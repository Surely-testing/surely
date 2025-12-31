import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';


// Test Run Analysis Component
export function TestRunAnalysis({ suiteId }: { suiteId: string }) {
    // TODO: Implement useTestRunAnalysis hook when backend is ready
    // const { data: analysisData, isLoading } = useTestRunAnalysis(suiteId);

    return (
        <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    Test Run Analysis
                </h3>
                <div className="flex items-center gap-2">
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted">
                        7 Days
                    </button>
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-background bg-primary rounded-lg">
                        30 Days
                    </button>
                    <button className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted">
                        90 Days
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground mb-1 sm:mb-2">Total Test Runs</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-muted-foreground mb-1">-</p>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground mb-1 sm:mb-2">Avg Duration</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-muted-foreground mb-1">-</p>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground mb-1 sm:mb-2">Peak Hours</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-muted-foreground mb-1">-</p>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground mb-1 sm:mb-2">Retry Rate</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-muted-foreground mb-1">-</p>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
            </div>

            {/* Charts and Failures */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Daily Execution Chart */}
                <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4">
                        Test Execution by Day
                    </h4>
                    <div className="flex items-end justify-between h-24 sm:h-32 gap-1 sm:gap-2">
                        {[0, 0, 0, 0, 0, 0, 0].map((_, index) => (
                            <div
                                key={index}
                                className="flex-1 bg-muted/50 rounded-t-lg"
                                style={{ height: '20%' }}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-xs text-muted-foreground">Coming Soon</p>
                    </div>
                </div>

                {/* Top Failures */}
                <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4">
                        Top Test Failures
                    </h4>
                    <div className="space-y-2">
                        {[1, 2, 3].map((index) => (
                            <div 
                                key={index}
                                className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg border border-border"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                                        Test Case #{index}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Coming Soon
                                    </p>
                                </div>
                                <Badge 
                                    variant="default"
                                    size="sm"
                                    className="ml-2"
                                >
                                    -
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}