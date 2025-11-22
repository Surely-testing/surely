// ============================================
// components/reports/ReportsView.tsx
// ============================================
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart3, FileText, TrendingUp, Download } from 'lucide-react';

interface ReportsViewProps {
  suiteId: string;
}

export function ReportsView({ suiteId }: ReportsViewProps) {
  const reportTypes = [
    {
      icon: BarChart3,
      title: 'Test Coverage Report',
      description: 'Overview of test case coverage across your suite',
      action: 'Generate Report',
    },
    {
      icon: TrendingUp,
      title: 'Bug Trends Analysis',
      description: 'Track bug discovery and resolution trends over time',
      action: 'Generate Report',
    },
    {
      icon: FileText,
      title: 'Sprint Summary',
      description: 'Comprehensive report of sprint activities and outcomes',
      action: 'Generate Report',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Generate comprehensive test reports and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.title} className="p-6">
            <div className="flex flex-col h-full">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <report.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {report.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
                {report.description}
              </p>
              <Button variant="outline" className="w-full">
                {report.action}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Reports
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Test Coverage Report - Q4 2024
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generated 2 days ago
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
