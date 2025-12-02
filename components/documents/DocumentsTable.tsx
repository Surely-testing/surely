// ============================================
// FILE: components/documents/DocumentsTable.tsx (FIXED)
// Using custom Table components with proper checkbox format
// ============================================
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableCheckbox,
  TableHeaderText,
  TableDescriptionText,
} from '@/components/ui/Table'
import { formatDistanceToNow } from 'date-fns'

const DOC_TYPE_LABELS: Record<string, string> = {
  meeting_notes: 'Meeting Notes',
  test_plan: 'Test Plan',
  test_strategy: 'Test Strategy',
  brainstorm: 'Brainstorm',
  general: 'General',
}

const DOC_TYPE_ICONS: Record<string, string> = {
  meeting_notes: '📝',
  test_plan: '📋',
  test_strategy: '🎯',
  brainstorm: '💡',
  general: '📄',
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
}

export function DocumentsTable({ 
  documents, 
  onOpen, 
  selectedDocIds, 
  onToggleSelect 
}: DocumentsTableProps) {
  return (
    <Table>
      {documents.map((doc) => {
        const isSelected = selectedDocIds.includes(doc.id)
        
        return (
          <TableRow
            key={doc.id}
            selected={isSelected}
            selectable={true}
            onClick={() => onOpen(doc)}
            className="cursor-pointer"
          >
            {/* Checkbox using TableCheckbox component */}
            <TableCheckbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(doc.id)}
            />

            <TableGrid columns={4}>
              {/* Title & Type */}
              <TableCell className="col-span-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {DOC_TYPE_ICONS[doc.file_type || 'general']}
                  </span>
                  <div className="min-w-0 flex-1">
                    <TableHeaderText>{doc.title}</TableHeaderText>
                    <TableDescriptionText>
                      {DOC_TYPE_LABELS[doc.file_type || 'general']}
                    </TableDescriptionText>
                  </div>
                </div>
              </TableCell>

              {/* Created By */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={doc.creator?.avatar_url || undefined} />
                    <AvatarFallback>
                      {doc.creator?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{doc.creator?.name || 'Unknown'}</span>
                </div>
              </TableCell>

              {/* Last Modified */}
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                </span>
              </TableCell>
            </TableGrid>
          </TableRow>
        )
      })}
    </Table>
  )
}