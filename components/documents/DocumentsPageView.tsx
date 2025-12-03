// ============================================
// FILE: components/documents/DocumentsPageView.tsx (COMPLETE FIXED)
// ============================================
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Search, FileText, RefreshCw, Filter, Grid, List } from 'lucide-react'
import { DocumentEditor } from './DocumentEditor'
import { DocumentsGrid } from './DocumentsGrid'
import { DocumentsTable } from './DocumentsTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { BulkActionsBar, type BulkAction, type ActionOption } from '@/components/shared/BulkActionBar'
import { Pagination } from '@/components/shared/Pagination'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type ViewMode = 'grid' | 'table'
type DocumentType = 'all' | 'meeting_notes' | 'test_plan' | 'test_strategy' | 'brainstorm' | 'general'

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

interface Suite {
  id: string
  name: string
}

interface DocumentsPageViewProps {
  suiteId: string
}

export function DocumentsPageView({ suiteId }: DocumentsPageViewProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [documents, setDocuments] = useState<Document[]>([])
  const [suites, setSuites] = useState<Suite[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()

  // Fetch data on mount and when suiteId changes
  useEffect(() => {
    fetchData()
  }, [suiteId])

  async function fetchData() {
    setIsLoading(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setCurrentUserId(user.id)

      // Fetch suites for the dropdown
      const { data: suitesData } = await supabase
        .from('test_suites')
        .select('id, name')
        .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      setSuites(suitesData || [])

      // Fetch documents for current suite only
      const { data: docsData } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          content,
          file_type,
          suite_id,
          created_by,
          created_at,
          updated_at
        `)
        .eq('suite_id', suiteId)
        .order('updated_at', { ascending: false })

      if (docsData) {
        // Fetch creator profiles separately
        const creatorIds = [...new Set(docsData.map(d => d.created_by))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', creatorIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

        // Map documents with parsed content and creator info
        const mappedDocs: Document[] = docsData.map(doc => ({
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
      console.error('Error fetching data:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || doc.file_type === typeFilter
      return matchesSearch && matchesType
    })
  }, [documents, search, typeFilter])

  // Paginated documents
  const paginatedDocs = useMemo(() => {
    return filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredDocs, currentPage, itemsPerPage])

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

      // Get creator profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', currentUserId)
        .single()

      const newDoc: Document = {
        id: data.id,
        title: data.title,
        content: data.content ? JSON.parse(data.content) : emptyContent,
        file_type: data.file_type,
        suite_id: data.suite_id,
        created_by: data.created_by,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        creator: profile || { 
          id: currentUserId, 
          name: 'You', 
          avatar_url: null 
        }
      }
      
      setDocuments([newDoc, ...documents])
      setSelectedDoc(newDoc)
      setMode('edit')
      toast.success('Document created')
    } catch (error: any) {
      console.error('Create document error:', error)
      toast.error('Failed to create document', { description: error.message })
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setMode('edit')
  }

  const handleCloseEditor = () => {
    setMode('view')
    setSelectedDoc(null)
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
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(selectedDocIds.filter(docId => docId !== id))
    } else {
      setSelectedDocIds([...selectedDocIds, id])
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
              supabase
                .from('documents')
                .update({ file_type: selectedOption.value })
                .eq('id', id)
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
          // Implement archive logic if you have an archive mechanism
          toast.info('Archive functionality - implement based on your schema')
          break

        case 'export':
          if (selectedOption) {
            toast.info(`Exporting ${selectedIds.length} document(s) as ${selectedOption.label}...`)
            // Implement export logic based on selectedOption.value (pdf, markdown, docx, html)
          }
          break

        case 'share':
          toast.info('Share functionality coming soon')
          break

        case 'bookmark':
          // Implement bookmark logic if you have this feature
          toast.info('Bookmark functionality - implement based on your schema')
          break

        case 'lock':
          // Implement lock logic if you have this feature
          toast.info('Lock functionality - implement based on your schema')
          break

        case 'unlock':
          // Implement unlock logic if you have this feature
          toast.info('Unlock functionality - implement based on your schema')
          break

        case 'move-to-suite':
          if (selectedOption) {
            await Promise.all(selectedIds.map(id =>
              supabase
                .from('documents')
                .update({ suite_id: selectedOption.value })
                .eq('id', id)
            ))
            await fetchData()
            toast.success(`${selectedIds.length} document(s) moved to ${selectedOption.label}`)
          }
          break

        default:
          toast.error('Unknown action')
      }
      setSelectedDocIds([])
    } catch (error: any) {
      toast.error('Bulk action failed', { description: error?.message })
    }
  }

  const handleRefresh = () => {
    fetchData()
  }

  const activeFiltersCount = typeFilter !== 'all' ? 1 : 0

  if (mode === 'edit' && selectedDoc) {
    return (
      <DocumentEditor
        document={selectedDoc}
        onClose={handleCloseEditor}
        suites={suites}
      />
    )
  }

  return (
    <>
      <div className="min-h-screen">
        <div className="mx-auto lg:px-2">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Documents</h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleCreateDocument}
                  disabled={isCreating}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreating ? 'Creating...' : 'New Doc'}</span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center w-10 h-10 text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div>
            {/* Unified Controls Bar */}
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Side: Select All */}
                <div className="flex items-center gap-3 order-2 lg:order-1">
                  <input
                    type="checkbox"
                    checked={selectedDocIds.length === paginatedDocs.length && paginatedDocs.length > 0}
                    onChange={handleSelectAll}
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    Select All
                  </span>
                </div>

                {/* Right Side: Search, Filters, View Toggle */}
                <div className="flex items-center gap-3 flex-1 justify-end order-1 lg:order-2 flex-wrap">
                  {/* Search */}
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setCurrentPage(1)
                      }}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                    />
                  </div>

                  {/* Filter Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="relative"
                    disabled={isLoading}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>

                  {/* View Toggle */}
                  <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      disabled={isLoading}
                      className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        viewMode === 'grid'
                          ? 'bg-primary text-primary-foreground shadow-theme-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="Grid View"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      disabled={isLoading}
                      className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        viewMode === 'table'
                          ? 'bg-primary text-primary-foreground shadow-theme-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTypeFilter('all')}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Type Filter */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                        Document Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'meeting_notes', label: '📝 Meeting Notes' },
                          { value: 'test_plan', label: '📋 Test Plan' },
                          { value: 'test_strategy', label: '🎯 Test Strategy' },
                          { value: 'brainstorm', label: '💡 Brainstorm' },
                          { value: 'general', label: '📄 General' }
                        ].map(type => (
                          <button
                            key={type.value}
                            onClick={() => setTypeFilter(typeFilter === type.value ? 'all' : type.value as DocumentType)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                              typeFilter === type.value
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-foreground border-border hover:border-primary'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="pt-6">
              {/* Stats Bar */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredDocs.length} of {documents.length} documents
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
                /* Empty State */
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-muted-foreground mb-4">
                    {search || typeFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Create your first document to get started'}
                  </p>
                  {!search && typeFilter === 'all' && (
                    <Button onClick={handleCreateDocument} disabled={isCreating}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Document
                    </Button>
                  )}
                </div>
              ) : (
                /* Documents Display */
                <>
                  {viewMode === 'grid' ? (
                    <DocumentsGrid 
                      documents={paginatedDocs} 
                      onOpen={handleOpenDocument}
                      selectedDocIds={selectedDocIds}
                      onToggleSelect={handleToggleSelect}
                    />
                  ) : (
                    <DocumentsTable 
                      documents={paginatedDocs} 
                      onOpen={handleOpenDocument}
                      selectedDocIds={selectedDocIds}
                      onToggleSelect={handleToggleSelect}
                    />
                  )}

                  {/* Pagination */}
                  {filteredDocs.length > itemsPerPage && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={currentPage}
                        totalItems={filteredDocs.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => {
                          setCurrentPage(page)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        onItemsPerPageChange={(items) => {
                          setItemsPerPage(items)
                          setCurrentPage(1)
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={selectedDocIds}
        onClearSelection={() => setSelectedDocIds([])}
        assetType="documents"
        onAction={handleBulkAction}
      />
    </>
  )
}