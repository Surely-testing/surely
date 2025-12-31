'use client';

import React, { useState } from 'react';
import { useTestCaseStats } from '@/lib/hooks/useTestCases';
import { useBugStats } from '@/lib/hooks/useBugs';
import { useSprints } from '@/lib/hooks/useSprints';
import { useRecentActivity } from '@/lib/hooks/useActivity';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { logger } from '@/lib/utils/logger';
import { HistoricalTrends } from '../stats/HistoricalTrends';
import { PerformanceBenchmark } from '../stats/PerformanceBenchmark';
import { TestRunAnalysis } from '../stats/TestAnalysis';
import {
    LayoutDashboard,
    FileCheck,
    Bug,
    Rocket,
    FileText,
    TrendingUp,
    TrendingDown,
    Calendar,
    Plus,
    Target,
    BarChart3,
    Zap,
    ArrowRight,
    CheckCircle2,
    Activity,
    Video,
    Lightbulb,
    Database,
    Users,
    Sparkles,
    RefreshCw,
    Circle,
    Clock,
    AlertTriangle,
    PlayCircle,
    PauseCircle,
    XCircle,
    Filter,
    SlidersHorizontal,
    Search,
    Download,
    ArrowUpRight,
    ChevronDown
} from 'lucide-react';

// Import metric components
import { TestCaseMetrics } from '../stats/TestCaseMetrics';
import { BugTrackingMetrics } from '../stats/BugtrackingMetrics';
import { SprintMetrics } from '../stats/SprintMetrics';
import { DocumentMetrics } from '../stats/DocumentMetrics';
import { RecordingsMetrics } from '../stats/RecordingsMetrics';
import { ReportsMetrics } from '../stats/ReportsMetrics';
import { TestDataMetrics } from '../stats/TestDataMetrics';
import { SuggestionsMetrics } from '../stats/SuggestionsMetrics';
import { TeamProductivity } from '../stats/TeamProductivity';

interface SuiteOverviewProps {
    suiteId: string;
    suiteName?: string;
}

type TabType = 'overview' | 'test-cases' | 'bugs' | 'sprints' | 'documents' | 'recordings' | 'reports' | 'test-data' | 'suggestions' | 'team';

