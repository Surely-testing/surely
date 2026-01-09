// ============================================
// components/documents/DocumentsTable.tsx
// Using custom Table components with responsive behavior
// ============================================
'use client'

import { formatDistanceToNow } from 'date-fns'
import { Eye, FileText, ClipboardList, Target, Lightbulb, FileIcon, Share2, Archive, Trash2, MoreVertical } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableAvatar,
  TableEmpty,
} from '@/components/ui/Table'
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
  const handleToggleSelection = (id: string) => {
    onToggleSelect(id)
  }

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
      <TableEmpty
        title="No documents to display"
        description="Create your first document to get started."
      />
    )
  }

  return (
    <Table>
      {/* Table Header */}
      <TableHeader
        columns={[
          <TableHeaderCell key="title" sticky minWidth="min-w-[320px]">Title</TableHeaderCell>,
          <TableHeaderCell key="id" minWidth="min-w-[120px]">Document ID</TableHeaderCell>,
          <TableHeaderCell key="type" minWidth="min-w-[140px]">Type</TableHeaderCell>,
          <TableHeaderCell key="creator" minWidth="min-w-[180px]">Created By</TableHeaderCell>,
          <TableHeaderCell key="created" minWidth="min-w-[120px]">Created</TableHeaderCell>,
          <TableHeaderCell key="modified" minWidth="min-w-[160px]">Last Modified</TableHeaderCell>,
          <TableHeaderCell key="actions" minWidth="min-w-[120px]">Actions</TableHeaderCell>,
        ]}
      />

      {/* Table Body */}
      {documents.map((doc) => {
        const isSelected = selectedDocIds.includes(doc.id)
        const IconComponent = DOC_TYPE_ICONS[doc.file_type || 'general']
        const iconColor = DOC_TYPE_COLORS[doc.file_type || 'general']

        return (
          <TableRow key={doc.id} selected={isSelected}>
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              selected={isSelected}
              onCheckedChange={() => handleToggleSelection(doc.id)}
            />

            {/* Title - Sticky */}
            <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
              <div className="flex items-center gap-3 min-w-0">
                <IconComponent className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                <div 
                  className="font-medium text-sm text-foreground truncate cursor-help"
                  title={doc.title}
                >
                  {doc.title}
                </div>
              </div>
            </TableCell>

            {/* Document ID */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm text-muted-foreground font-mono">
                {doc.id.slice(0, 8)}
              </span>
            </TableCell>

            {/* Type */}
            <TableCell minWidth="min-w-[140px]">
              <span className="text-sm text-foreground">
                {DOC_TYPE_LABELS[doc.file_type || 'general']}
              </span>
            </TableCell>

            {/* Created By */}
            <TableCell minWidth="min-w-[180px]">
              <div className="flex items-center gap-2 min-w-0">
                <TableAvatar
                  src={doc.creator?.avatar_url || undefined}
                  alt={doc.creator?.name || 'Unknown'}
                  fallback={doc.creator?.name?.charAt(0) || 'U'}
                />
                <span className="text-sm text-foreground truncate">
                  {doc.creator?.name || 'Unknown'}
                </span>
              </div>
            </TableCell>

            {/* Created */}
            <TableCell minWidth="min-w-[120px]">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(doc.created_at)}
              </span>
            </TableCell>

            {/* Last Modified */}
            <TableCell minWidth="min-w-[160px]">
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
              </span>
            </TableCell>

            {/* Actions */}
            <TableCell minWidth="min-w-[120px]">
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
            </TableCell>
          </TableRow>
        )
      })}
    </Table>
  )
}