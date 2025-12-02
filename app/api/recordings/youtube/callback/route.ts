// ============================================
// app/api/recordings/youtube/callback/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { youtube, oauth2Client } from '@/lib/youtube-client';

/**
 * GET /api/recordings/youtube/callback
 * Handle OAuth callback and display refresh token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { error: `OAuth error: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get channel info
    oauth2Client.setCredentials(tokens);
    const channelResponse = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet'],
      mine: true,
    });

    const channel = channelResponse.data.items?.[0];

    // Return HTML page with instructions
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>YouTube Setup Complete</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              line-height: 1.6;
            }
            .token-box {
              background: #f5f5f5;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              overflow-x: auto;
            }
            .token {
              font-family: monospace;
              font-size: 14px;
              word-break: break-all;
              background: white;
              padding: 15px;
              border-radius: 4px;
              border: 1px solid #e0e0e0;
            }
            .success {
              color: #28a745;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            code {
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="success">✓ YouTube Setup Complete!</div>
          
          <p><strong>Connected Channel:</strong> ${channel?.snippet?.title || 'Unknown'}</p>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> Keep this refresh token secure. It will be used by the application to upload videos.
          </div>

          <h3>Next Steps:</h3>
          <ol>
            <li>Copy the refresh token below</li>
            <li>Add it to your <code>.env.local</code> file</li>
            <li>Restart your application</li>
          </ol>

          <div class="token-box">
            <h4>Add this to .env.local:</h4>
            <div class="token">YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}</div>
          </div>

          <div class="token-box">
            <h4>Complete .env.local configuration:</h4>
            <div class="token">
YOUTUBE_CLIENT_ID=${process.env.YOUTUBE_CLIENT_ID}<br>
YOUTUBE_CLIENT_SECRET=${process.env.YOUTUBE_CLIENT_SECRET}<br>
YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}
            </div>
          </div>

          <p>After adding the refresh token to your environment variables and restarting the app, all users will be able to upload recordings to this YouTube channel automatically.</p>

          <p><a href="/dashboard/settings">Go to Settings</a></p>
        </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { error: 'Failed to complete setup' },
      { status: 500 }
    );
  }
}
