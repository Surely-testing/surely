// ============================================
// test-cases/views/test-case-utils.ts
// ============================================

import type { TestCase } from '@/types/test-case.types'
import type { TestCaseRow } from '../TestCaseTable'
import { GroupBy, SortField, SortOrder } from '@/types/test-case-view.types'

export const convertToTestCaseRows = (testCases: TestCase[]): TestCaseRow[] => {
  return testCases.map(tc => ({
    id: tc.id,
    suite_id: tc.suite_id,
    title: tc.title,
    description: tc.description,
    steps: tc.steps,
    expected_result: tc.expected_result,
    priority: tc.priority,
    status: tc.status,
    sprint_id: tc.sprint_id || null,
    created_by: tc.created_by,
    created_at: tc.created_at,
    updated_at: tc.updated_at,
    last_result: (tc as any).last_result || null,
    assigned_to: (tc as any).assigned_to || null,
    module: (tc as any).module || null,
    type: (tc as any).type || null,
    is_automated: (tc as any).is_automated || null,
    tags: (tc as any).tags || null,
  }))
}

export const filterTestCases = (
  testCases: TestCase[],
  searchQuery: string,
  priorityFilter: string
): TestCase[] => {
  return testCases.filter(tc => {
    const matchesSearch = !searchQuery || 
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter
    
    return matchesSearch && matchesPriority
  })
}

export const sortTestCases = (
  testCases: TestCase[],
  sortField: SortField,
  sortOrder: SortOrder
): TestCase[] => {
  return [...testCases].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    if (sortField === 'created_at' || sortField === 'updated_at') {
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
}

export const groupTestCases = (
  testCases: TestCase[],
  groupBy: GroupBy
): Record<string, TestCase[]> => {
  if (groupBy === 'none') {
    return { 'All Test Cases': testCases }
  }

  const grouped: Record<string, TestCase[]> = {}

  testCases.forEach(tc => {
    let groupKey = 'Uncategorized'

    switch (groupBy) {
      case 'priority':
        groupKey = tc.priority ? tc.priority.toUpperCase() : 'NO PRIORITY'
        break
      case 'status':
        groupKey = tc.status ? tc.status.toUpperCase() : 'NO STATUS'
        break
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = []
    }
    grouped[groupKey].push(tc)
  })

  return grouped
}