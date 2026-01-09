// ============================================
// FILE: components/test-cases/TestCaseForm.tsx
// Enhanced with test data linking
// ============================================
'use client'

import React, { useState } from 'react'
import { ArrowLeft, Plus, Trash, GripVertical, Database, X } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import type { TestCase, TestCaseFormData, TestCasePriority } from '@/types/test-case.types'
import type { Json } from '@/types/database.types'
import { logger } from '@/lib/utils/logger'
import { useTestDataTypes, useTestDataItems } from '@/lib/hooks/useTestData'

interface TestCaseFormProps {
  suiteId: string
  testCase?: TestCase
  onSuccess: () => void
  onCancel: () => void
}

interface TestDataReference {
  typeId: string
  typeName: string
  itemId: string
  itemValue: string
}

interface AutomatedStep {
  id: string
  order: number
  action: 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'assert' | 'screenshot' | 'scroll' | 'hover'
  selector?: string
  value?: string
  url?: string
  timeout?: number
  expectedValue?: string
  assertionType?: 'exists' | 'visible' | 'enabled' | 'equals' | 'contains'
  description: string
  useTestData?: boolean
  testDataRef?: TestDataReference
}

export function TestCaseForm({ suiteId, testCase, onSuccess, onCancel }: TestCaseFormProps) {
  const { supabase, user } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTypeForStep, setSelectedTypeForStep] = useState<Record<number, string>>({})

  // Fetch test data types
  const { data: testDataTypes = [] } = useTestDataTypes(suiteId)

  const [formData, setFormData] = useState<TestCaseFormData>({
    title: testCase?.title || '',
    description: testCase?.description || '',
    priority: (testCase?.priority as TestCasePriority) || 'medium',
    expected_result: testCase?.expected_result || '',
  })

  const [steps, setSteps] = useState<AutomatedStep[]>(() => {
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

  const addStep = () => {
    const newStep: AutomatedStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      action: 'click',
      selector: '',
      description: '',
      useTestData: false,
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (index: number) => {
    if (steps.length === 1) {
      toast.error('At least one step is required')
      return
    }
    const newSteps = steps.filter((_, i) => i !== index)
    newSteps.forEach((s, i) => s.order = i + 1)
    setSteps(newSteps)
  }

  const updateStep = (index: number, field: keyof AutomatedStep, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const toggleTestData = (index: number) => {
    const newSteps = [...steps]
    const currentUseTestData = newSteps[index].useTestData
    newSteps[index] = {
      ...newSteps[index],
      useTestData: !currentUseTestData,
      testDataRef: !currentUseTestData ? undefined : newSteps[index].testDataRef,
    }
    if (!currentUseTestData) {
      // Clear the manual value when switching to test data
      if (newSteps[index].action === 'fill') {
        newSteps[index].value = ''
      } else if (newSteps[index].action === 'navigate') {
        newSteps[index].url = ''
      }
    }
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

    // Validate steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
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

    setIsLoading(true)

    try {
      const stepsData = steps.map(s => ({
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
            {testCase ? 'Update the test case details below' : 'Create an automated test case with step-by-step actions'}
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

        {/* Automated Test Steps */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Automated Test Steps <span className="text-error">*</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Build automated steps with actions, selectors, and test data
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="w-4 h-4 mr-1" />
              Add Step
            </Button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <StepBuilder
                key={step.id}
                step={step}
                index={index}
                testDataTypes={testDataTypes}
                suiteId={suiteId}
                selectedTypeId={selectedTypeForStep[index]}
                onUpdateStep={updateStep}
                onRemoveStep={removeStep}
                onToggleTestData={toggleTestData}
                onSelectType={(typeId) => setSelectedTypeForStep({ ...selectedTypeForStep, [index]: typeId })}
                canRemove={steps.length > 1}
              />
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

// ============================================
// Step Builder Component
// ============================================
interface StepBuilderProps {
  step: AutomatedStep
  index: number
  testDataTypes: any[]
  suiteId: string
  selectedTypeId?: string
  onUpdateStep: (index: number, field: keyof AutomatedStep, value: any) => void
  onRemoveStep: (index: number) => void
  onToggleTestData: (index: number) => void
  onSelectType: (typeId: string) => void
  canRemove: boolean
}

function StepBuilder({
  step,
  index,
  testDataTypes,
  suiteId,
  selectedTypeId,
  onUpdateStep,
  onRemoveStep,
  onToggleTestData,
  onSelectType,
  canRemove
}: StepBuilderProps) {
  const { data: testDataItems = [] } = useTestDataItems(selectedTypeId || step.testDataRef?.typeId || null)

  const handleTestDataSelect = (itemId: string) => {
    const selectedType = testDataTypes.find(t => t.id === selectedTypeId)
    const selectedItem = testDataItems.find(i => i.id === itemId)

    if (selectedType && selectedItem) {
      onUpdateStep(index, 'testDataRef', {
        typeId: selectedType.id,
        typeName: selectedType.name,
        itemId: selectedItem.id,
        itemValue: selectedItem.value,
      })

      // Also update the value/url field for the step
      if (step.action === 'navigate') {
        onUpdateStep(index, 'url', selectedItem.value)
      } else if (step.action === 'fill') {
        onUpdateStep(index, 'value', selectedItem.value)
      }
    }
  }

  const shouldShowValueInput = ['fill', 'navigate'].includes(step.action)
  const shouldShowTestDataToggle = shouldShowValueInput

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start gap-3">
        <GripVertical className="w-5 h-5 text-muted-foreground mt-2 flex-shrink-0" />
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium mt-1">
          {index + 1}
        </span>

        <div className="flex-1 space-y-3">
          {/* Action Type */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Action Type <span className="text-error">*</span>
            </label>
            <Select
              value={step.action}
              onValueChange={(value) => onUpdateStep(index, 'action', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="navigate">Navigate to URL</SelectItem>
                <SelectItem value="click">Click Element</SelectItem>
                <SelectItem value="fill">Fill Input</SelectItem>
                <SelectItem value="select">Select Option</SelectItem>
                <SelectItem value="hover">Hover Element</SelectItem>
                <SelectItem value="scroll">Scroll to Element</SelectItem>
                <SelectItem value="wait">Wait</SelectItem>
                <SelectItem value="assert">Assert</SelectItem>
                <SelectItem value="screenshot">Take Screenshot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Description <span className="text-error">*</span>
            </label>
            <Input
              type="text"
              placeholder="Describe this step..."
              value={step.description}
              onChange={(e) => onUpdateStep(index, 'description', e.target.value)}
            />
          </div>

          {/* Navigate: URL */}
          {step.action === 'navigate' && (
            <div className="space-y-2">
              {shouldShowTestDataToggle && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`use-test-data-${index}`}
                    checked={step.useTestData}
                    onChange={() => onToggleTestData(index)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <label htmlFor={`use-test-data-${index}`} className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Use Test Data
                  </label>
                </div>
              )}

              {step.useTestData ? (
                <TestDataSelector
                  types={testDataTypes}
                  items={testDataItems}
                  selectedTypeId={selectedTypeId || step.testDataRef?.typeId}
                  selectedItemId={step.testDataRef?.itemId}
                  onSelectType={onSelectType}
                  onSelectItem={handleTestDataSelect}
                  label="URL"
                />
              ) : (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    URL <span className="text-error">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="/login or https://example.com/login"
                    value={step.url || ''}
                    onChange={(e) => onUpdateStep(index, 'url', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Selector for click, fill, select, hover, scroll, assert */}
          {['click', 'fill', 'select', 'hover', 'scroll', 'assert'].includes(step.action) && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                CSS Selector <span className="text-error">*</span>
              </label>
              <Input
                type="text"
                placeholder="#email, .btn-submit, button[type='submit']"
                value={step.selector || ''}
                onChange={(e) => onUpdateStep(index, 'selector', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use CSS selectors like #id, .class, or [attribute]
              </p>
            </div>
          )}

          {/* Fill: Value */}
          {step.action === 'fill' && (
            <div className="space-y-2">
              {shouldShowTestDataToggle && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`use-test-data-${index}`}
                    checked={step.useTestData}
                    onChange={() => onToggleTestData(index)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <label htmlFor={`use-test-data-${index}`} className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Use Test Data
                  </label>
                </div>
              )}

              {step.useTestData ? (
                <TestDataSelector
                  types={testDataTypes}
                  items={testDataItems}
                  selectedTypeId={selectedTypeId || step.testDataRef?.typeId}
                  selectedItemId={step.testDataRef?.itemId}
                  onSelectType={onSelectType}
                  onSelectItem={handleTestDataSelect}
                  label="Value"
                />
              ) : (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Value <span className="text-error">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Text to enter"
                    value={step.value || ''}
                    onChange={(e) => onUpdateStep(index, 'value', e.target.value)}
                  />
                </div>
              )}

              {step.useTestData && step.testDataRef && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                  <Database className="w-3 h-3 text-primary" />
                  <span className="font-medium">{step.testDataRef.typeName}:</span>
                  <span className="text-muted-foreground">{step.testDataRef.itemValue}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateStep(index, 'testDataRef', undefined)}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Select: Option Value */}
          {step.action === 'select' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Option Value
              </label>
              <Input
                type="text"
                placeholder="Option value to select"
                value={step.value || ''}
                onChange={(e) => onUpdateStep(index, 'value', e.target.value)}
              />
            </div>
          )}

          {/* Assert */}
          {step.action === 'assert' && (
            <>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Assertion Type <span className="text-error">*</span>
                </label>
                <Select
                  value={step.assertionType}
                  onValueChange={(value) => onUpdateStep(index, 'assertionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exists">Element Exists</SelectItem>
                    <SelectItem value="visible">Element Visible</SelectItem>
                    <SelectItem value="enabled">Element Enabled</SelectItem>
                    <SelectItem value="equals">Text Equals</SelectItem>
                    <SelectItem value="contains">Text Contains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {['equals', 'contains'].includes(step.assertionType || '') && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Expected Value
                  </label>
                  <Input
                    type="text"
                    placeholder="Expected text value"
                    value={step.expectedValue || ''}
                    onChange={(e) => onUpdateStep(index, 'expectedValue', e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {/* Wait: Timeout */}
          {step.action === 'wait' && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Timeout (ms)
              </label>
              <Input
                type="number"
                placeholder="3000"
                value={step.timeout || 3000}
                onChange={(e) => onUpdateStep(index, 'timeout', parseInt(e.target.value))}
              />
            </div>
          )}
        </div>

        {canRemove && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemoveStep(index)}
            className="mt-1"
          >
            <Trash className="w-4 h-4 text-error" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================
// Test Data Selector Component
// ============================================
interface TestDataSelectorProps {
  types: any[]
  items: any[]
  selectedTypeId?: string
  selectedItemId?: string
  onSelectType: (typeId: string) => void
  onSelectItem: (itemId: string) => void
  label: string
}

function TestDataSelector({
  types,
  items,
  selectedTypeId,
  selectedItemId,
  onSelectType,
  onSelectItem,
  label
}: TestDataSelectorProps) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          {label} - Test Data Type <span className="text-error">*</span>
        </label>
        <Select value={selectedTypeId} onValueChange={onSelectType}>
          <SelectTrigger>
            <SelectValue placeholder="Select test data type..." />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  {type.name} ({type.item_count || 0})
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTypeId && (
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            {label} - Select Item <span className="text-error">*</span>
          </label>
          <Select value={selectedItemId} onValueChange={onSelectItem}>
            <SelectTrigger>
              <SelectValue placeholder="Select test data item..." />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}