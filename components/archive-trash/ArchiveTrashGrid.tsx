// ============================================
// FILE: components/archive/ArchiveTrashGrid.tsx
// ============================================
'use client'

import { RotateCcw, XCircle, Clock, FileText, Bug, Lightbulb, Video, Calendar, Database, TestTube } from 'lucide-react'
import { Tables } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'

type ArchivedItem = Tables<'archived_items'> & {
  archiver?: { name: string; avatar_url: string | null }
}

type TrashItem = Tables<'trash'> & {
  deleter?: { name: string; avatar_url: string | null }
}

interface ArchiveTrashGridProps {
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

export function ArchiveTrashGrid({
  items,
  activeTab,
  onRestore,
  onDelete,
  selectedIds,
  onToggleSelect,
  isLoading
}: ArchiveTrashGridProps) {

  const getItemTitle = (item: ArchivedItem | TrashItem): string => {
    const data = item.asset_data as any
    return data?.title || data?.name || data?.description || 'Untitled'
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        {activeTab === 'archived' ? (
          <>
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No archived items</h3>
            <p className="text-muted-foreground">Items you archive will appear here</p>
          </>
        ) : (
          <>
            <XCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Trash is empty</h3>
            <p className="text-muted-foreground">Deleted items will appear here for 30 days</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
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
          <Card
            key={item.id}
            className={cn(
              "p-4 transition-all duration-200 group hover:shadow-lg hover:border-primary/50",
              isSelected && "border-primary ring-2 ring-primary/20"
            )}
          >
            {/* Header with Icon and Checkbox */}
            <div className="flex items-start gap-3 mb-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(item.id)}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all cursor-pointer mt-1",
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              />
              <Icon className={`w-5 h-5 ${config?.color} flex-shrink-0 mt-1`} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {getItemTitle(item)}
                </h3>
              </div>
            </div>

            {/* Type Badge */}
            <div className="mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border inline-block ${config?.color} bg-current/10 border-current/20`}>
                {config?.label}
              </span>
            </div>

            {/* User Info */}
            <div className="space-y-2 text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-5 h-5 rounded-full ring-1 ring-border flex-shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ring-1 ring-border flex-shrink-0">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <span className="truncate">{user?.name || 'Unknown'}</span>
              </div>
              <div>
                {formatDistanceToNow(new Date(timestamp!), { addSuffix: true })}
              </div>
              {expiresAt && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Clock className="w-3 h-3" />
                  Expires {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRestore(item)
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Restore
              </button>
              {activeTab === 'trash' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item as TrashItem)
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-error bg-error/10 hover:bg-error/20 rounded-lg transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}