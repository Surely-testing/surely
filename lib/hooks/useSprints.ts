// ============================================
// lib/hooks/useSprints.ts
// Fixed foreign key relationships
// ============================================

import { createClient } from "../supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
}

export function useSprints(suiteId: string, filters?: SprintFilters) {
  return useQuery({
    queryKey: ['sprints', suiteId, filters],
    queryFn: async () => {
      const supabase = createClient();
      // Simplified query without creator relationship to fix 400 error
      let query = supabase
        .from('sprints')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (filters?.status?.length) query = query.in('status', filters.status);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!suiteId,
  });
}

export function useSprint(sprintId: string) {
  return useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: async () => {
      const supabase = createClient();
      // Simplified query without creator relationship to fix 400 error
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', sprintId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sprintId,
  });
}

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
        })
        .select()
        .single();
      if (error) throw error;
      return sprint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', suiteId] });
    },
  });
}

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
    },
  });
}

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
    },
  });
}

export function useSprintStats(sprintId: string) {
  return useQuery({
    queryKey: ['sprint-stats', sprintId],
    queryFn: async () => {
      const supabase = createClient();
      // Sprintable assets: test cases, bugs, and suggestions (aka recommendations)
      const [testCases, bugs, suggestions] = await Promise.all([
        supabase.from('test_cases').select('id', { count: 'exact', head: true }).eq('sprint_id', sprintId),
        supabase.from('bugs').select('id', { count: 'exact', head: true }).eq('sprint_id', sprintId),
        supabase.from('suggestions').select('id', { count: 'exact', head: true }).eq('sprint_id', sprintId),
      ]);

      return {
        test_cases_count: testCases.count || 0,
        bugs_count: bugs.count || 0,
        suggestions_count: suggestions.count || 0, // Using suggestions as the actual table
      };
    },
    enabled: !!sprintId,
  });
}