// ============================================
// components/reports/CustomReportConfigurator.tsx
// Advanced custom report configuration panel
// ============================================
'use client';

import { useState } from 'react';
import { Info, Plus, X } from 'lucide-react';

export interface CustomReportConfig {
    sections: string[];
    metrics: {
        testCoverage: string[];
        bugTrends: string[];
        performance: string[];
    };
    filters: {
        tags?: string[];
        severity?: string[];
        status?: string[];
        assignees?: string[];
    };
    dateRange: {
        type: 'relative' | 'absolute';
        relative?: {
            value: number;
            unit: 'days' | 'weeks' | 'months';
        };
        absolute?: {
            start: string;
            end: string;
        };
    };
    groupBy?: 'day' | 'week' | 'month' | 'none';
    includeCharts: boolean;
    includeTrends: boolean;
}

interface CustomReportConfiguratorProps {
    config: CustomReportConfig;
    onChange: (config: CustomReportConfig) => void;
}

const AVAILABLE_SECTIONS = [
    { id: 'test_coverage', label: 'Test Coverage Analysis', description: 'Pass/fail rates, coverage percentage' },
    { id: 'bug_trends', label: 'Bug Trends', description: 'Bug creation, resolution, severity breakdown' },
    { id: 'performance', label: 'Performance Metrics', description: 'Test execution time, trends' },
    { id: 'team_activity', label: 'Team Activity', description: 'Contributor stats, velocity' },
];

const TEST_COVERAGE_METRICS = [
    { id: 'total_tests', label: 'Total Tests' },
    { id: 'pass_rate', label: 'Pass Rate' },
    { id: 'fail_rate', label: 'Fail Rate' },
    { id: 'coverage_percentage', label: 'Coverage Percentage' },
    { id: 'test_trends', label: 'Test Trends Over Time' },
];

const BUG_METRICS = [
    { id: 'total_bugs', label: 'Total Bugs' },
    { id: 'open_bugs', label: 'Open Bugs' },
    { id: 'resolved_bugs', label: 'Resolved Bugs' },
    { id: 'critical_bugs', label: 'Critical Bugs' },
    { id: 'resolution_rate', label: 'Resolution Rate' },
    { id: 'bug_severity_breakdown', label: 'Severity Breakdown' },
];

const PERFORMANCE_METRICS = [
    { id: 'avg_execution_time', label: 'Average Execution Time' },
    { id: 'slowest_tests', label: 'Slowest Tests' },
    { id: 'performance_trends', label: 'Performance Trends' },
];

