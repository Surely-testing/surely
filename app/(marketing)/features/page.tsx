'use client'

import React from 'react';
import { Zap, Shield, BarChart3, Clock, Users, Target, CheckCircle, Sparkles } from 'lucide-react';

const FeaturesPage = () => {
  const mainFeatures = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Automated Testing",
      description: "Run comprehensive test suites automatically on every code change. Catch bugs before they reach production with intelligent test scheduling.",
      benefits: [
        "Zero manual intervention required",
        "Schedule tests at optimal times",
        "Parallel test execution",
        "Smart retry mechanisms"
      ]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Quality Assurance",
      description: "Maintain high code quality with intelligent analysis and AI-powered suggestions that help your team write better, more reliable code.",
      benefits: [
        "Code quality metrics tracking",
        "Automated code reviews",
        "Best practice recommendations",
        "Technical debt monitoring"
      ]
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Real-time Analytics",
      description: "Get instant insights with beautiful, intuitive dashboards that show exactly what's happening with your tests and quality metrics.",
      benefits: [
        "Visual test result dashboards",
        "Trend analysis over time",
        "Team performance metrics",
        "Custom reporting tools"
      ]
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Continuous Testing",
      description: "Seamlessly integrate with your CI/CD pipeline for continuous quality monitoring throughout your entire development workflow.",
      benefits: [
        "GitHub, GitLab, Bitbucket support",
        "Jenkins & CircleCI integration",
        "Webhook notifications",
        "Automated deployment gates"
      ]
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team Collaboration",
      description: "Share test results, assign bugs, and collaborate with your team in real-time with built-in communication tools.",
      benefits: [
        "Real-time test result sharing",
        "Bug assignment & tracking",
        "Team chat integration",
        "Collaborative debugging"
      ]
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Smart Test Generation",
      description: "AI-powered test case generation that identifies critical paths, edge cases, and potential failure points automatically.",
      benefits: [
        "Automatic test case creation",
        "Edge case identification",
        "Critical path analysis",
        "Coverage gap detection"
      ]
    }
  ];

  const additionalFeatures = [
    "API Tester",
    "Workflow Optimizer",
    "Performance Benchmarker",
    "Test Result Analyzer"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:32px_32px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-800/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Powerful Features</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6">
              Everything you need for
              <span className="block text-primary">
                bulletproof testing
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-10 leading-relaxed">
              Ship with confidence using our comprehensive suite of testing and quality assurance tools
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/register'}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => window.location.href = '/contact'}
                className="px-8 py-3 bg-card border-2 border-border hover:border-primary text-foreground rounded-lg font-semibold transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-theme-xl"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Coming Soon
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Exciting new features currently in development to enhance your testing experience
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {additionalFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl px-6 py-5 hover:border-primary/50 transition-all hover:shadow-md relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-foreground font-medium">{feature}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-primary rounded-full">
                    Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Ready to transform your testing?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of teams already shipping better software with Assura
          </p>
          <button
            onClick={() => window.location.href = '/register'}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Free Trial - No Credit Card Required
          </button>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;