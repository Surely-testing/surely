// ============================================
// FILE: components/test-cases/TestCaseForm.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {testCase ? 'Edit Test Case' : 'Create New Test Case'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Test Case Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., User can login with valid credentials"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this test case covers..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Test Steps */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Test Steps *
            </label>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {index + 1}.
                    </span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={`Step ${index + 1}`}
                      value={step.step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </button>
          </div>

          {/* Expected Result */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Expected Result
            </label>
            <textarea
              name="expected_result"
              value={formData.expected_result}
              onChange={handleChange}
              placeholder="What should happen when this test passes..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                testCase ? 'Update Test Case' : 'Create Test Case'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}