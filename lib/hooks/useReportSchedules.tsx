// ============================================
// FILE: lib/hooks/useReportSchedules.ts (FIXED)
// Hook for managing report schedules - Client-side queries
// ============================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReportScheduleWithReport, ReportScheduleFormData } from '@/types/report.types'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger';

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
      logger.log('Error fetching schedules:', error)
      toast.error('Failed to load schedules', { description: error.message })
    } finally {
      setLoading(false)
    }
  }, [suiteId, supabase])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const createSchedule = async (formData: ReportScheduleFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Validate suite_id
      if (!formData.suite_id) {
        throw new Error('Suite ID is required')
      }

      const nextRun = calculateNextRun(formData.frequency)

      const { data, error } = await supabase
        .from('report_schedules')
        .insert({
          suite_id: formData.suite_id,
          user_id: user.id,
          name: formData.name,
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
      logger.log('Error creating schedule:', error)
      toast.error('Failed to create schedule', { description: error.message })
      throw error
    }
  }

  const updateSchedule = async (scheduleId: string, updates: Partial<ReportScheduleFormData>) => {
    try {
      const updateData: any = {}
      
      if (updates.name) updateData.name = updates.name
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
      logger.log('Error updating schedule:', error)
      toast.error('Failed to update schedule', { description: error.message })
      throw error
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
      logger.log('Error toggling schedule:', error)
      toast.error('Failed to toggle schedule', { description: error.message })
      throw error
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) throw error

      toast.success('Schedule deleted')
      await fetchSchedules()
    } catch (error: any) {
      logger.log('Error deleting schedule:', error)
      toast.error('Failed to delete schedule', { description: error.message })
      throw error
    }
  }

  const runScheduleNow = async (scheduleId: string) => {
    try {
      // Call the existing API endpoint to trigger report generation
      const response = await fetch(`/api/schedules/${scheduleId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run schedule');
      }

      const result = await response.json();

      toast.success('Report generated and sent successfully', {
        description: `Sent to ${result.sentTo?.length || 0} recipient(s)`
      });

      await fetchSchedules();
      return result;
    } catch (error: any) {
      logger.log('Error running schedule:', error);
      toast.error('Failed to generate report', { description: error.message });
      throw error;
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