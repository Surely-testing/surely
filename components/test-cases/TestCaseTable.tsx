// ============================================
// FILE: components/test-cases/TestCaseTable.tsx
// Updated to work with parent selection state
// ============================================
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { logger } from '@/lib/utils/logger';
import { 
  MoreVertical, 
  Calendar, 
  TestTube, 
  User, 
  FileText, 
  Clock,
  Edit,
  Trash2,
  Archive,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  ChevronDown,
  ChevronRight,
  Link2,
  Eye
} from 'lucide-react'
import {
  Table,
  TableRow,
  TableCell,
  TableGrid,
  TableCheckbox,
  TableSelectAll,
  TableEmpty,
  TableHeaderText,
  TableDescriptionText,
} from '../ui/Table'
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

interface TestCaseTableProps {
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

export function TestCaseTable({ 
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
}: TestCaseTableProps) {
  const [loadingActions, setLoadingActions] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [drawerTestCase, setDrawerTestCase] = useState<TestCase | null>(null)
  const [linkedAssetsCounts, setLinkedAssetsCounts] = useState<Record<string, number>>({})
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Use external selection if provided
  const selectedIds = externalSelectedIds

  // Paginated data
  const paginatedTestCases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return testCases.slice(startIndex, endIndex)
  }, [testCases, currentPage, itemsPerPage])

  // Fetch linked assets count for all visible test cases
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
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000))
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

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedId(expandedId === id ? null : id)
  }

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenId(menuOpenId === id ? null : id)
  }

  const handleViewDetails = (testCase: TestCaseRow, e: React.MouseEvent) => {
    e.stopPropagation()
    setDrawerTestCase(testCase as TestCase)
  }

  if (testCases.length === 0) {
    return (
      <TableEmpty
        icon={<TestTube className="w-8 h-8 text-primary" />}
        title="No test cases found"
        description="Create your first test case to get started"
      />
    )
  }

  return (
    <div className="space-y-0">
      {/* Table - Mobile First */}
      <Table>
        {paginatedTestCases.map((testCase) => {
          const isSelected = selectedIds.includes(testCase.id)
          const isExpanded = expandedId === testCase.id
          const isMenuOpen = menuOpenId === testCase.id
          const linkedCount = linkedAssetsCounts[testCase.id] ?? 0

          return (
            <div key={testCase.id}>
              {/* Mobile View - Card Style */}
              <div className="block lg:hidden">
                <TableRow selected={isSelected} selectable>
                  <div className="p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start gap-3">
                      <TableCheckbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(testCase.id, checked)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground text-sm leading-tight mb-1">
                              {testCase.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              ID: {testCase.id.slice(0, 8)}
                            </p>
                          </div>
                          
                          <button 
                            onClick={(e) => toggleMenu(testCase.id, e)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant={getPriorityColor(testCase.priority)} size="sm">
                            {testCase.priority || 'None'}
                          </Badge>
                          <Badge variant={getStatusColor(testCase.status)} size="sm">
                            {testCase.status || 'Active'}
                          </Badge>
                          {getResultIcon(testCase.last_result)}
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          {testCase.assigned_to && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{testCase.assigned_to}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            <span>{linkedCount > 0 ? `${linkedCount} linked` : 'Not linked'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(testCase.created_at)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={(e) => handleViewDetails(testCase, e)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            onClick={(e) => toggleExpand(testCase.id, e)}
                            className="px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TableRow>
              </div>

              {/* Desktop View - Table Style */}
              <div className="hidden lg:block">
                <TableRow selected={isSelected} selectable>
                  <TableCheckbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectOne(testCase.id, checked)}
                  />

                  <TableGrid columns={7}>
                    {/* Title & ID */}
                    <TableCell className="col-span-2">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={(e) => toggleExpand(testCase.id, e)}
                          className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {getResultIcon(testCase.last_result)}
                        </button>
                        <div className="flex-1 min-w-0">
                          <TableHeaderText>
                            <span className="hover:text-primary transition-colors">
                              {testCase.title}
                            </span>
                          </TableHeaderText>
                          <TableDescriptionText className="mt-1">
                            ID: {testCase.id.slice(0, 8)} {testCase.description && `• ${testCase.description}`}
                          </TableDescriptionText>
                        </div>
                      </div>
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <Badge 
                        variant={getPriorityColor(testCase.priority)}
                        size="sm"
                      >
                        {testCase.priority || 'None'}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge 
                        variant={getStatusColor(testCase.status)}
                        size="sm"
                      >
                        {testCase.status || 'Active'}
                      </Badge>
                    </TableCell>

                    {/* Linked Assets */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className={cn(
                          "text-xs",
                          linkedCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {linkedCount > 0 ? `${linkedCount} linked` : 'Not linked'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Assignee */}
                    <TableCell>
                      {testCase.assigned_to ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span className="truncate">{testCase.assigned_to}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleViewDetails(testCase, e)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      
                      <div className="relative">
                        <button 
                          onClick={(e) => toggleMenu(testCase.id, e)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
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
                    </TableCell>
                  </TableGrid>
                </TableRow>
              </div>

              {/* Expanded Details - Both Mobile & Desktop */}
              {isExpanded && (
                <div className="bg-muted/30 border border-border border-t-0 rounded-b-lg p-4 sm:p-6 mb-4 -mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Test Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3">Test Details</h4>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Type</dt>
                          <dd className="text-foreground font-medium">{testCase.type || 'Manual'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Automated</dt>
                          <dd className="text-foreground font-medium">{testCase.is_automated ? 'Yes' : 'No'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Last Result</dt>
                          <dd className="flex items-center gap-2">
                            {getResultIcon(testCase.last_result)}
                            <span className="text-foreground font-medium capitalize">
                              {testCase.last_result || 'Not Run'}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Steps */}
                    {testCase.steps && Array.isArray(testCase.steps) && testCase.steps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">Steps ({testCase.steps.length})</h4>
                        <ol className="space-y-2 text-sm list-decimal list-inside">
                          {testCase.steps.slice(0, 3).map((step: any, idx: number) => {
                            const stepText = typeof step === 'string' ? step : step?.step || step?.action || 'No description'
                            return (
                              <li key={idx} className="text-muted-foreground truncate">
                                {stepText}
                              </li>
                            )
                          })}
                          {testCase.steps.length > 3 && (
                            <li className="text-primary text-xs">+{testCase.steps.length - 3} more</li>
                          )}
                        </ol>
                      </div>
                    )}

                    {/* Expected Result */}
                    {testCase.expected_result && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">Expected Result</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {testCase.expected_result}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRun?.(testCase.id)
                      }}
                      className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Run Test
                    </button>
                    <button
                      onClick={(e) => handleViewDetails(testCase, e)}
                      className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </Table>

      {/* Pagination */}
      {testCases.length > 0 && (
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