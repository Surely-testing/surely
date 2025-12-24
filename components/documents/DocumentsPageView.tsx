// ============================================
// FILE: components/documents/DocumentsPageView.tsx (MAIN)
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Plus, RefreshCw, FileText } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DocumentEditor } from './DocumentEditor'
import { DocumentsControlBar } from './DocumentsControlBar'
import { DocumentsContentArea } from './DocumentContentArea'
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/BulkActionBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { useDocumentState } from './document-page.utils'
import type { DocumentWithCreator, Suite } from './document-page.types'

interface DocumentsPageViewProps {
  suiteId: string
  isOrganization?: boolean
}

export function DocumentsPageView({ suiteId, isOrganization = false }: DocumentsPageViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [documents, setDocuments] = useState<DocumentWithCreator[]>([])
  const [suites, setSuites] = useState<Suite[]>([])
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithCreator | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  
  // Delete/Archive dialogs
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; doc: DocumentWithCreator | null }>({ 
    open: false, 
    doc: null 
  })
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean; doc: DocumentWithCreator | null }>({ 
    open: false, 
    doc: null 
  })

  // Use custom hook for filters, sorting, pagination
  const {
    search, setSearch,
    typeFilter, setTypeFilter,
    sortField, setSortField,
    sortOrder, setSortOrder,
    groupBy, setGroupBy,
    viewMode, setViewMode,
    showFilters, setShowFilters,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    filteredDocs,
    groupedDocs,
    paginatedDocs,
    activeFiltersCount,
    clearFilters
  } = useDocumentState(documents)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [suiteId])

  // Handle shared document link
  useEffect(() => {
    const docId = searchParams.get('docId')
    if (docId && documents.length > 0) {
      const sharedDoc = documents.find(d => d.id === docId)
      if (sharedDoc) {
        handleOpenDocument(sharedDoc)
        // Clear the query param after opening
        router.replace('/dashboard/documents')
      } else {
        toast.error('Document not found or you don\'t have access')
      }
    }
  }, [searchParams, documents])

  async function fetchData() {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // Fetch suites
      const { data: suitesData } = await supabase
        .from('test_suites')
        .select('id, name')
        .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      setSuites(suitesData || [])

      // Fetch documents
      const { data: docsData } = await supabase
        .from('documents')
        .select('id, title, content, file_type, suite_id, created_by, created_at, updated_at')
        .eq('suite_id', suiteId)
        .eq('archived', false)
        .order('updated_at', { ascending: false })

      if (docsData) {
        const creatorIds = [...new Set(docsData.map(d => d.created_by))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', creatorIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

        const mappedDocs: DocumentWithCreator[] = docsData.map(doc => ({
          ...doc,
          content: doc.content ? JSON.parse(doc.content) : { type: 'doc', content: [] },
          created_at: doc.created_at || new Date().toISOString(),
          updated_at: doc.updated_at || new Date().toISOString(),
          creator: profileMap.get(doc.created_by) || { 
            id: doc.created_by, 
            name: 'Unknown', 
            avatar_url: null 
          }
        }))

        setDocuments(mappedDocs)
      }
    } catch (error: any) {
      logger.log('Error fetching data:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDocument = async () => {
    if (suites.length === 0) {
      toast.error('No test suites available')
      return
    }

    setIsCreating(true)
    try {
      const emptyContent = { type: 'doc', content: [] }
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: 'Untitled Document',
          content: JSON.stringify(emptyContent),
          file_type: 'general',
          suite_id: suiteId,
          created_by: currentUserId,
        })
        .select('id, title, content, file_type, suite_id, created_by, created_at, updated_at')
        .single()

      if (error) throw error

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', currentUserId)
        .single()

      const newDoc: DocumentWithCreator = {
        id: data.id,
        title: data.title,
        content: data.content ? JSON.parse(data.content) : emptyContent,
        file_type: data.file_type,
        suite_id: data.suite_id,
        created_by: data.created_by,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        creator: profile || { id: currentUserId, name: 'You', avatar_url: null }
      }

      setDocuments([newDoc, ...documents])
      setSelectedDoc(newDoc)
      setMode('edit')
      toast.success('Document created')
    } catch (error: any) {
      logger.log('Create document error:', error)
      toast.error('Failed to create document', { description: error.message })
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenDocument = (doc: DocumentWithCreator) => {
    setSelectedDoc(doc)
    setMode('edit')
  }

  const handleCloseEditor = () => {
    setMode('view')
    setSelectedDoc(null)
    fetchData()
  }

  const handleRefreshAfterCollabChange = () => {
    fetchData()
  }

  const handleSelectAll = () => {
    setSelectedDocIds(
      selectedDocIds.length === paginatedDocs.length && paginatedDocs.length > 0
        ? []
        : paginatedDocs.map(d => d.id)
    )
  }

  const handleToggleSelect = (id: string) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    )
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.doc) return
    try {
      const doc = deleteDialog.doc
      
      // Move to trash table
      const { error: trashError } = await supabase
        .from('trash')
        .insert({
          suite_id: doc.suite_id,
          asset_type: 'documents',
          asset_id: doc.id,
          asset_data: {
            title: doc.title,
            content: doc.content,
            file_type: doc.file_type,
            created_by: doc.created_by,
            created_at: doc.created_at,
            updated_at: doc.updated_at
          },
          deleted_by: currentUserId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
      
      if (trashError) throw trashError
      
      // Then delete from documents table
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)
      
      if (deleteError) throw deleteError
      
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
      toast.success('Document moved to trash')
    } catch (error: any) {
      logger.log('Delete document error:', error)
      toast.error('Failed to delete document', { description: error.message })
    } finally {
      setDeleteDialog({ open: false, doc: null })
    }
  }

  const handleArchiveConfirm = async () => {
    if (!archiveDialog.doc) return
    try {
      const doc = archiveDialog.doc
      
      // Move to archived_items table
      const { error: archiveError } = await supabase
        .from('archived_items')
        .insert({
          suite_id: doc.suite_id,
          asset_type: 'documents',
          asset_id: doc.id,
          asset_data: {
            title: doc.title,
            content: doc.content,
            file_type: doc.file_type,
            created_by: doc.created_by,
            created_at: doc.created_at,
            updated_at: doc.updated_at
          },
          archived_by: currentUserId
        })
      
      if (archiveError) throw archiveError
      
      // Then delete from documents table
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)
      
      if (deleteError) throw deleteError
      
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
      toast.success('Document archived successfully')
    } catch (error: any) {
      logger.log('Archive document error:', error)
      toast.error('Failed to archive document', { description: error.message })
    } finally {
      setArchiveDialog({ open: false, doc: null })
    }
  }

  const handleShareDocument = async (doc: DocumentWithCreator) => {
    const shareUrl = `${window.location.origin}/dashboard/documents?docId=${doc.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Document link copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleBulkAction = async (
    actionId: string, 
    selectedIds: string[], 
    actionConfig: BulkAction, 
    selectedOption?: ActionOption | null
  ) => {
    try {
      switch (actionId) {
        case 'delete':
          await Promise.all(selectedIds.map(id => 
            supabase.from('documents').delete().eq('id', id)
          ))
          setDocuments(prev => prev.filter(d => !selectedIds.includes(d.id)))
          toast.success(`${selectedIds.length} document(s) deleted`)
          break

        case 'change-type':
          if (selectedOption) {
            await Promise.all(selectedIds.map(id =>
              supabase.from('documents').update({ file_type: selectedOption.value }).eq('id', id)
            ))
            await fetchData()
            toast.success(`Document type changed to ${selectedOption.label}`)
          }
          break

        case 'duplicate':
          const docsToDuplicate = documents.filter(d => selectedIds.includes(d.id))
          for (const doc of docsToDuplicate) {
            await supabase.from('documents').insert({
              title: `${doc.title} (Copy)`,
              content: JSON.stringify(doc.content),
              file_type: doc.file_type,
              suite_id: doc.suite_id,
              created_by: currentUserId
            })
          }
          await fetchData()
          toast.success(`${selectedIds.length} document(s) duplicated`)
          break

        case 'archive':
          await Promise.all(selectedIds.map(id =>
            supabase.from('documents').update({ archived: true }).eq('id', id)
          ))
          setDocuments(prev => prev.filter(d => !selectedIds.includes(d.id)))
          toast.success(`${selectedIds.length} document(s) archived`)
          break

        case 'export':
          if (selectedOption) {
            toast.info(`Exporting ${selectedIds.length} document(s) as ${selectedOption.label}...`)
          }
          break

        case 'move-to-suite':
          if (selectedOption) {
            await Promise.all(selectedIds.map(id =>
              supabase.from('documents').update({ suite_id: selectedOption.value }).eq('id', id)
            ))
            await fetchData()
            toast.success(`${selectedIds.length} document(s) moved to ${selectedOption.label}`)
          }
          break

        default:
          toast.info('Action not yet implemented')
      }
      setSelectedDocIds([])
    } catch (error: any) {
      logger.log('Bulk action error:', error)
      toast.error('Bulk action failed', { description: error?.message })
    }
  }

  // Editor mode
  if (mode === 'edit' && selectedDoc) {
    return (
      <DocumentEditor
        document={selectedDoc}
        onClose={handleCloseEditor}
        suites={suites}
        currentUserId={currentUserId}
        onCollaborationChange={handleRefreshAfterCollabChange}
        isOrganization={isOrganization}
      />
    )
  }

  // Empty state
  if (documents.length === 0 && !isLoading) {
    return (
      <>
        <div className="min-h-screen">
          <div className="mx-auto lg:px-2">
            <div className="mb-8">
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Documents</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateDocument}
                    disabled={isCreating}
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{isCreating ? 'Creating...' : 'New Doc'}</span>
                  </button>
                  <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center w-10 h-10 text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            <EmptyState
              icon={FileText}
              iconSize={64}
              title="No documents yet"
              description="Create your first document to get started"
              actions={[
                {
                  label: 'Create Document',
                  onClick: handleCreateDocument,
                  variant: 'primary',
                  icon: Plus
                }
              ]}
              minHeight="400px"
            />
          </div>
        </div>

        <BulkActionsBar
          selectedItems={selectedDocIds}
          onClearSelection={() => setSelectedDocIds([])}
          assetType="documents"
          onAction={handleBulkAction}
        />
      </>
    )
  }

  // Main view
  return (
    <>
      <div className="min-h-screen">
        <div className="mx-auto lg:px-2">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Documents</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateDocument}
                  disabled={isCreating}
                  className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{isCreating ? 'Creating...' : 'New Doc'}</span>
                </button>
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center w-10 h-10 text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div>
            <DocumentsControlBar
              search={search}
              onSearchChange={(value) => {
                setSearch(value)
                setCurrentPage(1)
              }}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={(field, order) => {
                setSortField(field)
                setSortOrder(order)
              }}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearFilters}
              isLoading={isLoading}
              selectedDocIds={selectedDocIds}
              paginatedDocs={paginatedDocs}
              onSelectAll={handleSelectAll}
            />

            <DocumentsContentArea
              isLoading={isLoading}
              filteredDocs={filteredDocs}
              paginatedDocs={paginatedDocs}
              groupedDocs={groupedDocs}
              groupBy={groupBy}
              viewMode={viewMode}
              selectedDocIds={selectedDocIds}
              onOpenDocument={handleOpenDocument}
              onToggleSelect={handleToggleSelect}
              onDeleteDocument={(doc) => setDeleteDialog({ open: true, doc })}
              onShareDocument={handleShareDocument}
              onArchiveDocument={(doc) => setArchiveDialog({ open: true, doc })}
              onClearFilters={clearFilters}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onItemsPerPageChange={(items) => {
                setItemsPerPage(items)
                setCurrentPage(1)
              }}
              totalDocuments={documents.length}
            />
          </div>
        </div>
      </div>

      <BulkActionsBar
        selectedItems={selectedDocIds}
        onClearSelection={() => setSelectedDocIds([])}
        assetType="documents"
        onAction={handleBulkAction}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, doc: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.doc?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, doc: null })}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={archiveDialog.open} onOpenChange={(open) => !open && setArchiveDialog({ open: false, doc: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Document</DialogTitle>
            <DialogDescription>
              Archive "{archiveDialog.doc?.title}"? You can restore it later from the archive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveDialog({ open: false, doc: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchiveConfirm}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}