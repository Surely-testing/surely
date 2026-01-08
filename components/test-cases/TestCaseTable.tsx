// ============================================
// components/test-cases/TestCaseTable.tsx
// Using custom Table components with responsive behavior
// ============================================
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { logger } from '@/lib/utils/logger';
import { 
  MoreVertical, 
  TestTube, 
  User, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Copy,
  Archive,
  Trash2,
  Clock,
  Link2,
  Eye
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableEmpty,
} from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { BulkActionsBar, type BulkAction, type ActionOption } from '../shared/bulk-action/BulkActionBar'
import { Pagination } from '../shared/Pagination'
import { DetailsDrawer } from './DetailsDrawer'
import { relationshipsApi } from '@/lib/api/relationships'
import type { TestCase } from '@/types/test-case.types'
import { cn } from '@/lib/utils/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown'

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

  const getPriorityVariant = (priority: string | null | undefined): "default" | "primary" | "success" | "warning" | "danger" | "info" => {
    switch (priority) {
      case 'critical': return 'danger'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getStatusVariant = (status: string | null | undefined): "default" | "primary" | "success" | "warning" | "danger" | "info" => {
    switch (status) {
      case 'active': return 'success'
      case 'archived': return 'default'
      default: return 'info'
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

  const handleToggleSelection = (id: string) => {
    if (onSelectionChange) {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
      } else {
        onSelectionChange([...selectedIds, id])
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
      <Table>
        {/* Table Header */}
        <TableHeader
          columns={[
            <TableHeaderCell key="title" sticky minWidth="min-w-[320px]">Title</TableHeaderCell>,
            <TableHeaderCell key="id">Test Case ID</TableHeaderCell>,
            <TableHeaderCell key="priority">Priority</TableHeaderCell>,
            <TableHeaderCell key="status">Status</TableHeaderCell>,
            <TableHeaderCell key="result">Last Result</TableHeaderCell>,
            <TableHeaderCell key="assignee">Assignee</TableHeaderCell>,
            <TableHeaderCell key="module">Module</TableHeaderCell>,
            <TableHeaderCell key="type">Type</TableHeaderCell>,
            <TableHeaderCell key="automated">Automated</TableHeaderCell>,
            <TableHeaderCell key="linked">Linked Assets</TableHeaderCell>,
            <TableHeaderCell key="created">Created</TableHeaderCell>,
            <TableHeaderCell key="actions" minWidth="min-w-[120px]">Actions</TableHeaderCell>,
          ]}
        />

        {/* Table Body */}
        {paginatedTestCases.map((testCase) => {
          const isSelected = selectedIds.includes(testCase.id)
          const linkedCount = linkedAssetsCounts[testCase.id] ?? 0

          return (
            <TableRow key={testCase.id} selected={isSelected}>
              {/* Checkbox */}
              <TableCheckbox
                checked={isSelected}
                selected={isSelected}
                onCheckedChange={() => handleToggleSelection(testCase.id)}
              />

              {/* Title - Sticky */}
              <TableCell sticky selected={isSelected} minWidth="min-w-[320px]">
                <div 
                  className="font-medium truncate cursor-help"
                  title={testCase.title}
                >
                  {testCase.title}
                </div>
              </TableCell>

              {/* Test Case ID */}
              <TableCell>
                <span className="text-sm text-muted-foreground font-mono">
                  {testCase.id.slice(0, 8)}
                </span>
              </TableCell>

              {/* Priority */}
              <TableCell>
                <Badge variant={getPriorityVariant(testCase.priority)} size="sm">
                  {testCase.priority || 'None'}
                </Badge>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Badge variant={getStatusVariant(testCase.status)} size="sm">
                  {testCase.status || 'Active'}
                </Badge>
              </TableCell>

              {/* Last Result */}
              <TableCell>
                <div className="flex items-center gap-2">
                  {getResultIcon(testCase.last_result)}
                  <span className="text-sm capitalize">
                    {testCase.last_result || 'Not Run'}
                  </span>
                </div>
              </TableCell>

              {/* Assignee */}
              <TableCell>
                {testCase.assigned_to ? (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm truncate">{testCase.assigned_to}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </TableCell>

              {/* Module */}
              <TableCell>
                <span className="text-sm">{testCase.module || '—'}</span>
              </TableCell>

              {/* Type */}
              <TableCell>
                <span className="text-sm">{testCase.type || 'Manual'}</span>
              </TableCell>

              {/* Automated */}
              <TableCell>
                <span className="text-sm">{testCase.is_automated ? 'Yes' : 'No'}</span>
              </TableCell>

              {/* Linked Assets */}
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className={cn(
                    "text-sm",
                    linkedCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {linkedCount > 0 ? `${linkedCount}` : 'None'}
                  </span>
                </div>
              </TableCell>

              {/* Created */}
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDate(testCase.created_at)}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell minWidth="min-w-[120px]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleViewDetails(testCase, e)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onRun?.(testCase.id)}>
                        <Play className="w-4 h-4" />
                        Run Test
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(testCase.id)}>
                        <Copy className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate?.(testCase.id)}>
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onArchive?.(testCase.id)}>
                        <Archive className="w-4 h-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(testCase.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
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