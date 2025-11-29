// ============================================
// next.config.js - Fixed merged configuration
// ============================================

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  serverActions: {
    bodySizeLimit: '50mb', // For large video uploads
  },
}

module.exports = nextConfig

// ============================================
// Alternative: Using domains (legacy)
// ============================================

// If you're using an older Next.js version (before 12.3.0),
// use this format instead:

/*
const nextConfig = {
  images: {
    domains: [
      'img.youtube.com',
      'i.ytimg.com',
      'lh3.googleusercontent.com',
      'your-project.supabase.co', // Replace with your actual Supabase project URL
    ],
  },
}

module.exports = nextConfig
*/

// ============================================
// TypeScript version (next.config.ts)
// ============================================

/*
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
*/