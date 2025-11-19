
// ============================================
// FILE: components/marketing/Pricing.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: 'Starter',
      price: { monthly: 29, yearly: 290 },
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 5 test suites',
        '50 test cases per suite',
        'Basic analytics',
        'Email support',
        'Team collaboration',
      ],
      recommended: false,
    },
    {
      name: 'Professional',
      price: { monthly: 79, yearly: 790 },
      description: 'Best for growing teams and businesses',
      features: [
        'Unlimited test suites',
        '500 test cases per suite',
        'Advanced AI features',
        'Priority support',
        'API access',
        'Custom integrations',
      ],
      recommended: true,
    },
    {
      name: 'Enterprise',
      price: { monthly: null, yearly: null },
      description: 'Tailored solutions for large organizations',
      features: [
        'Unlimited everything',
        'Dedicated support',
        'Custom workflows',
        'SLA guarantees',
        'Training & onboarding',
        'White-label options',
      ],
      recommended: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-muted rounded-full px-4 py-2 mb-8 border border-border">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Pricing</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Choose your plan
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Transparent pricing that grows with your team. All plans include our core features and dedicated support.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex bg-muted rounded-lg p-1 border border-border">
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground shadow-theme-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-primary text-primary-foreground shadow-theme-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full font-medium">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card rounded-xl p-8 border transition-all duration-300 ${
                plan.recommended
                  ? 'border-primary shadow-theme-xl scale-105 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/50 hover:shadow-theme-lg'
              }`}
            >
              {plan.recommended && (
                <div className="text-center mb-4">
                  <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-foreground">
                    {plan.price[billingCycle] ? `$${plan.price[billingCycle]}` : 'Custom'}
                  </span>
                  {plan.price[billingCycle] && (
                    <span className="text-muted-foreground ml-2">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-success" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
                <Button
                  variant={plan.recommended ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { Pricing }
