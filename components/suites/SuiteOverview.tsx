// ============================================
// FILE: components/suites/SuiteOverview.tsx
// Updated with theme system - NO hardcoded colors
// ============================================
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTestCaseStats } from '@/lib/hooks/useTestCases';
import { useBugStats } from '@/lib/hooks/useBugs';
import { useSprints } from '@/lib/hooks/useSprints';
import { useRecentActivity } from '@/lib/hooks/useActivity';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { logger } from '@/lib/utils/logger';
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
    ArrowUpRight
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
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState('7d');

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

    // Add right after the hook declarations
    logger.log('🔍 Debug Info:', {
        suiteId,
        testCaseStats,
        bugStats,
        sprints,
        loadingTestCases,
        loadingBugs,
        loadingSprints,
        hasData,
        isConnected
    });

    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return { value: 0, isPositive: true };
        const change = ((current - previous) / previous) * 100;
        return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
    };

    const testCaseTrend = calculateTrend(testCaseStats?.total || 0, 85);
    const bugTrend = calculateTrend(bugStats?.by_status.open || 0, 12);
    const resolutionTrend = calculateTrend(Math.round(bugStats?.resolution_rate || 0), 68);
    const coverageTrend = calculateTrend(
        testCaseStats?.total ? Math.round(((testCaseStats?.by_status.active || 0) / testCaseStats.total) * 100) : 0,
        72
    );

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

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                        {suiteName} Dashboard
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Comprehensive QA metrics and insights
                        </p>
                        <div className="flex items-center gap-1.5">
                            <Circle className={`w-2 h-2 ${isConnected ? 'fill-success text-success' : 'fill-error text-error'}`} />
                            <span className="text-xs text-muted-foreground">
                                {isConnected ? 'Connected' : 'Connecting...'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 md:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${showFilters
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-card border-border text-foreground hover:bg-muted'
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 md:px-4 py-2 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                                Date Range
                            </label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                                <option value="all">All time</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                                Status
                            </label>
                            <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                                Priority
                            </label>
                            <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="all">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Total Test Cases */}
                <Card className="p-4 border-b-2 border-b-primary">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <FileCheck className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-medium ${testCaseTrend.isPositive ? 'text-success' : 'text-error'}`}>
                            {testCaseTrend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {testCaseTrend.value}%
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Total Tests</p>
                    <p className="text-2xl font-bold text-foreground">{totalTests}</p>
                </Card>

                {/* Open Bugs */}
                <Card className="p-4 border-b-2 border-b-error">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <Bug className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-medium ${bugTrend.isPositive ? 'text-error' : 'text-success'}`}>
                            {bugTrend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {bugTrend.value}%
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Open Bugs</p>
                    <p className="text-2xl font-bold text-foreground">{openBugs}</p>
                </Card>

                {/* Pass Rate */}
                <Card className="p-4 border-b-2 border-b-success">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-medium ${coverageTrend.isPositive ? 'text-success' : 'text-error'}`}>
                            {coverageTrend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {coverageTrend.value}%
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Execution Rate</p>
                    <p className="text-2xl font-bold text-foreground">{executionRate}%</p>
                </Card>

                {/* Active Tests */}
                <Card className="p-4 border-b-2 border-b-accent">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <PlayCircle className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            {activeTests}/{totalTests}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Active Tests</p>
                    <p className="text-2xl font-bold text-foreground">{activeTests}</p>
                </Card>

                {/* Sprints */}
                <Card className="p-4 border-b-2 border-b-warning">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <Rocket className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <Badge variant="success" size="sm">{activeSprints.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Sprints</p>
                    <p className="text-2xl font-bold text-foreground">{sprints?.length || 0}</p>
                </Card>

                {/* Resolution Rate */}
                <Card className="p-4 border-b-2 border-b-info">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <Target className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-medium ${resolutionTrend.isPositive ? 'text-success' : 'text-error'}`}>
                            {resolutionTrend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {resolutionTrend.value}%
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Resolution</p>
                    <p className="text-2xl font-bold text-foreground">{resolutionRate}%</p>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-border">
                <nav className="flex gap-6 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' ? (
                <div className="space-y-6">
                    {/* Test Cases & Bugs Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Test Cases Breakdown */}
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <FileCheck className="w-5 h-5" />
                                Test Cases by Status
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <PlayCircle className="w-5 h-5 text-primary" />
                                        <span className="text-sm font-medium text-foreground">Active</span>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">{activeTests}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                                    <div className="flex items-center gap-3">
                                        <PauseCircle className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm font-medium text-foreground">Archived</span>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">{archivedTests}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Priority</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center justify-between p-3 bg-error/10 rounded-lg border border-error/20">
                                        <span className="text-xs font-medium text-foreground">Critical</span>
                                        <span className="text-sm font-semibold text-error">{testCaseStats?.by_priority.critical || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                                        <span className="text-xs font-medium text-foreground">High</span>
                                        <span className="text-sm font-semibold text-warning">{testCaseStats?.by_priority.high || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-info/10 rounded-lg border border-info/20">
                                        <span className="text-xs font-medium text-foreground">Medium</span>
                                        <span className="text-sm font-semibold text-info">{testCaseStats?.by_priority.medium || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                                        <span className="text-xs font-medium text-foreground">Low</span>
                                        <span className="text-sm font-semibold text-success">{testCaseStats?.by_priority.low || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Bugs Overview */}
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Bug className="w-5 h-5" />
                                Bugs Overview
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between p-4 bg-error/10 rounded-xl border border-error/20">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-error" />
                                        <span className="text-sm font-medium text-foreground">Open</span>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">{openBugs}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-info/10 rounded-xl border border-info/20">
                                    <div className="flex items-center gap-3">
                                        <PlayCircle className="w-5 h-5 text-info" />
                                        <span className="text-sm font-medium text-foreground">In Progress</span>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">{inProgressBugs}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-success/10 rounded-xl border border-success/20">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-success" />
                                        <span className="text-sm font-medium text-foreground">Resolved</span>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">{resolvedBugs}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Severity</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center justify-between p-3 bg-error/10 rounded-lg border border-error/20">
                                        <span className="text-xs font-medium text-foreground">Critical</span>
                                        <span className="text-sm font-semibold text-error">{criticalBugs}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                                        <span className="text-xs font-medium text-foreground">High</span>
                                        <span className="text-sm font-semibold text-warning">{highBugs}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-info/10 rounded-lg border border-info/20">
                                        <span className="text-xs font-medium text-foreground">Medium</span>
                                        <span className="text-sm font-semibold text-info">{mediumBugs}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                                        <span className="text-xs font-medium text-foreground">Low</span>
                                        <span className="text-sm font-semibold text-success">{lowBugs}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link
                                href={`/dashboard/test-cases/new`}
                                className="flex items-center gap-3 p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">New Test Case</p>
                                    <p className="text-xs text-muted-foreground">Create test case</p>
                                </div>
                            </Link>

                            <Link
                                href={`/dashboard/bugs/new`}
                                className="flex items-center gap-3 p-4 border border-border rounded-xl hover:border-error hover:bg-error/5 transition-all group"
                            >
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center group-hover:bg-error transition-colors">
                                    <Bug className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Report Bug</p>
                                    <p className="text-xs text-muted-foreground">Log new issue</p>
                                </div>
                            </Link>

                            <Link
                                href={`/dashboard/sprints/new`}
                                className="flex items-center gap-3 p-4 border border-border rounded-xl hover:border-success hover:bg-success/5 transition-all group"
                            >
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center group-hover:bg-success transition-colors">
                                    <Rocket className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">New Sprint</p>
                                    <p className="text-xs text-muted-foreground">Start sprint</p>
                                </div>
                            </Link>

                            <Link
                                href={`/dashboard/documents/new`}
                                className="flex items-center gap-3 p-4 border border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
                            >
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center group-hover:bg-accent transition-colors">
                                    <FileText className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Add Document</p>
                                    <p className="text-xs text-muted-foreground">Upload docs</p>
                                </div>
                            </Link>
                        </div>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Recent Activity
                            </h2>
                        </div>

                        {activities && activities.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activities.slice(0, 9).map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                                        <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0 text-muted-foreground">
                                            {getIcon(activity.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-medium text-foreground truncate">{activity.user.name}</p>
                                                <Badge
                                                    variant={activity.action === 'created' ? 'success' : activity.action === 'deleted' ? 'danger' : 'default'}
                                                    size="sm"
                                                >
                                                    {activity.action}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mb-1">{activity.title}</p>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                {new Date(activity.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Activity className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">No recent activity</p>
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
        </div>
    );
}