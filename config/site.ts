// ============================================
// FILE: config/site.ts
// ============================================
export const siteConfig = {
  name: 'Surely',
  description: 'AI-Powered Quality Assurance Platform - Transform your testing workflow with intelligent automation',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://surely.app',
  ogImage: process.env.NEXT_PUBLIC_CLOUDINARY_OG_IMAGE || '/og-image.png',
  logo: process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || '/logo.svg',
  links: {
    twitter: 'https://twitter.com/surely_app',
    github: 'https://github.com/surely-app',
    linkedin: 'https://linkedin.com/company/surely',
    email: 'mailto:contact@surely.app',
  },
  creator: {
    name: 'Surely Team',
    email: 'contact@surely.app',
  },
}

export type SiteConfig = typeof siteConfig