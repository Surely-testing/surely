import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// Performance Benchmark Component
export function PerformanceBenchmark({ suiteId }: { suiteId: string }) {
    // TODO: Implement usePerformanceMetrics hook when backend is ready
    // const { data: performanceData, isLoading } = usePerformanceMetrics(suiteId);

    return (
        <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    Performance Benchmarks
                </h3>
                <Badge variant="default" size="sm" className="text-xs">Coming Soon</Badge>
            </div>
            
            <div className="space-y-4">
                {/* Average Response Time */}
                <div className="p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Avg Response Time
                            </p>
                            <p className="text-xs text-muted-foreground">All endpoints</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl sm:text-2xl font-bold text-muted-foreground">-</p>
                        </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-muted-foreground/30 h-1.5 rounded-full" style={{ width: '0%' }} />
                    </div>
                </div>

                {/* Percentiles */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">P50</p>
                        <p className="text-base sm:text-lg font-bold text-muted-foreground">-</p>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">P95</p>
                        <p className="text-base sm:text-lg font-bold text-muted-foreground">-</p>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">P99</p>
                        <p className="text-base sm:text-lg font-bold text-muted-foreground">-</p>
                    </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-border">
                        <span className="text-xs font-medium text-muted-foreground">Throughput</span>
                        <span className="text-xs font-bold text-muted-foreground">-</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-border">
                        <span className="text-xs font-medium text-muted-foreground">Error Rate</span>
                        <span className="text-xs font-bold text-muted-foreground">-</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-border">
                        <span className="text-xs font-medium text-muted-foreground">Timeout Rate</span>
                        <span className="text-xs font-bold text-muted-foreground">-</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
