// ============================================
// FILE: components/marketing/CTA.tsx
// ============================================
'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const CTA = () => {
  return (
    <section className="py-20 bg-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-primary-foreground mb-8 leading-tight">
          Ready to transform your QA process?
        </h2>
        <p className="text-lg sm:text-xl text-primary-foreground/90 mb-12 max-w-2xl mx-auto">
          Join thousands of teams already using Surely to ship better software faster.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button
              variant="secondary"
              size="lg"
              className="shadow-theme-lg hover:shadow-theme-xl"
            >
              Start Free Trial
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="outline"
              size="lg"
              className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
            >
              Schedule Demo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export { CTA }