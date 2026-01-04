// ============================================
// FILE: lib/hooks/useTestRuns.ts
// React Query hooks for test runs - matches test cases pattern
// ============================================
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface TestRunFilters {
  status?: string[];
  environment?: string[];
  test_type?: string[];
  assigned_to?: string;
  search?: string;
}

interface TestRunFormData {
  name: string;
  description?: string;
  environment: 'development' | 'staging' | 'qa' | 'production';
  test_type?: 'manual' | 'automated' | 'exploratory' | 'regression' | 'smoke';
  assigned_to?: string | null;
  scheduled_date?: string | null;
  notes?: string | null;
  test_case_ids?: string[];
  sprint_ids?: string[];
  additional_case_ids?: string[];
}

export function useTestRuns(suiteId: string, filters?: TestRunFilters) {
  return useQuery({
    queryKey: ['test-runs', suiteId, filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('test_runs')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (filters?.status?.length) query = query.in('status', filters.status);
      if (filters?.environment?.length) query = query.in('environment', filters.environment);
      if (filters?.test_type?.length) query = query.in('test_type', filters.test_type);
      if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!suiteId,
  });
}

export function useTestRun(testRunId: string) {
  return useQuery({
    queryKey: ['test-run', testRunId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('test_runs')
        .select('*')
        .eq('id', testRunId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!testRunId,
  });
}

export function useCreateTestRun(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TestRunFormData) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: testRun, error } = await supabase
        .from('test_runs')
        .insert({
          suite_id: suiteId,
          created_by: user.id,
          name: data.name,
          description: data.description || null,
          environment: data.environment,
          test_type: data.test_type || 'manual',
          status: 'pending',
          assigned_to: data.assigned_to || null,
          scheduled_date: data.scheduled_date || null,
          notes: data.notes || null,
          test_case_ids: data.test_case_ids || [],
          total_count: data.test_case_ids?.length || 0,
          passed_count: 0,
          failed_count: 0,
          blocked_count: 0,
          skipped_count: 0,
          sprint_ids: data.sprint_ids || [],
          additional_case_ids: data.additional_case_ids || [],
        })
        .select()
        .single();
      if (error) throw error;
      return testRun;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-runs', suiteId] });
    },
  });
}

export function useUpdateTestRun(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TestRunFormData> }) => {
      const supabase = createClient();
      const { data: testRun, error } = await supabase
        .from('test_runs')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return testRun;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-runs', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['test-run', variables.id] });
    },
  });
}

export function useDeleteTestRun(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (testRunId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('test_runs').delete().eq('id', testRunId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-runs', suiteId] });
    },
  });
}

export function useTestRunStats(suiteId: string) {
  return useQuery({
    queryKey: ['test-run-stats', suiteId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('test_runs')
        .select('status, environment, test_type')
        .eq('suite_id', suiteId);
      if (error) throw error;

      const total = data.length;

      return {
        total,
        by_status: {
          pending: data.filter(tr => tr.status === 'pending').length,
          'in-progress': data.filter(tr => tr.status === 'in-progress').length,
          passed: data.filter(tr => tr.status === 'passed').length,
          failed: data.filter(tr => tr.status === 'failed').length,
          blocked: data.filter(tr => tr.status === 'blocked').length,
          skipped: data.filter(tr => tr.status === 'skipped').length,
        },
        by_environment: {
          development: data.filter(tr => tr.environment === 'development').length,
          staging: data.filter(tr => tr.environment === 'staging').length,
          qa: data.filter(tr => tr.environment === 'qa').length,
          production: data.filter(tr => tr.environment === 'production').length,
        },
        by_type: {
          manual: data.filter(tr => tr.test_type === 'manual').length,
          automated: data.filter(tr => tr.test_type === 'automated').length,
          exploratory: data.filter(tr => tr.test_type === 'exploratory').length,
          regression: data.filter(tr => tr.test_type === 'regression').length,
          smoke: data.filter(tr => tr.test_type === 'smoke').length,
        },
      };
    },
    enabled: !!suiteId,
  });
}