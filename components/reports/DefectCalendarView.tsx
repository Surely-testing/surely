// ============================================
// components/reports/DefectCalendarView.tsx
// ============================================
'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, Download, Share2, X, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const localizer = momentLocalizer(moment);

interface DefectCalendarViewProps {
  suiteId: string;
  onClose: () => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    bug: any;
    severity: string;
    status: string;
  };
}

const SEVERITY_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  critical: { bg: '#ef4444', border: '#dc2626', label: 'Critical' },
  high:     { bg: '#f97316', border: '#ea580c', label: 'High'     },
  medium:   { bg: '#eab308', border: '#ca8a04', label: 'Medium'   },
  low:      { bg: '#3b82f6', border: '#2563eb', label: 'Low'      },
};

const STATUS_STYLES: Record<string, string> = {
  open:             'bg-red-50 text-red-700 border border-red-200',
  in_progress:      'bg-blue-50 text-blue-700 border border-blue-200',
  resolved:         'bg-green-50 text-green-700 border border-green-200',
  closed:           'bg-gray-100 text-gray-600 border border-gray-200',
  reopened:         'bg-orange-50 text-orange-700 border border-orange-200',
  blocked:          'bg-purple-50 text-purple-700 border border-purple-200',
  pending:          'bg-yellow-50 text-yellow-700 border border-yellow-200',
  wont_fix:         'bg-gray-100 text-gray-500 border border-gray-200',
  duplicate:        'bg-gray-100 text-gray-500 border border-gray-200',
  cannot_reproduce: 'bg-gray-100 text-gray-500 border border-gray-200',
};

interface PopupPosition {
  top: number;
  left: number;
}

