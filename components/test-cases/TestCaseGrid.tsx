// ============================================
// FILE: components/test-cases/TestCaseGrid.tsx
// ============================================
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { logger } from '@/lib/utils/logger';
import {
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Play,
  Copy,
  Archive,
  Trash2,
  Eye,
  Link2,
  TestTube
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { BulkActionsBar, type BulkAction, type ActionOption } from '../shared/bulk-action/BulkActionBar'
import { Pagination } from '../shared/Pagination'
import { DetailsDrawer } from './DetailsDrawer'
import { relationshipsApi } from '@/lib/api/relationships'
import type { TestCase } from '@/types/test-case.types'
import { cn } from '@/lib/utils/cn'

export interface TestCaseRow {
  id: string;
  suite_id: string;
  title: string;
  description: string | null;
  steps?: any;
  expected_result?: string | null;
  priority?: string | null;
  status?: string | null;
  sprint_id?: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  last_result?: 'passed' | 'failed' | 'blocked' | null;
  assigned_to?: string | null;
  module?: string | null;
  type?: string | null;
  is_automated?: boolean | null;
  tags?: string[] | null;
}

interface TestCaseGridProps {
  testCases: TestCaseRow[]
  suiteId: string
  onBulkAction?: (actionId: string, testCaseIds: string[], option?: ActionOption | null) => Promise<void>
  onEdit?: (testCaseId: string) => void
  onDelete?: (testCaseId: string) => void
  onArchive?: (testCaseId: string) => void
  onDuplicate?: (testCaseId: string) => void
  onRun?: (testCaseId: string) => void
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export function TestCaseGrid({
  testCases,
  suiteId,
  onBulkAction,
  onEdit,
  onDelete,
  onArchive,
  onDuplicate,
  onRun,
  selectedIds: externalSelectedIds = [],
  onSelectionChange
}: TestCaseGridProps) {
  const [loadingActions, setLoadingActions] = useState<string[]>([])
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [drawerTestCase, setDrawerTestCase] = useState<TestCase | null>(null)
  const [linkedAssetsCounts, setLinkedAssetsCounts] = useState<Record<string, number>>({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  const selectedIds = externalSelectedIds

  // Paginated data
  const paginatedTestCases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return testCases.slice(startIndex, endIndex)
  }, [testCases, currentPage, itemsPerPage])

  // Fetch linked assets count
  useEffect(() => {
    const fetchLinkedCounts = async () => {
      const counts: Record<string, number> = {}

      await Promise.all(
        paginatedTestCases.map(async (tc) => {
          try {
            const count = await relationshipsApi.getCount('test_case', tc.id)
            counts[tc.id] = count
          } catch (error) {
            counts[tc.id] = 0
          }
        })
      )

      setLinkedAssetsCounts(counts)
    }

    if (paginatedTestCases.length > 0) {
      fetchLinkedCounts()
    }
  }, [paginatedTestCases])

  const getPriorityColor = (priority: string | null | undefined): 'danger' | 'warning' | 'info' | 'success' | 'default' => {
    switch (priority) {
      case 'critical':
        return 'danger'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  const getStatusColor = (status: string | null | undefined): 'success' | 'default' | 'info' => {
    switch (status) {
      case 'active':
        return 'success'
      case 'archived':
        return 'default'
      default:
        return 'info'
    }
  }

  const getResultIcon = (result: string | null | undefined): React.ReactNode => {
    switch (result) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-success" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-error" />
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-warning" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, id])
      } else {
        onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
      }
    }
  }

  const handleBulkActionExecute = async (
    actionId: string,
    selectedTestCaseIds: string[],
    actionConfig: BulkAction,
    selectedOption?: ActionOption | null
  ) => {
    setLoadingActions(prev => [...prev, actionId])

    try {
      if (onBulkAction) {
        await onBulkAction(actionId, selectedTestCaseIds, selectedOption)
      }
      if (onSelectionChange) {
        onSelectionChange([])
      }
    } catch (error) {
      logger.log('Bulk action failed:', error)
    } finally {
      setLoadingActions(prev => prev.filter(a => a !== actionId))
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (onSelectionChange) {
      onSelectionChange([])
    }
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    if (onSelectionChange) {
      onSelectionChange([])
    }
  }

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenId(menuOpenId === id ? null : id)
  }

  const handleViewDetails = (testCase: TestCaseRow, e: React.MouseEvent) => {
    e.stopPropagation()
    setDrawerTestCase(testCase as TestCase)
  }

  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)

  const handleCardClick = (testCase: TestCaseRow) => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTime

    // Double click detection (within 300ms)
    if (lastClickedId === testCase.id && timeSinceLastClick < 300) {
      // Double click - open details
      setDrawerTestCase(testCase as TestCase)
      setLastClickTime(0)
      setLastClickedId(null)
    } else {
      // Single click - just record the time
      setLastClickTime(now)
      setLastClickedId(testCase.id)
    }
  }

  if (testCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <TestTube className="w-12 h-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium text-foreground mb-1">No test cases found</h3>
        <p className="text-sm text-muted-foreground">Create your first test case to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedTestCases.map((testCase) => {
          const isSelected = selectedIds.includes(testCase.id)
          const isMenuOpen = menuOpenId === testCase.id
          const linkedCount = linkedAssetsCounts[testCase.id] ?? 0

          return (
            <div
              key={testCase.id}
              onClick={() => handleCardClick(testCase)}
              className={cn(
                'bg-card rounded-lg border transition-all duration-200 cursor-pointer group hover:shadow-lg hover:border-primary/50',
                isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              )}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleSelectOne(testCase.id, e.target.checked)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "mt-1 w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all cursor-pointer",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {testCase.title}
                      </h3>
                    </div>
                  </div>

                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => toggleMenu(testCase.id, e)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpenId(null)
                          }}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(testCase, e)
                              setMenuOpenId(null)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onRun?.(testCase.id)
                              setMenuOpenId(null)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Run Test
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDuplicate?.(testCase.id)
                              setMenuOpenId(null)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <div className="my-1 h-px bg-border" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onArchive?.(testCase.id)
                              setMenuOpenId(null)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete?.(testCase.id)
                              setMenuOpenId(null)
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {testCase.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {testCase.description}
                  </p>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant={getPriorityColor(testCase.priority)} size="sm">
                    {testCase.priority || 'None'}
                  </Badge>
                  <Badge variant={getStatusColor(testCase.status)} size="sm">
                    {testCase.status || 'Active'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getResultIcon(testCase.last_result)}
                    <span className="text-xs text-muted-foreground capitalize">
                      {testCase.last_result || 'Not Run'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Test Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Type</span>
                    <span className="text-foreground font-medium">{testCase.type || 'Manual'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Automated</span>
                    <span className="text-foreground font-medium">{testCase.is_automated ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Meta Info */}
                <div className="space-y-2">
                  {testCase.assigned_to && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{testCase.assigned_to}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs">
                    <Link2 className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className={cn(
                      "truncate",
                      linkedCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {linkedCount > 0 ? `${linkedCount} linked` : 'Not linked'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{formatDate(testCase.created_at)}</span>
                  </div>
                </div>

                {/* Steps Preview */}
                {testCase.steps && Array.isArray(testCase.steps) && testCase.steps.length > 0 && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Steps</span>
                        <span className="text-xs text-muted-foreground">{testCase.steps.length}</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {(() => {
                          const firstStep = testCase.steps[0]
                          const stepText = typeof firstStep === 'string' ? firstStep : firstStep?.step || firstStep?.action || 'No description'
                          return `1. ${stepText}`
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {testCases.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalItems={testCases.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={selectedIds}
        onClearSelection={() => onSelectionChange?.([])}
        assetType="testCases"
        onAction={handleBulkActionExecute}
        loadingActions={loadingActions}
      />

      {/* Details Drawer */}
      <DetailsDrawer
        isOpen={drawerTestCase !== null}
        testCase={drawerTestCase}
        onClose={() => setDrawerTestCase(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
        onDuplicate={onDuplicate}
        onRun={onRun}
      />
    </div>
  )
}