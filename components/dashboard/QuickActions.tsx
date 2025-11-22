// ============================================
// components/dashboard/QuickActions.tsx
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, FileText, Bug, Rocket } from 'lucide-react';

interface QuickActionsProps {
  suiteId: string;
}

export function QuickActions({ suiteId }: QuickActionsProps) {
  const actions = [
    {
      icon: Plus,
      label: 'Create Test Case',
      href: `/${suiteId}/test-cases`,
      description: 'Add a new test case',
    },
    {
      icon: Bug,
      label: 'Report Bug',
      href: `/${suiteId}/bugs`,
      description: 'Log a new bug',
    },
    {
      icon: Rocket,
      label: 'New Sprint',
      href: `/${suiteId}/sprints`,
      description: 'Start a new sprint',
    },
    {
      icon: FileText,
      label: 'Upload Document',
      href: `/${suiteId}/documents`,
      description: 'Add documentation',
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <action.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {action.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
