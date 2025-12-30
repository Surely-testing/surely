// app/api/recordings/upload/route.ts
// API endpoint to receive recording from extension and save to Supabase

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      testSuiteId,
      accountId,
      sprintId,
      title,
      description,
      videoData, // base64 data URL
      duration,
      metadata
    } = body;

    // Validate required fields
    if (!testSuiteId || !accountId || !title || !videoData || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[API] Received recording upload request');
    console.log('[API] Test Suite:', testSuiteId);
    console.log('[API] Duration:', duration);

    // Convert base64 data URL to buffer
    const base64Data = videoData.split(',')[1];
    const videoBuffer = Buffer.from(base64Data, 'base64');
    
    console.log('[API] Video size:', (videoBuffer.length / 1024 / 1024).toFixed(2), 'MB');

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `recordings/${accountId}/${testSuiteId}/${timestamp}.webm`;

    // Upload video to Supabase Storage
    console.log('[API] Uploading to storage:', filename);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(filename, videoBuffer, {
        contentType: 'video/webm',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[API] Upload error:', uploadError);
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }

    console.log('[API] Upload successful');

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(filename);

    const videoUrl = urlData.publicUrl;

    // Save recording metadata to database
    console.log('[API] Saving to database');
    
    const { data: recording, error: dbError } = await supabase
      .from('recordings')
      .insert({
        test_suite_id: testSuiteId,
        account_id: accountId,
        sprint_id: sprintId,
        title: title,
        description: description || null,
        video_url: videoUrl,
        video_path: filename,
        duration: duration,
        status: 'completed',
        metadata: {
          timestamp: metadata.timestamp,
          resolution: metadata.resolution,
          browser: metadata.browser,
          os: metadata.os,
          console_logs: metadata.consoleLogs || [],
          network_logs: metadata.networkLogs || [],
          annotations: metadata.annotations || [],
          websocket_connections: metadata.websocketConnections || []
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('[API] Database error:', dbError);
      
      // Try to clean up uploaded file
      await supabase.storage
        .from('recordings')
        .remove([filename]);
      
      throw new Error(`Failed to save recording: ${dbError.message}`);
    }

    console.log('[API] Recording saved successfully:', recording.id);

    return NextResponse.json({
      success: true,
      recordingId: recording.id,
      videoUrl: videoUrl
    });

  } catch (error) {
    console.error('[API] Error processing recording:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process recording'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}