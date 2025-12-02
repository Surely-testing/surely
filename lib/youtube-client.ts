// ============================================
// lib/youtube-client.ts
// Shared YouTube OAuth client configuration
// ============================================

import { google } from 'googleapis';

export const youtube = google.youtube('v3');

// Single OAuth2 client for the entire app
export const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/recordings/youtube/callback`
);

// Set the refresh token from environment (one-time setup)
if (process.env.YOUTUBE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });
}

// Helper function to get fresh access token
export async function getYouTubeAuth() {
  if (!process.env.YOUTUBE_REFRESH_TOKEN) {
    throw new Error('YouTube not configured. Please run setup.');
  }

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    return oauth2Client;
  } catch (error) {
    console.error('Error refreshing YouTube token:', error);
    throw new Error('Failed to authenticate with YouTube');
  }
}
