'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Share2, Trash2, Archive } from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown'
import { cn } from '@/lib/utils/cn'

const DOC_TYPE_LABELS: Record<string, string> = {
  meeting_notes: 'Meeting Notes',
  test_plan: 'Test Plan',
  test_strategy: 'Test Strategy',
  brainstorm: 'Brainstorm',
  general: 'General',
}

interface Document {
  id: string
  title: string
  content: any
  file_type: string | null
  suite_id: string
  created_by: string
  created_at: string
  updated_at: string
  creator: { id: string; name: string; avatar_url: string | null }
}

interface DocumentsGridProps {
  documents: Document[]
  onOpen: (doc: Document) => void
  selectedDocIds: string[]
  onToggleSelect: (id: string) => void
}

// Helper function to extract plain text from document content
function getDocumentPreview(content: any): string {
  if (!content) return 'Empty document'
  
  let text = ''
  
  const traverse = (node: any) => {
    if (typeof node === 'string') {
      text += node + ' '
      return
    }
    
    if (!node || typeof node !== 'object') return
    
    if (node.text) {
      text += node.text + ' '
    }
    
    if (Array.isArray(node.content)) {
      node.content.forEach(traverse)
    }
    
    if (Array.isArray(node)) {
      node.forEach(traverse)
    }
    
    if (node.content && typeof node.content === 'object' && !Array.isArray(node.content)) {
      traverse(node.content)
    }
  }
  
  if (content.content) {
    traverse(content.content)
  } else {
    traverse(content)
  }
  
  const cleanText = text.trim()
  return cleanText || 'Empty document'
}

// Simple time ago function
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

export function DocumentsGrid({ documents, onOpen, selectedDocIds, onToggleSelect }: DocumentsGridProps) {
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null)

  const handleShare = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation()
    console.log('Share document:', doc.id)
  }

  const handleDelete = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation()
    console.log('Delete document:', doc.id)
  }

  const handleArchive = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation()
    console.log('Archive document:', doc.id)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {documents.map((doc) => {
        const isSelected = selectedDocIds.includes(doc.id)
        const preview = getDocumentPreview(doc.content)
        
        return (
          <div
            key={doc.id}
            className="relative cursor-pointer pt-4 px-4 pb-2 group"
            onMouseEnter={() => setHoveredDoc(doc.id)}
            onMouseLeave={() => setHoveredDoc(null)}
            onClick={() => onOpen(doc)}
          >
            {/* Checkbox */}
            <div 
              className={cn(
                "absolute top-6 left-6 z-20 transition-opacity duration-200",
                hoveredDoc === doc.id || isSelected ? 'opacity-100' : 'opacity-0'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation()
                  onToggleSelect(doc.id)
                }}
                className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Selection Border */}
            {isSelected && (
              <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none z-30"></div>
            )}

            {/* A4 Preview Card */}
            <div 
              className="bg-card border border-border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
              style={{ height: '280px' }}
            >
              <div className="p-6 h-full overflow-hidden">
                <p className="text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {preview}
                </p>
              </div>
            </div>

            {/* Metadata Card */}
            <div className="relative bg-muted border border-border rounded-lg p-3 shadow-md z-10 -mt-20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-semibold text-base text-foreground line-clamp-1">
                    {doc.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground">
                    {DOC_TYPE_LABELS[doc.file_type || 'general']}
                  </p>
                  
                  <p className="text-xs text-muted-foreground pt-1">
                    {formatTimeAgo(doc.created_at)}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                    >
                      <div className="flex flex-col gap-0.5 items-center justify-center w-4 h-4">
                        <div className="w-1 h-1 rounded-full bg-foreground"></div>
                        <div className="w-1 h-1 rounded-full bg-foreground"></div>
                        <div className="w-1 h-1 rounded-full bg-foreground"></div>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={(e) => handleShare(e, doc)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleArchive(e, doc)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleDelete(e, doc)}
                      className="text-error focus:text-error focus:bg-error/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Creator */}
              <div className="flex items-center justify-end gap-2 mt-2">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarImage src={doc.creator?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-muted text-foreground">
                    {doc.creator?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {doc.creator?.name || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}