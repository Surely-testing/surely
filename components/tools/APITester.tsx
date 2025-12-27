'use client'

import React, { useState, useEffect } from "react";
import { Save, Workflow, FileText } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { SingleAPIRequest } from './api-tester/SingleAPIReuest';
import { WorkflowBuilder } from './api-tester/WorkflowBuilder';
import { toast } from "sonner";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface APIRequest {
  id?: string;
  suite_id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  created_at?: string;
}

interface Workflow {
  id?: string;
  suite_id: string;
  name: string;
  steps: any[];
  total_duration?: number;
  created_at?: string;
}

interface APITesterContainerProps {
  suiteId: string;
}

export const APITester: React.FC<APITesterContainerProps> = ({ suiteId }) => {
  const [mode, setMode] = useState<'single' | 'workflow'>('single');
  const [currentRequest, setCurrentRequest] = useState<APIRequest>({
    suite_id: suiteId,
    name: 'Untitled Request',
    method: 'GET',
    url: '',
    headers: { 'Content-Type': 'application/json' },
    body: ''
  });
  const [savedRequests, setSavedRequests] = useState<APIRequest[]>([]);
  const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogType, setSaveDialogType] = useState<'request' | 'workflow'>('request');

  useEffect(() => {
    loadData();
  }, [suiteId]);

  const loadData = async () => {
    await Promise.all([
      loadSavedRequests(),
      loadSavedWorkflows()
    ]);
  };

  const loadSavedRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('api_requests')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadSavedWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const saveCurrentRequest = async () => {
    if (!currentRequest.name || !currentRequest.url) {
      toast.error('Please provide a name and URL');
      return;
    }

    try {
      if (currentRequest.id) {
        const { error } = await supabase
          .from('api_requests')
          .update({
            name: currentRequest.name,
            method: currentRequest.method,
            url: currentRequest.url,
            headers: currentRequest.headers,
            body: currentRequest.body,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentRequest.id);

        if (error) throw error;
        toast.success('Request updated');
      } else {
        const { data, error } = await supabase
          .from('api_requests')
          .insert([currentRequest])
          .select()
          .single();

        if (error) throw error;
        setCurrentRequest({ ...currentRequest, id: data.id });
        toast.success('Request saved');
      }
      
      loadSavedRequests();
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving request:', error);
      toast.error('Failed to save request');
    }
  };

  const saveCurrentWorkflow = async () => {
    if (!currentWorkflow || !currentWorkflow.name) {
      toast.error('Please provide a workflow name');
      return;
    }

    try {
      if (currentWorkflow.id) {
        const { error } = await supabase
          .from('workflows')
          .update({
            name: currentWorkflow.name,
            steps: currentWorkflow.steps,
            total_duration: currentWorkflow.total_duration,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentWorkflow.id);

        if (error) throw error;
        toast.success('Workflow updated');
      } else {
        const { data, error } = await supabase
          .from('workflows')
          .insert([{
            suite_id: suiteId,
            name: currentWorkflow.name,
            steps: currentWorkflow.steps,
            total_duration: currentWorkflow.total_duration
          }])
          .select()
          .single();

        if (error) throw error;
        setCurrentWorkflow({ ...currentWorkflow, id: data.id });
        toast.success('Workflow saved');
      }
      
      loadSavedWorkflows();
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
    }
  };

  const handleSelectRequest = (request: APIRequest) => {
    setCurrentRequest(request);
    setMode('single');
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
    setMode('workflow');
  };

  const handleCreateNewRequest = () => {
    setCurrentRequest({
      suite_id: suiteId,
      name: 'Untitled Request',
      method: 'GET',
      url: '',
      headers: { 'Content-Type': 'application/json' },
      body: ''
    });
    setMode('single');
  };

  const handleCreateNewWorkflow = () => {
    setCurrentWorkflow({
      suite_id: suiteId,
      name: 'New Workflow',
      steps: []
    });
    setMode('workflow');
  };

  const openSaveDialog = (type: 'request' | 'workflow') => {
    setSaveDialogType(type);
    setShowSaveDialog(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              API Testing Suite
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Test individual APIs or create automated workflows
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setMode('single')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  mode === 'single'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                Single Request
              </button>
              <button
                onClick={() => setMode('workflow')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  mode === 'workflow'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Workflow className="w-4 h-4" />
                Workflow
              </button>
            </div>

            <button
              onClick={() => openSaveDialog(mode === 'single' ? 'request' : 'workflow')}
              className="px-4 py-2 btn-primary text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save {mode === 'single' ? 'Request' : 'Workflow'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-shrink-0 overflow-y-auto">
          {mode === 'single' ? (
            <RequestListSidebar
              suiteId={suiteId}
              requests={savedRequests}
              onSelectRequest={handleSelectRequest}
              onCreateNew={handleCreateNewRequest}
              onRefresh={loadSavedRequests}
            />
          ) : (
            <WorkflowListSidebar
              suiteId={suiteId}
              workflows={savedWorkflows}
              onSelectWorkflow={handleSelectWorkflow}
              onCreateNew={handleCreateNewWorkflow}
              onRefresh={loadSavedWorkflows}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'single' ? (
            <SingleRequestView
              request={currentRequest}
              onRequestChange={setCurrentRequest}
              suiteId={suiteId}
            />
          ) : (
            <WorkflowView
              workflow={currentWorkflow}
              onWorkflowChange={setCurrentWorkflow}
              availableRequests={savedRequests}
              suiteId={suiteId}
            />
          )}
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Save {saveDialogType === 'request' ? 'Request' : 'Workflow'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={saveDialogType === 'request' ? currentRequest.name : currentWorkflow?.name || ''}
                  onChange={(e) => {
                    if (saveDialogType === 'request') {
                      setCurrentRequest({ ...currentRequest, name: e.target.value });
                    } else if (currentWorkflow) {
                      setCurrentWorkflow({ ...currentWorkflow, name: e.target.value });
                    }
                  }}
                  placeholder={`Enter ${saveDialogType} name`}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {saveDialogType === 'request' && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Method:</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-semibold">
                      {currentRequest.method}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">URL:</span>
                    <span className="flex-1 break-all">{currentRequest.url || 'Not set'}</span>
                  </div>
                </div>
              )}

              {saveDialogType === 'workflow' && currentWorkflow && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Steps:</span>
                    <span>{currentWorkflow.steps?.length || 0}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDialogType === 'request' ? saveCurrentRequest : saveCurrentWorkflow}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RequestListSidebar: React.FC<{
  suiteId: string;
  requests: APIRequest[];
  onSelectRequest: (request: APIRequest) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}> = ({ requests, onSelectRequest, onCreateNew }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredRequests = requests.filter(req =>
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Requests</h3>
          <button
            onClick={onCreateNew}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
          >
            New
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            {searchQuery ? 'No matching requests' : 'No requests yet'}
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => onSelectRequest(req)}
              className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 cursor-pointer transition-all"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate mb-1">
                {req.name}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                  {req.method}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {req.url}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const WorkflowListSidebar: React.FC<{
  suiteId: string;
  workflows: Workflow[];
  onSelectWorkflow: (workflow: Workflow) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}> = ({ workflows, onSelectWorkflow, onCreateNew }) => {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Workflows</h3>
          <button
            onClick={onCreateNew}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
          >
            New
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {workflows.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No workflows yet
          </div>
        ) : (
          workflows.map((workflow) => (
            <div
              key={workflow.id}
              onClick={() => onSelectWorkflow(workflow)}
              className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 cursor-pointer transition-all"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate mb-1">
                {workflow.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {workflow.steps?.length || 0} steps
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SingleRequestView: React.FC<{
  request: APIRequest;
  onRequestChange: (request: APIRequest) => void;
  suiteId: string;
}> = ({ request, onRequestChange, suiteId }) => {
  return <SingleAPIRequest 
    suiteId={suiteId} 
    onRequestSaved={() => {}} 
  />;
};

const WorkflowView: React.FC<{
  workflow: Workflow | null;
  onWorkflowChange: (workflow: Workflow) => void;
  availableRequests: APIRequest[];
  suiteId: string;
}> = ({ availableRequests, suiteId }) => {
  return <WorkflowBuilder 
    suiteId={suiteId}
    availableRequests={availableRequests}
    onSaveWorkflow={() => {}}
  />;
};