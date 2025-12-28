'use client'

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Filter, Clock, Layers, AlertCircle, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from '@/providers/SupabaseProvider';
import type { Workflow, APIRequest } from '@/types/api-tester.types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkflowListSidebarProps {
  suiteId: string;
  workflows: Workflow[];
  requests: APIRequest[];
  onSelectWorkflow: (workflow: Workflow) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}

export const WorkflowListSidebar: React.FC<WorkflowListSidebarProps> = ({
  suiteId,
  workflows,
  requests,
  onSelectWorkflow,
  onCreateNew,
  onRefresh
}) => {
  const { supabase } = useSupabase();
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'steps'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    filterAndSortWorkflows();
  }, [workflows, searchQuery, sortBy]);

  const filterAndSortWorkflows = () => {
    let filtered = [...workflows];

    if (searchQuery) {
      filtered = filtered.filter(workflow => 
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'steps':
          return (b.steps?.length || 0) - (a.steps?.length || 0);
        case 'recent':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    setFilteredWorkflows(filtered);
  };

  // Get request names used in a workflow
  const getLinkedRequestNames = (workflow: Workflow | undefined): string[] => {
    if (!workflow || !workflow.steps || workflow.steps.length === 0) return [];
    
    const requestNames: string[] = [];
    workflow.steps.forEach(step => {
      const requestId = step.requestId || (step as any).request?.id || step.id;
      const request = requests.find(r => r.id === requestId);
      if (request && !requestNames.includes(request.name)) {
        requestNames.push(request.name);
      }
    });
    
    return requestNames;
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || isDeleting) return;
    
    const workflow = workflows.find(w => w.id === deleteConfirmId);
    if (!workflow) {
      toast.error('Workflow not found');
      setDeleteConfirmId(null);
      return;
    }
    
    const linkedRequests = getLinkedRequestNames(workflow);
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;
      
      toast.success(
        <div className="space-y-1">
          <div className="font-semibold">Workflow deleted</div>
          {linkedRequests.length > 0 && (
            <div className="text-sm">
              {linkedRequests.length} request{linkedRequests.length > 1 ? 's are' : ' is'} now available for deletion
            </div>
          )}
        </div>,
        { duration: 5000 }
      );
      
      setDeleteConfirmId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDuration = (ms?: number | null) => {
    if (!ms) return 'Not run';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Workflows</h3>
            <button
              onClick={onCreateNew}
              className="p-1.5 sm:p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              title="Create new workflow"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows..."
              className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Sort
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 p-2.5 sm:p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'steps')}
                className="w-full px-2.5 sm:px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="steps">Number of Steps</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredWorkflows.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {searchQuery ? 'No matching workflows' : 'No workflows created yet'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWorkflows.map((workflow) => {
                const linkedRequestCount = getLinkedRequestNames(workflow).length;
                
                return (
                  <div
                    key={workflow.id}
                    className="group relative p-2.5 sm:p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-md"
                  >
                    {/* Main clickable area */}
                    <div 
                      onClick={() => onSelectWorkflow(workflow)}
                      className="cursor-pointer pr-10"
                    >
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-2">
                        {workflow.name}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap mb-2">
                        <div className="flex items-center gap-1">
                          <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>{workflow.steps?.length || 0} steps</span>
                        </div>
                        {workflow.total_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{formatDuration(workflow.total_duration)}</span>
                          </div>
                        )}
                        {linkedRequestCount > 0 && (
                          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Link2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{linkedRequestCount}</span>
                          </div>
                        )}
                      </div>

                      {/* Method indicators */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(workflow.updated_at || workflow.created_at)}
                        </div>
                        {workflow.steps && workflow.steps.length > 0 && (
                          <div className="flex items-center gap-1">
                            {workflow.steps.slice(0, 5).map((step: any, i: number) => {
                              const methodColors: Record<string, string> = {
                                'GET': 'bg-green-400',
                                'POST': 'bg-blue-400',
                                'PUT': 'bg-orange-400',
                                'PATCH': 'bg-yellow-400',
                                'DELETE': 'bg-red-400'
                              };
                              const method = step?.request?.method || step?.method || 'GET';
                              const color = methodColors[method] || 'bg-gray-400';
                              return (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${color}`}
                                  title={method}
                                />
                              );
                            })}
                            {workflow.steps.length > 5 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-0.5">
                                +{workflow.steps.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(workflow.id!);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all opacity-0 group-hover:opacity-100"
                      title="Delete workflow"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredWorkflows.length} of {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog - Using Custom Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Delete Workflow?</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {(() => {
              const workflow = workflows.find(w => w.id === deleteConfirmId);
              const linkedRequests = getLinkedRequestNames(workflow);
              
              return (
                <>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Are you sure you want to delete <span className="font-semibold">"{workflow?.name || 'this workflow'}"</span>? This action cannot be undone.
                  </p>
                  
                  {linkedRequests && linkedRequests.length > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Note: {linkedRequests.length} linked request{linkedRequests.length > 1 ? 's' : ''} will remain saved.
                    </p>
                  )}
                </>
              );
            })()}
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting && (
                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};