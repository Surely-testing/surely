// ============================================
// FILE: app/about/page.tsx
// ============================================
'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Target, Users, Zap, Shield, Heart, Award } from 'lucide-react'

const AboutPage = () => {
  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We believe in making quality assurance accessible to every team, regardless of size or budget.'
    },
    {
      icon: Users,
      title: 'Customer-Centric',
      description: 'Your success is our success. We listen, adapt, and evolve based on your feedback.'
    },
    {
      icon: Zap,
      title: 'Innovation First',
      description: 'We push boundaries with cutting-edge technology to deliver the best QA experience.'
    },
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'Your data security is paramount. We maintain the highest standards of protection.'
    },
    {
      icon: Heart,
      title: 'Empathy',
      description: 'We understand the challenges developers face and build solutions with care.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from code to customer support.'
    }
  ]

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Co-Founder',
      image: '/team/sarah.jpg',
      bio: 'Former VP of Engineering with 15+ years in software development'
    },
    {
      name: 'Michael Chen',
      role: 'CTO & Co-Founder',
      image: '/team/michael.jpg',
      bio: 'Ex-Google engineer passionate about developer tools and automation'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Product',
      image: '/team/emily.jpg',
      bio: 'Product leader with a track record of building beloved dev tools'
    },
    {
      name: 'David Park',
      role: 'Head of Engineering',
      image: '/team/david.jpg',
      bio: 'Full-stack architect specializing in scalable testing infrastructure'
    }
  ]

  const stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '2M+', label: 'Tests Run Monthly' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Mobile First */}
      <section className="relative overflow-hidden bg-primary py-12 sm:py-16 md:py-20 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-primary-light rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-cyan-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 sm:mb-6">
            Building the Future of QA
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-primary-foreground opacity-90 max-w-3xl mx-auto px-4">
            We're on a mission to make quality assurance faster, smarter, and more accessible for development teams worldwide.
          </p>
        </div>
      </section>

      {/* Stats Section - Mobile First */}
      <section className="py-8 sm:py-12 md:py-16 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 sm:mb-2">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section - Mobile First */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                Our Story
              </h2>
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg text-muted-foreground">
                <p>
                  Surely was born out of frustration. As developers ourselves, we spent countless hours writing and maintaining tests, dealing with flaky tests, and struggling with complex testing frameworks.
                </p>
                <p>
                  We knew there had to be a better way. In 2021, we set out to build the QA platform we wished existed—one that was powerful yet simple, intelligent yet reliable, and accessible to teams of all sizes.
                </p>
                <p>
                  Today, Surely helps thousands of teams ship better software faster. We're just getting started, and we're excited to have you join us on this journey.
                </p>
              </div>
            </div>
            <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-xl sm:rounded-2xl overflow-hidden bg-secondary border border-border shadow-theme-lg order-first lg:order-last">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-muted-foreground text-sm sm:text-base">Team Photo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Mobile First */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Our Values
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              These principles guide everything we do at Surely
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-lg sm:rounded-xl p-5 sm:p-6 md:p-8 shadow-theme hover:shadow-theme-md transition-all hover:-translate-y-1"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                    {value.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Section - Mobile First */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Meet the Team
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              The people behind Surely who are passionate about making QA better
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg sm:rounded-xl p-5 sm:p-6 shadow-theme hover:shadow-theme-lg transition-all hover:-translate-y-1 text-center"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-3 sm:mb-4 rounded-full bg-secondary border-2 border-primary overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
                    Photo
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-xs sm:text-sm text-primary font-medium mb-2 sm:mb-3">
                  {member.role}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile First */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 sm:mb-6 md:mb-8">
            Join Us on This Journey
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-primary-foreground opacity-90 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-4">
            Whether you're looking to improve your QA process or want to join our team, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto shadow-theme-lg hover:shadow-theme-xl px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base touch-manipulation active:scale-95"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:bg-opacity-10 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base touch-manipulation active:scale-95"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage