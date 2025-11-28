// ============================================
// app/api/recordings/status/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { youtube, getYouTubeAuth } from '@/lib/youtube-client';

/**
 * GET /api/recordings/status
 * Check if YouTube is configured (app-level)
 */
export async function GET(request: NextRequest) {
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

    const isConfigured = !!(
      process.env.YOUTUBE_CLIENT_ID &&
      process.env.YOUTUBE_CLIENT_SECRET &&
      process.env.YOUTUBE_REFRESH_TOKEN
    );

    let channelInfo = null;

    if (isConfigured) {
      try {
        const auth = await getYouTubeAuth();
        
        const response = await youtube.channels.list({
          auth,
          part: ['snippet'],
          mine: true,
        });

        const channel = response.data.items?.[0];
        if (channel) {
          channelInfo = {
            name: channel.snippet?.title,
            id: channel.id,
          };
        }
      } catch (error) {
        console.error('Error fetching channel info:', error);
        return NextResponse.json({
          configured: false,
          error: 'YouTube configuration invalid. Please reconfigure.',
        });
      }
    }

    return NextResponse.json({
      configured: isConfigured,
      channel: channelInfo,
      setupUrl: isConfigured ? null : '/api/recordings/youtube/setup',
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}