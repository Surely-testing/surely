// ============================================
// FILE: lib/hooks/useTestRuns.ts
// React Query hooks for test runs management
// ============================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/providers/SupabaseProvider';
import { toast } from 'sonner';

// ============================================
// Fetch Test Runs
// ============================================
export function useTestRuns(suiteId: string) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ['test-runs', suiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_runs')
        .select(`
          *,
          test_run_results (
            id,
            status,
            test_case_id
          )
        `)
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!suiteId,
  });
}

// ============================================
// Fetch Single Test Run
// ============================================
export function useTestRun(testRunId: string) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ['test-run', testRunId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_runs')
        .select(`
          *,
          test_run_results (
            *,
            test_case:test_cases (
              id,
              title,
              priority
            )
          )
        `)
        .eq('id', testRunId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!testRunId,
  });
}

// ============================================
// Create Test Run
// ============================================
export function useCreateTestRun(suiteId: string) {
  const { supabase, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      environment: string;
      test_type?: string;
      assigned_to?: string;
      scheduled_date?: string;
      notes?: string;
      test_case_ids: string[];
      sprint_id?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Create the test run
      const { data: testRun, error: runError } = await supabase
        .from('test_runs')
        .insert({
          suite_id: suiteId,
          name: data.name,
          description: data.description || null,
          environment: data.environment,
          test_type: data.test_type || 'manual',
          assigned_to: data.assigned_to || null,
          scheduled_date: data.scheduled_date || null,
          notes: data.notes || null,
          test_case_ids: data.test_case_ids,
          sprint_id: data.sprint_id || null,
          status: 'pending',
          total_count: data.test_case_ids.length,
          created_by: user.id,
        })
        .select()
        .single();

      if (runError) throw runError;

      // Create test run results for each test case
      const results = data.test_case_ids.map((testCaseId) => ({
        test_run_id: testRun.id,
        test_case_id: testCaseId,
        status: 'pending',
      }));

      const { error: resultsError } = await supabase
        .from('test_run_results')
        .insert(results);

      if (resultsError) throw resultsError;

      return testRun;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-runs', suiteId] });
      toast.success('Test run created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating test run:', error);
      toast.error('Failed to create test run');
    },
  });
}

// ============================================
// Update Test Run
// ============================================
export function useUpdateTestRun(suiteId: string) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        description: string;
        environment: string;
        test_type: string;
        status: string;
        assigned_to: string;
        scheduled_date: string;
        notes: string;
        test_case_ids: string[];
      }>;
    }) => {
      const { data: updated, error } = await supabase
        .from('test_runs')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If test_case_ids changed, update results
      if (data.test_case_ids) {
        // Get existing results
        const { data: existingResults } = await supabase
          .from('test_run_results')
          .select('test_case_id')
          .eq('test_run_id', id);

        const existingIds = existingResults?.map((r) => r.test_case_id) || [];
        const newIds = data.test_case_ids;

        // Delete removed test cases
        const toRemove = existingIds.filter((id) => !newIds.includes(id));
        if (toRemove.length > 0) {
          await supabase
            .from('test_run_results')
            .delete()
            .eq('test_run_id', id)
            .in('test_case_id', toRemove);
        }

        // Add new test cases
        const toAdd = newIds.filter((id) => !existingIds.includes(id));
        if (toAdd.length > 0) {
          const newResults = toAdd.map((testCaseId) => ({
            test_run_id: id,
            test_case_id: testCaseId,
            status: 'pending',
          }));
          await supabase.from('test_run_results').insert(newResults);
        }
      }

      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-runs', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['test-run', variables.id] });
      toast.success('Test run updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating test run:', error);
      toast.error('Failed to update test run');
    },
  });
}

// ============================================
// Delete Test Run
// ============================================
export function useDeleteTestRun(suiteId: string) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('test_runs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-runs', suiteId] });
      toast.success('Test run deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting test run:', error);
      toast.error('Failed to delete test run');
    },
  });
}

// ============================================
// Update Test Run Result
// ============================================
export function useUpdateTestRunResult(testRunId: string) {
  const { supabase, user } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resultId,
      status,
      actualResult,
      notes,
      bugId,
    }: {
      resultId: string;
      status: 'passed' | 'failed' | 'blocked' | 'skipped';
      actualResult?: string;
      notes?: string;
      bugId?: string;
    }) => {
      const { data, error } = await supabase
        .from('test_run_results')
        .update({
          status,
          actual_result: actualResult,
          notes,
          bug_id: bugId,
          executed_by: user?.id,
          executed_at: new Date().toISOString(),
        })
        .eq('id', resultId)
        .select()
        .single();

      if (error) throw error;

      // Check if all results are completed and update test run status
      const { data: allResults } = await supabase
        .from('test_run_results')
        .select('status')
        .eq('test_run_id', testRunId);

      const allCompleted = allResults?.every(
        (r) => r.status !== 'pending' && r.status !== 'in-progress'
      );

      if (allCompleted) {
        const hasFailed = allResults?.some((r) => r.status === 'failed');
        const newStatus = hasFailed ? 'failed' : 'passed';

        await supabase
          .from('test_runs')
          .update({
            status: newStatus,
            completed_at: new Date().toISOString(),
          })
          .eq('id', testRunId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-run', testRunId] });
      toast.success('Test result updated');
    },
    onError: (error: any) => {
      console.error('Error updating test result:', error);
      toast.error('Failed to update test result');
    },
  });
}

// ============================================
// Execute Test Run (start execution)
// ============================================
export function useExecuteTestRun() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testRunId: string) => {
      const { data, error } = await supabase
        .from('test_runs')
        .update({
          status: 'in-progress',
          executed_at: new Date().toISOString(),
        })
        .eq('id', testRunId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['test-runs'] });
      queryClient.invalidateQueries({ queryKey: ['test-run', data.id] });
      toast.success('Test run started');
    },
    onError: (error: any) => {
      console.error('Error executing test run:', error);
      toast.error('Failed to start test run');
    },
  });
}