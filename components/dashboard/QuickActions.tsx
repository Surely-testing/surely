// ============================================
// FILE: components/dashboard/QuickActions.tsx
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
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
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}