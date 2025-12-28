'use client'

import React, { useState, useEffect } from "react";
import { Save, Workflow as WorkflowIcon, FileText, AlertCircle, Menu, X } from "lucide-react";
import { SingleAPIRequest } from './api-tester/SingleAPIReuest';
import { WorkflowBuilder } from './api-tester/WorkflowBuilder';
import { RequestListSidebar } from './api-tester/RequestListSidebar';
import { WorkflowListSidebar } from './api-tester/WorkflowListSideBar';
import { toast } from "sonner";
import { useSupabase } from '@/providers/SupabaseProvider';
import type { APIRequest, Workflow } from '@/types/api-tester.types';
import { normalizeAPIRequest, normalizeWorkflow } from '@/types/api-tester.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface APITesterContainerProps {
  suiteId: string;
}

export const APITester: React.FC<APITesterContainerProps> = ({ suiteId }) => {
  const { supabase, user } = useSupabase();
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
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user && suiteId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [suiteId, user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadSavedRequests(),
      loadSavedWorkflows()
    ]);
    setLoading(false);
  };

  const loadSavedRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('api_requests')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading requests:', error);
        throw error;
      }
      const requests = (data || []).map(normalizeAPIRequest);
      setSavedRequests(requests);
    } catch (error: any) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load requests');
    }
  };

  const loadSavedWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading workflows:', error);
        throw error;
      }
      const workflows = (data || []).map(normalizeWorkflow);
      setSavedWorkflows(workflows);
    } catch (error: any) {
      console.error('Error loading workflows:', error);
      toast.error('Failed to load workflows');
    }
  };

  const saveCurrentRequest = async () => {
    if (!user) {
      toast.error('You must be logged in to save requests');
      return;
    }

    if (!currentRequest.name || !currentRequest.url) {
      toast.error('Please provide a name and URL');
      return;
    }

    try {
      const isExisting = currentRequest.id && typeof currentRequest.id === 'string' && !currentRequest.id.startsWith('temp-');
      
      if (isExisting && currentRequest.id) {
        const { error } = await supabase
          .from('api_requests')
          .update({
            name: currentRequest.name,
            method: currentRequest.method,
            url: currentRequest.url,
            headers: currentRequest.headers || {},
            body: currentRequest.body || ''
          })
          .eq('id', currentRequest.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast.success('Request updated');
      } else {
        const { data, error } = await supabase
          .from('api_requests')
          .insert([{
            suite_id: suiteId,
            name: currentRequest.name,
            method: currentRequest.method,
            url: currentRequest.url,
            headers: currentRequest.headers || {},
            body: currentRequest.body || ''
          }])
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        setCurrentRequest({ 
          ...currentRequest, 
          id: data.id,
          ...normalizeAPIRequest(data)
        });
        toast.success('Request saved');
      }
      
      await loadSavedRequests();
      setShowSaveDialog(false);
    } catch (error: any) {
      console.error('Error saving request:', error);
      toast.error(error.message || 'Failed to save request');
    }
  };

  const saveCurrentWorkflow = async () => {
    if (!user) {
      toast.error('You must be logged in to save workflows');
      return;
    }

    if (!currentWorkflow || !currentWorkflow.name) {
      toast.error('Please provide a workflow name');
      return;
    }

    try {
      const stepsAsJson = JSON.parse(JSON.stringify(currentWorkflow.steps || []));
      
      if (currentWorkflow.id) {
        const { error } = await supabase
          .from('workflows')
          .update({
            name: currentWorkflow.name,
            steps: stepsAsJson,
            total_duration: currentWorkflow.total_duration
          })
          .eq('id', currentWorkflow.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast.success('Workflow updated');
      } else {
        const { data, error } = await supabase
          .from('workflows')
          .insert({
            suite_id: suiteId,
            name: currentWorkflow.name,
            steps: stepsAsJson,
            total_duration: currentWorkflow.total_duration
          })
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        setCurrentWorkflow({ ...currentWorkflow, id: data.id });
        toast.success('Workflow saved');
      }
      
      await loadSavedWorkflows();
      setShowSaveDialog(false);
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      toast.error(error.message || 'Failed to save workflow');
    }
  };

  const handleSelectRequest = (request: APIRequest) => {
    setCurrentRequest(request);
    setMode('single');
    setSidebarOpen(false);
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
    setMode('workflow');
    setSidebarOpen(false);
  };

  const handleCreateNewRequest = () => {
    const newRequest = {
      id: `temp-${Date.now()}`,
      suite_id: suiteId,
      name: 'Untitled Request',
      method: 'GET',
      url: '',
      headers: { 'Content-Type': 'application/json' },
      body: ''
    };
    setCurrentRequest(newRequest);
    setMode('single');
    setSidebarOpen(false);
  };

  const handleCreateNewWorkflow = () => {
    const newWorkflow: Workflow = {
      suite_id: suiteId,
      name: 'New Workflow',
      steps: []
    };
    setCurrentWorkflow(newWorkflow);
    setMode('workflow');
    setSidebarOpen(false);
  };

  const openSaveDialog = (type: 'request' | 'workflow') => {
    setSaveDialogType(type);
    setShowSaveDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] py-12">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] py-12 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please log in to use the API Testing Suite
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-3 py-3 sm:px-4 sm:py-3 lg:px-6 lg:py-4 w-full max-w-full lg:max-w-7xl lg:mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex-1">
              Test individual APIs or create automated workflows
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setMode('single')}
                className={`flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  mode === 'single'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Request</span>
              </button>
              <button
                onClick={() => setMode('workflow')}
                className={`flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  mode === 'workflow'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <WorkflowIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Workflow</span>
              </button>
            </div>

            <button
              onClick={() => openSaveDialog(mode === 'single' ? 'request' : 'workflow')}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="hidden lg:flex lg:w-64 xl:w-80 flex-shrink-0 flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {mode === 'single' ? (
            <RequestListSidebar
              suiteId={suiteId}
              requests={savedRequests}
              workflows={savedWorkflows}
              onSelectRequest={handleSelectRequest}
              onCreateNew={handleCreateNewRequest}
              onRefresh={loadSavedRequests}
            />
          ) : (
            <WorkflowListSidebar
              suiteId={suiteId}
              workflows={savedWorkflows}
              requests={savedRequests}
              onSelectWorkflow={handleSelectWorkflow}
              onCreateNew={handleCreateNewWorkflow}
              onRefresh={loadSavedWorkflows}
            />
          )}
        </div>

        {sidebarOpen && (
          <>
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden fixed inset-y-0 left-0 w-full max-w-xs sm:max-w-sm bg-white dark:bg-gray-800 z-50 flex flex-col overflow-hidden shadow-xl">
              {mode === 'single' ? (
                <RequestListSidebar
                  suiteId={suiteId}
                  requests={savedRequests}
                  workflows={savedWorkflows}
                  onSelectRequest={handleSelectRequest}
                  onCreateNew={handleCreateNewRequest}
                  onRefresh={loadSavedRequests}
                />
              ) : (
                <WorkflowListSidebar
                  suiteId={suiteId}
                  workflows={savedWorkflows}
                  requests={savedRequests}
                  onSelectWorkflow={handleSelectWorkflow}
                  onCreateNew={handleCreateNewWorkflow}
                  onRefresh={loadSavedWorkflows}
                />
              )}
            </div>
          </>
        )}

        <div className="flex-1 overflow-y-auto min-w-0 bg-gray-50 dark:bg-gray-900">
          <div className="p-3 sm:p-4 lg:p-6 w-full max-w-full lg:max-w-7xl lg:mx-auto">
            {mode === 'single' ? (
              <SingleAPIRequest 
                suiteId={suiteId}
                request={currentRequest}
                onRequestChange={setCurrentRequest}
                onRequestSaved={() => {}} 
              />
            ) : (
              currentWorkflow ? (
                <WorkflowBuilder 
                  suiteId={suiteId}
                  availableRequests={savedRequests}
                  workflow={currentWorkflow}
                  onWorkflowChange={setCurrentWorkflow}
                  onSaveWorkflow={() => {}}
                />
              ) : (
                <div className="flex items-center justify-center min-h-[300px] px-4">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <WorkflowIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Select or create a workflow to get started</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Save {saveDialogType === 'request' ? 'Request' : 'Workflow'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {saveDialogType === 'request' 
                ? 'Provide a name for your API request to save it for later use.'
                : 'Provide a name for your workflow to save it for later use.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm sm:text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {saveDialogType === 'request' && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">Method:</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-semibold">
                    {currentRequest.method}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium whitespace-nowrap">URL:</span>
                  <span className="flex-1 break-all text-xs sm:text-sm">{currentRequest.url || 'Not set'}</span>
                </div>
              </div>
            )}

            {saveDialogType === 'workflow' && currentWorkflow && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Steps:</span>
                  <span>{currentWorkflow.steps?.length || 0}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setShowSaveDialog(false)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveDialogType === 'request' ? saveCurrentRequest : saveCurrentWorkflow}
              className="w-full sm:w-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// NO INLINE COMPONENTS HERE - REMOVED!
// All components are imported from separate files