import React from 'react';
import { Card } from '@/components/ui/Card';
import { 
    BarChart3
} from 'lucide-react';

// Historical Trends Component
export function HistoricalTrends({ suiteId }: { suiteId: string }) {
    // TODO: Implement useHistoricalTrends hook when backend is ready
    // const { data: historicalData, isLoading } = useHistoricalTrends(suiteId);
    
    return (
        <Card className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
                Historical Bug Trends
            </h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                    <table className="w-full min-w-[500px]">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                    Sprint
                                </th>
                                <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                    New Bugs
                                </th>
                                <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                    Resolved
                                </th>
                                <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                    Trend
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={4} className="py-8 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
                                        <p className="text-sm text-muted-foreground">Coming Soon</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    );
}
