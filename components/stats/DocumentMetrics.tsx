// ============================================
// FILE: components/dashboard/stats/DocumentMetrics.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { FileText, Upload, TrendingUp, File } from 'lucide-react';

interface DocumentMetricsProps {
  suiteId: string;
}

export function DocumentMetrics({ suiteId }: DocumentMetricsProps) {
  // TODO: Create useDocuments hook
  const isLoading = false;
  const totalDocs = 45;
  const recentUploads = 8;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold text-foreground">{totalDocs}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>15% increase</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent Uploads</p>
              <p className="text-2xl font-bold text-foreground">{recentUploads}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Last 7 days</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <File className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold text-foreground">2.4 GB</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '24%' }} />
          </div>
        </Card>
      </div>

      {/* Document Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Documents by Type</h3>
        <div className="space-y-4">
          {[
            { type: 'Test Plans', count: 15, color: 'bg-blue-500', percentage: 33 },
            { type: 'Requirements', count: 12, color: 'bg-purple-500', percentage: 27 },
            { type: 'Bug Reports', count: 10, color: 'bg-red-500', percentage: 22 },
            { type: 'Other', count: 8, color: 'bg-gray-500', percentage: 18 },
          ].map(({ type, count, color, percentage }) => (
            <div key={type}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm font-medium text-foreground">{type}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{count}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`${color} h-2 rounded-full transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Coming Soon */}
      <Card className="p-12">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Detailed Document Analytics Coming Soon
          </h3>
          <p className="text-muted-foreground">
            Track document versions, collaborators, and access patterns
          </p>
        </div>
      </Card>
    </div>
  );
}