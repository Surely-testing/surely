'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SuggestionWithCreator } from '@/types/suggestion.types';
import { X, ThumbsUp, ThumbsDown, Edit, Tag, User, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { logger } from '@/lib/utils/logger';

interface SuggestionDetailsDrawerProps {
  isOpen: boolean;
  suggestion: SuggestionWithCreator | null;
  onClose: () => void;
  onEdit: (suggestionId: string) => void;
  onVote: (suggestionId: string, voteType: 'upvote' | 'downvote') => void;
  currentUserId?: string;
  onUpdate?: () => void;
}

export function SuggestionDetailsDrawer({
  isOpen,
  suggestion,
  onClose,
  onEdit,
  onVote,
  currentUserId,
  onUpdate
}: SuggestionDetailsDrawerProps) {
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (suggestion) {
      setDiscussionNotes(suggestion.discussion_notes || '');
    }
  }, [suggestion]);

  if (!isOpen || !suggestion) return null;

  const userVote = suggestion.votes?.[currentUserId || ''];
  const netVotes = suggestion.upvotes - suggestion.downvotes;

  const handleSaveNotes = async () => {
    if (!suggestion) return;

    setIsSavingNotes(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('suggestions')
        .update({
          discussion_notes: discussionNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestion.id);

      if (error) throw error;

      toast.success('Discussion notes saved');
      onUpdate?.();
    } catch (error: any) {
      logger.log('Error saving notes:', error);
      toast.error('Failed to save notes', {
        description: error?.message
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-error bg-destructive/10 border-destructive/20';
      case 'high': return 'text-warning bg-warning/10 border-warning/20';
      case 'medium': return 'text-accent bg-accent/10 border-accent/20';
      case 'low': return 'text-info bg-info/10 border-info/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/10 border-warning/20';
      case 'under_review': return 'text-info bg-info/10 border-info/20';
      case 'accepted': return 'text-success bg-success/10 border-success/20';
      case 'rejected': return 'text-error bg-destructive/10 border-destructive/20';
      case 'implemented': return 'text-primary bg-primary/10 border-primary/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-error bg-destructive/10 border-destructive/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'low': return 'text-info bg-info/10 border-info/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-card border-l border-border z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-foreground pr-8">
                {suggestion.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(suggestion.status)}`}>
              {suggestion.status.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
              {suggestion.priority}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getImpactColor(suggestion.impact)}`}>
              {suggestion.impact} impact
            </span>
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium border text-foreground bg-muted border-border">
              {suggestion.category.replace('_', ' ')}
            </span>
          </div>

          {/* Voting */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <button
              onClick={() => onVote(suggestion.id, 'upvote')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                userVote === 'upvote'
                  ? 'bg-success/20 text-success border-2 border-success'
                  : 'bg-background hover:bg-muted text-muted-foreground border-2 border-border'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="font-medium">{suggestion.upvotes}</span>
            </button>
            <button
              onClick={() => onVote(suggestion.id, 'downvote')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                userVote === 'downvote'
                  ? 'bg-error/20 text-error border-2 border-error'
                  : 'bg-background hover:bg-muted text-muted-foreground border-2 border-border'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="font-medium">{suggestion.downvotes}</span>
            </button>
            <div className="flex-1 text-right">
              <span className="text-sm text-muted-foreground">
                Net: <span className={`font-medium ${netVotes >= 0 ? 'text-success' : 'text-error'}`}>
                  {netVotes > 0 ? '+' : ''}{netVotes}
                </span>
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {suggestion.description}
            </p>
          </div>

          {/* Rationale */}
          {suggestion.rationale && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Rationale</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {suggestion.rationale}
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <User className="w-3 h-3" />
                Created by
              </div>
              <div className="text-sm font-medium text-foreground">
                {suggestion.creator?.name || 'Unknown'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="w-3 h-3" />
                Created
              </div>
              <div className="text-sm font-medium text-foreground">
                {format(new Date(suggestion.created_at), 'MMM d, yyyy')}
              </div>
            </div>

            {suggestion.effort_estimate && (
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  Effort Estimate
                </div>
                <div className="text-sm font-medium text-foreground">
                  {suggestion.effort_estimate}
                </div>
              </div>
            )}

            {suggestion.assignee && (
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="w-3 h-3" />
                  Assigned to
                </div>
                <div className="text-sm font-medium text-foreground">
                  {suggestion.assignee.name}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {suggestion.tags && suggestion.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {suggestion.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary/10 text-primary gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Discussion Notes */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Discussion Notes</h3>
            <textarea
              value={discussionNotes}
              onChange={(e) => setDiscussionNotes(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px]"
              placeholder="Add notes from stakeholder discussions..."
            />
            {discussionNotes !== (suggestion.discussion_notes || '') && (
              <Button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="mt-2"
                size="sm"
              >
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={() => onEdit(suggestion.id)}
              variant="outline"
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}