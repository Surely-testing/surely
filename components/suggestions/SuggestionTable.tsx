// ============================================
// components/suggestions/SuggestionTable.tsx
// Using custom Table components with responsive behavior
// ============================================
'use client';

import { useState } from 'react';
import { SuggestionWithCreator } from '@/types/suggestion.types';
import { ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableBadge,
  TableAvatar,
  TableEmpty,
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
  const supabase = createClient();

  const handleToggleSelection = (suggestionId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedSuggestions.includes(suggestionId)) {
      onSelectionChange(selectedSuggestions.filter(id => id !== suggestionId));
    } else {
      onSelectionChange([...selectedSuggestions, suggestionId]);
    }
  };

  const handleStatusChange = async (suggestionId: string, newStatus: string) => {
    setUpdatingStatus(suggestionId);
    try {
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };
      
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

  if (suggestions.length === 0) {
    return (
      <TableEmpty
        title="No suggestions to display"
        description="No suggestions found."
      />
    );
  }

  return (
    <Table>
      {/* Table Header */}
      <TableHeader
        columns={[
          <TableHeaderCell key="title" sticky minWidth="min-w-[320px]">Title</TableHeaderCell>,
          <TableHeaderCell key="id" minWidth="min-w-[120px]">Suggestion ID</TableHeaderCell>,
          <TableHeaderCell key="category" minWidth="min-w-[140px]">Category</TableHeaderCell>,
          <TableHeaderCell key="priority" minWidth="min-w-[100px]">Priority</TableHeaderCell>,
          <TableHeaderCell key="status" minWidth="min-w-[140px]">Status</TableHeaderCell>,
          <TableHeaderCell key="creator" minWidth="min-w-[160px]">Creator</TableHeaderCell>,
          <TableHeaderCell key="votes" minWidth="min-w-[140px]">Votes</TableHeaderCell>,
          <TableHeaderCell key="actions" minWidth="min-w-[100px]">Actions</TableHeaderCell>,
        ]}
      />

      {/* Table Body */}
      {suggestions.map((suggestion) => {
        const isSelected = selectedSuggestions.includes(suggestion.id);
        const isUpdating = updatingStatus === suggestion.id;
        const userVote = suggestion.votes?.[currentUserId || ''];
        
        return (
          <TableRow key={suggestion.id} selected={isSelected}>
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              selected={isSelected}
              onCheckedChange={() => handleToggleSelection(suggestion.id)}
            />

            {/* Title - Sticky */}
            <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
              <div 
                className="font-medium truncate cursor-help"
                title={suggestion.title}
              >
                {suggestion.title}
              </div>
            </TableCell>

            {/* Suggestion ID */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm text-muted-foreground font-mono">
                {suggestion.id.slice(0, 8)}
              </span>
            </TableCell>

            {/* Category */}
            <TableCell minWidth="min-w-[140px]">
              <span className="text-sm capitalize">
                {suggestion.category.replace('_', ' ')}
              </span>
            </TableCell>

            {/* Priority */}
            <TableCell minWidth="min-w-[100px]">
              <div className="flex items-center h-full py-1">
                <div className={`
                  inline-flex items-center justify-center px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap w-20
                  ${getPriorityVariant(suggestion.priority) === 'red' ? 'bg-red-500 text-white' : ''}
                  ${getPriorityVariant(suggestion.priority) === 'orange' ? 'bg-orange-500 text-white' : ''}
                  ${getPriorityVariant(suggestion.priority) === 'yellow' ? 'bg-yellow-400 text-yellow-900' : ''}
                  ${getPriorityVariant(suggestion.priority) === 'green' ? 'bg-green-500 text-white' : ''}
                  ${getPriorityVariant(suggestion.priority) === 'gray' ? 'bg-gray-400 text-gray-900' : ''}
                `}>
                  {suggestion.priority}
                </div>
              </div>
            </TableCell>

            {/* Status */}
            <TableCell minWidth="min-w-[140px]">
              <select
                value={suggestion.status}
                onChange={(e) => {
                  e.stopPropagation();
                  handleStatusChange(suggestion.id, e.target.value);
                }}
                disabled={isUpdating}
                className={`
                  px-3 py-1.5 rounded text-xs font-medium border-0 cursor-pointer w-full
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
            </TableCell>

            {/* Creator */}
            <TableCell minWidth="min-w-[160px]">
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
            </TableCell>

            {/* Votes */}
            <TableCell minWidth="min-w-[140px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onVote(suggestion.id, 'upvote'); 
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                    userVote === 'upvote' 
                      ? 'bg-success/20 text-success' 
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span className="text-xs">{suggestion.upvotes}</span>
                </button>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onVote(suggestion.id, 'downvote'); 
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                    userVote === 'downvote' 
                      ? 'bg-error/20 text-error' 
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span className="text-xs">{suggestion.downvotes}</span>
                </button>
              </div>
            </TableCell>

            {/* Actions */}
            <TableCell minWidth="min-w-[100px]">
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
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}