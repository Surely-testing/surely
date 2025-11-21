
// ============================================
// FILE: components/test-cases/TestCaseTable.tsx
// ============================================
'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { Card } from '@/components/ui/Card'

type TestCase = {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'critical' | null
  status: 'active' | 'archived' | 'deleted'
  created_at: string
  created_by: string
}

interface TestCaseTableProps {
  testCases: TestCase[]
  suiteId: string
}

export function TestCaseTable({ testCases, suiteId }: TestCaseTableProps) {
  const getPriorityVariant = (priority: string | null) => {
    switch (priority) {
      case 'critical':
        return 'danger'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Title
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Priority
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {testCases.map((testCase) => (
              <tr
                key={testCase.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="p-4">
                  <Link
                    href={`/${suiteId}/test-cases/${testCase.id}`}
                    className="block"
                  >
                    <p className="font-medium text-foreground hover:text-primary transition-colors">
                      {testCase.title}
                    </p>
                    {testCase.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {testCase.description}
                      </p>
                    )}
                  </Link>
                </td>
                <td className="p-4">
                  {testCase.priority && (
                    <Badge variant={getPriorityVariant(testCase.priority)}>
                      {testCase.priority}
                    </Badge>
                  )}
                </td>
                <td className="p-4">
                  <Badge variant={testCase.status === 'active' ? 'success' : 'default'}>
                    {testCase.status}
                  </Badge>
                </td>
                <td className="p-4">
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(testCase.created_at)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
