// ============================================
// FILE: components/test-cases/AutomatedStepsBuilder.tsx
// Automated test steps builder component
// ============================================
'use client'

import React, { useState } from 'react'
import { Plus, Trash, GripVertical, Database, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { toast } from 'sonner'
import { useTestDataTypes, useTestDataItems } from '@/lib/hooks/useTestData'
import type { AutomatedStep } from './types'

interface AutomatedStepsBuilderProps {
  steps: AutomatedStep[]
  onStepsChange: (steps: AutomatedStep[]) => void
  suiteId: string
}

export function AutomatedStepsBuilder({ steps, onStepsChange, suiteId }: AutomatedStepsBuilderProps) {
  const [selectedTypeForStep, setSelectedTypeForStep] = useState<Record<number, string>>({})
  const { data: testDataTypes = [] } = useTestDataTypes(suiteId)

  const addStep = () => {
    const newStep: AutomatedStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      action: 'click',
      selector: '',
      description: '',
      useTestData: false,
    }
    onStepsChange([...steps, newStep])
  }

  const removeStep = (index: number) => {
    if (steps.length === 1) {
      toast.error('At least one step is required')
      return
    }
    const newSteps = steps.filter((_, i) => i !== index)
    newSteps.forEach((s, i) => s.order = i + 1)
    onStepsChange(newSteps)
  }

  const updateStep = (index: number, field: keyof AutomatedStep, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    onStepsChange(newSteps)
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
      if (newSteps[index].action === 'fill') {
        newSteps[index].value = ''
      } else if (newSteps[index].action === 'navigate') {
        newSteps[index].url = ''
      }
    }
    onStepsChange(newSteps)
  }

  return (
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
  )
}

// ============================================
// Step Builder Component
// ============================================
interface StepBuilderProps {
  step: AutomatedStep
  index: number
  testDataTypes: any[]
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