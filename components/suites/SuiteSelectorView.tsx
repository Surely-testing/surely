// ============================================
// FILE: components/suites/SuiteSelectorView.tsx
// ============================================
'use client'

import React from 'react'
import Link from 'next/link'
import { Plus, FolderOpen, Calendar, Users2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Database } from '@/types/database.types'

type Suite = Database['public']['Tables']['test_suites']['Row']

interface SuiteSelectorViewProps {
  suites: Suite[]
  userId: string
}

export function SuiteSelectorView({ suites, userId }: SuiteSelectorViewProps) {
  if (suites.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <EmptyState
          icon={<FolderOpen className="h-16 w-16" />}
          title="No test suites yet"
          description="Create your first test suite to start organizing your testing workflow"
          actionLabel="Create Test Suite"
          onAction={() => window.location.href = '/suites/new'}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Select Test Suite
            </h1>
            <p className="text-muted-foreground">
              Choose a test suite to continue working
            </p>
          </div>
          <Link href="/suites/new">
            <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />}>
              New Suite
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suites.map((suite) => (
          <Link key={suite.id} href={`/${suite.id}`}>
            <Card
              variant="elevated"
              className="h-full cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant={suite.owner_type === 'organization' ? 'primary' : 'default'}>
                    {suite.owner_type === 'organization' ? (
                      <Users2 className="h-3 w-3 mr-1" />
                    ) : null}
                    {suite.owner_type}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-1">{suite.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {suite.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Updated {suite.updated_at ? new Date(suite.updated_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}