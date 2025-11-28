// ============================================
// app/api/recordings/upload/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { youtube, getYouTubeAuth } from '@/lib/youtube-client';

/**
 * POST /api/recordings/upload
 * Upload video recording to YouTube (App-level authentication)
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

    // Verify user has access to the suite
    const { data: suite, error: suiteError } = await supabase
      .from('test_suites')
      .select('id, name, owner_id, admins, members')
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
        { error: 'Access denied to this test suite' },
        { status: 403 }
      );
    }

    // Get authenticated YouTube client
    const auth = await getYouTubeAuth();

    // Convert File to Buffer
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get user's name for video description
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();

    // Enhanced description with metadata
    const enhancedDescription = `${description}

---
Test Suite: ${suite.name}
Recorded by: ${profile?.name || profile?.email || 'Unknown'}
Timestamp: ${new Date().toISOString()}
Test Management System Recording

${description ? '\n' + description : ''}`;

    // Upload to YouTube
    const response = await youtube.videos.insert({
      auth,
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: `[${suite.name}] ${title}`,
          description: enhancedDescription,
          categoryId: '28', // Science & Technology
          tags: ['test-recording', 'qa', 'testing', suite.name.toLowerCase()],
        },
        status: {
          privacyStatus: 'unlisted',
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: buffer,
      },
    });

    const videoId = response.data.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'recording_uploaded',
      resource_type: 'recording',
      metadata: {
        videoId,
        title,
        suiteId,
        suiteName: suite.name,
      },
    });

    return NextResponse.json({
      success: true,
      url: videoUrl,
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    });

  } catch (error) {
    console.error('YouTube upload error:', error);

    // Handle specific YouTube API errors
    if (error && typeof error === 'object' && 'code' in error) {
      const err = error as { code: number; message: string };
      
      if (err.code === 401) {
        return NextResponse.json(
          { error: 'YouTube authentication failed. Please contact administrator.' },
          { status: 500 }
        );
      }
      
      if (err.code === 403) {
        return NextResponse.json(
          { error: 'YouTube API quota exceeded. Please try again later.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to upload video to YouTube' },
      { status: 500 }
    );
  }
}