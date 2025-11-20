// ============================================
// FILE: app/not-found.tsx
// ============================================
'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 - Mobile First */}
        <div className="relative mb-6 sm:mb-8">
          <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold text-primary opacity-20 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-primary animate-ping absolute opacity-20"></div>
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-primary opacity-30 flex items-center justify-center">
                <svg
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Mobile First */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground px-4">
            Oops! Page not found
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-md mx-auto px-4">
            The page you're looking for seems to have wandered off. Let's get you back on track.
          </p>

          {/* Action buttons - Mobile First Stack */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6 px-4">
            <Link href="/" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base touch-manipulation active:scale-95"
              >
                Back to Home
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base border-border text-foreground hover:bg-secondary touch-manipulation active:scale-95"
              >
                Contact Support
              </Button>
            </Link>
          </div>

          {/* Helpful links - Mobile Optimized */}
          <div className="pt-8 sm:pt-12 border-t border-border mt-8 sm:mt-12 mx-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Or try one of these popular pages:
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center text-xs sm:text-sm">
              <Link
                href="/features"
                className="text-primary hover:text-primary-dark transition-colors touch-manipulation px-2 py-1"
              >
                Features
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/pricing"
                className="text-primary hover:text-primary-dark transition-colors touch-manipulation px-2 py-1"
              >
                Pricing
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/docs"
                className="text-primary hover:text-primary-dark transition-colors touch-manipulation px-2 py-1"
              >
                Documentation
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/blog"
                className="text-primary hover:text-primary-dark transition-colors touch-manipulation px-2 py-1"
              >
                Blog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound