// ============================================
// FILE: components/ai/AIGeneratedContentPanel.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { Save, Trash2, Edit2, Check, X, Bug, FileText, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface AIGeneratedContent {
  id: string
  type: 'bug_report' | 'test_case' | 'test_cases' | 'report' | 'document'
  status: 'draft' | 'reviewed' | 'saved'
  data: any
  createdAt: Date
}

interface AIGeneratedContentPanelProps {
  content: AIGeneratedContent[]
  onSave: (contentId: string, editedData?: any) => Promise<void>
  onDiscard: (contentId: string) => Promise<void>
  isLoading: boolean
}

export function AIGeneratedContentPanel({
  content,
  onSave,
  onDiscard,
  isLoading
}: AIGeneratedContentPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<any>(null)

  if (content.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-10 h-10 text-primary/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Generated Content</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ask the AI to generate test cases, bug reports, or documentation and they'll appear here for review
        </p>
      </div>
    )
  }

  const handleEdit = (item: AIGeneratedContent) => {
    setEditingId(item.id)
    setEditedData(JSON.parse(JSON.stringify(item.data)))
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditedData(null)
  }

  const handleSaveEdit = async (contentId: string) => {
    await onSave(contentId, editedData)
    setEditingId(null)
    setEditedData(null)
  }

  const updateField = (field: string, value: any) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }))
  }

  const renderBugReport = (item: AIGeneratedContent) => {
    const isEditing = editingId === item.id
    const data = isEditing ? editedData : item.data

    return (
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bug className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Bug Report</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            data.severity === 'critical' ? 'bg-destructive/10 border-destructive text-destructive' :
            data.severity === 'high' ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400' :
            data.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-600 dark:text-yellow-400' :
            'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
          }`}>
            {data.severity?.toUpperCase()}
          </span>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-2">
              Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={data.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-foreground font-medium">{data.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={data.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">{data.description}</p>
            )}
          </div>

          {/* Severity & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-2">
                Severity
              </label>
              {isEditing ? (
                <select
                  value={data.severity}
                  onChange={(e) => updateField('severity', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              ) : (
                <p className="text-foreground text-sm capitalize">{data.severity}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-2">
                Priority
              </label>
              {isEditing ? (
                <select
                  value={data.priority}
                  onChange={(e) => updateField('priority', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              ) : (
                <p className="text-foreground text-sm capitalize">{data.priority}</p>
              )}
            </div>
          </div>

          {/* Steps to Reproduce */}
          {data.stepsToReproduce && data.stepsToReproduce.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-2">
                Steps to Reproduce
              </label>
              <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-sm">
                {data.stepsToReproduce.map((step: string, idx: number) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Expected vs Actual Behavior */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-2">
                Expected Behavior
              </label>
              <p className="text-muted-foreground text-sm">{data.expectedBehavior}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-2">
                Actual Behavior
              </label>
              <p className="text-muted-foreground text-sm">{data.actualBehavior}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {isEditing ? (
            <>
              <button
                onClick={() => handleSaveEdit(item.id)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Apply Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onSave(item.id)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save to Database
              </button>
              <button
                onClick={() => handleEdit(item)}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDiscard(item.id)}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  const renderTestCases = (item: AIGeneratedContent) => {
    const testCases = Array.isArray(item.data) ? item.data : item.data.testCases || []

    return (
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {testCases.length} Test Case{testCases.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {testCases.map((tc: any, idx: number) => (
            <div key={idx} className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm text-foreground">
                  {tc.id || `TC${idx + 1}`}: {tc.title}
                </h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                  tc.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  tc.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {tc.priority?.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{tc.description}</p>
              
              {tc.steps && tc.steps.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">Steps:</p>
                  <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
                    {tc.steps.map((step: any, stepIdx: number) => (
                      <li key={stepIdx}>
                        {typeof step === 'string' ? step : step.action}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => onSave(item.id)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save All to Database
          </button>
          <button
            onClick={() => onDiscard(item.id)}
            className="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-bold text-foreground">Generated Content</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Review and edit before saving to database
        </p>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {content.map((item) => (
          <div key={item.id}>
            {item.type === 'bug_report' && renderBugReport(item)}
            {(item.type === 'test_cases' || item.type === 'test_case') && renderTestCases(item)}
            {/* Add more renderers for other types as needed */}
          </div>
        ))}
      </div>
    </div>
  )
}