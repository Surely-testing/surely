// ============================================
// API Route: /app/api/test-execution/live/route.ts
// Uses EXISTING TestExecutor - No simulation!
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TestExecutor } from '@/lib/test-executor/executor';
import { TestCaseAdapter } from '@/lib/test-executor/adapter';
import type { Environment } from '@/lib/test-executor/types';

export async function POST(request: NextRequest) {
  try {
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

    if (!runId || !testCaseIds || !Array.isArray(testCaseIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: runId, testCaseIds' },
        { status: 400 }
      );
    }

    // Update test run status
    await supabase
      .from('test_runs')
      .update({ 
        status: 'in-progress',
        executed_at: new Date().toISOString()
      })
      .eq('id', runId);

    // Get test cases
    const { data: testCases, error: tcError } = await supabase
      .from('test_cases')
      .select('id, title, description, steps, expected_result, priority, status')
      .in('id', testCaseIds);

    if (tcError || !testCases || testCases.length === 0) {
      return NextResponse.json(
        { error: 'No test cases found' },
        { status: 400 }
      );
    }

    // Get environment
    const { data: environment, error: envError } = await supabase
      .from('environments')
      .select('*')
      .eq('suite_id', suiteId)
      .eq('is_default', true)
      .single();

    if (envError || !environment) {
      return NextResponse.json(
        { error: 'No default environment configured' },
        { status: 400 }
      );
    }

    // Execute tests asynchronously using REAL TestExecutor
    executeTestsWithRealPlaywright(testCases, environment, runId, supabase);

    return NextResponse.json({
      success: true,
      runId,
      testCaseCount: testCases.length,
      message: 'Test execution started'
    });

  } catch (error: any) {
    console.error('Test execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Execute tests using the EXISTING TestExecutor
async function executeTestsWithRealPlaywright(
  dbTestCases: any[],
  dbEnvironment: any,
  runId: string,
  supabase: any
) {
  const executor = new TestExecutor();
  
  try {
    console.log('🚀 Starting REAL Playwright execution...');
    
    // Convert database test cases to executor format
    const testCases = await TestCaseAdapter.toExecutorFormatBatch(dbTestCases, supabase);
    
    if (testCases.length === 0) {
      console.error('No valid test cases to execute');
      await supabase
        .from('test_runs')
        .update({ status: 'failed' })
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

    console.log(`📋 Executing ${testCases.length} test case(s)`);
    console.log(`🌍 Environment: ${environment.name} (${environment.base_url})`);

    // Execute tests with progress callback
    const results = await executor.executeTestCases(
      testCases,
      environment,
      async (current, total, result) => {
        console.log(`✅ Progress: ${current}/${total} - ${result.status}: ${result.testCaseId}`);
        
        // Save result to database immediately
        await supabase
          .from('test_run_results')
          .upsert({
            test_run_id: runId,
            test_case_id: result.testCaseId,
            status: result.status,
            duration_seconds: Math.round(result.duration / 1000),
            executed_at: result.startTime,
            notes: result.error || result.logs.join('\n'),
            step_results: result.steps,
            screenshots: result.screenshots,
          }, {
            onConflict: 'test_run_id,test_case_id'
          });

        // Update test case last_result
        await supabase
          .from('test_cases')
          .update({ last_result: result.status })
          .eq('id', result.testCaseId);
      }
    );

    // Calculate final statistics
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const blocked = results.filter(r => r.status === 'blocked').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    // Update test run with final status
    const finalStatus = failed > 0 ? 'failed' : blocked > 0 ? 'blocked' : 'passed';
    
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

    console.log('✅ Test execution completed!');
    console.log(`   Passed: ${passed}/${results.length}`);
    console.log(`   Failed: ${failed}/${results.length}`);
    console.log(`   Blocked: ${blocked}/${results.length}`);
    console.log(`   Skipped: ${skipped}/${results.length}`);

  } catch (error: any) {
    console.error('❌ Fatal execution error:', error);
    
    await supabase
      .from('test_runs')
      .update({ 
        status: 'failed',
        notes: `Execution error: ${error.message}`
      })
      .eq('id', runId);
      
  } finally {
    await executor.cleanup();
    console.log('🧹 Cleaned up browser resources');
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}