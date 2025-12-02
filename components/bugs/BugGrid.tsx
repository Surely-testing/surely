// ============================================
// components/bugs/BugGrid.tsx
// ============================================
'use client';

import { useState } from 'react';
import {
  MoreVertical,
  Calendar,
  User,
  Clock,
  Eye,
  Edit,
  Trash2,
  Copy,
  AlertCircle,
  Link2
} from 'lucide-react';
import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';

interface BugGridProps {
  bugs: BugWithCreator[];
  onSelect: (bug: BugWithCreator) => void;
  selectedBugs?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onEdit?: (bug: BugWithCreator) => void;
  onDelete?: (bugId: string) => void;
}

export function BugGrid({ 
  bugs, 
  onSelect, 
  selectedBugs = [], 
  onSelectionChange,
  onEdit,
  onDelete
}: BugGridProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  const getSeverityColor = (severity: BugSeverity | null): 'danger' | 'warning' | 'info' | 'success' | 'default' => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: BugStatus | null): 'danger' | 'info' | 'success' | 'default' | 'warning' => {
    switch (status) {
      case 'open': return 'danger';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      case 'reopened': return 'warning';
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

  const handleToggleSelection = (bugId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedBugs, bugId]);
    } else {
      onSelectionChange(selectedBugs.filter(id => id !== bugId));
    }
  };

  const handleCardClick = (bug: BugWithCreator) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // Double click detection (within 300ms)
    if (lastClickedId === bug.id && timeSinceLastClick < 300) {
      // Double click - open details
      onSelect(bug);
      setLastClickTime(0);
      setLastClickedId(null);
    } else {
      // Single click - just record the time
      setLastClickTime(now);
      setLastClickedId(bug.id);
    }
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleViewDetails = (bug: BugWithCreator, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(bug);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {bugs.map((bug) => {
        const isSelected = selectedBugs.includes(bug.id);
        const isMenuOpen = menuOpenId === bug.id;

        return (
          <div
            key={bug.id}
            onClick={() => handleCardClick(bug)}
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
                        handleToggleSelection(bug.id, e.target.checked);
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
                      {bug.title}
                    </h3>
                  </div>
                </div>

                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => toggleMenu(bug.id, e)}
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
                            handleViewDetails(bug, e);
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
                              onEdit(bug);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Duplicate logic would go here
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <div className="my-1 h-px bg-border" />
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(bug.id);
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
              {bug.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                  {bug.description}
                </p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant={getSeverityColor(bug.severity)} size="sm">
                  {bug.severity || 'None'}
                </Badge>
                <Badge variant={getStatusColor(bug.status)} size="sm">
                  {bug.status ? bug.status.replace('_', ' ') : 'open'}
                </Badge>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              {/* Bug Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Priority</span>
                  <span className="text-foreground font-medium capitalize">{bug.severity || 'Low'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-foreground font-medium capitalize">
                    {bug.status ? bug.status.replace('_', ' ') : 'Open'}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Meta Info */}
              <div className="space-y-2">
                {bug.creator && (
                  <div className="flex items-center gap-2 text-xs">
                    {bug.creator.avatar_url ? (
                      <img 
                        src={bug.creator.avatar_url} 
                        alt={bug.creator.name} 
                        className="w-5 h-5 rounded-full ring-1 ring-border flex-shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ring-1 ring-border flex-shrink-0">
                        {bug.creator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-muted-foreground truncate">{bug.creator.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{formatDate(bug.created_at)}</span>
                </div>

                {bug.updated_at && bug.updated_at !== bug.created_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Updated {formatDate(bug.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}