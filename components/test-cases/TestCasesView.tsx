// ============================================
// FILE: components/test-cases/TestCasesView.tsx
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, RefreshCw, Filter } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { TestCaseForm } from './TestCaseForm'
import { TestCaseTable } from './TestCaseTable'
import type { TestCase, TestCasePriority, TestCaseStatus } from '@/types/test-case.types'

interface TestCasesViewProps {
  suiteId: string
  canWrite?: boolean
}

export function TestCasesView({ suiteId, canWrite = false }: TestCasesViewProps) {
  const { supabase } = useSupabase()
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [isLoading, setIsLoading] = useState(true)

  const fetchTestCases = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTestCases(data || [])
    } catch (err: any) {
      console.error('Error fetching test cases:', err)
      toast.error('Failed to load test cases', { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTestCases()

    const channel = supabase
      .channel(`test_cases:${suiteId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'test_cases',
        filter: `suite_id=eq.${suiteId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTestCases(prev => [payload.new as TestCase, ...prev])
          toast.success('Test case created')
        } else if (payload.eventType === 'UPDATE') {
          setTestCases(prev => prev.map(tc => tc.id === payload.new.id ? payload.new as TestCase : tc))
          toast.success('Test case updated')
        } else if (payload.eventType === 'DELETE') {
          setTestCases(prev => prev.filter(tc => tc.id !== payload.old.id))
          toast.success('Test case deleted')
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [suiteId, supabase])

  const filteredTestCases = testCases.filter(tc => {
    const matchesSearch = tc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || tc.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (testCases.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Plus className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No test cases yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create your first test case to start testing</p>
          {canWrite && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Test Case
            </button>
          )}
        </div>
        {isCreateModalOpen && (
          <TestCaseForm
            suiteId={suiteId}
            onSuccess={() => setIsCreateModalOpen(false)}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Test Cases</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredTestCases.length} of {testCases.length} test cases
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchTestCases}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {canWrite && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Test Case
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search test cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* No Results */}
      {filteredTestCases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Filter className="h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No test cases found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setPriorityFilter('all')
              setStatusFilter('active')
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Table */}
      {filteredTestCases.length > 0 && (
        <TestCaseTable testCases={filteredTestCases} suiteId={suiteId} />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <TestCaseForm
          suiteId={suiteId}
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  )
}