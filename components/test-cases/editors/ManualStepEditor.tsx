// ============================================
// FILE: components/test-cases/editors/ManualStepEditor.tsx
// Editor component for manual test steps
// ============================================
'use client'

import React, { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'

interface ManualStepEditorProps {
  step: any
  index: number
  onUpdate: (index: number, field: 'description' | 'expectedResult', value: string) => void
  onRemove: (index: number) => void
}

export function ManualStepEditor({ step, index, onUpdate, onRemove }: ManualStepEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempDescription, setTempDescription] = useState(step.description || '')
  const [tempExpectedResult, setTempExpectedResult] = useState(step.expectedResult || '')

  const handleSave = () => {
    onUpdate(index, 'description', tempDescription)
    onUpdate(index, 'expectedResult', tempExpectedResult)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempDescription(step.description || '')
    setTempExpectedResult(step.expectedResult || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="border border-primary rounded-lg p-4 bg-card">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold mt-1">
            {index + 1}
          </span>
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Step Description
              </label>
              <textarea
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                className="w-full min-h-[60px] text-sm text-foreground bg-background border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Describe the action..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Expected Result
              </label>
              <textarea
                value={tempExpectedResult}
                onChange={(e) => setTempExpectedResult(e.target.value)}
                className="w-full min-h-[60px] text-sm text-foreground bg-background border border-border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                placeholder="What should happen..."
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary rounded hover:bg-primary/90"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-medium text-foreground bg-muted rounded hover:bg-muted/80"
              >
                Cancel
              </button>
            </div>
          </div>
          <button
            onClick={() => onRemove(index)}
            className="flex-shrink-0 p-1.5 text-error hover:bg-error/10 rounded transition-colors"
            title="Remove step"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow group">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold mt-1">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground font-medium">Step:</span>
              <p className="text-sm font-medium text-foreground mt-1">
                {step.description || <span className="text-muted-foreground italic">No description</span>}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Expected:</span>
              <p className="text-sm text-foreground mt-1">
                {step.expectedResult || <span className="text-muted-foreground italic">No expected result</span>}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
            title="Edit step"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 text-error hover:bg-error/10 rounded transition-colors"
            title="Remove step"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}