// ============================================
// hooks/useReportSchedules.ts
// Hook for managing report schedules with actions
// ============================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReportScheduleWithReport, ReportScheduleFormData } from '@/types/report.types';
import { toast } from 'sonner';
import {
  getReportSchedules,
  createReportSchedule,
  updateReportSchedule,
  toggleReportSchedule,
  deleteReportSchedule as deleteScheduleAction,
  runReportScheduleNow,
} from '@/lib/actions/reports';

export function useReportSchedules(suiteId?: string) {
  const [schedules, setSchedules] = useState<ReportScheduleWithReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await getReportSchedules(suiteId);

      if (error) throw new Error(error);
      
      // Filter out any schedules with relation errors and ensure proper typing
      const validSchedules = (data || []).filter((schedule: any): schedule is ReportScheduleWithReport => {
        // Check if report exists and is not an error object
        return schedule.report !== undefined && 
               typeof schedule.report === 'object' && 
               schedule.report !== null &&
               'id' in schedule.report;
      });
      
      setSchedules(validSchedules);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules', { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [suiteId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createSchedule = async (formData: ReportScheduleFormData, suiteId: string) => {
    try {
      const { data, error } = await createReportSchedule(formData, suiteId);

      if (error) throw new Error(error);

      toast.success('Report schedule created');
      await fetchSchedules();
      return data;
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule', { description: error.message });
      return null;
    }
  };

  const updateSchedule = async (scheduleId: string, updates: Partial<ReportScheduleFormData>) => {
    try {
      const { data, error } = await updateReportSchedule(scheduleId, updates);

      if (error) throw new Error(error);

      toast.success('Schedule updated');
      await fetchSchedules();
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule', { description: error.message });
    }
  };

  const toggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const { data, error } = await toggleReportSchedule(scheduleId, isActive);

      if (error) throw new Error(error);

      toast.success(isActive ? 'Schedule activated' : 'Schedule paused');
      await fetchSchedules();
    } catch (error: any) {
      console.error('Error toggling schedule:', error);
      toast.error('Failed to toggle schedule', { description: error.message });
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const { error } = await deleteScheduleAction(scheduleId);

      if (error) throw new Error(error);

      toast.success('Schedule deleted');
      await fetchSchedules();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule', { description: error.message });
    }
  };

  const runScheduleNow = async (scheduleId: string) => {
    try {
      const { error } = await runReportScheduleNow(scheduleId);

      if (error) throw new Error(error);

      toast.success('Report scheduled for generation');
      await fetchSchedules();
    } catch (error: any) {
      console.error('Error running schedule:', error);
      toast.error('Failed to run schedule', { description: error.message });
    }
  };

  return {
    schedules,
    loading,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    toggleSchedule,
    deleteSchedule,
    runScheduleNow,
  };
}