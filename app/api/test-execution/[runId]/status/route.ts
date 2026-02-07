// ============================================
// API Route: /api/test-execution/[runId]/status/route.ts
// FIXED: Await params Promise (Next.js 15+)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    // FIXED: Await params in Next.js 15+
    const { runId } = await params;

    if (!runId) {
      return NextResponse.json(
        { error: 'Run ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get test run details
    const { data: testRun, error: runError } = await supabase
      .from('test_runs')
      .select(`
        id,
        name,
        status,
        executed_at,
        completed_at,
        total_count,
        passed_count,
        failed_count,
        blocked_count,
        skipped_count,
        suite_id,
        environment
      `)
      .eq('id', runId)
      .single();

    if (runError) {
      console.error('Error fetching test run:', runError);
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }

    // Get all test case results for this run
    const { data: testCaseResults, error: resultsError } = await supabase
      .from('test_run_results')
      .select(`
        id,
        test_case_id,
        status,
        duration_seconds,
        executed_at,
        completed_at,
        notes,
        error_message,
        step_results,
        test_cases (
          id,
          title,
          description,
          priority
        )
      `)
      .eq('test_run_id', runId)
      .order('created_at', { ascending: true });

    if (resultsError) {
      console.error('Error fetching test results:', resultsError);
      // Don't fail completely, just return empty results
    }

    // Transform results to match frontend expectations
    const transformedResults = (testCaseResults || []).map((result: any) => ({
      id: result.id,
      testCaseId: result.test_case_id,
      status: result.status,
      duration: (result.duration_seconds || 0) * 1000, // Convert to ms
      startedAt: result.executed_at,
      completedAt: result.completed_at,
      error: result.error_message,
      stepResults: result.step_results || [],
      testCase: result.test_cases ? {
        id: result.test_cases.id,
        title: result.test_cases.title,
        description: result.test_cases.description,
        priority: result.test_cases.priority,
      } : null
    }));

    // Calculate execution progress
    const totalTests = testRun.total_count || transformedResults.length;
    const completedTests = transformedResults.filter((r: any) => 
      ['passed', 'failed', 'blocked', 'skipped'].includes(r.status)
    ).length;
    const progress = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

    return NextResponse.json({
      success: true,
      status: testRun.status,
      testRun: {
        id: testRun.id,
        name: testRun.name,
        status: testRun.status,
        executedAt: testRun.executed_at,
        completedAt: testRun.completed_at,
        environment: testRun.environment,
        stats: {
          total: testRun.total_count || 0,
          passed: testRun.passed_count || 0,
          failed: testRun.failed_count || 0,
          blocked: testRun.blocked_count || 0,
          skipped: testRun.skipped_count || 0,
          completed: completedTests,
          progress: Math.round(progress)
        }
      },
      testCaseResults: transformedResults,
    });

  } catch (error: any) {
    console.error('Test execution status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}