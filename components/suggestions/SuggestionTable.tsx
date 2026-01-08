// ============================================
// components/suggestions/SuggestionTable.tsx
// Mobile: full scroll | Desktop: sticky checkbox & title
// ============================================
'use client';

import { useState } from 'react';
import { SuggestionWithCreator } from '@/types/suggestion.types';
import { ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  TableBadge,
  TableAvatar,
} from '@/components/ui/Table';
import { logger } from '@/lib/utils/logger';

interface SuggestionTableProps {
  suggestions: SuggestionWithCreator[];
  onSelect: (suggestion: SuggestionWithCreator) => void;
  selectedSuggestions?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onVote: (suggestionId: string, voteType: 'upvote' | 'downvote') => void;
  currentUserId?: string;
  onUpdate?: () => void;
}

export function SuggestionTable({
  suggestions,
  onSelect,
  selectedSuggestions = [],
  onSelectionChange,
  onVote,
  currentUserId,
  onUpdate
}: SuggestionTableProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleToggleSelection = (suggestionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onSelectionChange) return;
    
    if (selectedSuggestions.includes(suggestionId)) {
      onSelectionChange(selectedSuggestions.filter(id => id !== suggestionId));
    } else {
      onSelectionChange([...selectedSuggestions, suggestionId]);
    }
  };

  const handleStatusChange = async (suggestionId: string, newStatus: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    
    try {
      setUpdatingStatus(suggestionId);
      const supabase = createClient();
      
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'implemented') {
        updateData.implemented_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('suggestions')
        .update(updateData)
        .eq('id', suggestionId);
      
      if (error) throw error;
      
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      onUpdate?.();
    } catch (error: any) {
      logger.log('Error updating status:', error);
      toast.error('Failed to update status', {
        description: error?.message
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getPriorityVariant = (priority: string): "default" | "yellow" | "green" | "pink" | "gray" | "orange" | "red" => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusVariant = (status: string): "default" | "yellow" | "green" | "pink" | "gray" | "orange" | "red" => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'under_review': return 'default';
      case 'accepted': return 'green';
      case 'rejected': return 'red';
      case 'implemented': return 'pink';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'under_review': return 'Under Review';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'implemented': return 'Implemented';
      default: return 'N/A';
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No suggestions to display
      </div>
    );
  }

  return (
    <div className="relative border border-border rounded-lg bg-card overflow-x-auto">
      <div className="min-w-max">
        {/* Table Header */}
        <div className="flex bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="w-12 px-4 py-2 border-r border-border flex items-center justify-center md:sticky md:left-0 bg-muted md:z-10">
            {/* Empty for checkbox */}
          </div>
          <div className="w-80 px-4 py-2 border-r border-border md:sticky md:left-12 bg-muted md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Title
          </div>
          <div className="w-32 px-4 py-2 border-r border-border flex-shrink-0">Suggestion ID</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Category</div>
          <div className="w-32 px-4 py-2 border-r border-border flex-shrink-0">Priority</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Status</div>
          <div className="w-48 px-4 py-2 border-r border-border flex-shrink-0">Creator</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Votes</div>
          <div className="w-32 px-4 py-2 flex-shrink-0">Actions</div>
        </div>

        {/* Table Body */}
        {suggestions.map((suggestion) => {
          const isSelected = selectedSuggestions.includes(suggestion.id);
          const isUpdating = updatingStatus === suggestion.id;
          const userVote = suggestion.votes?.[currentUserId || ''];
          
          return (
            <div
              key={suggestion.id}
              className={`flex items-center border-b border-border last:border-b-0 transition-colors ${
                isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              {/* Checkbox - Sticky on md+ */}
              <div className={`w-12 px-4 py-3 border-r border-border flex items-center justify-center md:sticky md:left-0 md:z-10 ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                {onSelectionChange && (
                  <div
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={(e) => handleToggleSelection(suggestion.id, e)}
                    className={`w-4 h-4 rounded border-2 border-border cursor-pointer transition-all flex items-center justify-center ${
                      isSelected ? 'bg-primary border-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              {/* Title - Sticky on md+ with shadow */}
              <div className={`w-80 px-4 py-3 border-r border-border md:sticky md:left-12 md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                <div 
                  className="font-medium truncate cursor-help"
                  title={suggestion.title}
                >
                  {suggestion.title}
                </div>
              </div>

              {/* Suggestion ID */}
              <div className="w-32 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-muted-foreground font-mono">
                  {suggestion.id.slice(0, 8)}
                </span>
              </div>

              {/* Category */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm capitalize">{suggestion.category.replace('_', ' ')}</span>
              </div>

              {/* Priority */}
              <div className="w-32 px-4 py-3 border-r border-border flex-shrink-0 flex items-center">
                <TableBadge variant={getPriorityVariant(suggestion.priority)}>
                  {suggestion.priority}
                </TableBadge>
              </div>

              {/* Status with dropdown */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <select
                  value={suggestion.status}
                  onChange={(e) => handleStatusChange(suggestion.id, e.target.value, e)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isUpdating}
                  className={`
                    w-full px-2.5 py-1 rounded text-xs font-medium border-0 cursor-pointer 
                    focus:ring-2 focus:ring-primary outline-none
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                    ${getStatusVariant(suggestion.status) === 'yellow' ? 'bg-yellow-400 text-yellow-900' : ''}
                    ${getStatusVariant(suggestion.status) === 'default' ? 'bg-gray-100 text-gray-800' : ''}
                    ${getStatusVariant(suggestion.status) === 'green' ? 'bg-green-500 text-white' : ''}
                    ${getStatusVariant(suggestion.status) === 'red' ? 'bg-red-500 text-white' : ''}
                    ${getStatusVariant(suggestion.status) === 'pink' ? 'bg-pink-500 text-white' : ''}
                    ${getStatusVariant(suggestion.status) === 'gray' ? 'bg-gray-400 text-gray-900' : ''}
                  `}
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="implemented">Implemented</option>
                </select>
              </div>

              {/* Creator */}
              <div className="w-48 px-4 py-3 border-r border-border flex-shrink-0">
                {suggestion.creator ? (
                  <div className="flex items-center gap-2">
                    <TableAvatar
                      src={suggestion.creator.avatar_url || undefined}
                      alt={suggestion.creator.name}
                      fallback={suggestion.creator.name.charAt(0).toUpperCase()}
                    />
                    <span className="text-sm truncate">{suggestion.creator.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unknown</span>
                )}
              </div>

              {/* Votes */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onVote(suggestion.id, 'upvote'); }}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                      userVote === 'upvote' ? 'bg-success/20 text-success' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span className="text-xs">{suggestion.upvotes}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onVote(suggestion.id, 'downvote'); }}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                      userVote === 'downvote' ? 'bg-error/20 text-error' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <ThumbsDown className="w-3 h-3" />
                    <span className="text-xs">{suggestion.downvotes}</span>
                  </button>
                </div>
              </div>

              {/* Actions - View Button */}
              <div className="w-32 px-4 py-3 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(suggestion);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}