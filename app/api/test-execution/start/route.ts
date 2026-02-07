// ============================================
// API Route: /api/test-execution/start/route.ts
// Starts test execution using existing TestExecutor
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TestExecutor } from '@/lib/test-executor/executor';
import { TestCaseAdapter } from '@/lib/test-executor/adapter';
import type { Environment } from '@/lib/test-executor/types';

export const maxDuration = 300; // 5 minutes max for Vercel

export async function POST(request: NextRequest) {
  try {
    // Use service role key for background execution
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { runId, testCaseIds, suiteId } = body;

    if (!runId || !testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: runId, testCaseIds (must be non-empty array)' },
        { status: 400 }
      );
    }

    if (!suiteId) {
      return NextResponse.json(
        { error: 'Missing required field: suiteId' },
        { status: 400 }
      );
    }

    // Verify test run exists
    const { data: testRun, error: runError } = await supabase
      .from('test_runs')
      .select('id, suite_id')
      .eq('id', runId)
      .single();

    if (runError || !testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }

    // Get default environment for the suite
    const { data: environment, error: envError } = await supabase
      .from('environments')
      .select('*')
      .eq('suite_id', suiteId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (envError || !environment) {
      return NextResponse.json(
        { error: 'No active default environment configured for this suite' },
        { status: 400 }
      );
    }

    // Get automated test cases only
    const { data: testCases, error: tcError } = await supabase
      .from('test_cases')
      .select('id, title, description, steps, expected_result, priority, status, is_automated')
      .in('id', testCaseIds)
      .eq('is_automated', true);

    if (tcError) {
      return NextResponse.json(
        { error: `Failed to fetch test cases: ${tcError.message}` },
        { status: 500 }
      );
    }

    if (!testCases || testCases.length === 0) {
      return NextResponse.json(
        { error: 'No automated test cases found with the provided IDs' },
        { status: 400 }
      );
    }

    // Update test run status to in-progress
    await supabase
      .from('test_runs')
      .update({ 
        status: 'in-progress',
        executed_at: new Date().toISOString()
      })
      .eq('id', runId);

    // Create initial test_run_results for tracking
    const initialResults = testCases.map(tc => ({
      test_run_id: runId,
      test_case_id: tc.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    }));

    await supabase
      .from('test_run_results')
      .insert(initialResults);

    // Execute tests in background (don't await)
    executeTestsAsync(testCases, environment, runId, supabase);

    return NextResponse.json({
      success: true,
      executionId: runId,
      testCaseCount: testCases.length,
      environment: environment.name,
      message: `Started execution of ${testCases.length} automated test(s)`
    });

  } catch (error: any) {
    console.error('Test execution start error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Execute tests asynchronously using TestExecutor
async function executeTestsAsync(
  dbTestCases: any[],
  dbEnvironment: any,
  runId: string,
  supabase: any
) {
  const executor = new TestExecutor();
  
  try {
    console.log(`🚀 [${runId}] Starting Playwright execution...`);
    
    // Convert database test cases to executor format
    const testCases = await TestCaseAdapter.toExecutorFormatBatch(dbTestCases, supabase);
    
    if (testCases.length === 0) {
      console.error(`❌ [${runId}] No valid test cases to execute`);
      await supabase
        .from('test_runs')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString(),
          notes: 'No valid automated test steps found'
        })
        .eq('id', runId);
      return;
    }

    // Convert database environment to executor format
    const environment: Environment = {
      id: dbEnvironment.id,
      name: dbEnvironment.name,
      type: dbEnvironment.type,
      base_url: dbEnvironment.base_url,
      viewport: dbEnvironment.viewport || { width: 1920, height: 1080 },
      headers: dbEnvironment.headers || {},
      credentials: dbEnvironment.credentials || {},
      variables: dbEnvironment.variables || {},
    };

    console.log(`📋 [${runId}] Executing ${testCases.length} test case(s)`);
    console.log(`🌍 [${runId}] Environment: ${environment.name} (${environment.base_url})`);

    // Execute tests with progress callback
    const results = await executor.executeTestCases(
      testCases,
      environment,
      async (current, total, result) => {
        console.log(`✅ [${runId}] Progress: ${current}/${total} - ${result.status}: ${result.testCaseId}`);
        
        // Update test_run_results immediately
        await supabase
          .from('test_run_results')
          .update({
            status: result.status,
            duration_seconds: Math.round(result.duration / 1000),
            executed_at: result.startTime,
            completed_at: result.endTime,
            notes: result.error ? `Error: ${result.error}` : result.logs.slice(-5).join('\n'),
            step_results: result.steps,
            error_message: result.error || null,
          })
          .eq('test_run_id', runId)
          .eq('test_case_id', result.testCaseId);

        // Update test case last_result
        await supabase
          .from('test_cases')
          .update({ 
            last_result: result.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', result.testCaseId);

        // Update test run counts as we go
        const { data: currentResults } = await supabase
          .from('test_run_results')
          .select('status')
          .eq('test_run_id', runId)
          .neq('status', 'pending');

        if (currentResults) {
          const passed = currentResults.filter((r: any) => r.status === 'passed').length;
          const failed = currentResults.filter((r: any) => r.status === 'failed').length;
          const blocked = currentResults.filter((r: any) => r.status === 'blocked').length;
          const skipped = currentResults.filter((r: any) => r.status === 'skipped').length;

          await supabase
            .from('test_runs')
            .update({
              passed_count: passed,
              failed_count: failed,
              blocked_count: blocked,
              skipped_count: skipped,
            })
            .eq('id', runId);
        }
      }
    );

    // Calculate final statistics
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const blocked = results.filter(r => r.status === 'blocked').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    // Determine final status
    const finalStatus = failed > 0 ? 'failed' : blocked > 0 ? 'blocked' : 'passed';
    
    // Update test run with final status
    await supabase
      .from('test_runs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        passed_count: passed,
        failed_count: failed,
        blocked_count: blocked,
        skipped_count: skipped,
        total_count: results.length,
      })
      .eq('id', runId);

    console.log(`✅ [${runId}] Test execution completed!`);
    console.log(`   Passed: ${passed}/${results.length}`);
    console.log(`   Failed: ${failed}/${results.length}`);
    console.log(`   Blocked: ${blocked}/${results.length}`);
    console.log(`   Skipped: ${skipped}/${results.length}`);

  } catch (error: any) {
    console.error(`❌ [${runId}] Fatal execution error:`, error);
    
    await supabase
      .from('test_runs')
      .update({ 
        status: 'failed',
        completed_at: new Date().toISOString(),
        notes: `Execution error: ${error.message}`
      })
      .eq('id', runId);
      
  } finally {
    await executor.cleanup();
    console.log(`🧹 [${runId}] Cleaned up browser resources`);
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to start execution.' },
    { status: 405 }
  );
}