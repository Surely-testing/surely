'use client';

import { useState } from 'react';
import { SuggestionWithCreator } from '@/types/suggestion.types';
import { ThumbsUp, ThumbsDown, Eye, User } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableHeaderText,
  TableDescriptionText,
  TableCheckbox,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
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

  const handleToggleSelection = (suggestionId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedSuggestions.includes(suggestionId)) {
      onSelectionChange(selectedSuggestions.filter(id => id !== suggestionId));
    } else {
      onSelectionChange([...selectedSuggestions, suggestionId]);
    }
  };

  const handleStatusChange = async (suggestionId: string, newStatus: string, e: React.MouseEvent) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-error bg-destructive/10';
      case 'high': return 'text-warning bg-warning/10';
      case 'medium': return 'text-accent bg-accent/10';
      case 'low': return 'text-info bg-info/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/10';
      case 'under_review': return 'text-info bg-info/10';
      case 'accepted': return 'text-success bg-success/10';
      case 'rejected': return 'text-error bg-destructive/10';
      case 'implemented': return 'text-primary bg-primary/10';
      default: return 'text-muted-foreground bg-muted';
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
    <div className="space-y-3">
      <div className={`hidden md:block px-4 py-2 bg-muted/50 rounded-lg border border-border ${onSelectionChange ? 'pl-12' : ''}`}>
        <TableGrid columns={7} className="gap-4">
          <TableHeaderText className="text-xs uppercase font-semibold">Title</TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">Category</TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">Priority</TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">Status</TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">Creator</TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold">Votes</TableHeaderText>
          <TableHeaderText className="text-xs uppercase font-semibold text-right">Actions</TableHeaderText>
        </TableGrid>
      </div>

      <Table className="space-y-2">
        {suggestions.map((suggestion) => {
          const isSelected = selectedSuggestions.includes(suggestion.id);
          const userVote = suggestion.votes?.[currentUserId || ''];
          
          return (
            <TableRow
              key={suggestion.id}
              onClick={() => onSelect(suggestion)}
              selected={isSelected}
              selectable={!!onSelectionChange}
            >
              {onSelectionChange && (
                <TableCheckbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleSelection(suggestion.id)}
                />
              )}

              <div className="md:hidden space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">TITLE</div>
                  <div className="text-sm font-medium text-foreground">{suggestion.title}</div>
                  {suggestion.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {suggestion.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                    {suggestion.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {suggestion.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {suggestion.creator && (
                      <div className="flex items-center gap-1.5">
                        {suggestion.creator.avatar_url ? (
                          <img src={suggestion.creator.avatar_url} alt={suggestion.creator.name} className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">{suggestion.creator.name}</span>
                      </div>
                    )}
                  </div>

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

                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(suggestion); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <Eye className="w-4 h-4" />View Details
                </button>
              </div>

              <TableGrid columns={7} className="hidden md:grid gap-4">
                <TableCell>
                  <div className="text-sm font-medium text-foreground">{suggestion.title}</div>
                  {suggestion.description && (
                    <TableDescriptionText className="line-clamp-1 mt-1">{suggestion.description}</TableDescriptionText>
                  )}
                </TableCell>

                <TableCell>
                  <span className="text-sm text-foreground">{suggestion.category.replace('_', ' ')}</span>
                </TableCell>

                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                </TableCell>

                <TableCell>
                  <select
                    value={suggestion.status}
                    onChange={(e) => handleStatusChange(suggestion.id, e.target.value, e as any)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={updatingStatus === suggestion.id}
                    className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer transition-colors w-full ${getStatusColor(suggestion.status)} ${
                      updatingStatus === suggestion.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="implemented">Implemented</option>
                  </select>
                </TableCell>

                <TableCell>
                  {suggestion.creator ? (
                    <div className="flex items-center gap-2">
                      {suggestion.creator.avatar_url ? (
                        <img src={suggestion.creator.avatar_url} alt={suggestion.creator.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm text-foreground">{suggestion.creator.name}</span>
                    </div>
                  ) : (
                    <TableDescriptionText>—</TableDescriptionText>
                  )}
                </TableCell>

                <TableCell>
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
                </TableCell>

                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(suggestion); }} className="h-8 text-xs">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />View
                  </Button>
                </TableCell>
              </TableGrid>
            </TableRow>
          );
        })}
      </Table>
    </div>
  );
}