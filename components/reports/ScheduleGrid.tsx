// ============================================
// components/reports/ScheduleGrid.tsx
// Grid view with selection support - receives filtered data from parent
// ============================================

import { ReportScheduleWithReport } from '@/types/report.types';
import { useState, useMemo } from 'react';
import {
  Clock,
  Play,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Pagination } from '../shared/Pagination';
import { cn } from '@/lib/utils';

interface ScheduleGridProps {
  schedules: ReportScheduleWithReport[];
  onToggle: (scheduleId: string, isActive: boolean) => void;
  onDelete: (scheduleId: string) => void;
  onRunNow: (scheduleId: string) => void;
  onEdit: (schedule: ReportScheduleWithReport) => void;
  selectedSchedules?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function ScheduleGrid({ 
  schedules, 
  onToggle,
  onDelete,
  onRunNow,
  onEdit,
  selectedSchedules = [],
  onSelectionChange,
}: ScheduleGridProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Paginated data
  const paginatedSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return schedules.slice(startIndex, endIndex);
  }, [schedules, currentPage, itemsPerPage]);

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedSchedules, id]);
      } else {
        onSelectionChange(selectedSchedules.filter(selectedId => selectedId !== id));
      }
    }
  };

  const getFrequencyColor = (frequency: string): 'info' | 'success' | 'warning' | 'default' => {
    switch (frequency) {
      case 'daily': return 'info';
      case 'weekly': return 'success';
      case 'monthly': return 'warning';
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

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const handleCardClick = (schedule: ReportScheduleWithReport) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    if (lastClickedId === schedule.id && timeSinceLastClick < 300) {
      onEdit(schedule);
      setLastClickTime(0);
      setLastClickedId(null);
    } else {
      setLastClickTime(now);
      setLastClickedId(schedule.id);
    }
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  // Empty state
  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium text-foreground mb-1">No schedules found</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedSchedules.map((schedule) => {
          const isMenuOpen = menuOpenId === schedule.id;
          const isActive = schedule.is_active;
          const isSelected = selectedSchedules.includes(schedule.id);

          return (
            <div
              key={schedule.id}
              onClick={() => handleCardClick(schedule)}
              className={cn(
                'bg-card rounded-lg border transition-all duration-200 cursor-pointer group hover:shadow-lg hover:border-primary/50',
                isActive ? '' : 'opacity-60',
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
                          handleSelectOne(schedule.id, e.target.checked);
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
                        {schedule.name || 'Untitled Schedule'}
                      </h3>
                    </div>
                  </div>

                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => toggleMenu(schedule.id, e)}
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
                        <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg z-20 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(schedule);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRunNow(schedule.id);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Run Now
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggle(schedule.id, !isActive);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            {isActive ? (
                              <>
                                <XCircle className="w-4 h-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </button>
                          <div className="my-1 h-px bg-border" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(schedule.id);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {schedule.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {schedule.description}
                  </p>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant={getFrequencyColor(schedule.frequency)} size="sm">
                    {schedule.frequency}
                  </Badge>
                  <Badge variant={isActive ? 'success' : 'default'} size="sm">
                    {isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Schedule Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Time</span>
                    <span className="text-foreground font-medium">
                      {formatTime(schedule.schedule_time)}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Meta Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Created {formatDate(schedule.created_at)}</span>
                  </div>

                  {schedule.next_run_at && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                      <span className="truncate text-primary font-medium">Next {formatDate(schedule.next_run_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {schedules.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={schedules.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
}