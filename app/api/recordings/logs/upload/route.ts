// ============================================
// app/api/recordings/logs/upload/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/recordings/logs/upload
 * Upload console/network logs to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { suiteId, recordingId, logs, type } = body;

    if (!suiteId || !recordingId || !logs || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['console', 'network'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid log type. Must be "console" or "network"' },
        { status: 400 }
      );
    }

    // Verify user has access to suite
    const { data: suite, error: suiteError } = await supabase
      .from('test_suites')
      .select('owner_id, admins, members')
      .eq('id', suiteId)
      .single();

    if (suiteError || !suite) {
      return NextResponse.json(
        { error: 'Test suite not found' },
        { status: 404 }
      );
    }

    const hasAccess =
      suite.owner_id === user.id ||
      suite.admins?.includes(user.id) ||
      suite.members?.includes(user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create logs file
    const fileName = `${suiteId}/${recordingId}/${type}-logs.json`;
    const logsJson = JSON.stringify(logs, null, 2);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('recording-logs')
      .upload(fileName, logsJson, {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recording-logs')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: fileName,
    });

  } catch (error) {
    console.error('Log upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload logs' },
      { status: 500 }
    );
  }
}
