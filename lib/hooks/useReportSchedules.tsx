// ============================================
// FILE: lib/hooks/useReportSchedules.ts (FIXED)
// Hook for managing report schedules - Client-side queries
// ============================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReportScheduleWithReport, ReportScheduleFormData } from '@/types/report.types'
import { toast } from 'sonner'

export function useReportSchedules(suiteId?: string) {
  const [schedules, setSchedules] = useState<ReportScheduleWithReport[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  const fetchSchedules = useCallback(async () => {
    if (!suiteId) return

    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch schedules for current suite and user
      const { data: schedulesData, error } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('suite_id', suiteId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Type cast since we don't have the report relation
      // In a real app, you might want to fetch related report data separately
      const validSchedules = (schedulesData || []) as ReportScheduleWithReport[]
      
      setSchedules(validSchedules)
    } catch (error: any) {
      console.error('Error fetching schedules:', error)
      toast.error('Failed to load schedules', { description: error.message })
    } finally {
      setLoading(false)
    }
  }, [suiteId, supabase])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const createSchedule = async (formData: ReportScheduleFormData, suiteId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const nextRun = calculateNextRun(formData.frequency)

      const { data, error } = await supabase
        .from('report_schedules')
        .insert({
          suite_id: suiteId,
          user_id: user.id,
          type: formData.type,
          frequency: formData.frequency,
          emails: formData.emails,
          is_active: formData.is_active ?? true,
          next_run: nextRun,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Report schedule created')
      await fetchSchedules()
      return data
    } catch (error: any) {
      console.error('Error creating schedule:', error)
      toast.error('Failed to create schedule', { description: error.message })
      return null
    }
  }

  const updateSchedule = async (scheduleId: string, updates: Partial<ReportScheduleFormData>) => {
    try {
      const updateData: any = {}
      
      if (updates.type) updateData.type = updates.type
      if (updates.emails) updateData.emails = updates.emails
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active
      
      if (updates.frequency) {
        updateData.frequency = updates.frequency
        updateData.next_run = calculateNextRun(updates.frequency)
      }

      const { error } = await supabase
        .from('report_schedules')
        .update(updateData)
        .eq('id', scheduleId)

      if (error) throw error

      toast.success('Schedule updated')
      await fetchSchedules()
    } catch (error: any) {
      console.error('Error updating schedule:', error)
      toast.error('Failed to update schedule', { description: error.message })
    }
  }

  const toggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('report_schedules')
        .update({ is_active: isActive })
        .eq('id', scheduleId)

      if (error) throw error

      toast.success(isActive ? 'Schedule activated' : 'Schedule paused')
      await fetchSchedules()
    } catch (error: any) {
      console.error('Error toggling schedule:', error)
      toast.error('Failed to toggle schedule', { description: error.message })
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      const { error } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) throw error

      toast.success('Schedule deleted')
      await fetchSchedules()
    } catch (error: any) {
      console.error('Error deleting schedule:', error)
      toast.error('Failed to delete schedule', { description: error.message })
    }
  }

  const runScheduleNow = async (scheduleId: string) => {
    try {
      const { data: schedule, error: fetchError } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single()

      if (fetchError || !schedule) throw new Error('Schedule not found')

      // Update next_run
      const { error } = await supabase
        .from('report_schedules')
        .update({ 
          next_run: calculateNextRun(schedule.frequency)
        })
        .eq('id', scheduleId)

      if (error) throw error

      toast.success('Report scheduled for generation')
      await fetchSchedules()
    } catch (error: any) {
      console.error('Error running schedule:', error)
      toast.error('Failed to run schedule', { description: error.message })
    }
  }

  return {
    schedules,
    loading,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    toggleSchedule,
    deleteSchedule,
    runScheduleNow,
  }
}

// Helper function to calculate next run time
function calculateNextRun(frequency: string): string {
  const now = new Date()
  
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1)
      break
    case 'weekly':
      now.setDate(now.getDate() + 7)
      break
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      break
  }
  
  now.setHours(9, 0, 0, 0)
  return now.toISOString()
}