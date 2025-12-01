'use client';

import { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  Tag, 
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { SuggestionWithCreator } from '@/types/suggestion.types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';

interface SuggestionGridProps {
  suggestions: SuggestionWithCreator[];
  onSelect: (suggestion: SuggestionWithCreator) => void;
  selectedSuggestions?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onVote: (suggestionId: string, voteType: 'upvote' | 'downvote') => void;
  currentUserId?: string;
  onEdit?: (suggestion: SuggestionWithCreator) => void;
  onDelete?: (suggestionId: string) => void;
}

export function SuggestionGrid({
  suggestions,
  onSelect,
  selectedSuggestions = [],
  onSelectionChange,
  onVote,
  currentUserId,
  onEdit,
  onDelete
}: SuggestionGridProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  const handleToggleSelection = (suggestionId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedSuggestions, suggestionId]);
    } else {
      onSelectionChange(selectedSuggestions.filter(id => id !== suggestionId));
    }
  };

  const handleCardClick = (suggestion: SuggestionWithCreator) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // Double click detection (within 300ms)
    if (lastClickedId === suggestion.id && timeSinceLastClick < 300) {
      // Double click - open details
      onSelect(suggestion);
      setLastClickTime(0);
      setLastClickedId(null);
    } else {
      // Single click - just record the time
      setLastClickTime(now);
      setLastClickedId(suggestion.id);
    }
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleViewDetails = (suggestion: SuggestionWithCreator, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(suggestion);
  };

  const getPriorityColor = (priority: string): 'danger' | 'warning' | 'info' | 'success' | 'default' => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'danger' | 'default' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'implemented': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No suggestions to display
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {suggestions.map((suggestion) => {
        const isSelected = selectedSuggestions.includes(suggestion.id);
        const isMenuOpen = menuOpenId === suggestion.id;
        const userVote = suggestion.votes?.[currentUserId || ''];

        return (
          <div
            key={suggestion.id}
            onClick={() => handleCardClick(suggestion)}
            className={cn(
              'bg-card rounded-lg border transition-all duration-200 cursor-pointer group hover:shadow-lg hover:border-primary/50',
              isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
            )}
          >
            {/* Card Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {onSelectionChange && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSelection(suggestion.id, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "mt-1 w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all cursor-pointer",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {suggestion.title}
                    </h3>
                  </div>
                </div>

                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => toggleMenu(suggestion.id, e)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                        }}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(suggestion, e);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(suggestion);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        <div className="my-1 h-px bg-border" />
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(suggestion.id);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              {suggestion.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                  {suggestion.description}
                </p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant={getStatusColor(suggestion.status)} size="sm">
                  {suggestion.status.replace('_', ' ')}
                </Badge>
                <Badge variant={getPriorityColor(suggestion.priority)} size="sm">
                  {suggestion.priority}
                </Badge>
                <Badge variant="default" size="sm">
                  <Tag className="w-3 h-3 mr-1" />
                  {suggestion.category.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              {/* Suggestion Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Priority</span>
                  <span className="text-foreground font-medium capitalize">{suggestion.priority}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-foreground font-medium capitalize">
                    {suggestion.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Voting Section */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Community Vote</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(suggestion.id, 'upvote');
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded transition-colors text-xs",
                      userVote === 'upvote'
                        ? 'bg-success/20 text-success'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span className="font-medium">{suggestion.upvotes}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(suggestion.id, 'downvote');
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded transition-colors text-xs",
                      userVote === 'downvote'
                        ? 'bg-error/20 text-error'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    <ThumbsDown className="w-3 h-3" />
                    <span className="font-medium">{suggestion.downvotes}</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Meta Info */}
              <div className="space-y-2">
                {suggestion.creator && (
                  <div className="flex items-center gap-2 text-xs">
                    {suggestion.creator.avatar_url ? (
                      <img 
                        src={suggestion.creator.avatar_url} 
                        alt={suggestion.creator.name} 
                        className="w-5 h-5 rounded-full ring-1 ring-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ring-1 ring-border flex-shrink-0">
                        {suggestion.creator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-muted-foreground truncate">{suggestion.creator.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{formatDate(suggestion.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}