export function DefectCalendarView({ suiteId, onClose }: DefectCalendarViewProps) {
  const [currentDate, setCurrentDate]       = useState(new Date());
  const [currentView, setCurrentView]       = useState<View>('month');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus]     = useState('all');
  const [selectedEvent, setSelectedEvent]   = useState<CalendarEvent | null>(null);
  const [popupPosition, setPopupPosition]   = useState<PopupPosition | null>(null);
  const [rawBugs, setRawBugs]               = useState<any[]>([]);
  const [loading, setLoading]               = useState(false);

  const popupRef    = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Fetch bugs directly — same pattern as BugsView
  useEffect(() => {
    const fetchBugs = async () => {
      if (!suiteId) return;
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('bugs')
          .select('*')
          .eq('suite_id', suiteId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRawBugs(data || []);
      } catch (err) {
        console.error('DefectCalendar: error fetching bugs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBugs();
  }, [suiteId]);

  // Close popup when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectedEvent &&
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        setSelectedEvent(null);
        setPopupPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedEvent]);

  // Client-side filtering
  const bugs = useMemo(() => rawBugs.filter(bug => {
    const sev = filterSeverity === 'all' || bug.severity === filterSeverity;
    const sta = filterStatus   === 'all' || bug.status   === filterStatus;
    return sev && sta;
  }), [rawBugs, filterSeverity, filterStatus]);

  // Transform to calendar events — preserve real time from created_at
  const events = useMemo<CalendarEvent[]>(() => bugs.map(bug => {
    const start = new Date(bug.created_at);
    // For month view, allDay=false with a real timestamp lets week/day views
    // place events at the correct hour. Month view shows them as date-slot items.
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30-min slot
    return {
      id: bug.id,
      title: bug.title,
      start,
      end,
      allDay: false,
      resource: { bug, severity: bug.severity || 'low', status: bug.status || 'open' },
    };
  }), [bugs]);

  // Stats always from full unfiltered set
  const stats = useMemo(() => ({
    total:    rawBugs.length,
    critical: rawBugs.filter(b => b.severity === 'critical').length,
    high:     rawBugs.filter(b => b.severity === 'high').length,
    resolved: rawBugs.filter(b => b.status === 'resolved' || b.status === 'closed').length,
  }), [rawBugs]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const c = SEVERITY_COLORS[event.resource.severity] || SEVERITY_COLORS.low;
    return {
      style: {
        backgroundColor: c.bg,
        borderColor:      c.border,
        borderWidth:      '1px',
        borderStyle:      'solid',
        borderRadius:     '4px',
        color:            'white',
        fontSize:         '11px',
        fontWeight:       '500',
        padding:          '1px 5px',
        cursor:           'pointer',
      },
    };
  }, []);

  // Calculate popup position in *viewport* coordinates (for fixed positioning)
  const calcPosition = useCallback((nativeEvent: React.MouseEvent | MouseEvent) => {
    const POPUP_W = 384;
    const POPUP_H = 440;
    const MARGIN  = 12;

    let left = nativeEvent.clientX + MARGIN;
    let top  = nativeEvent.clientY + MARGIN;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Flip left if too close to right edge
    if (left + POPUP_W > vw - MARGIN) left = nativeEvent.clientX - POPUP_W - MARGIN;
    // Flip up if too close to bottom edge
    if (top + POPUP_H > vh - MARGIN)  top  = nativeEvent.clientY - POPUP_H - MARGIN;
    // Clamp to viewport
    if (left < MARGIN) left = MARGIN;
    if (top  < MARGIN) top  = MARGIN;

    return { top, left };
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent, e: React.SyntheticEvent) => {
    const nativeEvent = e.nativeEvent as MouseEvent;
    setSelectedEvent(event);
    setPopupPosition(calcPosition(nativeEvent));
  }, [calcPosition]);

  // Intercept clicks on events inside the rbc-overlay (+more popup)
  // Strategy: let the click bubble naturally so RBC closes its own overlay,
  // then after a tick we open our detail popup.
  useEffect(() => {
    const handleOverlayEventClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const eventEl = target.closest('.rbc-overlay .rbc-event') as HTMLElement | null;
      if (!eventEl) return;

      // Find matching event by title text inside the element
      const titleEl = eventEl.querySelector('.rbc-event-content');
      const titleText = titleEl?.textContent?.trim();
      if (!titleText) return;

      const matched = events.find(ev => ev.title === titleText);
      if (!matched) return;

      // Capture position NOW before the overlay disappears
      const capturedPos = calcPosition(e);

      // Let the event bubble so RBC's own overlay dismissal logic runs,
      // then open our detail popup on the next tick.
      setTimeout(() => {
        setSelectedEvent(matched);
        setPopupPosition(capturedPos);
      }, 0);
    };

    // Use bubble phase (not capture) so RBC's own handlers run first
    document.addEventListener('click', handleOverlayEventClick, false);
    return () => document.removeEventListener('click', handleOverlayEventClick, false);
  }, [events, calcPosition]);

  const bug      = selectedEvent?.resource.bug;
  const sevColor = bug ? (SEVERITY_COLORS[bug.severity] || SEVERITY_COLORS.low) : null;

  return (
    <div className="flex flex-col gap-3 pb-8">

      {/* ── Top bar: title + actions ──────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-semibold">Defect Calendar</h1>
          {loading && (
            <span className="text-xs text-muted-foreground animate-pulse ml-1">Loading…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors"
            style={{ backgroundColor: '#6366f1' }}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* ── Compact stats + filter bar ────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap px-3 py-2 rounded-lg border border-border bg-muted/30 text-xs">

        {/* Stats */}
        <div className="flex items-center gap-1 text-muted-foreground">
          Total <span className="font-bold text-foreground ml-0.5">{stats.total}</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Critical</span>
          <span className="font-semibold text-foreground">{stats.critical}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">High</span>
          <span className="font-semibold text-foreground">{stats.high}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Resolved</span>
          <span className="font-semibold text-foreground">{stats.resolved}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />
        <div className="w-px h-3 bg-border" />

        {/* Severity dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Severity</span>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="border border-border rounded px-1.5 py-0.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Status</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-border rounded px-1.5 py-0.5 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="reopened">Reopened</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
            <option value="wont_fix">Won&apos;t Fix</option>
          </select>
        </div>

        {/* Clear */}
        {(filterSeverity !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => { setFilterSeverity('all'); setFilterStatus('all'); }}
            className="text-primary hover:underline font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Calendar ──────────────────────────────────────── */}
      <div
        ref={calendarRef}
        className="rounded-lg border border-border overflow-hidden bg-background"
        style={{ height: 'calc(100vh - 230px)', minHeight: '540px' }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', padding: '12px 16px' }}
          views={['month', 'week', 'day', 'agenda']}
          view={currentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onView={setCurrentView}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          popup
          toolbar
        />

        {/* ── Bug Detail Popup (fixed to viewport — never clipped by overflow) ── */}
        {selectedEvent && bug && popupPosition && (
          <div
            ref={popupRef}
            className="fixed z-[9999] w-96 bg-background rounded-xl shadow-2xl border border-border"
            style={{
              top:       popupPosition.top,
              left:      popupPosition.left,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-start justify-between gap-3 sticky top-0"
              style={{
                background: `${sevColor?.bg}12`,
                borderBottom: `2px solid ${sevColor?.bg}`,
              }}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span
                  className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: sevColor?.bg }}
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm leading-snug break-words">
                    {bug.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reported {moment(bug.created_at).format('MMM D, YYYY [at] h:mm A')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEvent(null); setPopupPosition(null); }}
                className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-3">

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: sevColor?.bg }}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {sevColor?.label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[bug.status] || STATUS_STYLES.open}`}>
                  {(bug.status || 'open').replace(/_/g, ' ')}
                </span>
                {bug.priority && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    Priority: {bug.priority}
                  </span>
                )}
              </div>

              {/* Description */}
              {bug.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {bug.description}
                </p>
              )}

              {/* Meta grid — only show populated fields */}
              {[
                { label: 'Environment', value: bug.environment },
                { label: 'Browser',     value: bug.browser     },
                { label: 'OS',          value: bug.os          },
                { label: 'Version',     value: bug.version     },
                { label: 'Module',      value: bug.module      },
                { label: 'Component',   value: bug.component   },
                { label: 'Resolved',    value: bug.resolved_at ? moment(bug.resolved_at).format('MMM D, YYYY') : null },
              ].filter(f => f.value).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Environment', value: bug.environment },
                    { label: 'Browser',     value: bug.browser     },
                    { label: 'OS',          value: bug.os          },
                    { label: 'Version',     value: bug.version     },
                    { label: 'Module',      value: bug.module      },
                    { label: 'Component',   value: bug.component   },
                    { label: 'Resolved',    value: bug.resolved_at ? moment(bug.resolved_at).format('MMM D, YYYY') : null },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="bg-muted/50 rounded-lg p-2">
                      <div className="text-xs text-muted-foreground mb-0.5">{f.label}</div>
                      <div className="text-xs font-medium text-foreground truncate">{f.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              {bug.tags && bug.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bug.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex justify-end sticky bottom-0">
              <button
                onClick={() => { setSelectedEvent(null); setPopupPosition(null); }}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Scoped calendar CSS ───────────────────────────── */}
      <style>{`
        .rbc-calendar { font-family: inherit !important; }

        .rbc-toolbar {
          padding: 4px 0 12px !important;
          margin-bottom: 0 !important;
          gap: 6px !important;
        }
        .rbc-toolbar button {
          padding: 5px 12px !important;
          border: 1px solid #e2e8f0 !important;
          background: white !important;
          color: #374151 !important;
          border-radius: 6px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.15s !important;
          line-height: 1.4 !important;
        }
        .rbc-toolbar button:hover {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
        }
        .rbc-toolbar button.rbc-active,
        .rbc-toolbar button.rbc-active:hover {
          background: #6366f1 !important;
          color: white !important;
          border-color: #6366f1 !important;
        }
        .rbc-toolbar-label {
          font-weight: 600 !important;
          font-size: 14px !important;
        }

        .rbc-header {
          padding: 8px 4px !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: #64748b !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .rbc-header + .rbc-header { border-left: 1px solid #e2e8f0 !important; }

        .rbc-today { background-color: #eef2ff !important; }
        .rbc-off-range-bg { background-color: #fafafa !important; }
        .rbc-date-cell { padding: 3px 6px !important; font-size: 12px !important; }
        .rbc-date-cell.rbc-off-range { opacity: 0.35 !important; }
        .rbc-date-cell.rbc-now button { color: #6366f1 !important; font-weight: 700 !important; }

        .rbc-month-view { border: none !important; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #e2e8f0 !important; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #e2e8f0 !important; }
        .rbc-row-content { z-index: 1 !important; }

        .rbc-event {
          border-radius: 4px !important;
          padding: 1px 5px !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          border: none !important;
        }
        .rbc-event:focus { outline: none !important; box-shadow: 0 0 0 2px rgba(99,102,241,0.5) !important; }
        .rbc-selected { box-shadow: 0 0 0 2px rgba(99,102,241,0.5) !important; }

        .rbc-show-more {
          color: #6366f1 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          background: none !important;
          padding: 0 4px !important;
          cursor: pointer !important;
        }

        .rbc-time-view { border: none !important; }
        .rbc-time-header-content { border-left: 1px solid #e2e8f0 !important; }
        .rbc-time-content { border-top: 1px solid #e2e8f0 !important; }
        .rbc-day-slot .rbc-time-slot { border-top: 1px solid #f1f5f9 !important; }
        .rbc-current-time-indicator { background-color: #6366f1 !important; height: 2px !important; }

        .rbc-agenda-view table.rbc-agenda-table { border: none !important; }
        .rbc-agenda-date-cell, .rbc-agenda-time-cell, .rbc-agenda-event-cell {
          font-size: 12px !important;
          padding: 8px 12px !important;
        }

        .rbc-overlay {
          border-radius: 8px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          border: 1px solid #e2e8f0 !important;
          z-index: 999 !important;
        }
        .rbc-overlay-header {
          font-size: 12px !important;
          font-weight: 600 !important;
          padding: 6px 10px !important;
          border-bottom: 1px solid #e2e8f0 !important;
          margin-bottom: 4px !important;
        }

        /* Clickable events inside +more overlay */
        .rbc-overlay .rbc-event {
          cursor: pointer !important;
          transition: opacity 0.1s !important;
        }
        .rbc-overlay .rbc-event:hover {
          opacity: 0.85 !important;
        }
      `}</style>
    </div>
  );
}