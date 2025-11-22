'use client';

import React from 'react';
import { useTestCaseStats } from '@/lib/hooks/useTestCases';
import { useBugStats } from '@/lib/hooks/useBugs';
import { useSprints } from '@/lib/hooks/useSprints';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import Link from 'next/link';

interface SuiteOverviewProps {
    suiteId: string;
}

export function SuiteOverview({ suiteId }: SuiteOverviewProps) {
    const { data: testCaseStats, isLoading: loadingTestCases } = useTestCaseStats(suiteId);
    const { data: bugStats, isLoading: loadingBugs } = useBugStats(suiteId);
    const { data: sprints, isLoading: loadingSprints } = useSprints(suiteId);

    const isLoading = loadingTestCases || loadingBugs || loadingSprints;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const activeSprints = sprints?.filter(s => s.status === 'active') || [];
    const planningSprints = sprints?.filter(s => s.status === 'planning') || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Suite Overview
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Monitor your testing progress and activity
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href={`/${suiteId}/reports`}>📈 View Reports</Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/${suiteId}/test-cases`}>➕ New Test Case</Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Test Cases Card */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Test Cases
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {testCaseStats?.total || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Badge variant="success">
                            {testCaseStats?.by_status.active || 0} Active
                        </Badge>
                        <Badge variant="primary">
                            {testCaseStats?.by_priority.critical || 0} Critical
                        </Badge>
                    </div>
                </Card>

                {/* Bugs Card */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Bugs
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {bugStats?.total || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🐛</span>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Badge variant="danger">
                            {bugStats?.by_status.open || 0} Open
                        </Badge>
                        <Badge variant="warning">
                            {bugStats?.by_severity.critical || 0} Critical
                        </Badge>
                    </div>
                </Card>

                {/* Sprints Card */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Sprints
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {sprints?.length || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🚀</span>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Badge variant="success">
                            {activeSprints.length} Active
                        </Badge>
                        <Badge variant="primary">
                            {planningSprints.length} Planning
                        </Badge>
                    </div>
                </Card>

                {/* Resolution Rate Card */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Resolution Rate
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                {Math.round(bugStats?.resolution_rate || 0)}%
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${bugStats?.resolution_rate || 0}%` }}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Active Sprints Section */}
            {activeSprints.length > 0 ? (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Active Sprints
                        </h2>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/${suiteId}/sprints`}>View All</Link>
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {activeSprints.slice(0, 3).map((sprint) => (
                            <Link
                                key={sprint.id}
                                href={`/${suiteId}/sprints/${sprint.id}`}
                                className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {sprint.name}
                                        </h3>
                                        {sprint.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {sprint.description}
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant="success">Active</Badge>
                                </div>
                                {sprint.end_date && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                        Ends: {new Date(sprint.end_date).toLocaleDateString()}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                </Card>
            ) : (
                <EmptyState
                    title="No Active Sprints"
                    description="Create a sprint to organize your test cases and bugs"
                    action={
                        <Button asChild>
                            <Link href={`/${suiteId}/sprints`}>Create Sprint</Link>
                        </Button>
                    }
                />
            )}

            {/* Quick Actions */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="justify-start" asChild>
                        <Link href={`/${suiteId}/test-cases`}>
                            <span className="mr-2">✅</span>
                            Create Test Case
                        </Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                        <Link href={`/${suiteId}/bugs`}>
                            <span className="mr-2">🐛</span>
                            Report Bug
                        </Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                        <Link href={`/${suiteId}/documents`}>
                            <span className="mr-2">📁</span>
                            Upload Document
                        </Link>
                    </Button>
                </div>
            </Card>

            {/* Priority Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Case Priority */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Test Cases by Priority
                    </h2>
                    <div className="space-y-3">
                        {[
                            { level: 'critical', count: testCaseStats?.by_priority.critical || 0, color: 'bg-red-500' },
                            { level: 'high', count: testCaseStats?.by_priority.high || 0, color: 'bg-orange-500' },
                            { level: 'medium', count: testCaseStats?.by_priority.medium || 0, color: 'bg-yellow-500' },
                            { level: 'low', count: testCaseStats?.by_priority.low || 0, color: 'bg-green-500' },
                        ].map(({ level, count, color }) => (
                            <div key={level} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${color}`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                        {level}
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Bug Severity */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Bugs by Severity
                    </h2>
                    <div className="space-y-3">
                        {[
                            { level: 'critical', count: bugStats?.by_severity.critical || 0, color: 'bg-red-500' },
                            { level: 'high', count: bugStats?.by_severity.high || 0, color: 'bg-orange-500' },
                            { level: 'medium', count: bugStats?.by_severity.medium || 0, color: 'bg-yellow-500' },
                            { level: 'low', count: bugStats?.by_severity.low || 0, color: 'bg-green-500' },
                        ].map(({ level, count, color }) => (
                            <div key={level} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${color}`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                        {level}
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}