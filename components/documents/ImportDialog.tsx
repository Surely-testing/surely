
// ============================================
// FILE: components/documents/ImportDialog.tsx
// ============================================
'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Upload, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (content: any) => void
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      
      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text)
        onImport(json)
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        // Convert markdown to TipTap JSON
        const content = convertMarkdownToJSON(text)
        onImport(content)
      } else {
        throw new Error('Unsupported file format')
      }
      
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Failed to import file', {
        description: error.message,
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Document</DialogTitle>
          <DialogDescription>
            Upload a file to import into this document
          </DialogDescription>
        </DialogHeader>

        <div className="py-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.md,.txt"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isImporting}
          />
          
          <Button
            variant="outline"
            className="w-full h-32 border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <div className="flex flex-col items-center gap-2">
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="font-medium">Click to upload</span>
                  <span className="text-xs text-muted-foreground">
                    JSON, Markdown, or Text files
                  </span>
                </>
              )}
            </div>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Supported formats:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>JSON (.json) - TipTap document format</li>
            <li>Markdown (.md) - Will be converted to rich text</li>
            <li>Plain Text (.txt) - Will be imported as paragraphs</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function convertMarkdownToJSON(markdown: string): any {
  const lines = markdown.split('\n')
  const content: any[] = []

  lines.forEach(line => {
    line = line.trim()
    if (!line) return

    // Headings
    if (line.startsWith('# ')) {
      content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: line.slice(2) }],
      })
    } else if (line.startsWith('## ')) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: line.slice(3) }],
      })
    } else if (line.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: line.slice(4) }],
      })
    } else {
      // Regular paragraph
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      })
    }
  })

  return { type: 'doc', content }
}