// ============================================
// FILE: components/documents/DocumentEditor.tsx
// FIXED VERSION - With isOrganization prop
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  ArrowLeft,
  Share2,
  Download,
  Upload,
  Save,
  Sparkles,
  Wand2,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  X,
  Users,
  Lock,
  Globe,
} from 'lucide-react'
import { TiptapEditor } from '../tiptap/tiptapEditor'
import { FloatingTOC } from './FloatingTOC'
import { ExportDialog } from './ExportDialog'
import { ImportDialog } from './ImportDialog'
import { ShareDialog } from './ShareDialog'
import { DocumentCollaborationDialog } from './DocumentCollaborationDialog'
import { AISuggestionsPanel } from '../ai/AISuggestionsPanel'
import { updateDocument } from '@/lib/actions/documents'
import { toast } from 'sonner'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { logger } from '@/lib/utils/logger'

// Import utilities
import {
  DOC_TYPES,
  getDocumentTemplate,
  isContentEmpty,
  type DocType
} from '@/lib/utils/document-templates'
import {
  checkGrammar,
  rewriteText,
  improveText,
  generateDocumentSuggestions,
  applySuggestionToEditor,
  broadcastDocumentContext,
  clearDocumentContext,
  listenForContentInsertion,
} from '@/lib/utils/document-ai'

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

interface DocumentEditorProps {
  document: any
  onClose: () => void
  suites: any[]
  currentUserId: string
  onCollaborationChange?: () => void
  isOrganization?: boolean // ADD THIS
}

