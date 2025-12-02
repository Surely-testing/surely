// ============================================
// app/api/recordings/youtube/setup/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/youtube-client';

/**
 * GET /api/recordings/youtube/setup
 * Admin-only route to set up YouTube OAuth (one-time)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if already set up
    if (process.env.YOUTUBE_REFRESH_TOKEN) {
      return NextResponse.json({
        message: 'YouTube is already configured',
        status: 'configured',
      });
    }

    // Generate auth URL for admin
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
      ],
      prompt: 'consent', // Force consent to get refresh token
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate setup' },
      { status: 500 }
    );
  }
}