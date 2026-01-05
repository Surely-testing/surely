// ============================================
// FILE: lib/hooks/useTestExecutionStats.ts
// NEW: Hook to fetch real test execution statistics
// ============================================

import { useState, useEffect } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { logger } from '@/lib/utils/logger';

interface TestExecutionStats {
  total_tests: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  pending: number;
  pass_rate: number;
  execution_rate: number;
}

export function useTestExecutionStats(suiteId: string) {
  const { supabase } = useSupabase();
  const [data, setData] = useState<TestExecutionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all test runs for this suite
      const { data: testRuns, error: runsError } = await supabase
        .from('test_runs')
        .select('id')
        .eq('suite_id', suiteId);

      if (runsError) throw runsError;

      if (!testRuns || testRuns.length === 0) {
        setData({
          total_tests: 0,
          passed: 0,
          failed: 0,
          blocked: 0,
          skipped: 0,
          pending: 0,
          pass_rate: 0,
          execution_rate: 0
        });
        return;
      }

      const testRunIds = testRuns.map(run => run.id);

      // Get all test results for these test runs
      const { data: results, error: resultsError } = await supabase
        .from('test_run_results')
        .select('status')
        .in('test_run_id', testRunIds);

      if (resultsError) throw resultsError;

      // Calculate statistics
      const passed = results?.filter(r => r.status === 'passed').length || 0;
      const failed = results?.filter(r => r.status === 'failed').length || 0;
      const blocked = results?.filter(r => r.status === 'blocked').length || 0;
      const skipped = results?.filter(r => r.status === 'skipped').length || 0;
      const pending = results?.filter(r => r.status === 'pending').length || 0;
      const total_tests = results?.length || 0;

      const executed = passed + failed + blocked + skipped;
      const pass_rate = total_tests > 0 ? (passed / total_tests) * 100 : 0;
      const execution_rate = total_tests > 0 ? (executed / total_tests) * 100 : 0;

      setData({
        total_tests,
        passed,
        failed,
        blocked,
        skipped,
        pending,
        pass_rate: Math.round(pass_rate * 10) / 10,
        execution_rate: Math.round(execution_rate * 10) / 10
      });

    } catch (err) {
      logger.log('Error fetching test execution stats:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (suiteId) {
      fetchStats();
    }
  }, [suiteId]);

  return { 
    data, 
    isLoading, 
    error,
    refetch: fetchStats 
  };
}