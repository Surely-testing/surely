// ============================================
// FILE: components/archive/ArchiveTrashTable.tsx
// ============================================
'use client'

import { RotateCcw, XCircle, Clock, FileText, Bug, Lightbulb, Video, Calendar, Database, TestTube } from 'lucide-react'
import { Tables } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableCheckbox,
  TableEmpty,
  TableHeaderText,
  TableDescriptionText,
} from '@/components/ui/Table'

type ArchivedItem = Tables<'archived_items'> & {
  archiver?: { name: string; avatar_url: string | null }
}

type TrashItem = Tables<'trash'> & {
  deleter?: { name: string; avatar_url: string | null }
}

interface ArchiveTrashTableProps {
  items: (ArchivedItem | TrashItem)[]
  activeTab: 'archived' | 'trash'
  onRestore: (item: ArchivedItem | TrashItem) => void
  onDelete: (item: TrashItem) => void
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  isLoading: boolean
}

const ASSET_CONFIG = {
  testCases: { label: 'Test Cases', icon: TestTube, color: 'text-blue-500' },
  bugs: { label: 'Bugs', icon: Bug, color: 'text-red-500' },
  recommendations: { label: 'Suggestions', icon: Lightbulb, color: 'text-yellow-500' },
  recordings: { label: 'Recordings', icon: Video, color: 'text-purple-500' },
  sprints: { label: 'Sprints', icon: Calendar, color: 'text-green-500' },
  documents: { label: 'Documents', icon: FileText, color: 'text-indigo-500' },
  testData: { label: 'Test Data', icon: Database, color: 'text-cyan-500' },
}

export function ArchiveTrashTable({
  items,
  activeTab,
  onRestore,
  onDelete,
  selectedIds,
  onToggleSelect,
  isLoading
}: ArchiveTrashTableProps) {

  if (items.length === 0) {
    return (
      <TableEmpty
        icon={activeTab === 'archived' ? <FileText className="w-8 h-8 text-muted-foreground" /> : <XCircle className="w-8 h-8 text-muted-foreground" />}
        title={activeTab === 'archived' ? 'No archived items' : 'Trash is empty'}
        description={activeTab === 'archived' ? 'Items you archive will appear here' : 'Deleted items will appear here for 30 days'}
      />
    )
  }

  const getItemTitle = (item: ArchivedItem | TrashItem): string => {
    const data = item.asset_data as any
    return data?.title || data?.name || data?.description || 'Untitled'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  return (
    <Table>
      {/* Table Header */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4 px-4 py-2 bg-muted/50 rounded-lg border border-border text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        <div>Item</div>
        <div>Type</div>
        <div>{activeTab === 'archived' ? 'Archived By' : 'Deleted By'}</div>
        <div>{activeTab === 'archived' ? 'Archived' : 'Deleted'}</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Table Rows */}
      {items.map((item) => {
        const config = ASSET_CONFIG[item.asset_type as keyof typeof ASSET_CONFIG]
        const Icon = config?.icon || FileText
        const isSelected = selectedIds.includes(item.id)
        
        // Type-safe way to get user and timestamp
        const isArchived = activeTab === 'archived'
        const user = isArchived ? (item as ArchivedItem).archiver : (item as TrashItem).deleter
        const timestamp = isArchived ? (item as ArchivedItem).archived_at : (item as TrashItem).deleted_at
        const expiresAt = isArchived ? null : (item as TrashItem).expires_at

        return (
          <TableRow
            key={item.id}
            selected={isSelected}
            selectable={true}
          >
            {/* Selection Checkbox */}
            <TableCheckbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(item.id)}
            />

            <TableGrid columns={5}>
              {/* Item Name Column */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${config?.color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <TableHeaderText>{getItemTitle(item)}</TableHeaderText>
                    {expiresAt && (
                      <TableDescriptionText className="flex items-center gap-1 text-orange-500 mt-1">
                        <Clock className="w-3 h-3" />
                        Expires {formatDate(expiresAt)}
                      </TableDescriptionText>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Type Column */}
              <TableCell>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${config?.color} bg-current/10 border-current/20`}>
                  {config?.label}
                </span>
              </TableCell>

              {/* User Column */}
              <TableCell>
                <div className="flex items-center gap-2">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-6 h-6 rounded-full ring-1 ring-border"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ring-1 ring-border">
                      {user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-sm text-foreground truncate">
                    {user?.name || 'Unknown'}
                  </span>
                </div>
              </TableCell>

              {/* Date Column */}
              <TableCell>
                <div className="text-sm text-foreground">
                  {formatDate(timestamp)}
                </div>
              </TableCell>

              {/* Actions Column */}
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRestore(item)
                    }}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Restore"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  {activeTab === 'trash' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item as TrashItem)
                      }}
                      className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                      title="Delete Permanently"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </TableCell>
            </TableGrid>
          </TableRow>
        )
      })}
    </Table>
  )
}