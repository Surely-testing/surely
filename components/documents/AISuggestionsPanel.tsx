// ============================================
// FILE: components/documents/AISuggestionsPanel.tsx
// ARTIFACT 3 OF 4
// Floating panel for AI suggestions
// ============================================
'use client'

import { Button } from '@/components/ui/Button'
import { Wand2, X } from 'lucide-react'
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
          {suggestions.map((suggestion, idx) => (
            <div 
              key={idx} 
              className="border rounded-lg p-3 space-y-2 bg-card hover:bg-accent/5 transition-colors"
            >
              {/* Type and Badges */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {suggestion.type}
                </span>
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
                  {suggestion.type === 'suggestion' ? 'Suggestion:' : 'Improved:'}
                </div>
                <div className="bg-primary/5 p-2 rounded text-xs border border-primary/20">
                  {getSuggestionText(suggestion).length > 200
                    ? `${getSuggestionText(suggestion).substring(0, 200)}...`
                    : getSuggestionText(suggestion)}
                </div>
              </div>
              
              {/* Apply Button */}
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => onApply(suggestion)}
              >
                Apply Suggestion
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Click "Apply" to insert suggestion into your document
        </p>
      </div>
    </div>
  )
}