'use client'

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Filter, Calendar, Code, List } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from '@/providers/SupabaseProvider';
import type { APIRequest } from '@/types/api-tester.types';

interface RequestListSidebarProps {
  suiteId: string;
  requests: APIRequest[];
  onSelectRequest: (request: APIRequest) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}

type ViewMode = 'simple' | 'grouped-method' | 'grouped-date';

export const RequestListSidebar: React.FC<RequestListSidebarProps> = ({
  suiteId,
  requests,
  onSelectRequest,
  onCreateNew,
  onRefresh
}) => {
  const { supabase } = useSupabase();
  const [filteredRequests, setFilteredRequests] = useState<APIRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, selectedMethod]);

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchQuery) {
      filtered = filtered.filter(req => 
        req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.method.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedMethod !== 'all') {
      filtered = filtered.filter(req => req.method === selectedMethod);
    }

    setFilteredRequests(filtered);
  };

  const deleteRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this request?')) return;

    try {
      const { error } = await supabase
        .from('api_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Request deleted');
      onRefresh();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
    }
  };

  const groupRequestsByMethod = () => {
    const grouped: Record<string, APIRequest[]> = {};
    filteredRequests.forEach(req => {
      if (!grouped[req.method]) {
        grouped[req.method] = [];
      }
      grouped[req.method].push(req);
    });
    return grouped;
  };

  const groupRequestsByDate = () => {
    const grouped: Record<string, APIRequest[]> = {};
    filteredRequests.forEach(req => {
      const date = req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Unknown';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(req);
    });
    return grouped;
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'POST': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'PUT': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      'PATCH': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      'DELETE': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      'HEAD': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      'OPTIONS': 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
    };
    return colors[method] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
  };

  const uniqueMethods = Array.from(new Set(requests.map(r => r.method)));

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const renderRequestItem = (req: APIRequest) => (
    <div
      key={req.id}
      onClick={() => onSelectRequest(req)}
      className="group p-2.5 sm:p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
          {req.name}
        </span>
        <button
          onClick={(e) => deleteRequest(req.id!, e)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
        >
          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600 dark:text-red-400" />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getMethodColor(req.method)}`}>
          {req.method}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">
          {getHostname(req.url)}
        </span>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
        {req.url}
      </div>
    </div>
  );

  const renderSimpleView = () => (
    <div className="space-y-2">
      {filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
          {searchQuery || selectedMethod !== 'all' ? 'No matching requests' : 'No requests saved yet'}
        </div>
      ) : (
        filteredRequests.map(renderRequestItem)
      )}
    </div>
  );

  const renderGroupedByMethod = () => {
    const grouped = groupRequestsByMethod();
    return (
      <div className="space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            No matching requests
          </div>
        ) : (
          Object.entries(grouped).map(([method, reqs]) => (
            <div key={method}>
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${getMethodColor(method)}`}>
                  {method}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {reqs.length} {reqs.length === 1 ? 'request' : 'requests'}
                </span>
              </div>
              <div className="space-y-2">
                {reqs.map(renderRequestItem)}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderGroupedByDate = () => {
    const grouped = groupRequestsByDate();
    return (
      <div className="space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            No matching requests
          </div>
        ) : (
          Object.entries(grouped).map(([date, reqs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2 px-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {date}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {reqs.length}
                </span>
              </div>
              <div className="space-y-2">
                {reqs.map(renderRequestItem)}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
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

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requests..."
            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Filters
          </button>

          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setViewMode('simple')}
              className={`p-1 sm:p-1.5 rounded transition-colors ${
                viewMode === 'simple'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Simple list"
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setViewMode('grouped-method')}
              className={`p-1 sm:p-1.5 rounded transition-colors ${
                viewMode === 'grouped-method'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Group by method"
            >
              <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setViewMode('grouped-date')}
              className={`p-1 sm:p-1.5 rounded transition-colors ${
                viewMode === 'grouped-date'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Group by date"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-2.5 sm:p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              HTTP Method
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All methods</option>
              {uniqueMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {viewMode === 'simple' && renderSimpleView()}
        {viewMode === 'grouped-method' && renderGroupedByMethod()}
        {viewMode === 'grouped-date' && renderGroupedByDate()}
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {filteredRequests.length} of {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </div>
      </div>
    </div>
  );
};