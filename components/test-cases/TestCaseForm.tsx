// ============================================
// FILE: components/test-cases/TestCaseForm.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { useSupabase } from '@/providers/SupabaseProvider'
import type { Json } from '@/types/database.types'

interface TestCaseFormProps {
  suiteId: string
  testCase?: any
  onSuccess: () => void
  onCancel: () => void
}

export function TestCaseForm({ suiteId, testCase, onSuccess, onCancel }: TestCaseFormProps) {
  const { supabase, user } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: testCase?.title || '',
    description: testCase?.description || '',
    priority: testCase?.priority || 'medium',
    expectedResult: testCase?.expected_result || '',
    steps: testCase?.steps || [{ step: '' }],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...formData.steps]
    newSteps[index] = { step: value }
    setFormData({ ...formData, steps: newSteps })
  }

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, { step: '' }] })
  }

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, steps: newSteps })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError('')

    try {
      if (testCase) {
        // Update existing
        const { error: updateError } = await supabase
          .from('test_cases')
          .update({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            expected_result: formData.expectedResult,
            steps: formData.steps as Json,
          })
          .eq('id', testCase.id)

        if (updateError) throw updateError
      } else {
        // Create new
        const { error: createError } = await supabase
          .from('test_cases')
          .insert({
            suite_id: suiteId,
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            expected_result: formData.expectedResult,
            steps: formData.steps as Json,
            created_by: user.id,
          })

        if (createError) throw createError
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to save test case')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-error rounded-xl">
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}

      <Input
        label="Test Case Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="e.g., User can login with valid credentials"
        required
      />

      <Textarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Describe what this test case covers..."
        rows={3}
      />

      <Select
        label="Priority"
        name="priority"
        value={formData.priority}
        onChange={handleChange}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' },
        ]}
      />

      {/* Test Steps */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Test Steps
        </label>
        <div className="space-y-3">
          {formData.steps.map((step: { step: string }, index: number) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`Step ${index + 1}`}
                  value={step.step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                />
              </div>
              {formData.steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(index)}
                >
                  <Trash2 className="h-4 w-4 text-error" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={addStep}
        >
          Add Step
        </Button>
      </div>

      <Textarea
        label="Expected Result"
        name="expectedResult"
        value={formData.expectedResult}
        onChange={handleChange}
        placeholder="What should happen when this test passes..."
        rows={3}
      />

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            testCase ? 'Update Test Case' : 'Create Test Case'
          )}
        </Button>
      </div>
    </form>
  )
}