// ============================================
// FILE: components/test-cases/TestCasesView.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TestCaseTable } from './TestCaseTable'
import { TestCaseForm } from './TestCaseForm'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSuiteContext } from '@/providers/SuiteContextProvider'

type TestCase = {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'critical' | null
  status: 'active' | 'archived' | 'deleted'
  created_at: string
  created_by: string
}

interface TestCasesViewProps {
  suiteId: string
  testCases: TestCase[]
}

export function TestCasesView({ suiteId, testCases: initialTestCases }: TestCasesViewProps) {
  const { canWrite } = useSuiteContext()
  const [testCases] = useState(initialTestCases)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')

  // Filter test cases
  const filteredTestCases = testCases.filter(tc => {
    const matchesSearch = tc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || tc.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  if (testCases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <EmptyState
          icon={<Plus className="h-16 w-16" />}
          title="No test cases yet"
          description="Create your first test case to start testing your application"
          actionLabel={canWrite ? "Create Test Case" : undefined}
          onAction={canWrite ? () => setIsCreateModalOpen(true) : undefined}
        />
        {canWrite && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title="Create Test Case"
            description="Add a new test case to your suite"
            size="lg"
          >
            <TestCaseForm
              suiteId={suiteId}
              onSuccess={() => {
                setIsCreateModalOpen(false)
                window.location.reload()
              }}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </Modal>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Test Cases</h1>
          <p className="text-muted-foreground">
            {filteredTestCases.length} of {testCases.length} test cases
          </p>
        </div>
        {canWrite && (
          <Button
            variant="primary"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Test Case
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search test cases..."
            leftIcon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </div>

      {/* Test Cases Table */}
      <TestCaseTable testCases={filteredTestCases} suiteId={suiteId} />

      {/* Create Modal */}
      {canWrite && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Test Case"
          description="Add a new test case to your suite"
          size="lg"
        >
          <TestCaseForm
            suiteId={suiteId}
            onSuccess={() => {
              setIsCreateModalOpen(false)
              window.location.reload()
            }}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  )
}