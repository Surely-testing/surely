// ============================================
// FILE: lib/utils/document-ai.ts
// ARTIFACT 1 OF 4
// AI utilities for document editing assistance
// ============================================

import { aiService } from '@/lib/ai/ai-service'
import { getDocTypeAIContext, type DocType } from './document-templates'
import type { Editor } from '@tiptap/react'

/**
 * AI Writing Assistance - Grammar Check
 */
export async function checkGrammar(text: string) {
  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Please select more text (at least 10 characters)' }
  }

  const result = await aiService.checkGrammar(text, { style: 'professional' })
  
  if (result.success && result.data) {
    return {
      success: true,
      original: text,
      suggestion: result.data.content,
      type: 'grammar'
    }
  }
  
  return { success: false, error: result.userMessage }
}

/**
 * AI Writing Assistance - Rewrite Text
 */
export async function rewriteText(
  text: string, 
  style: 'professional' | 'casual' | 'technical' | 'concise' = 'professional'
) {
  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Please select more text to rewrite' }
  }

  const result = await aiService.rewriteContent(text, {
    style,
    action: 'improve',
    tone: 'neutral'
  })
  
  if (result.success && result.data) {
    return {
      success: true,
      original: text,
      suggestion: result.data.content,
      type: 'rewrite',
      style
    }
  }
  
  return { success: false, error: result.userMessage }
}

/**
 * AI Writing Assistance - Improve Text
 */
export async function improveText(text: string) {
  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Please select more text to improve' }
  }

  const result = await aiService.rewriteContent(text, {
    action: 'improve',
    style: 'professional',
    tone: 'neutral'
  })
  
  if (result.success && result.data) {
    return {
      success: true,
      original: text,
      suggestion: result.data.content,
      type: 'improvement'
    }
  }
  
  return { success: false, error: result.userMessage }
}

/**
 * Generate context-aware suggestions for the document
 */
export async function generateDocumentSuggestions(
  docType: DocType,
  content: any,
  headings: any[]
) {
  const context = getDocTypeAIContext(docType)
  
  const result = await aiService.generateSuggestions({
    currentPage: 'document-editor',
    recentActions: ['writing', docType],
    pageData: { 
      docType, 
      headings, 
      contentLength: JSON.stringify(content).length,
      sectionCount: headings.length
    },
    userRole: 'writer'
  })
  
  // Type guard to check if response has suggestions
  if (result.success && result.data && 'suggestions' in result.data) {
    return {
      success: true,
      suggestions: result.data.suggestions.map((s: any) => ({
        ...s,
        type: 'suggestion'
      }))
    }
  }
  
  return { success: false, error: result.userMessage || 'Failed to generate suggestions' }
}

/**
 * Apply AI suggestion to editor
 */
export function applySuggestionToEditor(
  editor: Editor,
  suggestion: any,
  selectionRange?: { from: number; to: number }
) {
  if (!editor) return false

  try {
    const suggestionText = typeof suggestion.suggestion === 'string' 
      ? suggestion.suggestion 
      : suggestion.description || suggestion.title

    if (selectionRange && suggestion.original) {
      // Replace selected text with suggestion
      editor
        .chain()
        .focus()
        .setTextSelection(selectionRange)
        .insertContent(suggestionText)
        .run()
    } else {
      // Insert at current cursor position
      editor.chain().focus().insertContent(suggestionText).run()
    }

    return true
  } catch (error) {
    console.error('Failed to apply suggestion:', error)
    return false
  }
}

/**
 * Extract text content from Tiptap JSON for AI context
 */
export function extractTextFromContent(node: any, maxLength: number = 3000): string {
  if (!node) return ''
  
  if (node.type === 'text') {
    return node.text || ''
  }
  
  if (node.content && Array.isArray(node.content)) {
    const text = node.content.map((n: any) => extractTextFromContent(n, maxLength)).join(' ')
    return text.substring(0, maxLength)
  }
  
  return ''
}

/**
 * Broadcast document context to main AI assistant
 */
export function broadcastDocumentContext(document: {
  id: string
  title: string
  type: DocType
  content: any
  headings: any[]
}) {
  const event = new CustomEvent('document-context-update', {
    detail: {
      id: document.id,
      title: document.title,
      type: document.type,
      contentPreview: extractTextFromContent(document.content, 1000),
      headings: document.headings,
      sectionCount: document.headings.length,
      wordCount: extractTextFromContent(document.content).split(/\s+/).filter(Boolean).length
    }
  })
  window.dispatchEvent(event)
}

/**
 * Clear document context (when leaving editor)
 */
export function clearDocumentContext() {
  window.dispatchEvent(new CustomEvent('document-context-update', { detail: null }))
}

/**
 * Listen for content insertion from main AI assistant
 */
export function listenForContentInsertion(
  callback: (content: string) => void
) {
  const handler = (event: CustomEvent) => {
    if (event.detail?.content) {
      callback(event.detail.content)
    }
  }

  window.addEventListener('document-insert-content', handler as EventListener)
  
  return () => {
    window.removeEventListener('document-insert-content', handler as EventListener)
  }
}

/**
 * Insert content from AI into document
 */
export function insertContentIntoDocument(content: string) {
  const event = new CustomEvent('document-insert-content', {
    detail: { content }
  })
  window.dispatchEvent(event)
}