export function SuiteOverview({ suiteId, suiteName = 'Test Suite' }: SuiteOverviewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data: testCaseStats, isLoading: loadingTestCases, refetch: refetchTestCases } = useTestCaseStats(suiteId);
    const { data: bugStats, isLoading: loadingBugs, refetch: refetchBugs } = useBugStats(suiteId);
    const { data: sprints, isLoading: loadingSprints, refetch: refetchSprints } = useSprints(suiteId);
    const { data: activities, isLoading: loadingActivities } = useRecentActivity(suiteId, 10);

    const isLoading = loadingTestCases || loadingBugs || loadingSprints;
    const hasData = testCaseStats !== undefined || bugStats !== undefined || sprints !== undefined;
    const isConnected = !isLoading && hasData;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const refetchPromises = [
                refetchTestCases?.(),
                refetchBugs?.(),
                refetchSprints?.()
            ].filter(Boolean);

            if (refetchPromises.length > 0) {
                await Promise.all(refetchPromises);
            }
        } catch (error) {
            logger.log('Error refreshing data:', error);
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return { value: 0, isPositive: true };
        const change = ((current - previous) / previous) * 100;
        return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
    };

    const testCaseTrend = calculateTrend(testCaseStats?.total || 0, 85);
    const bugTrend = calculateTrend(bugStats?.by_status.open || 0, 12);
    const passRateTrend = calculateTrend(Math.round(testCaseStats?.pass_rate || 0), 87);

    const activeSprints = sprints?.filter(s => s.status === 'active') || [];
    const totalTests = testCaseStats?.total || 0;
    const activeTests = testCaseStats?.by_status.active || 0;
    const archivedTests = testCaseStats?.by_status.archived || 0;
    const totalBugs = bugStats?.total || 0;
    const openBugs = bugStats?.by_status.open || 0;
    const inProgressBugs = bugStats?.by_status.in_progress || 0;
    const resolvedBugs = bugStats?.by_status.resolved || 0;
    const criticalBugs = bugStats?.by_severity.critical || 0;
    const highBugs = bugStats?.by_severity.high || 0;
    const mediumBugs = bugStats?.by_severity.medium || 0;
    const lowBugs = bugStats?.by_severity.low || 0;
    const resolutionRate = Math.round(bugStats?.resolution_rate || 0);
    const executionRate = testCaseStats?.execution_rate || 0;
    const passRate = testCaseStats?.pass_rate || 0;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'test-cases', label: 'Test Cases', icon: FileCheck },
        { id: 'bugs', label: 'Bugs', icon: Bug },
        { id: 'sprints', label: 'Sprints', icon: Rocket },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'recordings', label: 'Recordings', icon: Video },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'test-data', label: 'Test Data', icon: Database },
        { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
        { id: 'team', label: 'Team', icon: Users },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'test_case': return <FileCheck className="w-4 h-4" />;
            case 'bug': return <Bug className="w-4 h-4" />;
            case 'sprint': return <Rocket className="w-4 h-4" />;
            case 'document': return <FileText className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const passedTests = Math.round((passRate / 100) * totalTests);
    const failedTests = Math.round(((100 - passRate) / 100) * totalTests * 0.6);
    const blockedTests = Math.round(((100 - passRate) / 100) * totalTests * 0.3);
    const pendingTests = totalTests - passedTests - failedTests - blockedTests;

    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/30 to-muted/10">
            {/* Header - Mobile First */}
            <header className="bg-card/95 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                <div className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">
                                {suiteName} Dashboard
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                    Sprint 2025-Q4
                                </p>
                                <span className="text-xs text-muted-foreground">•</span>
                                <div className="flex items-center gap-1">
                                    <Circle className={`w-1.5 h-1.5 ${isConnected ? 'fill-success text-success' : 'fill-error text-error'}`} />
                                    <span className="text-xs text-muted-foreground">
                                        {isConnected ? 'Live' : 'Connecting...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* View Selector Dropdown */}
                            <div className="relative flex-1 sm:flex-initial">
                                <select
                                    value={activeTab}
                                    onChange={(e) => setActiveTab(e.target.value as TabType)}
                                    className="w-full sm:w-auto appearance-none pl-3 pr-10 py-2 text-xs sm:text-sm font-medium border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    {tabs.map((tab) => (
                                        <option key={tab.id} value={tab.id}>
                                            {tab.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2 sm:px-4 sm:py-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-all"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>

                            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-background btn-primary rounded-lg hover:bg-primary/90 transition-colors">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-4 sm:px-6 py-4 sm:py-6 lg:py-8 mx-auto">
                {activeTab === 'overview' ? (
                    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                        {/* Hero Metrics - Mobile First */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {/* Primary Metric: Pass Rate */}
                            <Card className="sm:col-span-2 bg-gradient-to-br from-success/90 to-success rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-lg border-0">
                                <div className="flex items-start justify-between mb-4 sm:mb-6">
                                    <div>
                                        <p className="text-success-foreground/80 text-xs sm:text-sm font-medium mb-2">Overall Pass Rate</p>
                                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">{passRate.toFixed(1)}%</h2>
                                        <div className="flex items-center gap-2 text-success-foreground/80">
                                            {passRateTrend.isPositive ? (
                                                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                                            )}
                                            <span className="text-xs sm:text-sm font-medium">
                                                {passRateTrend.isPositive ? '+' : '-'}{passRateTrend.value}% from last sprint
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-white/20">
                                    <div>
                                        <p className="text-success-foreground/80 text-xs mb-1">Passed</p>
                                        <p className="text-xl sm:text-2xl font-semibold">{passedTests}</p>
                                    </div>
                                    <div>
                                        <p className="text-success-foreground/80 text-xs mb-1">Failed</p>
                                        <p className="text-xl sm:text-2xl font-semibold">{failedTests}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Active Bugs */}
                            <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-error/10 rounded-xl flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-error" />
                                    </div>
                                </div>
                                <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{openBugs}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Active Bugs</p>
                                <div className="flex items-center gap-2">
                                    <Badge variant="success" size="sm" className="text-xs">
                                        -{resolvedBugs} resolved
                                    </Badge>
                                </div>
                            </Card>

                            {/* Test Coverage */}
                            <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                                    </div>
                                </div>
                                <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{executionRate}%</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Test Coverage</p>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-accent h-2 rounded-full transition-all duration-600"
                                        style={{ width: `${executionRate}%` }}
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* Secondary Metrics - Compact Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                            <Card className="rounded-lg sm:rounded-xl p-3 sm:p-4 border shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                    <p className="text-xs text-muted-foreground font-medium">Total Tests</p>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-foreground">{totalTests}</p>
                            </Card>

                            <Card className="rounded-lg sm:rounded-xl p-3 sm:p-4 border shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-info rounded-full" />
                                    <p className="text-xs text-muted-foreground font-medium">MTTR</p>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-foreground">-</p>
                            </Card>

                            <Card className="rounded-lg sm:rounded-xl p-3 sm:p-4 border shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-warning rounded-full" />
                                    <p className="text-xs text-muted-foreground font-medium">Defect Density</p>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-foreground">-</p>
                            </Card>

                            <Card className="rounded-lg sm:rounded-xl p-3 sm:p-4 border shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-error rounded-full" />
                                    <p className="text-xs text-muted-foreground font-medium">Escape Rate</p>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-foreground">-</p>
                            </Card>

                            <Card className="rounded-lg sm:rounded-xl p-3 sm:p-4 border shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-accent rounded-full" />
                                    <p className="text-xs text-muted-foreground font-medium">Flakiness</p>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-foreground">-</p>
                            </Card>

                            <Card className="rounded-lg sm:rounded-xl p-3 sm:p-4 border shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-success rounded-full" />
                                    <p className="text-xs text-muted-foreground font-medium">Tests/Hour</p>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-foreground">-</p>
                            </Card>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Test Execution Status */}
                            <Card className="lg:col-span-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Test Execution Status</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Passed</span>
                                            <span className="text-xs sm:text-sm font-semibold text-foreground">{passedTests} ({passRate.toFixed(1)}%)</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5 sm:h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-success to-success/80 h-full rounded-full transition-all duration-600"
                                                style={{ width: `${passRate}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Failed</span>
                                            <span className="text-xs sm:text-sm font-semibold text-foreground">{failedTests} ({((failedTests / totalTests) * 100).toFixed(1)}%)</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5 sm:h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-error to-error/80 h-full rounded-full transition-all duration-600"
                                                style={{ width: `${(failedTests / totalTests) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Blocked</span>
                                            <span className="text-xs sm:text-sm font-semibold text-foreground">{blockedTests} ({((blockedTests / totalTests) * 100).toFixed(1)}%)</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5 sm:h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-warning to-warning/80 h-full rounded-full transition-all duration-600"
                                                style={{ width: `${(blockedTests / totalTests) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Pending</span>
                                            <span className="text-xs sm:text-sm font-semibold text-foreground">{pendingTests} ({((pendingTests / totalTests) * 100).toFixed(1)}%)</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5 sm:h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/30 h-full rounded-full transition-all duration-600"
                                                style={{ width: `${(pendingTests / totalTests) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Test Automation */}
                            <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Test Automation</h3>
                                <div className="flex items-center justify-center py-4">
                                    <div className="relative">
                                        <svg className="w-32 h-32 sm:w-40 sm:h-40 transform -rotate-90">
                                            <circle cx="80" cy="80" r="60" stroke="hsl(var(--muted))" strokeWidth="12" fill="none" />
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="60"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth="12"
                                                fill="none"
                                                strokeDasharray="377"
                                                strokeDashoffset="56"
                                                strokeLinecap="round"
                                                className="transition-all duration-600"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-3xl sm:text-4xl font-bold text-foreground">-</span>
                                            <span className="text-xs sm:text-sm text-muted-foreground">Automated</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-6 space-y-2">
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-muted-foreground">Automated</span>
                                        <span className="font-semibold text-foreground">-</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-muted-foreground">Manual</span>
                                        <span className="font-semibold text-foreground">-</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Bug Priority & Test Types */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Bug Priority Distribution */}
                            <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Bug Priority Distribution</h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 sm:w-24 text-xs sm:text-sm font-medium text-foreground">Critical</div>
                                        <div className="flex-1">
                                            <div className="w-full bg-muted rounded-full h-7 sm:h-8 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-error to-error/80 h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-600"
                                                    style={{ width: totalBugs ? `${(criticalBugs / totalBugs) * 100}%` : '0%' }}
                                                >
                                                    <span className="text-xs font-semibold text-white">{criticalBugs}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 sm:w-24 text-xs sm:text-sm font-medium text-foreground">High</div>
                                        <div className="flex-1">
                                            <div className="w-full bg-muted rounded-full h-7 sm:h-8 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-warning to-warning/80 h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-600"
                                                    style={{ width: totalBugs ? `${(highBugs / totalBugs) * 100}%` : '0%' }}
                                                >
                                                    <span className="text-xs font-semibold text-white">{highBugs}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 sm:w-24 text-xs sm:text-sm font-medium text-foreground">Medium</div>
                                        <div className="flex-1">
                                            <div className="w-full bg-muted rounded-full h-7 sm:h-8 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-info to-info/80 h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-600"
                                                    style={{ width: totalBugs ? `${(mediumBugs / totalBugs) * 100}%` : '0%' }}
                                                >
                                                    <span className="text-xs font-semibold text-white">{mediumBugs}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 sm:w-24 text-xs sm:text-sm font-medium text-foreground">Low</div>
                                        <div className="flex-1">
                                            <div className="w-full bg-muted rounded-full h-7 sm:h-8 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-success to-success/80 h-full rounded-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-600"
                                                    style={{ width: totalBugs ? `${(lowBugs / totalBugs) * 100}%` : '0%' }}
                                                >
                                                    <span className="text-xs font-semibold text-white">{lowBugs}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Test Types */}
                            <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Test Types Breakdown</h3>
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center justify-between p-3 sm:p-4 bg-primary/5 rounded-lg sm:rounded-xl border border-primary/10">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full" />
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Functional</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-foreground">Coming Soon</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 sm:p-4 bg-accent/5 rounded-lg sm:rounded-xl border border-accent/10">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-accent rounded-full" />
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Integration</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-foreground">Coming Soon</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 sm:p-4 bg-success/5 rounded-lg sm:rounded-xl border border-success/10">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-success rounded-full" />
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Regression</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-foreground">Coming Soon</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 sm:p-4 bg-warning/5 rounded-lg sm:rounded-xl border border-warning/10">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-warning rounded-full" />
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Performance</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-foreground">Coming Soon</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Environment & API Testing */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Environment Breakdown */}
                            <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Environment Breakdown</h3>
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center justify-between p-3 sm:p-4 bg-primary/5 rounded-lg sm:rounded-xl border border-primary/10">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full" />
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Chrome</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-foreground">Coming Soon</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 sm:p-4 bg-accent/5 rounded-lg sm:rounded-xl border border-accent/10">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-accent rounded-full" />
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Firefox</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-foreground">Coming Soon</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 sm:p-4 bg-success/5 rounded-lg sm:rounded-xl border border-success/10">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-success rounded-full" />
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Safari</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-foreground">Coming Soon</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 sm:p-4 bg-warning/5 rounded-lg sm:rounded-xl border border-warning/10">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-warning rounded-full" />
                                            <span className="text-xs sm:text-sm font-medium text-foreground">Mobile</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-foreground">Coming Soon</span>
                                    </div>
                                </div>
                            </Card>

                            {/* API Testing */}
                            <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <h3 className="text-base sm:text-lg font-semibold text-foreground">API Testing</h3>
                                    <Badge variant="default" size="sm" className="text-xs">Coming Soon</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                    <div className="bg-primary/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-primary/10">
                                        <p className="text-xs text-muted-foreground mb-1">Endpoints</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-foreground">-</p>
                                    </div>
                                    <div className="bg-success/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-success/10">
                                        <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-foreground">-</p>
                                    </div>
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-muted-foreground">GET Requests</span>
                                            <span className="text-xs font-semibold text-foreground">-</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                                            <div className="bg-success h-full rounded-full" style={{ width: '0%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-muted-foreground">POST Requests</span>
                                            <span className="text-xs font-semibold text-foreground">-</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                                            <div className="bg-primary h-full rounded-full" style={{ width: '0%' }} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        {/* Historical Trends & Performance */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <HistoricalTrends suiteId={suiteId} />
                            <PerformanceBenchmark suiteId={suiteId} />
                        </div>

                        {/* Test Run Analysis */}
                        <TestRunAnalysis suiteId={suiteId} />

                        {/* Workflow Optimizer - Metrics Only */}
                        <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div>
                                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-1">Workflow Optimizer</h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground">AI-powered insights and metrics</p>
                                </div>
                                <Badge variant="default" size="sm">Coming Soon</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div className="bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Time Saved</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-foreground">-</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Optimizations</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-foreground">-</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Efficiency Gain</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-foreground">-</p>
                                </div>
                            </div>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Recent Test Runs
                                </h3>
                            </div>

                            {activities && activities.length > 0 ? (
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                                                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">Title</th>
                                                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">User</th>
                                                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                                                    <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {activities.slice(0, 5).map((activity) => (
                                                    <tr key={activity.id} className="hover:bg-muted/50 transition-colors">
                                                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground">
                                                            {getIcon(activity.type)}
                                                        </td>
                                                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-foreground">
                                                            <div className="truncate max-w-[150px] sm:max-w-none">{activity.title}</div>
                                                        </td>
                                                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                                                            {activity.user.name}
                                                        </td>
                                                        <td className="py-2 sm:py-3 px-3 sm:px-4">
                                                            <Badge
                                                                variant={activity.action === 'created' ? 'success' : activity.action === 'deleted' ? 'danger' : 'default'}
                                                                size="sm"
                                                                className="text-xs"
                                                            >
                                                                {activity.action}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                                                            {new Date(activity.created_at).toLocaleTimeString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 sm:py-12">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">No recent activity</p>
                                </div>
                            )}
                        </Card>
                    </div>
                ) : (
                    <div>
                        {/* Detailed Metrics Content */}
                        {activeTab === 'test-cases' && <TestCaseMetrics suiteId={suiteId} />}
                        {activeTab === 'bugs' && <BugTrackingMetrics suiteId={suiteId} />}
                        {activeTab === 'sprints' && <SprintMetrics suiteId={suiteId} />}
                        {activeTab === 'documents' && <DocumentMetrics suiteId={suiteId} />}
                        {activeTab === 'recordings' && <RecordingsMetrics suiteId={suiteId} />}
                        {activeTab === 'reports' && <ReportsMetrics suiteId={suiteId} />}
                        {activeTab === 'test-data' && <TestDataMetrics suiteId={suiteId} />}
                        {activeTab === 'suggestions' && <SuggestionsMetrics suiteId={suiteId} />}
                        {activeTab === 'team' && <TeamProductivity suiteId={suiteId} />}
                    </div>
                )}
            </main>
        </div>
    );
}