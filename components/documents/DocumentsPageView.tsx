// ============================================
// FILE: components/documents/DocumentsPageView.tsx (FIXED)
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Plus, Search, LayoutGrid, Table, FileText } from 'lucide-react'
import { DocumentEditor } from './DocumentEditor'
import { DocumentsGrid } from './DocumentsGrid'
import { DocumentsTable } from './DocumentsTable'
import { Skeleton } from '@/components/ui/Skeleton'
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

  const supabase = createClient()

  // Fetch data on mount and when suiteId changes
  useEffect(() => {
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

    fetchData()
  }, [suiteId, supabase])

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || doc.file_type === typeFilter
    return matchesSearch && matchesType
  })

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
          content: JSON.stringify(emptyContent), // ✅ Store as string
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
        content: data.content ? JSON.parse(data.content) : emptyContent, // ✅ Parse when reading
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
    
    // Refresh documents
    setIsLoading(true)
    supabase
      .from('documents')
      .select('id, title, content, file_type, suite_id, created_by, created_at, updated_at')
      .eq('suite_id', suiteId)
      .order('updated_at', { ascending: false })
      .then(async ({ data: docsData }) => {
        if (docsData) {
          // Fetch creator profiles
          const creatorIds = [...new Set(docsData.map(d => d.created_by))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', creatorIds)

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

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
        setIsLoading(false)
      })
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage test documentation
          </p>
        </div>
        <Button onClick={handleCreateDocument} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? 'Creating...' : 'New Document'}
        </Button>
      </div>

      {/* Filters & View Toggle */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as DocumentType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="meeting_notes">📝 Meeting Notes</SelectItem>
              <SelectItem value="test_plan">📋 Test Plan</SelectItem>
              <SelectItem value="test_strategy">🎯 Test Strategy</SelectItem>
              <SelectItem value="brainstorm">💡 Brainstorm</SelectItem>
              <SelectItem value="general">📄 General</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

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
          <Card className="p-4">
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
          </Card>
        )
      ) : filteredDocs.length === 0 ? (
        /* Empty State */
        <Card className="p-12">
          <div className="text-center">
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
        </Card>
      ) : (
        /* Documents Display */
        viewMode === 'grid' ? (
          <DocumentsGrid documents={filteredDocs} onOpen={handleOpenDocument} />
        ) : (
          <DocumentsTable documents={filteredDocs} onOpen={handleOpenDocument} />
        )
      )}
    </div>
  )
}