// ============================================
// 4. app/api/test-execution/trigger/route.ts
// ============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TestExecutor } from '@/lib/test-executor/executor';
import { TestCaseAdapter } from '@/lib/test-executor/adapter';
import type { Database } from '@/types/database.types';

type TestCaseRow = Database['public']['Tables']['test_cases']['Row'];
type EnvironmentRow = Database['public']['Tables']['environments']['Row'];

export async function POST(request: NextRequest) {
  try {
    const { runId, testCaseIds, environment, suiteId } = await request.json();

    const supabase = await createClient();

    const { data: dbTestCases, error: testCasesError } = await supabase
      .from('test_cases')
      .select('id, title, description, steps, expected_result, priority, status')
      .in('id', testCaseIds);

    if (testCasesError) throw testCasesError;
    if (!dbTestCases || dbTestCases.length === 0) {
      throw new Error('No test cases found');
    }

    const testCases = await TestCaseAdapter.toExecutorFormatBatch(
      dbTestCases as any[],
      supabase
    );

    if (testCases.length === 0) {
      throw new Error('No valid test cases with steps found');
    }

    const { data: envConfig, error: envError } = await supabase
      .from('environments')
      .select('*')
      .eq('suite_id', suiteId)
      .eq('type', environment)
      .single();

    let environmentConfig: any;

    if (envError || !envConfig) {
      environmentConfig = {
        id: environment,
        name: environment,
        type: environment,
        base_url: getBaseUrlForEnvironment(environment),
        viewport: { width: 1920, height: 1080 },
        headers: {},
        credentials: {},
      };
    } else {
      environmentConfig = {
        id: envConfig.id,
        name: envConfig.name,
        type: envConfig.type,
        base_url: envConfig.base_url,
        viewport: envConfig.viewport as any || { width: 1920, height: 1080 },
        headers: envConfig.headers as any || {},
        credentials: envConfig.credentials as any || {},
      };
    }

    await supabase
      .from('test_runs')
      .update({ 
        status: 'in-progress',
        executed_at: new Date().toISOString() 
      })
      .eq('id', runId);

    executeTestsInBackground(runId, testCases, environmentConfig, supabase);

    return NextResponse.json({
      success: true,
      runId,
      testCasesCount: testCases.length,
      message: 'Test execution started'
    });

  } catch (error: any) {
    console.error('Test execution trigger error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getBaseUrlForEnvironment(environment: string): string {
  const urls: Record<string, string> = {
    'development': 'http://localhost:3000',
    'staging': 'https://staging.example.com',
    'qa': 'https://qa.example.com',
    'production': 'https://example.com',
  };
  return urls[environment] || 'http://localhost:3000';
}

async function executeTestsInBackground(
  runId: string,
  testCases: any[],
  environment: any,
  supabase: any
) {
  const executor = new TestExecutor();

  try {
    const resultEntries = testCases.map(tc => ({
      test_run_id: runId,
      test_case_id: tc.id,
      status: 'pending' as const,
    }));

    await supabase.from('test_run_results').insert(resultEntries);

    const results = await executor.executeTestCases(
      testCases,
      environment,
      async (index, total, result) => {
        await supabase
          .from('test_run_results')
          .update({
            status: result.status,
            executed_at: new Date().toISOString(),
            duration_seconds: Math.floor(result.duration / 1000),
            actual_result: result.error || `Completed with ${result.steps.filter(s => s.status === 'passed').length}/${result.steps.length} steps passed`,
            screenshots: result.screenshots.map((s, i) => ({ 
              step: i + 1,
              data: s,
              timestamp: new Date().toISOString()
            })),
            notes: result.logs.slice(-20).join('\n'),
          })
          .eq('test_run_id', runId)
          .eq('test_case_id', result.testCaseId);

        const { data: runResults } = await supabase
          .from('test_run_results')
          .select('status')
          .eq('test_run_id', runId);

        if (runResults) {
          const counts = {
            passed: runResults.filter((r: any) => r.status === 'passed').length,
            failed: runResults.filter((r: any) => r.status === 'failed').length,
            blocked: runResults.filter((r: any) => r.status === 'blocked').length,
            skipped: runResults.filter((r: any) => r.status === 'skipped').length,
          };

          await supabase
            .from('test_runs')
            .update({
              passed_count: counts.passed,
              failed_count: counts.failed,
              blocked_count: counts.blocked,
              skipped_count: counts.skipped,
              total_count: runResults.length,
            })
            .eq('id', runId);
        }
      }
    );

    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const blocked = results.filter(r => r.status === 'blocked').length;

    let finalStatus = 'passed';
    if (failed > 0) finalStatus = 'failed';
    else if (blocked > 0) finalStatus = 'blocked';

    await supabase
      .from('test_runs')
      .update({
        status: finalStatus,
        passed_count: passed,
        failed_count: failed,
        blocked_count: blocked,
        total_count: results.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

  } catch (error: any) {
    console.error('Background execution error:', error);
    
    await supabase
      .from('test_runs')
      .update({
        status: 'failed',
        notes: `Execution error: ${error.message}`,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
  }
}