// ============================================
// components/reports/DefectCalendarView.tsx
// Defect Calendar - visualize bugs over time using react-big-calendar
// ============================================
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  ChevronLeft, 
  Download,
  Share2,
  Filter,
  Clock,
  CalendarIcon,
  X
} from 'lucide-react';
import { useBugs } from '@/lib/hooks/useBugs';

const localizer = momentLocalizer(moment);

interface DefectCalendarViewProps {
  suiteId: string;
  onClose: () => void;
}

type DateMode = 'occurred' | 'reported';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    bug: any;
    severity: string;
    status: string;
  };
}

export function DefectCalendarView({ suiteId, onClose }: DefectCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const [dateMode, setDateMode] = useState<DateMode>('reported');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch bugs using your existing hook with filters
  const { data: bugs, isLoading: loading } = useBugs(suiteId, {
    status: filterStatus.length > 0 ? filterStatus : undefined,
    severity: filterSeverity.length > 0 ? filterSeverity : undefined,
  });

  // Transform bugs into calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    if (!bugs || bugs.length === 0) return [];

    return bugs.map(bug => {
      // Use created_at as the event date
      const eventDate = new Date(bug.created_at);
      
      return {
        id: bug.id,
        title: bug.title,
        start: eventDate,
        end: eventDate,
        resource: {
          bug,
          severity: bug.severity || 'low',
          status: bug.status || 'open',
        }
      };
    });
  }, [bugs]);

  // Event style getter for color coding by severity
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const { severity } = event.resource;
    
    let backgroundColor = '#3b82f6'; // default blue
    let borderColor = '#2563eb';
    
    switch (severity) {
      case 'critical':
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
        break;
      case 'high':
        backgroundColor = '#f97316';
        borderColor = '#ea580c';
        break;
      case 'medium':
        backgroundColor = '#eab308';
        borderColor = '#ca8a04';
        break;
      case 'low':
        backgroundColor = '#3b82f6';
        borderColor = '#2563eb';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        fontSize: '12px',
        padding: '2px 4px',
      }
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Handle slot selection (clicking on empty date)
  const handleSelectSlot = useCallback((slotInfo: any) => {
    setSelectedEvent(null);
  }, []);

  // Navigation handlers
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  // Export handler
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting calendar...');
  };

  // Share handler
  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Sharing calendar...');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-700 border-red-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const activeFiltersCount = filterSeverity.length + filterStatus.length;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!bugs || bugs.length === 0) {
      return {
        total: 0,
        critical: 0,
        high: 0,
        resolved: 0,
      };
    }

    return {
      total: bugs.length,
      critical: bugs.filter(b => b.severity === 'critical').length,
      high: bugs.filter(b => b.severity === 'high').length,
      resolved: bugs.filter(b => b.status === 'resolved' || b.status === 'closed').length,
    };
  }, [bugs]);

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto lg:px-2">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Back to Reports"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Defect Calendar</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Visualize defects over time to identify patterns and trends
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-background border border-border rounded-lg mb-6 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Date Mode Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Mode Toggle - Disabled for now since we only have created_at */}
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1 opacity-50 cursor-not-allowed" title="Only creation date available">
                <button
                  disabled
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-background text-foreground shadow-sm"
                >
                  <CalendarIcon className="w-3 h-3 inline mr-1" />
                  Date Created
                </button>
              </div>

              <div className="text-xs text-muted-foreground">
                {loading ? 'Loading...' : `${stats.total} defect${stats.total !== 1 ? 's' : ''}`}
              </div>
            </div>

            {/* Right side - Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-background border-border text-foreground hover:bg-muted'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setFilterSeverity([]);
                    setFilterStatus([]);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Severity Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Severity</label>
                  <div className="flex flex-wrap gap-2">
                    {['critical', 'high', 'medium', 'low'].map((severity) => (
                      <button
                        key={severity}
                        onClick={() => {
                          setFilterSeverity(prev =>
                            prev.includes(severity)
                              ? prev.filter(s => s !== severity)
                              : [...prev, severity]
                          );
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                          filterSeverity.includes(severity)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${getSeverityColor(severity)} inline-block mr-1`} />
                        {severity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(prev =>
                            prev.includes(status)
                              ? prev.filter(s => s !== status)
                              : [...prev, status]
                          );
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                          filterStatus.includes(status)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="bg-background border border-border rounded-lg p-4 mb-6" style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
            view={currentView}
            date={currentDate}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventStyleGetter}
            selectable
            popup
            toolbar={true}
          />
        </div>

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className="bg-background border border-border rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Bug Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${getSeverityColor(selectedEvent.resource.severity)}`} />
                  <h4 className="font-medium">{selectedEvent.resource.bug.title}</h4>
                </div>
                {selectedEvent.resource.bug.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedEvent.resource.bug.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Severity</div>
                  <div className={`text-sm font-medium ${getSeverityTextColor(selectedEvent.resource.severity)}`}>
                    {selectedEvent.resource.severity}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div className={`inline-block px-2 py-1 rounded-md border text-xs ${getStatusColor(selectedEvent.resource.status)}`}>
                    {selectedEvent.resource.status.replace('_', ' ')}
                  </div>
                </div>
                {selectedEvent.resource.bug.priority && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Priority</div>
                    <div className="text-sm font-medium">{selectedEvent.resource.bug.priority}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Created</div>
                  <div className="text-sm">{moment(selectedEvent.start).format('MMM D, YYYY h:mm A')}</div>
                </div>
              </div>

              {selectedEvent.resource.bug.assigned_to && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Assigned To</div>
                  <div className="text-sm">{selectedEvent.resource.bug.assigned_to}</div>
                </div>
              )}

              {selectedEvent.resource.bug.tags && selectedEvent.resource.bug.tags.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.resource.bug.tags.map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 text-xs bg-muted rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Defects</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-background border border-red-200 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Critical</div>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </div>
          <div className="bg-background border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">High</div>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
          </div>
          <div className="bg-background border border-green-200 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Resolved</div>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </div>
        </div>
      </div>

      {/* Custom Calendar Styles */}
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        
        .rbc-header {
          padding: 10px 4px;
          font-weight: 600;
          font-size: 14px;
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .rbc-today {
          background-color: hsl(var(--primary) / 0.05);
        }
        
        .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.3);
        }
        
        .rbc-date-cell {
          padding: 4px 8px;
          font-size: 14px;
        }
        
        .rbc-event {
          padding: 2px 4px;
          font-size: 12px;
        }
        
        .rbc-event-label {
          font-size: 11px;
        }
        
        .rbc-toolbar {
          padding: 12px 0;
          margin-bottom: 16px;
        }
        
        .rbc-toolbar button {
          padding: 6px 12px;
          border: 1px solid hsl(var(--border));
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .rbc-toolbar button:hover {
          background-color: hsl(var(--muted));
        }
        
        .rbc-toolbar button.rbc-active {
          background-color: hsl(var(--primary));
          color: white;
          border-color: hsl(var(--primary));
        }
        
        .rbc-month-view,
        .rbc-time-view,
        .rbc-agenda-view {
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
        }
        
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid hsl(var(--border));
        }
        
        .rbc-time-header-content {
          border-left: 1px solid hsl(var(--border));
        }
        
        .rbc-time-content {
          border-top: 1px solid hsl(var(--border));
        }
      `}</style>
    </div>
  );
}