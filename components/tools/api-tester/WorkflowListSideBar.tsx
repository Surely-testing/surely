'use client'

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Filter, Play, Clock, Layers } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from '@/providers/SupabaseProvider';
import type { Workflow } from '@/types/api-tester.types';

interface WorkflowListSidebarProps {
  suiteId: string;
  workflows: Workflow[];
  onSelectWorkflow: (workflow: Workflow) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
  onRunWorkflow?: (workflow: Workflow) => void;
}

export const WorkflowListSidebar: React.FC<WorkflowListSidebarProps> = ({
  suiteId,
  workflows,
  onSelectWorkflow,
  onCreateNew,
  onRefresh,
  onRunWorkflow
}) => {
  const { supabase } = useSupabase();
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'steps'>('recent');
  const [showFilters, setShowFilters] = useState(false);

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

  const deleteWorkflow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this workflow? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Workflow deleted');
      onRefresh();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const duplicateWorkflow = async (workflow: Workflow, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const stepsAsJson = JSON.parse(JSON.stringify(workflow.steps || []));
      
      const { error } = await supabase
        .from('workflows')
        .insert({
          suite_id: workflow.suite_id,
          name: `${workflow.name} (Copy)`,
          steps: stepsAsJson,
          total_duration: workflow.total_duration
        });

      if (error) throw error;
      toast.success('Workflow duplicated');
      onRefresh();
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      toast.error('Failed to duplicate workflow');
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
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => onSelectWorkflow(workflow)}
                className="group p-2.5 sm:p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                      {workflow.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
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
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onRunWorkflow && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRunWorkflow(workflow);
                        }}
                        className="p-1 sm:p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Run workflow"
                      >
                        <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600 dark:text-green-400" />
                      </button>
                    )}
                    <button
                      onClick={(e) => duplicateWorkflow(workflow, e)}
                      className="p-1 sm:p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Duplicate workflow"
                    >
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={(e) => deleteWorkflow(workflow.id!, e)}
                      className="p-1 sm:p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete workflow"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(workflow.updated_at || workflow.created_at)}
                  </div>
                  {workflow.steps && workflow.steps.length > 0 && (
                    <div className="flex items-center gap-1">
                      {workflow.steps.slice(0, 3).map((step: any, i: number) => {
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
                      {workflow.steps.length > 3 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                          +{workflow.steps.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {filteredWorkflows.length} of {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'}
        </div>
      </div>
    </div>
  );
};