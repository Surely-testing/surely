// ============================================
// FILE: components/documents/document-page.utils.ts
// Utility functions and hooks for documents page
// ============================================

import { useMemo, useState } from 'react'
import type { DocumentWithCreator, DocumentType, SortField, SortOrder, GroupBy, ViewMode } from './views/document-page.types'

// Hook for managing document filters, sorting, and pagination
export function useDocumentState(documents: DocumentWithCreator[]) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType>('all')
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Filter and sort documents
  const filteredDocs = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || doc.file_type === typeFilter
      return matchesSearch && matchesType
    })

    filtered.sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === 'updated_at' || sortField === 'created_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? 1 : -1
      if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? -1 : 1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [documents, search, typeFilter, sortField, sortOrder])

  // Group documents
  const groupedDocs = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Documents': filteredDocs }
    }

    const grouped: Record<string, DocumentWithCreator[]> = {}

    filteredDocs.forEach(doc => {
      let groupKey = 'Uncategorized'

      switch (groupBy) {
        case 'type':
          const typeLabels: Record<string, string> = {
            'meeting_notes': '📝 Meeting Notes',
            'test_plan': '📋 Test Plan',
            'test_strategy': '🎯 Test Strategy',
            'brainstorm': '💡 Brainstorm',
            'general': '📄 General'
          }
          groupKey = doc.file_type ? typeLabels[doc.file_type] || doc.file_type : 'No Type'
          break

        case 'creator':
          groupKey = doc.creator?.name || 'Unknown Creator'
          break

        case 'date':
          const docDate = new Date(doc.created_at)
          const now = new Date()
          const diffDays = Math.floor((now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays === 0) groupKey = 'Today'
          else if (diffDays === 1) groupKey = 'Yesterday'
          else if (diffDays <= 7) groupKey = 'This Week'
          else if (diffDays <= 30) groupKey = 'This Month'
          else if (diffDays <= 90) groupKey = 'Last 3 Months'
          else groupKey = 'Older'
          break
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }
      grouped[groupKey].push(doc)
    })

    return grouped
  }, [filteredDocs, groupBy])

  // Paginated documents
  const paginatedDocs = useMemo(() => {
    if (groupBy !== 'none') {
      return filteredDocs
    }
    return filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredDocs, currentPage, itemsPerPage, groupBy])

  const activeFiltersCount = typeFilter !== 'all' ? 1 : 0

  const clearFilters = () => {
    setTypeFilter('all')
    setSortField('updated_at')
    setSortOrder('desc')
    setGroupBy('none')
  }

  return {
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
  }
}