// ============================================
// FILE: lib/hooks/useSprints.ts
// Complete working sprints hooks - REPLACE YOUR ENTIRE FILE WITH THIS
// ============================================

import { createClient } from "../supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface SprintFilters {
  status?: string[];
  search?: string;
}

interface SprintFormData {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  test_case_ids?: string[];
}

// Fetch all sprints for a suite
export function useSprints(suiteId: string, filters?: SprintFilters) {
  return useQuery({
    queryKey: ['sprints', suiteId, filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('sprints')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (filters?.status?.length) query = query.in('status', filters.status);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      
      // Ensure test_case_ids is always an array
      return (data || []).map(sprint => ({
        ...sprint,
        test_case_ids: Array.isArray(sprint.test_case_ids) ? sprint.test_case_ids : []
      }));
    },
    enabled: !!suiteId,
  });
}

// Fetch single sprint
export function useSprint(sprintId: string) {
  return useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', sprintId)
        .single();
      if (error) throw error;
      return {
        ...data,
        test_case_ids: Array.isArray(data.test_case_ids) ? data.test_case_ids : []
      };
    },
    enabled: !!sprintId,
  });
}

// Create sprint
export function useCreateSprint(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SprintFormData) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: sprint, error } = await supabase
        .from('sprints')
        .insert({
          suite_id: suiteId,
          created_by: user.id,
          name: data.name,
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status || 'planning',
          test_case_ids: data.test_case_ids || [],
        })
        .select()
        .single();
      if (error) throw error;
      return sprint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', suiteId] });
      toast.success('Sprint created successfully');
    },
    onError: (error: any) => {
      logger.log('Error creating sprint:', error);
      toast.error('Failed to create sprint');
    },
  });
}

// Update sprint
export function useUpdateSprint(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SprintFormData> }) => {
      const supabase = createClient();
      const { data: sprint, error } = await supabase
        .from('sprints')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return sprint;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['sprint', variables.id] });
      toast.success('Sprint updated successfully');
    },
    onError: (error: any) => {
      logger.log('Error updating sprint:', error);
      toast.error('Failed to update sprint');
    },
  });
}

// Delete sprint
export function useDeleteSprint(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('sprints').delete().eq('id', sprintId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', suiteId] });
      toast.success('Sprint deleted successfully');
    },
    onError: (error: any) => {
      logger.log('Error deleting sprint:', error);
      toast.error('Failed to delete sprint');
    },
  });
}

// Get sprint stats
export function useSprintStats(sprintId: string) {
  return useQuery({
    queryKey: ['sprint-stats', sprintId],
    queryFn: async () => {
      const supabase = createClient();
      const [testCases, bugs, suggestions] = await Promise.all([
        supabase.from('test_cases').select('id', { count: 'exact', head: true }).eq('sprint_id', sprintId),
        supabase.from('bugs').select('id', { count: 'exact', head: true }).eq('sprint_id', sprintId),
        supabase.from('suggestions').select('id', { count: 'exact', head: true }).eq('sprint_id', sprintId),
      ]);

      return {
        test_cases_count: testCases.count || 0,
        bugs_count: bugs.count || 0,
        suggestions_count: suggestions.count || 0,
      };
    },
    enabled: !!sprintId,
  });
}