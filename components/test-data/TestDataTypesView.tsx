// components/test-data/TestDataTypesView.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { Grid, List, Search, Plus, Database } from 'lucide-react'
import { TestDataType } from '@/types/test-data'
import { useTestDataTypes, useDeleteTestDataTypes } from '@/lib/hooks/useTestData'
import TestDataTypeCard from './TestDataTypeCard'
import TestDataTypeListItem from './TestDataTypeListItem'
import Pagination from '@/components/shared/Pagination'
import EnhancedBulkActionsBar from '@/components/shared/BulkActionBar'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'

interface TestDataTypesViewProps {
  suiteId: string
  onSelectType: (type: TestDataType) => void
  onCreateNew: () => void
}

export default function TestDataTypesView({
  suiteId,
  onSelectType,
  onCreateNew
}: TestDataTypesViewProps) {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([])
  const [typesPage, setTypesPage] = useState(1)
  const [typesPerPage, setTypesPerPage] = useState(20)

  const { data: types = [], isLoading } = useTestDataTypes(suiteId)
  const deleteTypes = useDeleteTestDataTypes(suiteId)

  const filteredTypes = useMemo(() => {
    if (!search) return types
    const searchLower = search.toLowerCase()
    return types.filter((t) => 
      t.name.toLowerCase().includes(searchLower) ||
      (t.description?.toLowerCase() || '').includes(searchLower)
    )
  }, [types, search])

  const paginatedTypes = useMemo(() => {
    const start = (typesPage - 1) * typesPerPage
    return filteredTypes.slice(start, start + typesPerPage)
  }, [filteredTypes, typesPage, typesPerPage])

  const handleTypeAction = async (actionId: string, selectedIds: string[]) => {
    if (actionId === 'delete') {
      await deleteTypes.mutateAsync(selectedIds)
      setSelectedTypeIds([])
    }
  }

  const toggleTypeSelection = (id: string) => {
    setSelectedTypeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedTypeIds.length === paginatedTypes.length && paginatedTypes.length > 0) {
      setSelectedTypeIds([])
    } else {
      setSelectedTypeIds(paginatedTypes.map((type) => type.id))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center flex-wrap gap-2 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                <span className="hidden sm:inline">Test Data Library</span>
                <span className="sm:hidden">Test Data</span>
              </h1>
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <Skeleton className="h-6 w-16 rounded-full" />
                ) : (
                  <span className="px-2 py-1 bg-muted rounded-full text-xs font-normal text-foreground whitespace-nowrap">
                    {filteredTypes.length} {filteredTypes.length === 1 ? 'type' : 'types'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onCreateNew}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded hover:bg-primary/90 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Type
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-card shadow-sm rounded-lg overflow-hidden border border-border">
          <div className="px-4 sm:px-6 py-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 order-2 sm:order-1">
                <input
                  type="checkbox"
                  checked={selectedTypeIds.length === paginatedTypes.length && paginatedTypes.length > 0}
                  onChange={handleSelectAll}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary flex-shrink-0 disabled:opacity-50"
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>

              <div className="flex items-center gap-3 flex-1 justify-end order-1 sm:order-2">
                <div className="relative flex-1 sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search types..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setTypesPage(1)
                    }}
                    disabled={isLoading}
                    className="pl-10 w-full sm:w-64 h-9"
                  />
                </div>

                <div className="flex gap-1 border border-border rounded-lg p-1 bg-card">
                  <button
                    onClick={() => setView('grid')}
                    disabled={isLoading}
                    className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                      view === 'grid' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    disabled={isLoading}
                    className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                      view === 'list' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Skeletons or Types Grid/List */}
          <div className="p-4 sm:p-6">
            {isLoading ? (
              view === 'grid' ? (
                // Grid Skeleton
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 bg-card">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <div className="flex items-center gap-2 pt-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // List Skeleton
                <div className="space-y-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-1/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {paginatedTypes.map((type) => (
                  <TestDataTypeCard
                    key={type.id}
                    type={type}
                    isSelected={selectedTypeIds.includes(type.id)}
                    onSelect={toggleTypeSelection}
                    onDoubleClick={() => onSelectType(type)}
                  />
                ))}
                {paginatedTypes.length === 0 && (
                  <div className="col-span-full text-center py-16">
                    <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No types found.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedTypes.map((type) => (
                  <TestDataTypeListItem
                    key={type.id}
                    type={type}
                    isSelected={selectedTypeIds.includes(type.id)}
                    onSelect={toggleTypeSelection}
                    onDoubleClick={() => onSelectType(type)}
                  />
                ))}
                {paginatedTypes.length === 0 && (
                  <div className="text-center py-16">
                    <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No types found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && filteredTypes.length > typesPerPage && (
          <Pagination
            currentPage={typesPage}
            totalItems={filteredTypes.length}
            itemsPerPage={typesPerPage}
            onPageChange={setTypesPage}
            onItemsPerPageChange={(value) => {
              setTypesPerPage(value)
              setTypesPage(1)
            }}
          />
        )}
      </div>

      {/* Bulk Actions Bar */}
      <EnhancedBulkActionsBar
        selectedItems={selectedTypeIds}
        onClearSelection={() => setSelectedTypeIds([])}
        assetType="testData"
        onAction={handleTypeAction}
        portalId="test-data-types-bulk-actions"
      />
    </div>
  )
}