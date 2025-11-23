// ============================================
// components/bugs/BugSuggestions.tsx
// AI-powered suggestions for bug management
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Recommendation, RecommendationPriority, RecommendationStatus } from '@/types/recommendation.types';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SuggestionsProps {
  suiteId: string;
}

export function Suggestions({ suiteId }: SuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | RecommendationStatus>('all');

  useEffect(() => {
    fetchSuggestions();
  }, [suiteId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Suggestions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Recommendations to improve bug tracking and resolution
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All ({suggestions.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Pending ({suggestions.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('implemented')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'implemented'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Implemented ({suggestions.filter(s => s.status === 'implemented').length})
          </button>
        </div>
      </div>

      {/* Suggestions List */}
      {filteredSuggestions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all' ? 'No suggestions yet' : `No ${filter} suggestions`}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            AI suggestions will appear here to help improve your bug tracking
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id} 
              className="p-5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {suggestion.title}
                  </h3>
                </div>
              </div>

              {suggestion.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {suggestion.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {suggestion.priority && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </span>
                  )}
                  {suggestion.category && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {suggestion.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(suggestion.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}