// ============================================
// next.config.ts - Fixed configuration
// ============================================

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // YouTube thumbnails
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      // Supabase Storage
      {
        protocol: 'https',
        hostname: 'qtfzqbzapciwdwwrfsla.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Optional: Google User Content for avatars
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // For large video uploads
    },
  },
}

export default nextConfig