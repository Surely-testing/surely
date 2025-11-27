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
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [aiCount, setAiCount] = useState(3)

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
    // Use generator_type from the type object, not the type.id
    const generatorKey = type.generator_type || 'generic'
    const generator = testDataGenerators[generatorKey as keyof typeof testDataGenerators] || testDataGenerators.generic
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

    setIsAIGenerating(true)
    setIsAIOpen(false)
    
    try {
      // Import AI service dynamically to avoid client-side issues
      const { aiService } = await import('@/lib/ai/ai-service')
      const { isTestDataResponse } = await import('@/lib/ai/types')
      
      // Call AI service to generate test data with user-specified count
      const result = await aiService.generateTestData(
        aiPrompt,
        type.name,
        aiCount
      )

      if (result.success && result.data && isTestDataResponse(result.data)) {
        const values = result.data.testData
        
        const newItems = values.map(value => ({
          type_id: type.id,
          suite_id: type.suite_id,
          value
        }))

        await createItems.mutateAsync(newItems)
      } else {
        throw new Error(result.error || 'Failed to generate test data')
      }
    } catch (error: any) {
      console.error('AI generation error:', error)
      // Fallback to random generation
      const generatorKey = type.generator_type || 'generic'
      const generator = testDataGenerators[generatorKey as keyof typeof testDataGenerators] || testDataGenerators.generic
      const values = generator().slice(0, aiCount)
      
      const newItems = values.map(value => ({
        type_id: type.id,
        suite_id: type.suite_id,
        value
      }))

      await createItems.mutateAsync(newItems)
    } finally {
      setIsAIGenerating(false)
      setAiPrompt('')
    }
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
      <div className="w-full py-4 px-3 sm:py-6 sm:px-4 lg:px-8">
        <div className="bg-card shadow-sm rounded-lg overflow-hidden transition-all duration-300 border border-border">
          {/* Header */}
          <div className="border-b border-border px-3 py-3 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3">
              {/* Top Row - Back button and Title */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>

                <div className={cn("w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center flex-shrink-0", iconColorClass)}>
                  <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground truncate">
                    {type.name}
                  </h2>
                  <span className="px-2 py-0.5 sm:py-1 bg-muted rounded-full text-xs font-normal text-foreground whitespace-nowrap flex-shrink-0">
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Bottom Row - Action Buttons */}
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={handleRandomGenerate}
                  disabled={createItems.isPending && !isAIGenerating}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {(createItems.isPending && !isAIGenerating) ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span>Random</span>
                </button>

                <button
                  onClick={() => setIsAIOpen(true)}
                  disabled={isAIGenerating}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-primary-foreground bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAIGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden xs:inline">AI Generate</span>
                  <span className="xs:hidden">AI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            {items.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <Database className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  No test data yet. Use the generate buttons above!
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {/* Select All Row */}
                <div className="flex items-center justify-between gap-2 border-b border-border py-2 rounded">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.length === items.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary flex-shrink-0"
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground truncate">
                      {selectedItemIds.length === items.length
                        ? "All"
                        : selectedItemIds.length > 0
                          ? `${selectedItemIds.length}`
                          : "Select"}
                    </span>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={exportData.isPending}
                    className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {exportData.isPending ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    <span className="hidden sm:inline">Export</span>
                  </button>
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
        <DialogContent className="w-[95vw] sm:w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">AI Generate Test Data</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Describe what test data you need for {type.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Number of items to generate
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={aiCount}
                onChange={(e) => setAiCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Description
              </label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={`e.g. "Generate ${aiCount} invalid ${type.name.toLowerCase()} for testing error handling"`}
                rows={3}
                className="text-sm"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex gap-2">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                  AI will generate realistic test data based on your description using Google Gemini.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsAIOpen(false)}
              className="w-full sm:w-auto text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || isAIGenerating}
              className="w-full sm:w-auto text-sm"
            >
              {isAIGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  Generate {aiCount} {aiCount === 1 ? 'Item' : 'Items'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}