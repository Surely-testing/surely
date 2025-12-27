// ============================================
// FILE: components/marketing/Hero.tsx
// ============================================
'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Play, CheckCircle } from 'lucide-react'

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isRotating, setIsRotating] = useState(false)

   const images = [
    'https://res.cloudinary.com/lordefid/image/upload/v1766513233/21_2_sg0lze.png',
    'https://res.cloudinary.com/lordefid/image/upload/v1766512613/21_ul02zn.png',
    'https://res.cloudinary.com/lordefid/image/upload/v1766512932/22_2_geqzjm.png',
    'https://res.cloudinary.com/lordefid/image/upload/v1766512994/23_ifvk46.png',
  ]

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRotating(true)
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
        setIsRotating(false)
      }, 600)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative pt-32 pb-20 bg-gradient-to-br from-background to-muted overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left: Content */}
          <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-card rounded-full px-4 py-2 shadow-theme-sm border border-border">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-muted-foreground">
                AI-Powered QA Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
              <span className="text-foreground block mb-2">
                Quality Assurance
              </span>
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Transform your testing workflow with AI-powered automation, intelligent bug tracking, and real-time insights that accelerate your development cycle.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  className="shadow-glow-md hover:shadow-glow-lg group"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="group"
              >
                <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Features List */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              {[
                '14-day free trial',
                'No credit card required',
                'Cancel anytime',
              ].map((item) => (
                <div key={item} className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Image Section */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            {/* Floating background elements */}
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-primary opacity-20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Main image container */}
            <div className="relative group perspective-1000">
              <div className="absolute -inset-1 bg-gradient-primary rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
              
              <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                {/* Folding segments container */}
                <div className="relative w-full" style={{ height: 'auto' }}>
                  {[0, 1, 2, 3, 4].map((segment) => (
                    <div
                      key={segment}
                      className="fold-segment"
                      style={{
                        transform: isRotating 
                          ? `rotateY(${90 - segment * 18}deg)` 
                          : 'rotateY(0deg)',
                        transformOrigin: 'left',
                        transition: `transform 600ms ease-in-out ${segment * 100}ms`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        clipPath: `inset(${segment * 20}% 0 ${100 - (segment + 1) * 20}% 0)`,
                      }}
                    >
                      <img
                        src={images[currentImageIndex]}
                        alt="Product dashboard"
                        className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: 'auto',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                    </div>
                  ))}
                  
                  {/* Base image for height reference */}
                  <img
                    src={images[currentImageIndex]}
                    alt="Product dashboard"
                    className="w-full h-auto opacity-0"
                  />
                </div>
              </div>
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-8 -left-8 bg-card border border-border rounded-xl shadow-xl p-4 animate-float hidden sm:block">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">79.9%</p>
                  <p className="text-xs text-muted-foreground">Faster Release</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .perspective-1000 {
          perspective: 2000px;
        }

        .fold-segment {
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
      `}</style>
    </section>
  )
}

export { Hero }