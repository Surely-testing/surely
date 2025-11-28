// ============================================
// components/reports/GenerateReportDialog.tsx
// Dialog for creating instant reports
// ============================================
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportType, ReportFormData } from '@/types/report.types';

interface GenerateReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (formData: ReportFormData) => Promise<void>;
  isGenerating?: boolean;
}

export function GenerateReportDialog({
  isOpen,
  onClose,
  onGenerate,
  isGenerating = false,
}: GenerateReportDialogProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    name: '',
    type: 'test_coverage',
    filters: {
      date_range: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerate(formData);
    onClose();
    setFormData({
      name: '',
      type: 'test_coverage',
      filters: {
        date_range: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Generate Report</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Report Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Q4 Test Coverage Report"
              required
            />
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Report Type
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

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={formData.filters?.date_range?.start || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  filters: {
                    ...formData.filters,
                    date_range: {
                      ...formData.filters?.date_range,
                      start: e.target.value,
                      end: formData.filters?.date_range?.end || '',
                    },
                  },
                })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={formData.filters?.date_range?.end || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  filters: {
                    ...formData.filters,
                    date_range: {
                      ...formData.filters?.date_range,
                      start: formData.filters?.date_range?.start || '',
                      end: e.target.value,
                    },
                  },
                })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">
              {getReportDescription(formData.type)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getReportDescription(type: ReportType): string {
  switch (type) {
    case 'test_coverage':
      return 'Analyze test case coverage, pass rates, and identify gaps in testing.';
    case 'bug_trends':
      return 'Track bug creation, resolution rates, and severity distribution over time.';
    case 'sprint_summary':
      return 'Comprehensive overview of sprint activities, velocity, and deliverables.';
    case 'team_performance':
      return 'Measure team productivity, contributions, and identify top performers.';
    case 'custom':
      return 'Create a custom report with your selected metrics and filters.';
    default:
      return '';
  }
}