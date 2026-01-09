// ============================================
// components/archive/ArchiveTrashTable.tsx
// Using custom Table components with responsive behavior
// ============================================
'use client'

import { RotateCcw, XCircle, Clock, FileText, Bug, Lightbulb, Video, Calendar, Database, TestTube } from 'lucide-react'
import { Tables } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableEmpty,
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
      {/* Table Header - Archived Tab */}
      {activeTab === 'archived' && (
        <TableHeader
          columns={[
            <TableHeaderCell key="item" sticky minWidth="min-w-[320px]">Item</TableHeaderCell>,
            <TableHeaderCell key="type">Type</TableHeaderCell>,
            <TableHeaderCell key="user">Archived By</TableHeaderCell>,
            <TableHeaderCell key="date">Archived</TableHeaderCell>,
            <TableHeaderCell key="actions" minWidth="min-w-[120px]">Actions</TableHeaderCell>,
          ]}
        />
      )}

      {/* Table Header - Trash Tab */}
      {activeTab === 'trash' && (
        <TableHeader
          columns={[
            <TableHeaderCell key="item" sticky minWidth="min-w-[320px]">Item</TableHeaderCell>,
            <TableHeaderCell key="type">Type</TableHeaderCell>,
            <TableHeaderCell key="user">Deleted By</TableHeaderCell>,
            <TableHeaderCell key="date">Deleted</TableHeaderCell>,
            <TableHeaderCell key="expires">Expires</TableHeaderCell>,
            <TableHeaderCell key="actions" minWidth="min-w-[120px]">Actions</TableHeaderCell>,
          ]}
        />
      )}

      {/* Table Body */}
      {items.map((item) => {
        const config = ASSET_CONFIG[item.asset_type as keyof typeof ASSET_CONFIG]
        const Icon = config?.icon || FileText
        const isSelected = selectedIds.includes(item.id)
        
        const isArchived = activeTab === 'archived'
        const user = isArchived ? (item as ArchivedItem).archiver : (item as TrashItem).deleter
        const timestamp = isArchived ? (item as ArchivedItem).archived_at : (item as TrashItem).deleted_at
        const expiresAt = isArchived ? null : (item as TrashItem).expires_at

        return (
          <TableRow key={item.id} selected={isSelected}>
            {/* Checkbox */}
            <TableCheckbox
              checked={isSelected}
              selected={isSelected}
              onCheckedChange={() => onToggleSelect(item.id)}
            />

            {/* Item Name - Sticky */}
            <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config?.color} flex-shrink-0`} />
                <div className="min-w-0">
                  <div className="font-medium truncate" title={getItemTitle(item)}>
                    {getItemTitle(item)}
                  </div>
                </div>
              </div>
            </TableCell>

            {/* Type */}
            <TableCell>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${config?.color} bg-current/10 border-current/20`}>
                {config?.label}
              </span>
            </TableCell>

            {/* User */}
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
                <span className="text-sm truncate">
                  {user?.name || 'Unknown'}
                </span>
              </div>
            </TableCell>

            {/* Date */}
            <TableCell>
              <div className="text-sm">
                {formatDate(timestamp)}
              </div>
            </TableCell>

            {/* Expires (Trash only) */}
            {activeTab === 'trash' && (
              <TableCell>
                {expiresAt ? (
                  <div className="flex items-center gap-1.5 text-sm text-orange-500">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(expiresAt)}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
            )}

            {/* Actions */}
            <TableCell minWidth="min-w-[120px]">
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
          </TableRow>
        )
      })}
    </Table>
  )
}