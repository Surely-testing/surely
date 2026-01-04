// ============================================
// FILE: hooks/useBulkActions.ts
// ============================================

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { relationshipsApi } from '@/lib/api/relationships'

type AssetType = 
  | 'test_cases'
  | 'bugs' 
  | 'documents' 
  | 'recordings' 
  | 'recommendations' 
  | 'sprints' 
  | 'reports' 
  | 'report_schedules'
  | 'test_runs' 
  | 'test_data_items'
  | 'trash'
  | 'archive'

export function useBulkActions(assetType: AssetType, suiteId: string) {
  const [isExecuting, setIsExecuting] = useState(false)

  const execute = async (
    action: string,
    selectedIds: string[],
    actionConfig?: any,
    onSuccess?: () => void
  ) => {
    if (!selectedIds || selectedIds.length === 0) {
      toast.error('No items selected')
      return
    }

    setIsExecuting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Handle test_cases specific actions
      if (assetType === 'test_cases') {
        if (action === 'delete') {
          // Delete relationships first
          for (const id of selectedIds) {
            await relationshipsApi.deleteAllForAsset('test_case' as any, id)
          }

          // Delete test cases
          const { error } = await supabase
            .from('test_cases')
            .delete()
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Deleted ${selectedIds.length} test case(s)`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }

        } else if (action === 'archive') {
          if (!user?.id) {
            throw new Error('User not authenticated')
          }

          // Fetch test cases to archive
          const { data: testCases, error: fetchError } = await supabase
            .from('test_cases')
            .select('*')
            .in('id', selectedIds)

          if (fetchError) throw fetchError

          // Insert into archived_items
          const archivedItems = testCases?.map(tc => ({
            suite_id: suiteId,
            asset_type: 'testCases',
            asset_id: tc.id,
            asset_data: tc,
            archived_by: user.id
          }))

          const { error: archiveError } = await supabase
            .from('archived_items')
            .insert(archivedItems)

          if (archiveError) throw archiveError

          // Delete from test_cases
          const { error: deleteError } = await supabase
            .from('test_cases')
            .delete()
            .in('id', selectedIds)

          if (deleteError) throw deleteError

          toast.success(`Archived ${selectedIds.length} test case(s)`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }

        } else if (action === 'pass') {
          const { error } = await supabase
            .from('test_cases')
            .update({ status: 'passed' })
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Marked ${selectedIds.length} test case(s) as passed`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }

        } else if (action === 'fail') {
          const { error } = await supabase
            .from('test_cases')
            .update({ status: 'failed' })
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Marked ${selectedIds.length} test case(s) as failed`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }

        } else if (action === 'block') {
          const { error } = await supabase
            .from('test_cases')
            .update({ status: 'blocked' })
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Marked ${selectedIds.length} test case(s) as blocked`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }

        } else if (action === 'reset') {
          const { error } = await supabase
            .from('test_cases')
            .update({ status: 'pending' })
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Reset ${selectedIds.length} test case(s)`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }

        } else if (action === 'assign') {
          const updates: any = {}
          if (actionConfig?.priority) {
            updates.priority = actionConfig.priority
          }
          if (actionConfig?.assignee) {
            updates.assigned_to = actionConfig.assignee
          }

          const { error } = await supabase
            .from('test_cases')
            .update(updates)
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Updated ${selectedIds.length} test case(s)`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }
        }
      }

      // Handle test_runs specific actions
      if (assetType === 'test_runs') {
        if (action === 'delete') {
          // Delete relationships first
          for (const id of selectedIds) {
            await relationshipsApi.deleteAllForAsset('test_run' as any, id)
          }

          // Delete test run results
          await supabase
            .from('test_run_results')
            .delete()
            .in('test_run_id', selectedIds)

          // Delete test runs
          const { error } = await supabase
            .from('test_runs')
            .delete()
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Deleted ${selectedIds.length} test run(s)`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }

        } else if (action === 'archive') {
          // Using status instead of is_archived
          const { error } = await supabase
            .from('test_runs')
            .update({ status: 'archived' })
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Archived ${selectedIds.length} test run(s)`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }

        } else if (action === 'execute') {
          const { error } = await supabase
            .from('test_runs')
            .update({ 
              status: 'in-progress',
              executed_at: new Date().toISOString()
            })
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Started ${selectedIds.length} test run(s)`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }

        } else if (action === 'abort') {
          const { error } = await supabase
            .from('test_runs')
            .update({ status: 'blocked' })
            .in('id', selectedIds)

          if (error) throw error

          toast.success(`Aborted ${selectedIds.length} test run(s)`)
          onSuccess?.()
          return { success: true, updatedCount: selectedIds.length }
        }
      }

      return { success: false, error: 'Unknown action' }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsExecuting(false)
    }
  }

  return { execute, isExecuting }
}