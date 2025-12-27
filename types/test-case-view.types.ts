// ============================================
// types/test-case-view.types.ts
// ============================================

export type ViewMode = 'grid' | 'table'
export type SortField = 'created_at' | 'updated_at' | 'title' | 'priority'
export type SortOrder = 'asc' | 'desc'
export type GroupBy = 'none' | 'priority' | 'status'

export interface DialogState {
  open: boolean
  testCaseId: string | null
}

export interface BulkDialogState {
  open: boolean
  count: number
}

export interface TestCaseFilters {
  searchQuery: string
  priorityFilter: string
  statusFilter: string
}

export interface TestCasesViewProps {
  suiteId: string
  canWrite?: boolean
}
