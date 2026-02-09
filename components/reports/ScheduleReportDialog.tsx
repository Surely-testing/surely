// ============================================
// components/reports/ScheduleReportDialog.tsx
// Dialog for scheduling automated reports
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportType, ReportFrequency, ReportScheduleFormData, ReportScheduleWithReport } from '@/types/report.types';
import { toast } from 'sonner';
import { CustomReportConfigurator, CustomReportConfig } from './CustomReportConfigurator';

interface ScheduleReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (formData: ReportScheduleFormData) => Promise<void>;
  existingSchedule?: ReportScheduleWithReport | null;
  isSubmitting?: boolean;
  suiteId: string;
  suiteName?: string;
}

export function ScheduleReportDialog({
  isOpen,
  onClose,
  onSchedule,
  existingSchedule,
  isSubmitting = false,
  suiteId,
  suiteName,
}: ScheduleReportDialogProps) {
  const [formData, setFormData] = useState<ReportScheduleFormData>({
    name: '',
    type: 'test_coverage',
    frequency: 'weekly',
    emails: [''],
    is_active: true,
    suite_id: suiteId,
    filters: {
      date_range: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    },
    custom_config: undefined,
  });

  useEffect(() => {
    if (existingSchedule) {
      // Helper function to safely convert to string
      const toString = (value: any): string => {
        if (value === undefined || value === null) return '';
        if (typeof value === 'string') return value;
        if (value instanceof Date) return value.toISOString().split('T')[0];
        if (typeof value === 'number') return String(value);
        return String(value);
      };

      // Helper to safely parse filters
      const parseFilters = (filters: any) => {
        // If filters is not an object or is null/undefined, return default
        if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
          return {
            date_range: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end: new Date().toISOString().split('T')[0],
            },
          };
        }

        // If filters has date_range, parse it
        if (filters.date_range && typeof filters.date_range === 'object') {
          return {
            ...filters,
            date_range: {
              start: toString(filters.date_range.start),
              end: toString(filters.date_range.end),
            },
          };
        }

        // Otherwise return filters with default date_range
        return {
          ...filters,
          date_range: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
          },
        };
      };

      const scheduleData = {
        report_id: existingSchedule.report_id || undefined,
        name: existingSchedule.name || '',
        type: existingSchedule.type as ReportType,
        frequency: existingSchedule.frequency as ReportFrequency,
        emails: Array.isArray(existingSchedule.emails) ? existingSchedule.emails : [''],
        is_active: existingSchedule.is_active ?? true,
        suite_id: existingSchedule.suite_id || suiteId,
        filters: parseFilters(existingSchedule.filters),
        custom_config: (existingSchedule as any).custom_config || undefined,
      };

      setFormData(scheduleData);

      // If custom config exists, set it and show the panel
      if ((existingSchedule as any).custom_config) {
        setCustomConfig((existingSchedule as any).custom_config);
        setShowCustomConfig(true);
      }
    } else {
      // Reset to defaults when no existing schedule
      setFormData({
        name: '',
        type: 'test_coverage',
        frequency: 'weekly',
        emails: [''],
        is_active: true,
        suite_id: suiteId,
        filters: {
          date_range: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
          },
        },
        custom_config: undefined,
      });
      setShowCustomConfig(false);
    }
  }, [existingSchedule, suiteId]);

  // Toggle custom config when report type changes to/from 'custom'
  useEffect(() => {
    if (formData.type === 'custom') {
      setShowCustomConfig(true);
    } else {
      setShowCustomConfig(false);
    }
  }, [formData.type]);

  const [isLoading, setIsLoading] = useState(false);
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [customConfig, setCustomConfig] = useState<CustomReportConfig>({
    sections: ['test_coverage'],
    metrics: {
      testCoverage: ['total_tests', 'pass_rate', 'coverage_percentage'],
      bugTrends: ['total_bugs', 'critical_bugs', 'resolution_rate'],
      performance: [],
    },
    filters: {},
    dateRange: {
      type: 'relative',
      relative: { value: 7, unit: 'days' },
    },
    groupBy: 'none',
    includeCharts: true,
    includeTrends: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty emails
    const validEmails = formData.emails.filter(email => email.trim() !== '');

    if (validEmails.length === 0) {
      toast.error('Validation Error', { description: 'Please add at least one email recipient' });
      return;
    }

    // Ensure suite_id is included
    if (!formData.suite_id) {
      toast.error('Validation Error', { description: 'Suite ID is required' });
      return;
    }

    // Ensure name is included
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Validation Error', { description: 'Report name is required' });
      return;
    }

    // Validate custom report configuration
    if (formData.type === 'custom') {
      if (customConfig.sections.length === 0) {
        toast.error('Validation Error', { description: 'Please select at least one report section' });
        return;
      }
    }

    try {
      setIsLoading(true);
      const submitData = { 
        ...formData, 
        emails: validEmails,
        custom_config: formData.type === 'custom' ? customConfig : undefined,
      };
      await onSchedule(submitData);
      onClose();
      resetForm();
    } catch (error) {
      // Error is already handled by the hook
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'test_coverage',
      frequency: 'weekly',
      emails: [''],
      is_active: true,
      suite_id: suiteId,
      filters: {
        date_range: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
      },
    });
  };

  const addEmail = () => {
    setFormData({ ...formData, emails: [...formData.emails, ''] });
  };

  const removeEmail = (index: number) => {
    setFormData({
      ...formData,
      emails: formData.emails.filter((_, i) => i !== index),
    });
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...formData.emails];
    newEmails[index] = value;
    setFormData({ ...formData, emails: newEmails });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-background border border-border rounded-lg shadow-lg w-full max-h-[90vh] flex flex-col transition-all duration-300" 
        style={{ maxWidth: showCustomConfig ? '900px' : '500px' }}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">
            {existingSchedule ? 'Edit Schedule' : 'Schedule Report'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Suite Info Display */}
          {suiteName && (
            <div className="p-3 border border-border rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Test Suite</p>
              <p className="text-sm font-medium text-foreground">{suiteName}</p>
            </div>
          )}

          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Schedule Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Weekly Test Summary"
              required
            />
          </div>

          {/* Report Type & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Report Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ReportType })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="test_coverage">Test Coverage</option>
                <option value="bug_trends">Bug Trends</option>
                <option value="sprint_summary">Sprint Summary</option>
                <option value="team_performance">Team Performance</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as ReportFrequency })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Custom Report Configuration */}
          {showCustomConfig && (
            <div className="border-2 border-border/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Custom Report Configuration</h3>
              </div>
              <CustomReportConfigurator
                config={customConfig}
                onChange={setCustomConfig}
              />
            </div>
          )}

          {/* Email Recipients */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-foreground">
                Email Recipients <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addEmail}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Email
              </button>
            </div>
            <div className="space-y-2">
              {formData.emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="user@example.com"
                    required
                  />
                  {formData.emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail(index)}
                      className="p-2 text-muted-foreground hover:text-error hover:bg-destructive/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-sm text-foreground">
              Activate schedule immediately
            </label>
          </div>

          {/* Schedule Info */}
          <div className="p-3 border border-border rounded-md">
            <p className="text-xs text-muted-foreground">
              {getScheduleInfo(formData.frequency)}
            </p>
          </div>
        </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex justify-end gap-3 p-4 border-t border-border flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading 
                ? (existingSchedule ? 'Updating...' : 'Creating...')
                : (existingSchedule ? 'Update Schedule' : 'Create Schedule')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getScheduleInfo(frequency: ReportFrequency): string {
  switch (frequency) {
    case 'daily':
      return 'Report will be generated and emailed every day at 9:00 AM UTC.';
    case 'weekly':
      return 'Report will be generated and emailed every Monday at 9:00 AM UTC.';
    case 'monthly':
      return 'Report will be generated and emailed on the 1st of each month at 9:00 AM UTC.';
    default:
      return '';
  }
}