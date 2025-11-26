// components/test-data/TestDataItemsView.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { ArrowLeft, Download, Sparkles, Loader2, AlertCircle, Database } from 'lucide-react'
import { TestDataType } from '@/types/test-data'
import { ICON_MAP, COLOR_MAP } from '@/lib/constants/test-data-constants'
import { useTestDataItems, useCreateTestDataItems, useDeleteTestDataItems, useExportTestData } from '@/lib/hooks/useTestData'
import { testDataGenerators } from '@/lib/utils/test-data-generators'
import TestDataItemRow from './TestDataItemRow'
import Pagination from '@/components/shared/Pagination'
import EnhancedBulkActionsBar from '@/components/shared/BulkActionBar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

interface TestDataItemsViewProps {
  type: TestDataType
  onBack: () => void
}

export default function TestDataItemsView({ type, onBack }: TestDataItemsViewProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [itemsPage, setItemsPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')

  const { data: items = [], isLoading } = useTestDataItems(type.id)
  const createItems = useCreateTestDataItems(type.id)
  const deleteItems = useDeleteTestDataItems(type.id)
  const exportData = useExportTestData()

  const TypeIcon = ICON_MAP[type.icon as keyof typeof ICON_MAP] || Database
  const iconColorClass = COLOR_MAP[type.color as keyof typeof COLOR_MAP] || COLOR_MAP.blue

  const paginatedItems = useMemo(() => {
    const start = (itemsPage - 1) * itemsPerPage
    return items.slice(start, start + itemsPerPage)
  }, [items, itemsPage, itemsPerPage])

  const handleRandomGenerate = async () => {
    const generator = testDataGenerators[type.id as keyof typeof testDataGenerators] || testDataGenerators.generic
    const values = generator()
    
    const newItems = values.map(value => ({
      type_id: type.id,
      suite_id: type.suite_id,
      value
    }))

    await createItems.mutateAsync(newItems)
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return

    // For now, use the same generator as random
    // In production, this would call your AI service
    const generator = testDataGenerators[type.id as keyof typeof testDataGenerators] || testDataGenerators.generic
    const values = generator().slice(0, 2).map(v => `AI: ${v}`)
    
    const newItems = values.map(value => ({
      type_id: type.id,
      suite_id: type.suite_id,
      value
    }))

    await createItems.mutateAsync(newItems)
    setAiPrompt('')
    setIsAIOpen(false)
  }

  const handleExport = async () => {
    await exportData.mutateAsync(type.id)
  }

  const handleItemAction = async (actionId: string, selectedIds: string[]) => {
    if (actionId === 'delete') {
      await deleteItems.mutateAsync(selectedIds)
      setSelectedItemIds([])
    }
  }

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedItemIds.length === items.length && items.length > 0) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(items.map(item => item.id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow-sm rounded-lg overflow-hidden transition-all duration-300 border border-border">
          {/* Header */}
          <div className="border-b border-border px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              {/* Left side */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0", iconColorClass)}>
                  <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {type.name}
                  </h2>
                  <span className="px-2 py-1 bg-muted rounded-full text-xs font-normal text-foreground whitespace-nowrap">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-2 flex-1 sm:flex-none sm:gap-2 justify-end">
                <button
                  onClick={handleRandomGenerate}
                  disabled={createItems.isPending}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex-1 sm:flex-none"
                >
                  {createItems.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Random
                </button>

                <button
                  onClick={() => setIsAIOpen(true)}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground bg-orange-500 rounded hover:bg-orange-600 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Generate
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No test data yet. Use the generate buttons above!
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {/* Select All Row */}
                <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-border py-2 sm:py-2 rounded">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.length === items.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary flex-shrink-0"
                    />
                    <span className="text-sm text-muted-foreground truncate">
                      {selectedItemIds.length === items.length
                        ? "All selected"
                        : selectedItemIds.length > 0
                          ? `${selectedItemIds.length} selected`
                          : "Select all"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExport}
                      disabled={exportData.isPending}
                      className="inline-flex items-center gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      {exportData.isPending ? (
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>

                {/* Items */}
                {paginatedItems.map((item, index) => (
                  <TestDataItemRow
                    key={item.id}
                    item={{
                      ...item,
                      created_at: item.created_at || new Date().toISOString(),
                      updated_at: item.updated_at || new Date().toISOString(),
                      metadata: typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : undefined
                    }}
                    isSelected={selectedItemIds.includes(item.id)}
                    onSelect={toggleItemSelection}
                    isLast={index === paginatedItems.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {items.length > itemsPerPage && (
            <Pagination
              currentPage={itemsPage}
              totalItems={items.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setItemsPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value)
                setItemsPage(1)
              }}
            />
          )}
        </div>

        {/* Bulk Actions Bar */}
        <EnhancedBulkActionsBar
          selectedItems={selectedItemIds}
          onClearSelection={() => setSelectedItemIds([])}
          assetType="testData"
          onAction={handleItemAction}
          portalId="test-data-items-bulk-actions"
        />
      </div>

      {/* AI Generate Dialog */}
      <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Generate Test Data</DialogTitle>
            <DialogDescription>
              Describe what test data you need for {type.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={`e.g. "Generate 3 invalid ${type.name.toLowerCase()} for testing"`}
              rows={4}
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  AI generation is currently in development. For now, this will generate random sample data.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAIOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || createItems.isPending}
            >
              {createItems.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}