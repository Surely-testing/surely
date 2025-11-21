// ============================================
// lib/hooks/useTestCases.ts
// ============================================
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface TestCaseFilters {
  status?: string[];
  priority?: string[];
  sprint_id?: string | null;
  created_by?: string;
  search?: string;
}

interface TestCaseFormData {
  title: string;
  description?: string;
  steps?: any[];
  expected_result?: string;
  priority?: string;
  sprint_id?: string | null;
}

export function useTestCases(suiteId: string, filters?: TestCaseFilters) {
  return useQuery({
    queryKey: ['test-cases', suiteId, filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('test_cases')
        .select('*, creator:created_by(id, name, avatar_url)')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (filters?.status?.length) query = query.in('status', filters.status);
      if (filters?.priority?.length) query = query.in('priority', filters.priority);
      if (filters?.sprint_id) query = query.eq('sprint_id', filters.sprint_id);
      if (filters?.created_by) query = query.eq('created_by', filters.created_by);
      if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!suiteId,
  });
}

export function useTestCase(testCaseId: string) {
  return useQuery({
    queryKey: ['test-case', testCaseId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('test_cases')
        .select('*, creator:created_by(id, name, avatar_url)')
        .eq('id', testCaseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!testCaseId,
  });
}

export function useCreateTestCase(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TestCaseFormData) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: testCase, error } = await supabase
        .from('test_cases')
        .insert({
          suite_id: suiteId,
          created_by: user.id,
          title: data.title,
          description: data.description,
          steps: data.steps || [],
          expected_result: data.expected_result,
          priority: data.priority || 'medium',
          sprint_id: data.sprint_id,
        })
        .select()
        .single();
      if (error) throw error;
      return testCase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases', suiteId] });
    },
  });
}

export function useUpdateTestCase(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TestCaseFormData> }) => {
      const supabase = createClient();
      const { data: testCase, error } = await supabase
        .from('test_cases')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return testCase;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-cases', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['test-case', variables.id] });
    },
  });
}

export function useDeleteTestCase(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (testCaseId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('test_cases').delete().eq('id', testCaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-cases', suiteId] });
    },
  });
}

export function useTestCaseStats(suiteId: string) {
  return useQuery({
    queryKey: ['test-case-stats', suiteId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('test_cases')
        .select('priority, status, sprint_id')
        .eq('suite_id', suiteId);
      if (error) throw error;

      return {
        total: data.length,
        by_priority: {
          low: data.filter(tc => tc.priority === 'low').length,
          medium: data.filter(tc => tc.priority === 'medium').length,
          high: data.filter(tc => tc.priority === 'high').length,
          critical: data.filter(tc => tc.priority === 'critical').length,
        },
        by_status: {
          active: data.filter(tc => tc.status === 'active').length,
          archived: data.filter(tc => tc.status === 'archived').length,
          deleted: data.filter(tc => tc.status === 'deleted').length,
        },
        by_sprint: data.reduce((acc, tc) => {
          const sprintId = tc.sprint_id || 'unassigned';
          acc[sprintId] = (acc[sprintId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    },
    enabled: !!suiteId,
  });
}