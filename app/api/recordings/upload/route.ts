// ============================================
// app/api/recordings/upload/route.ts - SUPABASE VERSION
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// IMPORTANT: Configure body size limits
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase from default 1mb to 50mb
    },
  },
};

// For App Router (Next.js 13+), use maxDuration
export const maxDuration = 60; // 60 seconds timeout (adjust as needed)

/**
 * POST /api/recordings/upload
 * Upload video recording to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.log('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const suiteId = formData.get('suiteId') as string;

    if (!videoFile || !title || !suiteId) {
      return NextResponse.json(
        { error: 'Video file, title, and suite ID are required' },
        { status: 400 }
      );
    }

    // CHECK FILE SIZE (Add this validation)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (videoFile.size > maxSize) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB. Your file is ${(videoFile.size / 1024 / 1024).toFixed(2)}MB`,
          code: 'FILE_TOO_LARGE'
        },
        { status: 413 }
      );
    }

    logger.log('Upload request:', {
      fileName: videoFile.name,
      fileSize: `${(videoFile.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: videoFile.type,
      title,
      suiteId,
    });

    // Verify user has access to the suite
    const { data: suite, error: suiteError } = await supabase
      .from('test_suites')
      .select('id, name, owner_id, admins, members')
      .eq('id', suiteId)
      .single();

    if (suiteError || !suite) {
      logger.log('Suite error:', suiteError);
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
        { error: 'Access denied to this test suite' },
        { status: 403 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${suiteId}/${timestamp}-${randomId}.webm`;

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    logger.log('Uploading to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recordings') // Bucket name
      .upload(fileName, buffer, {
        contentType: 'video/webm',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      logger.log('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(fileName);

    const videoUrl = urlData.publicUrl;

    logger.log('Upload successful:', videoUrl);

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'recording_uploaded',
      resource_type: 'recording',
      metadata: {
        fileName,
        title,
        suiteId,
        suiteName: suite.name,
        fileSize: videoFile.size,
      },
    });

    return NextResponse.json({
      success: true,
      url: videoUrl,
      fileName,
      fileSize: videoFile.size,
    });

  } catch (error) {
    logger.log('Upload error:', error);

    if (error && typeof error === 'object') {
      const err = error as any;
      
      logger.log('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      
      if (err.message) {
        return NextResponse.json(
          { error: `Upload failed: ${err.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to save recording. Please try again.' },
      { status: 500 }
    );
  }
}