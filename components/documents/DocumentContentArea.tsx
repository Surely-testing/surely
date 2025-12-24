// ============================================
// FILE: components/documents/DocumentsContentArea.tsx
// Content display area with loading, empty states, and pagination
// ============================================

import { FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/shared/Pagination'
import { DocumentsGrid } from './DocumentsGrid'
import { DocumentsTable } from './DocumentsTable'
import type { DocumentWithCreator, ViewMode, GroupBy } from './document-page.types'

interface DocumentsContentAreaProps {
  isLoading: boolean
  filteredDocs: DocumentWithCreator[]
  paginatedDocs: DocumentWithCreator[]
  groupedDocs: Record<string, DocumentWithCreator[]>
  groupBy: GroupBy
  viewMode: ViewMode
  selectedDocIds: string[]
  onOpenDocument: (doc: DocumentWithCreator) => void
  onToggleSelect: (id: string) => void
  onDeleteDocument: (doc: DocumentWithCreator) => void
  onShareDocument: (doc: DocumentWithCreator) => void
  onArchiveDocument: (doc: DocumentWithCreator) => void
  onClearFilters: () => void
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  totalDocuments: number
}

export function DocumentsContentArea({
  isLoading,
  filteredDocs,
  paginatedDocs,
  groupedDocs,
  groupBy,
  viewMode,
  selectedDocIds,
  onOpenDocument,
  onToggleSelect,
  onDeleteDocument,
  onShareDocument,
  onArchiveDocument,
  onClearFilters,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  totalDocuments
}: DocumentsContentAreaProps) {
  return (
    <div className="pt-6">
      {/* Stats Bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDocs.length} of {totalDocuments} documents
          {selectedDocIds.length > 0 && ` • ${selectedDocIds.length} selected`}
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        )
      ) : filteredDocs.length === 0 ? (
        /* Filtered Empty State */
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Documents Display */}
          {groupBy === 'none' ? (
            <>
              {viewMode === 'grid' ? (
                <DocumentsGrid
                  documents={paginatedDocs}
                  onOpen={onOpenDocument}
                  selectedDocIds={selectedDocIds}
                  onToggleSelect={onToggleSelect}
                  onDelete={onDeleteDocument}
                  onShare={onShareDocument}
                  onArchive={onArchiveDocument}
                />
              ) : (
                <DocumentsTable
                  documents={paginatedDocs}
                  onOpen={onOpenDocument}
                  selectedDocIds={selectedDocIds}
                  onToggleSelect={onToggleSelect}
                />
              )}

              {/* Pagination */}
              {filteredDocs.length > itemsPerPage && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredDocs.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={onPageChange}
                    onItemsPerPageChange={onItemsPerPageChange}
                  />
                </div>
              )}
            </>
          ) : (
            /* Grouped Display */
            <div className="space-y-6">
              {Object.entries(groupedDocs).map(([groupName, groupDocs]) => (
                <div key={groupName}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-foreground uppercase">
                      {groupName}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({groupDocs.length})
                    </span>
                  </div>
                  {viewMode === 'grid' ? (
                    <DocumentsGrid
                      documents={groupDocs}
                      onOpen={onOpenDocument}
                      selectedDocIds={selectedDocIds}
                      onToggleSelect={onToggleSelect}
                      onDelete={onDeleteDocument}
                      onShare={onShareDocument}
                      onArchive={onArchiveDocument}
                    />
                  ) : (
                    <DocumentsTable
                      documents={groupDocs}
                      onOpen={onOpenDocument}
                      selectedDocIds={selectedDocIds}
                      onToggleSelect={onToggleSelect}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}