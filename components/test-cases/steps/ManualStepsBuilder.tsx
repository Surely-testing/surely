// ============================================
// FILE: components/test-cases/ManualStepsBuilder.tsx
// Manual test steps builder component
// ============================================
'use client'

import React from 'react'
import { Plus, Trash, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from 'sonner'
import type { ManualStep } from './types'

interface ManualStepsBuilderProps {
  steps: ManualStep[]
  onStepsChange: (steps: ManualStep[]) => void
}

export function ManualStepsBuilder({ steps, onStepsChange }: ManualStepsBuilderProps) {
  const addStep = () => {
    const newStep: ManualStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      description: '',
      expectedResult: '',
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

  const updateStep = (index: number, field: keyof ManualStep, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    onStepsChange(newSteps)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Test Steps <span className="text-error">*</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Define the steps a tester should follow to execute this test
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addStep}>
          <Plus className="w-4 h-4 mr-1" />
          Add Step
        </Button>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-start gap-3">
              <GripVertical className="w-5 h-5 text-muted-foreground mt-2 flex-shrink-0" />
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium mt-1">
                {index + 1}
              </span>

              <div className="flex-1 space-y-3">
                {/* Step Description */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Step Description <span className="text-error">*</span>
                  </label>
                  <Textarea
                    placeholder="e.g., Navigate to the login page and enter username and password"
                    value={step.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Describe the action the tester should perform
                  </p>
                </div>

                {/* Expected Result */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Expected Result <span className="text-error">*</span>
                  </label>
                  <Textarea
                    placeholder="e.g., User should be redirected to the dashboard"
                    value={step.expectedResult}
                    onChange={(e) => updateStep(index, 'expectedResult', e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    What should happen after performing this step
                  </p>
                </div>
              </div>

              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeStep(index)}
                  className="mt-1"
                >
                  <Trash className="w-4 h-4 text-error" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}