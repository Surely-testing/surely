// ============================================
// components/documents/DocumentsTable.tsx
// Mobile: full scroll | Desktop: sticky checkbox & title
// ============================================
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Eye, FileText, ClipboardList, Target, Lightbulb, FileIcon, Share2, Archive, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown'

const DOC_TYPE_LABELS: Record<string, string> = {
  meeting_notes: 'Meeting Notes',
  test_plan: 'Test Plan',
  test_strategy: 'Test Strategy',
  brainstorm: 'Brainstorm',
  general: 'General',
}

const DOC_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meeting_notes: FileText,
  test_plan: ClipboardList,
  test_strategy: Target,
  brainstorm: Lightbulb,
  general: FileIcon,
}

const DOC_TYPE_COLORS: Record<string, string> = {
  meeting_notes: 'text-blue-600 dark:text-blue-400',
  test_plan: 'text-purple-600 dark:text-purple-400',
  test_strategy: 'text-green-600 dark:text-green-400',
  brainstorm: 'text-yellow-600 dark:text-yellow-400',
  general: 'text-gray-600 dark:text-gray-400',
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

interface DocumentsTableProps {
  documents: Document[]
  onOpen: (doc: Document) => void
  selectedDocIds: string[]
  onToggleSelect: (id: string) => void
  onSelectAll?: () => void
  onDelete?: (doc: Document) => void
  onShare?: (doc: Document) => void
  onArchive?: (doc: Document) => void
}

export function DocumentsTable({ 
  documents, 
  onOpen, 
  selectedDocIds, 
  onToggleSelect,
  onSelectAll,
  onDelete,
  onShare,
  onArchive
}: DocumentsTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No documents to display
      </div>
    )
  }

  return (
    <div className="relative border border-border rounded-lg bg-card overflow-x-auto">
      <div className="min-w-max">
        {/* Table Header */}
        <div className="flex bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="w-12 px-4 py-2 border-r border-border flex items-center justify-center md:sticky md:left-0 bg-muted md:z-10">
            {onSelectAll && (
              <input
                type="checkbox"
                checked={selectedDocIds.length === documents.length && documents.length > 0}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary transition-all cursor-pointer"
              />
            )}
          </div>
          <div className="w-80 px-4 py-2 border-r border-border md:sticky md:left-12 bg-muted md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Title
          </div>
          <div className="w-32 px-4 py-2 border-r border-border flex-shrink-0">Document ID</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Type</div>
          <div className="w-48 px-4 py-2 border-r border-border flex-shrink-0">Created By</div>
          <div className="w-36 px-4 py-2 border-r border-border flex-shrink-0">Created</div>
          <div className="w-40 px-4 py-2 border-r border-border flex-shrink-0">Last Modified</div>
          <div className="w-32 px-4 py-2 flex-shrink-0">Actions</div>
        </div>

        {/* Table Body */}
        {documents.map((doc) => {
          const isSelected = selectedDocIds.includes(doc.id)
          const IconComponent = DOC_TYPE_ICONS[doc.file_type || 'general']
          const iconColor = DOC_TYPE_COLORS[doc.file_type || 'general']

          return (
            <div
              key={doc.id}
              className={`flex items-center border-b border-border last:border-b-0 transition-colors ${
                isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              {/* Checkbox - Sticky on md+ */}
              <div className={`w-12 px-4 py-3 border-r border-border flex items-center justify-center md:sticky md:left-0 md:z-10 ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                <div
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleSelect(doc.id)
                  }}
                  className={`w-4 h-4 rounded border-2 border-border cursor-pointer transition-all flex items-center justify-center ${
                    isSelected ? 'bg-primary border-primary' : 'hover:border-primary/50'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Title - Sticky on md+ with shadow */}
              <div className={`w-80 px-4 py-3 border-r border-border md:sticky md:left-12 md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                isSelected ? 'bg-primary/5' : 'bg-card'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <IconComponent className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                  <div 
                    className="font-medium text-sm text-foreground truncate cursor-help"
                    title={doc.title}
                  >
                    {doc.title}
                  </div>
                </div>
              </div>

              {/* Document ID */}
              <div className="w-32 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-muted-foreground font-mono">
                  {doc.id.slice(0, 8)}
                </span>
              </div>

              {/* Type */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-foreground">
                  {DOC_TYPE_LABELS[doc.file_type || 'general']}
                </span>
              </div>

              {/* Created By */}
              <div className="w-48 px-4 py-3 border-r border-border flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={doc.creator?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {doc.creator?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground truncate">
                    {doc.creator?.name || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Created */}
              <div className="w-36 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(doc.created_at)}
                </span>
              </div>

              {/* Last Modified */}
              <div className="w-40 px-4 py-3 border-r border-border flex-shrink-0">
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                </span>
              </div>

              {/* Actions */}
              <div className="w-32 px-4 py-3 flex-shrink-0">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpen(doc)
                    }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="View document"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {onShare && (
                        <DropdownMenuItem onClick={() => onShare(doc)}>
                          <Share2 className="w-4 h-4" />
                          Share
                        </DropdownMenuItem>
                      )}
                      
                      {onArchive && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onArchive(doc)}>
                            <Archive className="w-4 h-4" />
                            Archive
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(doc)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}