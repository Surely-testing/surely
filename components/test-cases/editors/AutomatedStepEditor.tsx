// ============================================
// FILE: components/test-cases/editors/AutomatedStepEditor.tsx
// Editor component for automated test steps
// ============================================
'use client'

import React, { useState } from 'react'
import { Edit, Trash2, Database } from 'lucide-react'

interface AutomatedStepEditorProps {
  step: any
  index: number
  onUpdate: (index: number, updates: Partial<any>) => void
  onRemove: (index: number) => void
}

export function AutomatedStepEditor({ step, index, onUpdate, onRemove }: AutomatedStepEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempStep, setTempStep] = useState({ ...step })

  const handleSave = () => {
    onUpdate(index, tempStep)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempStep({ ...step })
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
            {/* Action Type */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Action Type</label>
              <select
                value={tempStep.action}
                onChange={(e) => setTempStep({ ...tempStep, action: e.target.value })}
                className="w-full text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="navigate">Navigate to URL</option>
                <option value="click">Click Element</option>
                <option value="fill">Fill Input</option>
                <option value="select">Select Option</option>
                <option value="hover">Hover Element</option>
                <option value="scroll">Scroll to Element</option>
                <option value="wait">Wait</option>
                <option value="assert">Assert</option>
                <option value="screenshot">Take Screenshot</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Description</label>
              <input
                type="text"
                value={tempStep.description || ''}
                onChange={(e) => setTempStep({ ...tempStep, description: e.target.value })}
                className="w-full text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                placeholder="Describe this step..."
              />
            </div>

            {/* URL for navigate */}
            {tempStep.action === 'navigate' && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">URL</label>
                <input
                  type="text"
                  value={tempStep.url || ''}
                  onChange={(e) => setTempStep({ ...tempStep, url: e.target.value })}
                  className="w-full text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  placeholder="/login or https://example.com"
                />
              </div>
            )}

            {/* Selector for most actions */}
            {['click', 'fill', 'select', 'hover', 'scroll', 'assert'].includes(tempStep.action) && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">CSS Selector</label>
                <input
                  type="text"
                  value={tempStep.selector || ''}
                  onChange={(e) => setTempStep({ ...tempStep, selector: e.target.value })}
                  className="w-full text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  placeholder="#id, .class, [attribute]"
                />
              </div>
            )}

            {/* Value for fill */}
            {tempStep.action === 'fill' && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Value</label>
                <input
                  type="text"
                  value={tempStep.value || ''}
                  onChange={(e) => setTempStep({ ...tempStep, value: e.target.value })}
                  className="w-full text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Text to enter"
                />
              </div>
            )}

            {/* Assertion type and expected value */}
            {tempStep.action === 'assert' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Assertion Type</label>
                  <select
                    value={tempStep.assertionType || 'exists'}
                    onChange={(e) => setTempStep({ ...tempStep, assertionType: e.target.value })}
                    className="w-full text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="exists">Element Exists</option>
                    <option value="visible">Element Visible</option>
                    <option value="enabled">Element Enabled</option>
                    <option value="equals">Text Equals</option>
                    <option value="contains">Text Contains</option>
                  </select>
                </div>
                {['equals', 'contains'].includes(tempStep.assertionType || '') && (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Expected Value</label>
                    <input
                      type="text"
                      value={tempStep.expectedValue || ''}
                      onChange={(e) => setTempStep({ ...tempStep, expectedValue: e.target.value })}
                      className="w-full text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Expected text"
                    />
                  </div>
                )}
              </>
            )}

            {/* Timeout for wait */}
            {tempStep.action === 'wait' && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Timeout (ms)</label>
                <input
                  type="number"
                  value={tempStep.timeout || 3000}
                  onChange={(e) => setTempStep({ ...tempStep, timeout: parseInt(e.target.value) || 3000 })}
                  className="w-full text-sm bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  placeholder="3000"
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
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

  // Read-only view
  const stepAction = step.action || 'navigate'
  const stepDescription = step.description || ''
  const stepSelector = step.selector || ''
  const stepValue = step.value || ''
  const stepUrl = step.url || ''
  const stepTimeout = step.timeout || 30000
  const stepAssertionType = step.assertionType || 'exists'
  const stepExpectedValue = step.expectedValue || ''
  const useTestData = step.useTestData || false
  const testDataRef = step.testDataRef

  return (
    <div className="border border-border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow group">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold mt-1">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
              {stepAction.toUpperCase()}
            </span>
            {useTestData && testDataRef && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-info/10 text-info">
                📊 {testDataRef.typeName}
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-foreground mb-2">
            {stepDescription || <span className="text-muted-foreground italic">No description</span>}
          </p>

          <div className="space-y-2 text-xs">
            {stepAction === 'navigate' && stepUrl && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground font-medium min-w-[80px]">URL:</span>
                <code className="flex-1 bg-muted px-2 py-1 rounded font-mono text-foreground break-all">
                  {stepUrl}
                </code>
              </div>
            )}

            {['click', 'fill', 'select', 'hover', 'scroll', 'assert'].includes(stepAction) && stepSelector && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground font-medium min-w-[80px]">Selector:</span>
                <code className="flex-1 bg-muted px-2 py-1 rounded font-mono text-foreground break-all">
                  {stepSelector}
                </code>
              </div>
            )}

            {stepAction === 'fill' && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground font-medium min-w-[80px]">Value:</span>
                {useTestData && testDataRef ? (
                  <span className="flex-1 bg-info/10 px-2 py-1 rounded text-info">
                    {testDataRef.itemValue}
                  </span>
                ) : (
                  <code className="flex-1 bg-muted px-2 py-1 rounded font-mono text-foreground break-all">
                    {stepValue || <span className="text-muted-foreground italic">No value</span>}
                  </code>
                )}
              </div>
            )}

            {stepAction === 'assert' && (
              <>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground font-medium min-w-[80px]">Assertion:</span>
                  <span className="flex-1 bg-muted px-2 py-1 rounded text-foreground">
                    {stepAssertionType}
                  </span>
                </div>
                {stepExpectedValue && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground font-medium min-w-[80px]">Expected:</span>
                    <code className="flex-1 bg-muted px-2 py-1 rounded font-mono text-foreground break-all">
                      {stepExpectedValue}
                    </code>
                  </div>
                )}
              </>
            )}

            {stepTimeout && stepTimeout !== 30000 && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground font-medium min-w-[80px]">Timeout:</span>
                <span className="flex-1 text-foreground">{stepTimeout}ms</span>
              </div>
            )}

            {useTestData && testDataRef && (
              <div className="mt-2 p-2 bg-info/5 border border-info/20 rounded">
                <div className="flex items-center gap-1 text-info mb-1">
                  <Database className="h-3 w-3" />
                  <span className="font-medium">Using Test Data</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Type: {testDataRef.typeName} • Item ID: {testDataRef.itemId.slice(0, 8)}...
                </div>
              </div>
            )}
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