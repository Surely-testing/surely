// ============================================
// API Route: /api/test-execution/[runId]/stop/route.ts
// FIXED: Await params Promise (Next.js 15+)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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

    // Verify test run exists and is running
    const { data: testRun, error: runError } = await supabase
      .from('test_runs')
      .select('id, status')
      .eq('id', runId)
      .single();

    if (runError || !testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }

    if (testRun.status !== 'in-progress') {
      return NextResponse.json(
        { error: 'Test run is not in progress' },
        { status: 400 }
      );
    }

    // Get current results to calculate final counts
    const { data: results } = await supabase
      .from('test_run_results')
      .select('status')
      .eq('test_run_id', runId);

    const passed = results?.filter(r => r.status === 'passed').length || 0;
    const failed = results?.filter(r => r.status === 'failed').length || 0;
    const blocked = results?.filter(r => r.status === 'blocked').length || 0;
    const skipped = results?.filter(r => r.status === 'skipped').length || 0;
    const pending = results?.filter(r => r.status === 'pending').length || 0;

    // Mark pending tests as skipped
    if (pending > 0) {
      await supabase
        .from('test_run_results')
        .update({ 
          status: 'skipped',
          notes: 'Execution stopped by user'
        })
        .eq('test_run_id', runId)
        .eq('status', 'pending');
    }

    // Update test run to stopped/blocked status
    const { error: updateError } = await supabase
      .from('test_runs')
      .update({
        status: 'blocked',
        completed_at: new Date().toISOString(),
        passed_count: passed,
        failed_count: failed,
        blocked_count: blocked,
        skipped_count: skipped + pending,
        notes: 'Execution stopped by user'
      })
      .eq('id', runId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Test execution stopped',
      stats: {
        passed,
        failed,
        blocked,
        skipped: skipped + pending
      }
    });

  } catch (error: any) {
    console.error('Test execution stop error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}