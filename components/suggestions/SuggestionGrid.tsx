'use client';

import { SuggestionWithCreator } from '@/types/suggestion.types';
import { ThumbsUp, ThumbsDown, User, Tag } from 'lucide-react';
import { TableSelectAll } from '@/components/ui/Table';

interface SuggestionGridProps {
  suggestions: SuggestionWithCreator[];
  onSelect: (suggestion: SuggestionWithCreator) => void;
  selectedSuggestions?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onVote: (suggestionId: string, voteType: 'upvote' | 'downvote') => void;
  currentUserId?: string;
}

export function SuggestionGrid({
  suggestions,
  onSelect,
  selectedSuggestions = [],
  onSelectionChange,
  onVote,
  currentUserId
}: SuggestionGridProps) {
  const handleToggleSelection = (suggestionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    
    if (selectedSuggestions.includes(suggestionId)) {
      onSelectionChange(selectedSuggestions.filter(id => id !== suggestionId));
    } else {
      onSelectionChange([...selectedSuggestions, suggestionId]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedSuggestions.length === suggestions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(suggestions.map(s => s.id));
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

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No suggestions to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onSelectionChange && (
        <div className="flex items-center justify-between">
          <TableSelectAll
            checked={selectedSuggestions.length === suggestions.length && suggestions.length > 0}
            onCheckedChange={handleSelectAll}
          />
          {selectedSuggestions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedSuggestions.length} selected
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((suggestion) => {
          const isSelected = selectedSuggestions.includes(suggestion.id);
          const userVote = suggestion.votes?.[currentUserId || ''];

          return (
            <div
              key={suggestion.id}
              onClick={() => onSelect(suggestion)}
              className={`relative group bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'border-primary shadow-sm' : 'border-border'
              }`}
            >
              {onSelectionChange && (
                <div
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleToggleSelection(suggestion.id, e as any)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <h3 className="font-semibold text-foreground mb-2 pr-8 line-clamp-2">
                {suggestion.title}
              </h3>

              {suggestion.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {suggestion.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(suggestion.status)}`}>
                  {suggestion.status.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                  {suggestion.priority}
                </span>
                <span className="px-2 py-1 rounded-md text-xs font-medium border text-muted-foreground bg-muted border-border flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {suggestion.category.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  {suggestion.creator?.avatar_url ? (
                    <img
                      src={suggestion.creator.avatar_url}
                      alt={suggestion.creator.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {suggestion.creator?.name || 'Unknown'}
                  </span>
                </div>

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
                    <span className="text-xs font-medium">{suggestion.upvotes}</span>
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
                    <span className="text-xs font-medium">{suggestion.downvotes}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}