// ============================================
// FILE: components/documents/DocumentsGrid.tsx
// ============================================
'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FileText, Calendar, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const DOC_TYPE_ICONS: Record<string, string> = {
  meeting_notes: '📝',
  test_plan: '📋',
  test_strategy: '🎯',
  brainstorm: '💡',
  general: '📄',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  meeting_notes: 'Meeting Notes',
  test_plan: 'Test Plan',
  test_strategy: 'Test Strategy',
  brainstorm: 'Brainstorm',
  general: 'General',
}

export function DocumentsGrid({ documents, onOpen }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc: any) => (
        <Card
          key={doc.id}
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onOpen(doc)}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {DOC_TYPE_ICONS[doc.file_type || 'general']}
                </span>
                <h3 className="font-semibold line-clamp-1">{doc.title}</h3>
              </div>
            </div>

            <Badge variant="default" className="sm">
              {DOC_TYPE_LABELS[doc.file_type || 'general']}
            </Badge>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={doc.creator?.avatar_url} />
                  <AvatarFallback>
                    {doc.creator?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span>{doc.creator?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}