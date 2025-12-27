// ============================================
// FILE: components/documents/ExportDialog.tsx
// ============================================
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { FileText, FileJson, FileCode } from 'lucide-react'
import { toast } from 'sonner'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: { title: string; content: any }
}

export function ExportDialog({ open, onOpenChange, document }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportAsMarkdown = () => {
    setIsExporting(true)
    try {
      const markdown = convertToMarkdown(document.content)
      downloadFile(markdown, `${document.title}.md`, 'text/markdown')
      toast.success('Exported as Markdown')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to export')
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsJSON = () => {
    setIsExporting(true)
    try {
      const json = JSON.stringify(document.content, null, 2)
      downloadFile(json, `${document.title}.json`, 'application/json')
      toast.success('Exported as JSON')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to export')
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsHTML = () => {
    setIsExporting(true)
    try {
      const html = convertToHTML(document.content)
      downloadFile(html, `${document.title}.html`, 'text/html')
      toast.success('Exported as HTML')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to export')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Document</DialogTitle>
          <DialogDescription>
            Choose a format to export your document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={exportAsMarkdown}
            disabled={isExporting}
          >
            <div className="flex items-start gap-3">
              <FileText className="h-10 w-10 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">Markdown (.md)</p>
                <p className="text-xs text-muted-foreground">
                  Plain text format with formatting syntax
                </p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={exportAsJSON}
            disabled={isExporting}
          >
            <div className="flex items-start gap-3">
              <FileJson className="h-10 w-10 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">JSON (.json)</p>
                <p className="text-xs text-muted-foreground">
                  Structured data format for importing later
                </p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={exportAsHTML}
            disabled={isExporting}
          >
            <div className="flex items-start gap-3">
              <FileCode className="h-10 w-10 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">HTML (.html)</p>
                <p className="text-xs text-muted-foreground">
                  Web page format with styling
                </p>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function convertToMarkdown(content: any): string {
  // Basic conversion - can be enhanced
  let markdown = ''
  
  content.content?.forEach((node: any) => {
    if (node.type === 'heading') {
      const level = '#'.repeat(node.attrs.level)
      const text = node.content?.[0]?.text || ''
      markdown += `${level} ${text}\n\n`
    } else if (node.type === 'paragraph') {
      const text = node.content?.[0]?.text || ''
      markdown += `${text}\n\n`
    } else if (node.type === 'bulletList') {
      node.content?.forEach((item: any) => {
        const text = item.content?.[0]?.content?.[0]?.text || ''
        markdown += `- ${text}\n`
      })
      markdown += '\n'
    } else if (node.type === 'orderedList') {
      node.content?.forEach((item: any, index: number) => {
        const text = item.content?.[0]?.content?.[0]?.text || ''
        markdown += `${index + 1}. ${text}\n`
      })
      markdown += '\n'
    }
  })
  
  return markdown
}

function convertToHTML(content: any): string {
  let html = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<style>\n'
  html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }\n'
  html += 'h1 { font-size: 2.5rem; margin-top: 2rem; }\n'
  html += 'h2 { font-size: 2rem; margin-top: 1.5rem; }\n'
  html += 'h3 { font-size: 1.5rem; margin-top: 1.25rem; }\n'
  html += 'code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }\n'
  html += 'pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }\n'
  html += '</style>\n</head>\n<body>\n'
  
  content.content?.forEach((node: any) => {
    if (node.type === 'heading') {
      const level = node.attrs.level
      const text = node.content?.[0]?.text || ''
      html += `<h${level}>${text}</h${level}>\n`
    } else if (node.type === 'paragraph') {
      const text = node.content?.[0]?.text || ''
      html += `<p>${text}</p>\n`
    }
  })
  
  html += '</body>\n</html>'
  return html
}