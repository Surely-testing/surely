// ============================================
// FILE: components/documents/DocumentEditor.tsx
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
} from 'lucide-react'
import { TiptapEditor } from './tiptapEditor'
import { FloatingTOC } from './FloatingTOC'
import { ExportDialog } from './ExportDialog'
import { ImportDialog } from './ImportDialog'
import { ShareDialog } from './ShareDialog'
import { updateDocument } from '@/lib/actions/documents'
import { toast } from 'sonner'
import { useDebounce } from '@/lib/hooks/useDebounce'

const DOC_TYPES = [
  { value: 'meeting_notes', label: '📝 Meeting Notes' },
  { value: 'test_plan', label: '📋 Test Plan' },
  { value: 'test_strategy', label: '🎯 Test Strategy' },
  { value: 'brainstorm', label: '💡 Brainstorm' },
  { value: 'general', label: '📄 General' },
]

export function DocumentEditor({ document, onClose, suites }: any) {
  const [title, setTitle] = useState(document.title)
  const [docType, setDocType] = useState(document.file_type || 'general')
  const [content, setContent] = useState(document.content || { type: 'doc', content: [] })
  const [headings, setHeadings] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const debouncedTitle = useDebounce(title, 1000)
  const debouncedContent = useDebounce(content, 2000)

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
        console.error('Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }

    save()
  }, [debouncedTitle, debouncedContent, docType, document.id])

  const handleContentChange = (newContent: any, newHeadings: any[]) => {
    setContent(newContent)
    setHeadings(newHeadings)
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
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Save Indicator */}
            <div className="text-xs text-muted-foreground mr-2">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Save className="h-3 w-3 animate-pulse" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              ) : null}
            </div>

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

        {/* Editor */}
        <div className="h-full overflow-y-auto">
          <div className="container max-w-4xl py-8 px-4 ml-[320px]">
            <TiptapEditor
              initialContent={content}
              onChange={handleContentChange}
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
    </div>
  )
}