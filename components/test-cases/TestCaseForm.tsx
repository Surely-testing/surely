// ============================================
// FILE: components/test-cases/TestCaseForm.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { ArrowLeft, Plus, Trash } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import type { TestCase, TestCaseFormData, TestCasePriority } from '@/types/test-case.types'
import type { Json } from '@/types/database.types'

interface TestCaseFormProps {
  suiteId: string
  testCase?: TestCase
  onSuccess: () => void
  onCancel: () => void
}

export function TestCaseForm({ suiteId, testCase, onSuccess, onCancel }: TestCaseFormProps) {
  const { supabase, user } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<TestCaseFormData>({
    title: testCase?.title || '',
    description: testCase?.description || '',
    priority: (testCase?.priority as TestCasePriority) || 'medium',
    expected_result: testCase?.expected_result || '',
  })

  const [steps, setSteps] = useState<Array<{ step: string }>>(
    testCase?.steps ? (testCase.steps as any) : [{ step: '' }]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { step: value }
    setSteps(newSteps)
  }

  const addStep = () => {
    setSteps([...steps, { step: '' }])
  }

  const removeStep = (index: number) => {
    if (steps.length === 1) {
      toast.error('At least one step is required')
      return
    }
    const newSteps = steps.filter((_, i) => i !== index)
    setSteps(newSteps)
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

    if (steps.some((s) => !s.step.trim())) {
      toast.error('All test steps must have content')
      return
    }

    setIsLoading(true)

    try {
      if (testCase) {
        const { error: updateError } = await supabase
          .from('test_cases')
          .update({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            expected_result: formData.expected_result,
            steps: steps as Json,
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
            steps: steps as Json,
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
      console.error('Error saving test case:', err)
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
            {testCase ? 'Update the test case details below' : 'Fill in the details to create a new test case'}
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
          </div>
        </section>

        {/* Test Steps */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Test Steps <span className="text-error">*</span>
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="w-4 h-4 mr-1" />
              Add Step
            </Button>
          </div>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium mt-2">
                  {index + 1}
                </span>
                <Input
                  type="text"
                  placeholder={`Step ${index + 1}`}
                  value={step.step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  className="flex-1"
                />
                {steps.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="mt-2"
                  >
                    <Trash className="w-4 h-4 text-error" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Expected Result */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Expected Result</h3>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Expected Result
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