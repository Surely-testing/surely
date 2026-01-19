'use client';

import React, { useState } from 'react';
import { Play, Video, MessageSquare, Bug, CheckCircle2, Clock, Users, Zap, ArrowRight, Chrome, Download, FileText, GitBranch, BarChart3, Shield } from 'lucide-react';

export default function DemoPage() {
  const [activeFeature, setActiveFeature] = useState('recording');
  
  const allFeatures = [
    {
      icon: Video,
      title: 'Screen Recording',
      description: 'Capture tests with audio, annotations, and auto-logs',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      icon: FileText,
      title: 'Test Documentation',
      description: 'Organize test cases, suites, and sprint planning',
      color: 'from-purple-500 to-pink-400'
    },
    {
      icon: GitBranch,
      title: 'Version Control',
      description: 'Track changes and collaborate with your team',
      color: 'from-green-500 to-emerald-400'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Insights into test coverage and bug trends',
      color: 'from-orange-500 to-amber-400'
    },
    {
      icon: Bug,
      title: 'Bug Tracking',
      description: 'Console logs, network requests captured automatically',
      color: 'from-red-500 to-rose-400'
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      description: 'Enterprise-grade security for sensitive data',
      color: 'from-indigo-500 to-blue-400'
    }
  ];

  const recordingFeatures = [
    'HD screen capture with audio',
    'Live annotation tools',
    'Auto-capture console & network logs',
    'DOM replay with rrweb',
    'Multi-tab support',
    'One-click bug reporting'
  ];

  const steps = [
    {
      number: '01',
      title: 'Plan Your Tests',
      description: 'Create test suites and organize by sprints',
      time: '1 minute'
    },
    {
      number: '02',
      title: 'Document Test Cases',
      description: 'Write test scenarios and expected outcomes',
      time: '5-10 minutes'
    },
    {
      number: '03',
      title: 'Execute & Record',
      description: 'Run tests and capture issues with screen recording',
      time: '2-5 minutes'
    },
    {
      number: '04',
      title: 'Track & Resolve',
      description: 'Review, assign, and monitor bug resolution',
      time: 'Ongoing'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Simplified */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-cyan-50 dark:from-blue-950/20 dark:via-background dark:to-cyan-950/20" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center mb-12">
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Experience Surely in Action
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              See how teams streamline their entire QA workflow - from test planning to bug tracking.
            </p>
          </div>

          {/* Main Demo Video - THIS IS THE FOCUS */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="relative rounded-2xl overflow-hidden shadow-theme-xl border border-border">
              <div className="aspect-video bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
                    <Play className="h-12 w-12 text-white ml-2" />
                  </div>
                  <p className="text-white text-2xl font-semibold mb-2">Watch the Complete Platform Tour</p>
                  <p className="text-white/90 text-lg">3 minutes • All features walkthrough</p>
                </div>
              </div>
              
              {/* Floating stats */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-4">
                <div className="flex-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <div className="text-2xl font-bold text-blue-600">85%</div>
                  <div className="text-xs text-muted-foreground">Faster QA</div>
                </div>
                <div className="flex-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <div className="text-2xl font-bold text-cyan-500">3 min</div>
                  <div className="text-xs text-muted-foreground">Avg. Setup</div>
                </div>
                <div className="flex-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <div className="text-2xl font-bold text-primary">15K+</div>
                  <div className="text-xs text-muted-foreground">Tests Run</div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary CTA - Try it yourself */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Ready to try the platform?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary px-8 py-4 text-base flex items-center justify-center gap-2 group">
                Start Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-lg border-2 border-border hover:border-primary transition-all duration-200 bg-background text-foreground font-semibold flex items-center justify-center gap-2">
                <Download className="h-5 w-5" />
                Get Extension
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Note: Screen recording requires browser extension and account login
            </p>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Complete QA Testing Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your testing workflow in one place
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {allFeatures.map((feature, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-6 hover:shadow-theme-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recording Feature Deep Dive */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
                  <Video className="h-4 w-4" />
                  Featured Capability
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Screen Recording with Superpowers
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Not just another screen recorder. Capture everything developers need to reproduce and fix bugs - automatically.
                </p>
                
                <div className="space-y-3 mb-8">
                  {recordingFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className="btn-primary px-6 py-3 flex items-center gap-2 group">
                  <Chrome className="h-5 w-5" />
                  Install Browser Extension
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-border flex items-center justify-center">
                  <div className="text-center p-8">
                    <Video className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <p className="text-foreground font-medium mb-2">Live Recording Demo</p>
                    <p className="text-muted-foreground text-sm">Interactive walkthrough of recording features</p>
                  </div>
                </div>
                
                {/* Floating feature cards */}
                <div className="absolute -right-4 top-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 border border-border max-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Bug className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-medium">Auto Logs</span>
                  </div>
                  <p className="text-xs text-muted-foreground">42 console errors captured</p>
                </div>
                
                <div className="absolute -left-4 bottom-12 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 border border-border max-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium">Live Annotation</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Draw & highlight on screen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Complete QA Testing Workflow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From test planning to bug resolution - not just recording
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-8">
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Connector Line */}
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-cyan-300 dark:from-blue-700 dark:to-cyan-700 -ml-4" />
                  )}
                  
                  <div className="relative bg-card border border-border rounded-xl p-6 hover:shadow-theme-md transition-all">
                    <div className="text-5xl font-bold text-blue-100 dark:text-blue-900/30 mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {step.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                      <Clock className="h-3 w-3" />
                      {step.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="grid sm:grid-cols-3 gap-8 mb-12">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">15,000+</div>
                <div className="text-muted-foreground">Tests Recorded</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-cyan-500 mb-2">600+</div>
                <div className="text-muted-foreground">Active Teams</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">4.8/5</div>
                <div className="text-muted-foreground">User Rating</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
              <Users className="h-5 w-5" />
              <span>Trusted by QA teams at startups and enterprises worldwide</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Streamline Your QA Process?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join hundreds of teams who've transformed their testing workflow with Surely
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 rounded-lg bg-white text-blue-600 font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 group shadow-xl">
                Start Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-200 backdrop-blur-sm">
                Schedule a Demo Call
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                3-minute setup
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Free forever plan
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}