export function CustomReportConfigurator({ config, onChange }: CustomReportConfiguratorProps) {
    const [tagInput, setTagInput] = useState('');

    const updateConfig = (updates: Partial<CustomReportConfig>) => {
        onChange({ ...config, ...updates });
    };

    const toggleSection = (sectionId: string) => {
        const sections = config.sections.includes(sectionId)
            ? config.sections.filter(s => s !== sectionId)
            : [...config.sections, sectionId];
        updateConfig({ sections });
    };

    const toggleMetric = (category: keyof CustomReportConfig['metrics'], metricId: string) => {
        const metrics = { ...config.metrics };
        metrics[category] = metrics[category].includes(metricId)
            ? metrics[category].filter(m => m !== metricId)
            : [...metrics[category], metricId];
        updateConfig({ metrics });
    };

    const addTag = () => {
        if (tagInput.trim()) {
            const filters = { ...config.filters };
            filters.tags = [...(filters.tags || []), tagInput.trim()];
            updateConfig({ filters });
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        const filters = { ...config.filters };
        filters.tags = (filters.tags || []).filter(t => t !== tag);
        updateConfig({ filters });
    };

    return (
        <div className="space-y-4">
            {/* Date Range Configuration */}
            <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                    Date Range <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => updateConfig({
                                dateRange: {
                                    type: 'relative',
                                    relative: { value: 7, unit: 'days' }
                                }
                            })}
                            className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${config.dateRange.type === 'relative'
                                    ? 'border-none bg-blue-50 text-foreground'
                                    : 'border-border/50 bg-background text-muted-foreground hover:border-border'
                                }`}
                        >
                            Relative Period
                        </button>
                        <button
                            type="button"
                            onClick={() => updateConfig({
                                dateRange: {
                                    type: 'absolute',
                                    absolute: {
                                        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                        end: new Date().toISOString().split('T')[0]
                                    }
                                }
                            })}
                            className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${config.dateRange.type === 'absolute'
                                    ? 'border-none bg-blue-50 text-foreground'
                                    : 'border-border/50 bg-background text-muted-foreground hover:border-border'
                                }`}
                        >
                            Specific Dates
                        </button>
                    </div>

                    {config.dateRange.type === 'relative' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Value
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={config.dateRange.relative?.value || 7}
                                    onChange={(e) => updateConfig({
                                        dateRange: {
                                            ...config.dateRange,
                                            relative: {
                                                ...config.dateRange.relative!,
                                                value: parseInt(e.target.value) || 1
                                            }
                                        }
                                    })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Unit
                                </label>
                                <select
                                    value={config.dateRange.relative?.unit || 'days'}
                                    onChange={(e) => updateConfig({
                                        dateRange: {
                                            ...config.dateRange,
                                            relative: {
                                                ...config.dateRange.relative!,
                                                unit: e.target.value as 'days' | 'weeks' | 'months'
                                            }
                                        }
                                    })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                >
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {config.dateRange.type === 'absolute' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={config.dateRange.absolute?.start || ''}
                                    onChange={(e) => updateConfig({
                                        dateRange: {
                                            ...config.dateRange,
                                            absolute: {
                                                ...config.dateRange.absolute!,
                                                start: e.target.value
                                            }
                                        }
                                    })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={config.dateRange.absolute?.end || ''}
                                    onChange={(e) => updateConfig({
                                        dateRange: {
                                            ...config.dateRange,
                                            absolute: {
                                                ...config.dateRange.absolute!,
                                                end: e.target.value
                                            }
                                        }
                                    })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Sections */}
            <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                    Report Sections <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5">
                    {AVAILABLE_SECTIONS.map((section) => (
                        <div
                            key={section.id}
                            onClick={() => toggleSection(section.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${config.sections.includes(section.id)
                                    ? 'border-border bg-orange-50'
                                    : 'border-border/50 bg-background hover:border-border'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={config.sections.includes(section.id)}
                                    onChange={() => { }}
                                    className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-sm text-foreground">{section.label}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{section.description}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Metrics Selection */}
            {config.sections.includes('test_coverage') && (
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">
                        Test Coverage Metrics
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {TEST_COVERAGE_METRICS.map((metric) => (
                            <label
                                key={metric.id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition-all ${config.metrics.testCoverage.includes(metric.id)
                                        ? 'border-border bg-orange-50'
                                        : 'border-border/50 bg-background hover:border-border'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={config.metrics.testCoverage.includes(metric.id)}
                                    onChange={() => toggleMetric('testCoverage', metric.id)}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-xs text-foreground">{metric.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {config.sections.includes('bug_trends') && (
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">
                        Bug Metrics
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {BUG_METRICS.map((metric) => (
                            <label
                                key={metric.id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition-all ${config.metrics.bugTrends.includes(metric.id)
                                        ? 'border-border bg-orange-50'
                                        : 'border-border/50 bg-background hover:border-border'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={config.metrics.bugTrends.includes(metric.id)}
                                    onChange={() => toggleMetric('bugTrends', metric.id)}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-xs text-foreground">{metric.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {config.sections.includes('performance') && (
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">
                        Performance Metrics
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {PERFORMANCE_METRICS.map((metric) => (
                            <label
                                key={metric.id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition-all ${config.metrics.performance.includes(metric.id)
                                        ? 'border-border bg-orange-50'
                                        : 'border-border/50 bg-background hover:border-border'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={config.metrics.performance.includes(metric.id)}
                                    onChange={() => toggleMetric('performance', metric.id)}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-xs text-foreground">{metric.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                    Additional Filters
                </label>

                {/* Tags */}
                <div className="mb-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Tags (optional)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder="Enter tag name..."
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
                        />
                        <button
                            type="button"
                            onClick={addTag}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    {config.filters.tags && config.filters.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {config.filters.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-primary/70"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Severity Filter */}
                <div className="mb-3">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Bug Severity (optional)
                    </label>
                    <select
                        multiple
                        value={config.filters.severity || []}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            updateConfig({ filters: { ...config.filters, severity: selected } });
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                        size={4}
                    >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Status (optional)
                    </label>
                    <select
                        multiple
                        value={config.filters.status || []}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            updateConfig({ filters: { ...config.filters, status: selected } });
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                        size={3}
                    >
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                        <option value="in_progress">In Progress</option>
                    </select>
                </div>
            </div>

            {/* Display Options */}
            <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                    Display Options
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.includeCharts}
                            onChange={(e) => updateConfig({ includeCharts: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Include charts and visualizations</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.includeTrends}
                            onChange={(e) => updateConfig({ includeTrends: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Include trend analysis</span>
                    </label>

                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Group Data By
                        </label>
                        <select
                            value={config.groupBy || 'none'}
                            onChange={(e) => updateConfig({ groupBy: e.target.value as any })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                        >
                            <option value="none">No Grouping</option>
                            <option value="day">By Day</option>
                            <option value="week">By Week</option>
                            <option value="month">By Month</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="p-3 border border-border rounded-lg">
                <div className="flex gap-2">
                    <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-foreground">
                        <p className="font-medium">Custom Report Configuration</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Select sections, metrics, and filters. The report will be generated based on your configuration.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}