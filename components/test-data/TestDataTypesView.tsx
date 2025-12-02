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
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Test Data Library
              </h1>
              {isLoading ? (
                <Skeleton className="h-7 w-20 rounded-full" />
              ) : (
                <span className="px-3 py-1.5 bg-muted rounded-full text-sm font-medium text-muted-foreground">
                  {filteredTypes.length} {filteredTypes.length === 1 ? 'type' : 'types'}
                </span>
              )}
            </div>
            <button
              onClick={onCreateNew}
              disabled={isLoading}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              Add Type
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-card shadow-theme-md rounded-lg overflow-hidden border border-border">
          {/* Controls Bar */}
          <div className="px-6 py-4 border-b border-border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Select All */}
              <div className="flex items-center gap-3 order-2 sm:order-1">
                <input
                  type="checkbox"
                  checked={selectedTypeIds.length === paginatedTypes.length && paginatedTypes.length > 0}
                  onChange={handleSelectAll}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Select All
                </span>
              </div>

              {/* Search and View Toggle */}
              <div className="flex items-center gap-3 flex-1 justify-end order-1 sm:order-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search types..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setTypesPage(1)
                    }}
                    disabled={isLoading}
                    className="pl-10 w-full h-10 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                  <button
                    onClick={() => setView('grid')}
                    disabled={isLoading}
                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      view === 'grid' 
                        ? 'bg-primary text-primary-foreground shadow-theme-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Grid view"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    disabled={isLoading}
                    className={`p-2 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      view === 'list' 
                        ? 'bg-primary text-primary-foreground shadow-theme-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {isLoading ? (
              view === 'grid' ? (
                // Grid Skeleton
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 bg-card shadow-theme-sm">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-6 w-14 rounded-full" />
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
                    <div key={i} className="border border-border rounded-lg p-4 bg-card shadow-theme-sm">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
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
            ) : paginatedTypes.length === 0 ? (
              // Empty State
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {search ? 'No types found' : 'No test data types yet'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {search 
                    ? 'Try adjusting your search criteria to find what you\'re looking for.' 
                    : 'Get started by creating your first test data type to organize your test data.'}
                </p>
                {!search && (
                  <button
                    onClick={onCreateNew}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Test Data Type
                  </button>
                )}
              </div>
            ) : view === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginatedTypes.map((type) => (
                  <TestDataTypeCard
                    key={type.id}
                    type={type}
                    isSelected={selectedTypeIds.includes(type.id)}
                    onSelect={toggleTypeSelection}
                    onDoubleClick={() => onSelectType(type)}
                  />
                ))}
              </div>
            ) : (
              // List View
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
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && filteredTypes.length > typesPerPage && (
          <div className="mt-6">
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
          </div>
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