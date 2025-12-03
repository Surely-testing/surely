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
      const { aiService } = await import('@/lib/ai/ai-service')
      const { isTestDataResponse } = await import('@/lib/ai/types')
      
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
    <div className="min-h-screen">
      <div>
        <div>
          {/* Header */}
          <div className="border-b border-border py-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left Section - Back, Icon, Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>

                <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200", iconColorClass)}>
                  <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                    {type.name}
                  </h2>
                  <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Right Section - Generate Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleRandomGenerate}
                  disabled={createItems.isPending && !isAIGenerating}
                  className="btn-primary inline-flex items-center justify-center px-5 py-2.5 gap-2 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(createItems.isPending && !isAIGenerating) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Random</span>
                </button>

                <button
                  onClick={() => setIsAIOpen(true)}
                  disabled={isAIGenerating}
                  className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white overflow-hidden flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 bg-gradient-accent shadow-glow-accent hover:shadow-glow-accent"
                >
                  {isAIGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>AI Generate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div>
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No test data yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Use the generate buttons above to create test data.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {/* Select All Row */}
                <div className="flex items-center justify-between gap-3 border-b border-border py-3 rounded">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.length === items.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      {selectedItemIds.length === items.length
                        ? "All selected"
                        : selectedItemIds.length > 0
                          ? `${selectedItemIds.length} selected`
                          : "Select all"}
                    </span>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={exportData.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportData.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Export</span>
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
            <div className="px-4 sm:px-6 pb-6">
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
            </div>
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
            <DialogTitle className="text-lg">AI Generate Test Data</DialogTitle>
            <DialogDescription className="text-sm">
              Describe what test data you need for {type.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Number of items to generate
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={aiCount}
                onChange={(e) => setAiCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background bg-background text-foreground transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={`e.g. "Generate ${aiCount} invalid ${type.name.toLowerCase()} for testing error handling"`}
                rows={3}
                className="text-sm resize-none"
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  AI will generate realistic test data based on your description using Google Gemini.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsAIOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || isAIGenerating}
              className="w-full sm:w-auto"
            >
              {isAIGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
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