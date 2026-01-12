// ============================================
// FILE: components/test-cases/TestCaseForm.tsx
// Main form component with manual/automated support
// ============================================
'use client'

import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import type { TestCase, TestCaseFormData, TestCasePriority } from '@/types/test-case.types'
import type { Json } from '@/types/database.types'
import { logger } from '@/lib/utils/logger'
import { ManualStepsBuilder } from './steps/ManualStepsBuilder'
import { AutomatedStepsBuilder } from './steps/AutomatedStepsBuilder'
import type { ManualStep, AutomatedStep } from './steps/types'

interface TestCaseFormProps {
  suiteId: string
  testCase?: TestCase
  onSuccess: () => void
  onCancel: () => void
}

export function TestCaseForm({ suiteId, testCase, onSuccess, onCancel }: TestCaseFormProps) {
  const { supabase, user } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  
  // Determine initial test type from existing test case
  const [testType, setTestType] = useState<'manual' | 'automated'>(() => {
    if (testCase?.steps && Array.isArray(testCase.steps)) {
      const parsedSteps = testCase.steps as any[]
      if (parsedSteps.length > 0 && parsedSteps[0].action) {
        return 'automated'
      }
    }
    return 'manual'
  })

  const [formData, setFormData] = useState<TestCaseFormData>({
    title: testCase?.title || '',
    description: testCase?.description || '',
    priority: (testCase?.priority as TestCasePriority) || 'medium',
    expected_result: testCase?.expected_result || '',
  })

  // Manual steps
  const [manualSteps, setManualSteps] = useState<ManualStep[]>(() => {
    if (testCase?.steps && Array.isArray(testCase.steps)) {
      const parsedSteps = testCase.steps as any[]
      if (parsedSteps.length > 0 && !parsedSteps[0].action) {
        return parsedSteps.map((s, i) => ({
          id: s.id || `step-${i}`,
          order: s.order || i + 1,
          description: s.description || '',
          expectedResult: s.expectedResult || '',
        }))
      }
    }
    return [{
      id: 'step-1',
      order: 1,
      description: '',
      expectedResult: '',
    }]
  })

  // Automated steps
  const [automatedSteps, setAutomatedSteps] = useState<AutomatedStep[]>(() => {
    if (testCase?.steps && Array.isArray(testCase.steps)) {
      const parsedSteps = testCase.steps as any[]
      if (parsedSteps.length > 0 && parsedSteps[0].action) {
        return parsedSteps.map((s, i) => ({
          id: s.id || `step-${i}`,
          order: s.order || i + 1,
          action: s.action,
          selector: s.selector,
          value: s.value,
          url: s.url,
          timeout: s.timeout,
          expectedValue: s.expectedValue,
          assertionType: s.assertionType || 'exists',
          description: s.description || '',
          useTestData: s.useTestData || false,
          testDataRef: s.testDataRef,
        }))
      }
    }
    return [{
      id: 'step-1',
      order: 1,
      action: 'navigate',
      url: '/',
      description: 'Navigate to page',
      useTestData: false,
    }]
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    if (!formData.title?.trim()) {
      toast.error('Title is required')
      return
    }

    // Validate steps based on test type
    if (testType === 'manual') {
      for (let i = 0; i < manualSteps.length; i++) {
        const step = manualSteps[i]
        if (!step.description?.trim()) {
          toast.error(`Step ${i + 1}: Description is required`)
          return
        }
        if (!step.expectedResult?.trim()) {
          toast.error(`Step ${i + 1}: Expected result is required`)
          return
        }
      }
    } else {
      for (let i = 0; i < automatedSteps.length; i++) {
        const step = automatedSteps[i]
        if (!step.description?.trim()) {
          toast.error(`Step ${i + 1}: Description is required`)
          return
        }
        if (!step.action) {
          toast.error(`Step ${i + 1}: Action is required`)
          return
        }

        // Validate based on action type
        if (['click', 'fill', 'select', 'assert', 'scroll', 'hover'].includes(step.action) && !step.selector?.trim()) {
          toast.error(`Step ${i + 1}: Selector is required for ${step.action} action`)
          return
        }

        if (step.action === 'navigate') {
          if (!step.useTestData && !step.url?.trim()) {
            toast.error(`Step ${i + 1}: URL is required for navigate action`)
            return
          }
          if (step.useTestData && !step.testDataRef) {
            toast.error(`Step ${i + 1}: Test data selection is required`)
            return
          }
        }

        if (step.action === 'fill') {
          if (!step.useTestData && !step.value?.trim()) {
            toast.error(`Step ${i + 1}: Value is required for fill action`)
            return
          }
          if (step.useTestData && !step.testDataRef) {
            toast.error(`Step ${i + 1}: Test data selection is required`)
            return
          }
        }

        if (step.action === 'assert' && !step.assertionType) {
          toast.error(`Step ${i + 1}: Assertion type is required`)
          return
        }
      }
    }

    setIsLoading(true)

    try {
      const stepsData = testType === 'manual' 
        ? manualSteps.map(s => ({
            id: s.id,
            order: s.order,
            description: s.description,
            expectedResult: s.expectedResult,
          }))
        : automatedSteps.map(s => ({
            id: s.id,
            order: s.order,
            action: s.action,
            selector: s.selector || undefined,
            value: s.value || undefined,
            url: s.url || undefined,
            timeout: s.timeout || 30000,
            expectedValue: s.expectedValue || undefined,
            assertionType: s.assertionType || 'exists',
            description: s.description,
            useTestData: s.useTestData || false,
            testDataRef: s.testDataRef || undefined,
          }))

      if (testCase) {
        const { error: updateError } = await supabase
          .from('test_cases')
          .update({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            expected_result: formData.expected_result,
            steps: stepsData as Json,
            is_automated: testType === 'automated',
            updated_at: new Date().toISOString(),
          })
          .eq('id', testCase.id)

        if (updateError) throw updateError
        toast.success('Test case updated successfully')
      } else {
        const { error: createError } = await supabase
          .from('test_cases')
          .insert({
            suite_id: suiteId,
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            expected_result: formData.expected_result,
            steps: stepsData as Json,
            is_automated: testType === 'automated',
            created_by: user.id,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (createError) throw createError
        toast.success('Test case created successfully')
      }

      onSuccess()
    } catch (err: any) {
      logger.log('Error saving test case:', err)
      toast.error('Failed to save test case', {
        description: err.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-start gap-4">
        <Button variant="outline" size="sm" onClick={onCancel} className="mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {testCase ? 'Edit Test Case' : 'Create New Test Case'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {testCase ? 'Update the test case details below' : 'Create a manual or automated test case'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Test Case Title <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., User can login with valid credentials"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what this test case covers..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority <span className="text-error">*</span>
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TestCasePriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Test Type <span className="text-error">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="manual"
                    checked={testType === 'manual'}
                    onChange={(e) => setTestType(e.target.value as 'manual' | 'automated')}
                    className="w-4 h-4 text-primary border-input focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm">Manual</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="automated"
                    checked={testType === 'automated'}
                    onChange={(e) => setTestType(e.target.value as 'manual' | 'automated')}
                    className="w-4 h-4 text-primary border-input focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm">Automated</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {testType === 'manual' 
                  ? 'Manual tests require human execution and verification' 
                  : 'Automated tests use step-by-step actions and can be run automatically'}
              </p>
            </div>
          </div>
        </section>

        {/* Test Steps - Conditional based on type */}
        {testType === 'manual' ? (
          <ManualStepsBuilder
            steps={manualSteps}
            onStepsChange={setManualSteps}
          />
        ) : (
          <AutomatedStepsBuilder
            steps={automatedSteps}
            onStepsChange={setAutomatedSteps}
            suiteId={suiteId}
          />
        )}

        {/* Expected Result */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Expected Result</h3>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Overall Expected Result
            </label>
            <Textarea
              name="expected_result"
              value={formData.expected_result}
              onChange={handleChange}
              placeholder="What should happen when this test passes..."
              rows={4}
            />
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : testCase ? 'Update Test Case' : 'Create Test Case'}
          </Button>
        </div>
      </form>
    </div>
  )
}