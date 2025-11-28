'use client'

import React from 'react'
import { Check, X, AlertCircle, FileText, Bug } from 'lucide-react'

type AIGeneratedContent = {
  id: string
  type: 'bug_report' | 'test_case' | 'test_cases' | 'report' | 'document'
  status: 'draft' | 'reviewed' | 'saved'
  data: any
  createdAt: Date
}

interface GeneratedContentPreviewProps {
  content: AIGeneratedContent
  onSave: (contentId: string) => void
  onDiscard: (contentId: string) => void
  onReview: (contentId: string) => void
}

export function GeneratedContentPreview({ 
  content, 
  onSave, 
  onDiscard,
  onReview 
}: GeneratedContentPreviewProps) {
  
  if (content.type === 'bug_report') {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Generated Bug Report</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded ${
              content.data.severity === 'critical' ? 'bg-red-600 text-white' :
              content.data.severity === 'high' ? 'bg-orange-500 text-white' :
              content.data.severity === 'medium' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {content.data.severity?.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Title:</span>
            <p className="text-gray-900 mt-1">{content.data.title}</p>
          </div>

          <div>
            <span className="font-semibold text-gray-700">Description:</span>
            <p className="text-gray-900 mt-1">{content.data.description}</p>
          </div>

          {content.data.stepsToReproduce && content.data.stepsToReproduce.length > 0 && (
            <div>
              <span className="font-semibold text-gray-700">Steps to Reproduce:</span>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                {content.data.stepsToReproduce.map((step: string, idx: number) => (
                  <li key={idx} className="text-gray-900">{step}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="font-semibold text-gray-700">Expected:</span>
              <p className="text-gray-900 mt-1 text-xs">{content.data.expectedBehavior}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Actual:</span>
              <p className="text-gray-900 mt-1 text-xs">{content.data.actualBehavior}</p>
            </div>
          </div>

          {content.data.possibleCause && (
            <div>
              <span className="font-semibold text-gray-700">Possible Cause:</span>
              <p className="text-gray-900 mt-1 text-xs">{content.data.possibleCause}</p>
            </div>
          )}

          {content.data.suggestedFix && (
            <div>
              <span className="font-semibold text-gray-700">Suggested Fix:</span>
              <p className="text-gray-900 mt-1 text-xs">{content.data.suggestedFix}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-red-200">
          <button
            onClick={() => onSave(content.id)}
            className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Save to Database
          </button>
          <button
            onClick={() => onDiscard(content.id)}
            className="px-3 py-2 border border-red-300 text-red-700 rounded hover:bg-red-100 text-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  if (content.type === 'test_cases') {
    const testCases = Array.isArray(content.data) ? content.data : content.data.testCases || []
    
    return (
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">
              Generated {testCases.length} Test Case{testCases.length !== 1 ? 's' : ''}
            </h3>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {testCases.map((tc: any, idx: number) => (
            <div key={idx} className="bg-white rounded p-3 border border-blue-200">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm text-gray-900">{tc.id || `TC${idx + 1}`}: {tc.title}</h4>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  tc.priority === 'high' ? 'bg-red-100 text-red-700' :
                  tc.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {tc.priority?.toUpperCase()}
                </span>
              </div>
              
              <p className="text-xs text-gray-600 mb-2">{tc.description}</p>
              
              {tc.steps && tc.steps.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-semibold text-gray-700">Steps:</span>
                  <ol className="list-decimal list-inside text-xs text-gray-600 mt-1 space-y-1">
                    {tc.steps.map((step: any, stepIdx: number) => (
                      <li key={stepIdx}>
                        {typeof step === 'string' ? step : `${step.action} → ${step.expectedResult}`}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-blue-200">
          <button
            onClick={() => onSave(content.id)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Save All to Database
          </button>
          <button
            onClick={() => onDiscard(content.id)}
            className="px-3 py-2 border border-blue-300 text-blue-700 rounded hover:bg-blue-100 text-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Default preview for other types
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Generated Content</h3>
        </div>
      </div>

      <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-64">
        {JSON.stringify(content.data, null, 2)}
      </pre>

      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => onSave(content.id)}
          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
        >
          Save to Database
        </button>
        <button
          onClick={() => onDiscard(content.id)}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-sm"
        >
          Discard
        </button>
      </div>
    </div>
  )
}