export function DocumentEditor({
  document,
  onClose,
  suites,
  currentUserId,
  onCollaborationChange,
  isOrganization = false // ADD THIS with default value
}: DocumentEditorProps) {
  // Document state
  const [title, setTitle] = useState(document.title)
  const [docType, setDocType] = useState<DocType>(document.file_type || 'general')
  const [content, setContent] = useState(document.content || { type: 'doc', content: [] })
  const [headings, setHeadings] = useState<any[]>([])

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)

  // AI state
  const [selectedText, setSelectedText] = useState('')
  const [selectionRange, setSelectionRange] = useState<any>(null)
  const [aiSuggestions, setAISuggestions] = useState<Suggestion[]>([])
  const [editorInstance, setEditorInstance] = useState<any>(null)
  const [isProcessingAI, setIsProcessingAI] = useState(false)

  const debouncedTitle = useDebounce(title, 1000)
  const debouncedContent = useDebounce(content, 2000)

  const isOwner = document.created_by === currentUserId

  // Auto-save
  useEffect(() => {
    const save = async () => {
      if (!debouncedTitle && !debouncedContent) return

      setIsSaving(true)
      try {
        const result = await updateDocument(document.id, {
          title: debouncedTitle,
          content: debouncedContent,
          file_type: docType,
        })

        if (result.error) throw new Error(result.error)

        setLastSaved(new Date())
      } catch (error: any) {
        logger.log('Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }

    save()
  }, [debouncedTitle, debouncedContent, docType, document.id])

  // Broadcast document context to main AI assistant
  useEffect(() => {
    broadcastDocumentContext({
      id: document.id,
      title,
      type: docType,
      content,
      headings
    })

    const interval = setInterval(() => {
      broadcastDocumentContext({
        id: document.id,
        title,
        type: docType,
        content,
        headings
      })
    }, 5000)

    return () => {
      clearInterval(interval)
      clearDocumentContext()
    }
  }, [document.id, title, docType, content, headings])

  // Listen for content insertion from main AI assistant
  useEffect(() => {
    const cleanup = listenForContentInsertion((insertedContent) => {
      if (editorInstance) {
        editorInstance.chain().focus().insertContent(insertedContent).run()
        toast.success('Content inserted from AI assistant')
      }
    })

    return cleanup
  }, [editorInstance])

  // Handle document type change
  const handleDocTypeChange = (newType: DocType) => {
    const typeConfig = DOC_TYPES.find(t => t.value === newType)

    const isEmpty = isContentEmpty(content)

    logger.log('Changing doc type:', { newType, isEmpty, currentContent: content })

    if (isEmpty) {
      const template = getDocumentTemplate(newType)
      logger.log('Applying template:', template)

      if (template) {
        setContent(template)
        toast.success(`${typeConfig?.label} template applied`, {
          description: 'Template loaded successfully'
        })
      }
    } else {
      const shouldReplace = window.confirm(
        `You have existing content. Do you want to replace it with the ${typeConfig?.label} template?`
      )

      if (shouldReplace) {
        const template = getDocumentTemplate(newType)
        if (template) {
          setContent(template)
          toast.success(`${typeConfig?.label} template applied`)
        }
      }
    }

    setDocType(newType)

    if (newType === 'brainstorm') {
      toast.info('💡 Brainstorm mode: Use your main AI assistant for collaborative ideation', {
        duration: 4000
      })
    }
  }

  const handleContentChange = (newContent: any, newHeadings: any[]) => {
    logger.log('Content changed:', { newContent, newHeadings })
    setContent(newContent)
    setHeadings(newHeadings)
  }

  const handleTextSelection = (text: string, range: any, editor: any) => {
    logger.log('Text selected:', { text, range })
    setSelectedText(text)
    setSelectionRange(range)
    setEditorInstance(editor)
  }

  // AI Writing Assistance Functions
  const handleCheckGrammar = async () => {
    if (!selectedText || selectedText.length < 3) {
      toast.error('Please select at least 3 characters of text')
      return
    }

    setIsProcessingAI(true)
    const loadingToast = toast.loading('Checking grammar...')

    try {
      const result = await checkGrammar(selectedText)
      toast.dismiss(loadingToast)

      if (result.success) {
        setAISuggestions([{
          type: 'grammar',
          original: result.original,
          suggestion: result.suggestion,
          confidence: 'high'
        }])
        toast.success('Grammar check complete')
      } else {
        toast.error(result.error || 'Grammar check failed')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Failed to check grammar')
    } finally {
      setIsProcessingAI(false)
    }
  }

  const handleRewriteText = async (style: 'professional' | 'casual' | 'technical' | 'concise') => {
    if (!selectedText || selectedText.length < 3) {
      toast.error('Please select at least 3 characters of text')
      return
    }

    setIsProcessingAI(true)
    const loadingToast = toast.loading(`Rewriting in ${style} style...`)

    try {
      const result = await rewriteText(selectedText, style)
      toast.dismiss(loadingToast)

      if (result.success) {
        setAISuggestions([{
          type: 'rewrite',
          original: result.original,
          suggestion: result.suggestion,
          style: result.style,
          confidence: 'high'
        }])
        toast.success('Text rewritten')
      } else {
        toast.error(result.error || 'Rewrite failed')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Failed to rewrite text')
    } finally {
      setIsProcessingAI(false)
    }
  }

  const handleImproveText = async () => {
    if (!selectedText || selectedText.length < 3) {
      toast.error('Please select at least 3 characters of text')
      return
    }

    setIsProcessingAI(true)
    const loadingToast = toast.loading('Improving text...')

    try {
      const result = await improveText(selectedText)
      toast.dismiss(loadingToast)

      if (result.success) {
        setAISuggestions([{
          type: 'improvement',
          original: result.original,
          suggestion: result.suggestion,
          confidence: 'high'
        }])
        toast.success('Text improved')
      } else {
        toast.error(result.error || 'Improvement failed')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Failed to improve text')
    } finally {
      setIsProcessingAI(false)
    }
  }

  const handleGenerateSuggestions = async () => {
    setIsProcessingAI(true)
    const loadingToast = toast.loading('Generating suggestions...')

    try {
      const result = await generateDocumentSuggestions(docType, content, headings)
      toast.dismiss(loadingToast)

      if (result.success && result.suggestions) {
        setAISuggestions(result.suggestions)
        toast.success(`${result.suggestions.length} suggestions generated`)
      } else {
        toast.error(result.error || 'Failed to generate suggestions')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Failed to generate suggestions')
    } finally {
      setIsProcessingAI(false)
    }
  }

  const handleApplySuggestion = (suggestion: Suggestion) => {
    if (!editorInstance) {
      toast.error('Editor not ready')
      return
    }

    // Check if this is an insight/advice rather than actionable content
    if (suggestion.type === 'insight' || suggestion.type === 'tip' || suggestion.type === 'warning') {
      toast.info('This is advice, not actionable content', {
        description: 'Use this suggestion as guidance for manual improvements'
      })
      return
    }

    const success = applySuggestionToEditor(editorInstance, suggestion, selectionRange)

    if (success) {
      toast.success('Suggestion applied')
      setAISuggestions(aiSuggestions.filter(s => s !== suggestion))
      setSelectedText('')
    } else {
      toast.error('Cannot apply this type of suggestion automatically', {
        description: 'Please use it as guidance for manual edits'
      })
    }
  }

  const handleCollaborationDialogClose = () => {
    setShowCollaboration(false)
    if (onCollaborationChange) {
      onCollaborationChange()
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 px-4">
          {/* Left */}
          <div className="flex items-center gap-4 flex-1">
            <Button variant="outline" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex items-center gap-2 flex-1 max-w-2xl">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0"
                placeholder="Untitled"
              />
              <Select value={docType} onValueChange={handleDocTypeChange}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Document Visibility Indicator */}
            {document.visibility && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                {document.visibility === 'private' ? (
                  <><Lock className="h-3 w-3" /> Private</>
                ) : (
                  <><Globe className="h-3 w-3" /> Public</>
                )}
              </div>
            )}

            {/* AI Writing Tools - Show when text is selected */}
            {selectedText && selectedText.length > 2 && !isProcessingAI && (
              <div className="flex items-center gap-1 mr-2 p-1 bg-muted rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCheckGrammar}
                  title="Check Grammar"
                  className="h-8 w-8 p-0"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImproveText}
                  title="Improve Text"
                  className="h-8 w-8 p-0"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRewriteText('professional')}
                  title="Rewrite Professional"
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSuggestions}
              disabled={isProcessingAI}
              title="AI Suggestions"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Suggest
            </Button>

            {/* Save Indicator */}
            <div className="text-xs text-muted-foreground mr-2 min-w-[100px]">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Save className="h-3 w-3 animate-pulse" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              ) : null}
            </div>

            {/* Collaboration Button - ONLY SHOW FOR ORGANIZATIONS */}
            {isOrganization && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCollaboration(true)}
                className="bg-primary/10 hover:bg-primary/20 border-primary/30"
              >
                <Users className="h-4 w-4 mr-2" />
                Collaborate
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative h-[calc(100vh-4rem)] overflow-hidden">
        {/* Floating TOC */}
        <FloatingTOC headings={headings} />

        {/* AI Suggestions Panel */}
        {aiSuggestions.length > 0 && (
          <AISuggestionsPanel
            suggestions={aiSuggestions}
            onApply={handleApplySuggestion}
            onClear={() => setAISuggestions([])}
          />
        )}

        {/* Editor */}
        <div className="h-full overflow-y-auto" id="document-editor-scroll-container">
          <div className="max-w-4xl mx-auto py-8 px-4">
            <TiptapEditor
              key={docType}
              initialContent={content}
              onChange={handleContentChange}
              onTextSelect={handleTextSelection}
              docType={docType}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
        document={{ title, content }}
      />
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImport={(importedContent: any) => {
          setContent(importedContent)
          toast.success('Document imported')
        }}
      />
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        documentId={document.id}
        suites={suites}
      />

      {/* Collaboration Dialog - ONLY RENDER FOR ORGANIZATIONS */}
      {isOrganization && (
        <DocumentCollaborationDialog
          open={showCollaboration}
          onClose={handleCollaborationDialogClose}
          document={document}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}