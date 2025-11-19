// ============================================
// FILE: components/marketing/Features.tsx
// ============================================
import React from 'react'
import { FileText, Bug, BarChart3, Zap, Shield, Rocket } from 'lucide-react'

const Features = () => {
  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Smart Test Management',
      description: 'AI-powered test case creation and organization with intelligent coverage analysis that adapts to your workflow.',
    },
    {
      icon: <Bug className="h-6 w-6" />,
      title: 'Advanced Bug Tracking',
      description: 'Capture, categorize, and resolve issues with automated workflows and visual debugging tools.',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Real-time Analytics',
      description: 'Live dashboards with predictive insights and performance metrics that drive decision-making.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'AI Test Generation',
      description: 'Automatically generate comprehensive test suites from requirements and user stories using advanced AI.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Screen Recording Pro',
      description: 'Capture bugs with complete context including network logs, console errors, and user interactions.',
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: 'Sprint Management',
      description: 'Organize testing efforts into sprints with burndown charts and velocity tracking.',
    },
  ]

  return (
    <section id="features" className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card rounded-full px-4 py-2 mb-8 shadow-theme-sm border border-border">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Features</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
            Everything you need <br className="hidden sm:block" />
            for quality assurance
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced tools that adapt to your team&apos;s needs and scale with your growth
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-theme-lg h-full">
                <div className="inline-flex p-3 bg-muted rounded-xl text-muted-foreground mb-6 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-primary transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { Features }