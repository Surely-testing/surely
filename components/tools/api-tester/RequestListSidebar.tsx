'use client'

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Link2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from '@/providers/SupabaseProvider';
import type { APIRequest, Workflow } from '@/types/api-tester.types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RequestListSidebarProps {
  suiteId: string;
  requests: APIRequest[];
  workflows: Workflow[];
  onSelectRequest: (request: APIRequest) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}

export const RequestListSidebar: React.FC<RequestListSidebarProps> = ({
  suiteId,
  requests,
  workflows,
  onSelectRequest,
  onCreateNew,
  onRefresh
}) => {
  const { supabase } = useSupabase();
  const [filteredRequests, setFilteredRequests] = useState<APIRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery]);

  const filterRequests = () => {
    let filtered = [...requests];
    if (searchQuery) {
      filtered = filtered.filter(req => 
        req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.url.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredRequests(filtered);
  };

  const isRequestUsedInWorkflow = (requestId: string): { used: boolean; workflowName: string | null } => {
    for (const workflow of workflows) {
      if (workflow.steps && Array.isArray(workflow.steps)) {
        const isUsed = workflow.steps.some(step => {
          return step.requestId === requestId || 
                 (step as any).request?.id === requestId ||
                 step.id === requestId;
        });
        
        if (isUsed) {
          return { used: true, workflowName: workflow.name };
        }
      }
    }
    return { used: false, workflowName: null };
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || isDeleting) return;
    
    const request = requests.find(r => r.id === deleteConfirmId);
    if (!request) {
      toast.error('Request not found');
      setDeleteConfirmId(null);
      return;
    }

    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('api_requests')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;
      
      toast.success('Request deleted');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
    } finally {
      setIsDeleting(false);
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'POST': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'PUT': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      'PATCH': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      'DELETE': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    };
    return colors[method] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
  };

  return (
    <>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Requests</h3>
            <button
              onClick={onCreateNew}
              className="p-1.5 sm:p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              title="Create new request"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {searchQuery ? 'No matching requests' : 'No requests saved yet'}
            </div>
          ) : (
            filteredRequests.map((req) => {
              const { used, workflowName } = isRequestUsedInWorkflow(req.id!);
              
              return (
                <div
                  key={req.id}
                  className="group relative p-2.5 sm:p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-md"
                >
                  {/* Clickable area */}
                  <div 
                    onClick={() => onSelectRequest(req)}
                    className="cursor-pointer pr-10"
                  >
                    <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2 truncate">
                      {req.name}
                    </div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getMethodColor(req.method)}`}>
                        {req.method}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {req.url}
                    </div>

                    {/* Linked workflow indicator */}
                    {used && workflowName && (
                      <div className="mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                          <Link2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{workflowName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* DELETE BUTTON - Always visible on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!used) {
                        setDeleteConfirmId(req.id!);
                      }
                    }}
                    disabled={used}
                    className={`absolute top-2 right-2 p-1.5 rounded transition-all opacity-0 group-hover:opacity-100 ${
                      used
                        ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                        : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                    }`}
                    title={used ? `Cannot delete - linked to ${workflowName}` : 'Delete request'}
                  >
                    <Trash2 className={`w-3.5 h-3.5 ${
                      used
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-red-600 dark:text-red-400'
                    }`} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredRequests.length} of {requests.length} {requests.length === 1 ? 'request' : 'requests'}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Delete Request?</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {(() => {
              const request = requests.find(r => r.id === deleteConfirmId);
              
              return (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete <span className="font-semibold">"{request?.name || 'this request'}"</span>? This action cannot be undone.
                </p>
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