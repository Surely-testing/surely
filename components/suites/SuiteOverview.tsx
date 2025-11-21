// ============================================
// FILE: components/suites/SuiteOverview.tsx
// ============================================
'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, Bug, Rocket, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { useSuiteContext } from '@/providers/SuiteContextProvider'

type TestCase = {
  id: string
  title: string
  created_at: string
  created_by: string
}

type BugType = {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
}

interface SuiteOverviewProps {
  suiteId: string
  stats: {
    testCases: number
    bugs: number
    sprints: number
  }
  recentTestCases: TestCase[]
  recentBugs: BugType[]
}

export function SuiteOverview({ suiteId, stats, recentTestCases, recentBugs }: SuiteOverviewProps) {
  const { suite } = useSuiteContext()

  const statCards = [
    {
      title: 'Test Cases',
      value: stats.testCases,
      icon: FileText,
      href: `/${suiteId}/test-cases`,
      color: 'text-primary',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Open Bugs',
      value: stats.bugs,
      icon: Bug,
      href: `/${suiteId}/bugs`,
      color: 'text-error',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      title: 'Active Sprints',
      value: stats.sprints,
      icon: Rocket,
      href: `/${suiteId}/sprints`,
      color: 'text-success',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'danger'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'danger'
      case 'in_progress':
        return 'info'
      case 'resolved':
        return 'success'
      case 'closed':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {suite.name}
        </h1>
        {suite.description && (
          <p className="text-muted-foreground">{suite.description}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-theme-lg transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground mb-1">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Test Cases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Test Cases</CardTitle>
                <CardDescription>Latest test cases created</CardDescription>
              </div>
              <Link href={`/${suiteId}/test-cases`}>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTestCases.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No test cases yet</p>
                <Link href={`/${suiteId}/test-cases`}>
                  <Button variant="primary" size="sm" className="mt-4">
                    Create Test Case
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTestCases.map((testCase) => (
                  <Link
                    key={testCase.id}
                    href={`/${suiteId}/test-cases/${testCase.id}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {testCase.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(testCase.created_at)}
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="h-4 w-4 text-success flex-shrink-0 ml-2" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bugs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Bugs</CardTitle>
                <CardDescription>Latest bugs reported</CardDescription>
              </div>
              <Link href={`/${suiteId}/bugs`}>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentBugs.length === 0 ? (
              <div className="text-center py-8">
                <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No bugs reported yet</p>
                <Link href={`/${suiteId}/bugs`}>
                  <Button variant="primary" size="sm" className="mt-4">
                    Report Bug
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBugs.map((bug) => (
                  <Link
                    key={bug.id}
                    href={`/${suiteId}/bugs/${bug.id}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {bug.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getSeverityColor(bug.severity)} size="sm">
                            {bug.severity}
                          </Badge>
                          <Badge variant={getStatusColor(bug.status)} size="sm">
                            {bug.status.replace('_', ' ')}
                          </Badge>
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(bug.created_at)}
                          </p>
                        </div>
                      </div>
                      <AlertCircle className="h-4 w-4 text-error flex-shrink-0 ml-2" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href={`/${suiteId}/test-cases`}>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Create Test Case
              </Button>
            </Link>
            <Link href={`/${suiteId}/bugs`}>
              <Button variant="outline" className="w-full justify-start">
                <Bug className="h-4 w-4 mr-2" />
                Report Bug
              </Button>
            </Link>
            <Link href={`/${suiteId}/sprints`}>
              <Button variant="outline" className="w-full justify-start">
                <Rocket className="h-4 w-4 mr-2" />
                Create Sprint
              </Button>
            </Link>
            <Link href={`/${suiteId}/reports`}>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}