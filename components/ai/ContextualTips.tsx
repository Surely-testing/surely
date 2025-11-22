// ============================================
// FILE: components/ai/ContextualTips.tsx
// ============================================
'use client'

import React from 'react'
import { X, Lightbulb, AlertCircle, TrendingUp, Zap, Sparkles } from 'lucide-react'
import { useAI } from './AIAssistantProvider'

export function ContextualTips() {
  const { suggestions, dismissSuggestion, setIsOpen } = useAI()

  const getIcon = (type: string) => {
    switch (type) {
      case 'tip': return Lightbulb
      case 'warning': return AlertCircle
      case 'insight': return TrendingUp
      case 'action': return Zap
      default: return Lightbulb
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case 'tip': return 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800'
      case 'warning': return 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800'
      case 'insight': return 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800'
      case 'action': return 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
      default: return 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-800'
    }
  }

  const visibleSuggestion = suggestions.find(s => s.priority === 'high') || suggestions[0]

  if (!visibleSuggestion) return null

  const Icon = getIcon(visibleSuggestion.type)

  return (
    <div className={`fixed top-20 right-6 w-96 bg-gradient-to-br ${getColors(visibleSuggestion.type)} border rounded-xl shadow-lg p-4 z-40 animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
              {visibleSuggestion.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {visibleSuggestion.description}
            </p>
          </div>
        </div>
        <button
          onClick={() => dismissSuggestion(visibleSuggestion.id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {visibleSuggestion.action && (
        <button
          onClick={visibleSuggestion.action.handler}
          className="w-full mt-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
        >
          <span>{visibleSuggestion.action.label}</span>
          <Sparkles className="h-4 w-4" />
        </button>
      )}

      {suggestions.length > 1 && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full mt-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          +{suggestions.length - 1} more suggestions
        </button>
      )}
    </div>
  )
}