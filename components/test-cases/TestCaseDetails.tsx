// ============================================
// FILE: components/test-cases/TestCaseDetail.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TestCaseForm } from './TestCaseForm'
import { formatDateTime } from '@/lib/utils/formatters'
import { useSuiteContext } from '@/providers/SuiteContextProvider'
import { useRouter } from 'next/navigation'

interface TestCaseDetailProps {
  testCase: any
  suiteId: string
}

export function TestCaseDetail({ testCase, suiteId }: TestCaseDetailProps) {
  const router = useRouter()
  const { canWrite, canAdmin } = useSuiteContext()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const getPriorityVariant = (priority: string | null) => {
    switch (priority) {
      case 'critical': return 'danger'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'default'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => router.push(`/${suiteId}/test-cases`)}
        >
          Back to Test Cases
        </Button>
        <div className="flex gap-2">
          {canWrite && (
            <Button
              variant="outline"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit
            </Button>
          )}
          {canAdmin && (
            <Button
              variant="ghost"
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="text-error hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Test Case Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{testCase.title}</CardTitle>
              <div className="flex items-center gap-2">
                {testCase.priority && (
                  <Badge variant={getPriorityVariant(testCase.priority)}>
                    {testCase.priority}
                  </Badge>
                )}
                <Badge variant={testCase.status === 'active' ? 'success' : 'default'}>
                  {testCase.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {testCase.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-foreground">{testCase.description}</p>
            </div>
          )}

          {testCase.steps && testCase.steps.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Test Steps
              </h3>
              <ol className="space-y-2">
                {testCase.steps.map((step: any, index: number) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-foreground">{step.step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {testCase.expected_result && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Expected Result
              </h3>
              <div className="flex gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-success/20">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-foreground">{testCase.expected_result}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border text-sm text-muted-foreground">
            Created {formatDateTime(testCase.created_at)}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {canWrite && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Test Case"
          description="Update test case details"
          size="lg"
        >
          <TestCaseForm
            suiteId={suiteId}
            testCase={testCase}
            onSuccess={() => {
              setIsEditModalOpen(false)
              window.location.reload()
            }}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  )
}