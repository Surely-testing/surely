// ============================================
// FILE: components/documents/AISuggestionsPanel.tsx
// Updated to distinguish actionable vs advisory suggestions
// ============================================
'use client'

import { Button } from '@/components/ui/Button'
import { Wand2, X, Info, Lightbulb, AlertTriangle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Suggestion {
  type: string
  original?: string
  suggestion?: string
  description?: string
  title?: string
  style?: string
  confidence?: string
  priority?: string
  isActionable?: boolean
}

interface AISuggestionsPanelProps {
  suggestions: Suggestion[]
  onApply: (suggestion: Suggestion) => void
  onClear: () => void
}

export function AISuggestionsPanel({ 
  suggestions, 
  onApply, 
  onClear 
}: AISuggestionsPanelProps) {
  const getSuggestionText = (suggestion: Suggestion): string => {
    return typeof suggestion.suggestion === 'string' 
      ? suggestion.suggestion 
      : suggestion.description || suggestion.title || ''
  }

  const isActionable = (suggestion: Suggestion): boolean => {
    // Check if suggestion can be directly applied
    return suggestion.isActionable !== false && 
           suggestion.type !== 'insight' && 
           suggestion.type !== 'tip' &&
           suggestion.type !== 'warning' &&
           !!suggestion.suggestion
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'insight':
        return <Info className="h-4 w-4" />
      case 'tip':
        return <Lightbulb className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Wand2 className="h-4 w-4" />
    }
  }

  const getConfidenceBadgeColor = (confidence?: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      case 'low':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
      default:
        return 'bg-primary/10 text-primary'
    }
  }

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-700 dark:text-red-400'
      case 'medium':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
      case 'low':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="absolute top-4 right-4 w-96 bg-background border rounded-lg shadow-lg z-10 max-h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          AI Suggestions
          <span className="text-xs font-normal text-muted-foreground">
            ({suggestions.length})
          </span>
        </h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {suggestions.map((suggestion, idx) => {
            const actionable = isActionable(suggestion)
            
            return (
              <div 
                key={idx} 
                className="border rounded-lg p-3 space-y-2 bg-card hover:bg-accent/5 transition-colors"
              >
                {/* Type and Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(suggestion.type)}
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {suggestion.type}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {suggestion.confidence && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceBadgeColor(suggestion.confidence)}`}>
                        {suggestion.confidence}
                      </span>
                    )}
                    {suggestion.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadgeColor(suggestion.priority)}`}>
                        {suggestion.priority}
                      </span>
                    )}
                    {suggestion.style && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">
                        {suggestion.style}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Original Text */}
                {suggestion.original && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Original:</div>
                    <div className="bg-muted/50 p-2 rounded text-xs italic border border-border/50">
                      {suggestion.original.length > 150 
                        ? `${suggestion.original.substring(0, 150)}...` 
                        : suggestion.original}
                    </div>
                  </div>
                )}
                
                {/* Suggestion Text */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    {actionable ? 'Improved:' : 'Advice:'}
                  </div>
                  <div className={`p-2 rounded text-xs border ${
                    actionable 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-blue-500/5 border-blue-500/20'
                  }`}>
                    {getSuggestionText(suggestion).length > 200
                      ? `${getSuggestionText(suggestion).substring(0, 200)}...`
                      : getSuggestionText(suggestion)}
                  </div>
                </div>
                
                {/* Apply Button - Different for actionable vs advisory */}
                {actionable ? (
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => onApply(suggestion)}
                  >
                    Apply Suggestion
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <Info className="h-3 w-3 flex-shrink-0" />
                    <span>Use this as guidance for manual improvements</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Actionable suggestions can be applied directly • Advisory suggestions are for guidance
        </p>
      </div>
    </div>
  )
}