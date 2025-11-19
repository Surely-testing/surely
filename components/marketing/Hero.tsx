// ============================================
// FILE: components/marketing/Hero.tsx
// ============================================
'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Play, CheckCircle } from 'lucide-react'

const Hero = () => {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-br from-background to-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-card rounded-full px-4 py-2 mb-8 shadow-theme-sm border border-border">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-muted-foreground">
              AI-Powered QA Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="text-foreground block mb-2">
              Quality Assurance
            </span>
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your testing workflow with AI-powered automation, intelligent bug tracking, and real-time insights that accelerate your development cycle.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="h-5 w-5" />}
                className="shadow-glow-md hover:shadow-glow-lg"
              >
                Start Free Trial
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              leftIcon={<Play className="h-5 w-5" />}
            >
              Watch Demo
            </Button>
          </div>

          {/* Features List */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Hero }