'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Star, ArrowRight, Zap, Sparkles, Crown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useSupabase } from '@/providers/SupabaseProvider'
import { formatPrice, formatPriceSimple } from '@/lib/utils/format'

interface SubscriptionTier {
  id: string;
  name: string;
  price_monthly: number | null;
  price_yearly: number | null;
  created_at?: string | null;
  features?: any;
  limits: any;
}

const Pricing = () => {
  const { supabase } = useSupabase()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTiers = async () => {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('price_monthly', { ascending: true, nullsFirst: false })

      if (error) {
        console.error('Error fetching tiers:', error)
      } else {
        console.log('Fetched tiers from DB:', data)
        setTiers(data || [])
      }
      setLoading(false)
    }

    fetchTiers()
  }, [supabase])

  const getIcon = (tierName: string) => {
    const name = tierName.toLowerCase()
    if (name.includes('freelancer')) return <Zap className="h-5 w-5" />
    if (name.includes('pro')) return <Sparkles className="h-5 w-5" />
    if (name.includes('enterprise')) return <Crown className="h-5 w-5" />
    return <Sparkles className="h-5 w-5" />
  }

  const getDescription = (tierName: string) => {
    const name = tierName.toLowerCase()
    if (name.includes('freelancer')) return 'Perfect for independent testers'
    if (name.includes('pro')) return 'Best for growing teams and businesses'
    if (name.includes('enterprise')) return 'Tailored solutions for large organizations'
    return 'Great for your needs'
  }

  const isRecommended = (tierName: string) => {
    return tierName.toLowerCase().includes('pro')
  }

  const formatFeatures = (tier: SubscriptionTier) => {
    const features: string[] = []
    
    if (tier.limits.test_suites !== undefined) {
      features.push(tier.limits.test_suites === -1 ? 'Unlimited test suites' : `Up to ${tier.limits.test_suites} test suites`)
    }
    
    if (tier.limits.test_cases_per_suite !== undefined) {
      features.push(`${tier.limits.test_cases_per_suite} test cases per suite`)
    }
    
    if (tier.limits.ai_features) {
      features.push('AI-powered features')
    }
    
    if (tier.limits.support_response_hours !== undefined) {
      if (tier.limits.support_response_hours === 0) {
        features.push('24/7 premium support')
      } else if (tier.limits.support_response_hours === -1) {
        features.push('Community support')
      } else {
        features.push(`${tier.limits.support_response_hours}hr support response`)
      }
    }
    
    if (tier.limits.has_collaboration) {
      features.push('Team collaboration')
    }
    
    return features
  }

  if (loading) {
    return (
      <section id="pricing" className="py-20 sm:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </section>
    )
  }

  // Filter out only the Free tier (not Freelancer!)
  const displayTiers = tiers.filter(tier => tier.name.toLowerCase() !== 'free')
  
  console.log('All tiers:', tiers)
  console.log('Display tiers (without Free):', displayTiers)

  return (
    <section id="pricing" className="py-20 sm:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:32px_32px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 rounded-full px-4 py-2 mb-6">
            <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Pricing</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Choose your plan
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Transparent pricing that grows with your team. All plans include our core features.
          </p>

          <div className="inline-flex items-center bg-muted rounded-xl p-1.5 border border-border shadow-sm">
            <button
              className={`relative px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-background text-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`relative px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                billingCycle === 'yearly'
                  ? 'bg-background text-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
          {displayTiers.map((tier) => {
            const recommended = isRecommended(tier.name)
            const features = formatFeatures(tier)
            const price = billingCycle === 'monthly' ? tier.price_monthly : tier.price_yearly
            const isEnterprise = !tier.price_monthly && !tier.price_yearly

            return (
              <div
                key={tier.id}
                className={`relative bg-card rounded-2xl p-8 border-2 transition-all duration-300 ${
                  recommended
                    ? 'border-blue-500 shadow-2xl scale-105 lg:z-10'
                    : 'border-border hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl'
                }`}
              >
                {recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      recommended 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    }`}>
                      {getIcon(tier.name)}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {tier.name}
                    </h3>
                  </div>
                  <p className="text-muted-foreground">{getDescription(tier.name)}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-foreground">
                      {isEnterprise ? 'Custom' : formatPrice(price)}
                    </span>
                    {!isEnterprise && (
                      <span className="text-muted-foreground">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                  {!isEnterprise && billingCycle === 'yearly' && tier.price_monthly && tier.price_yearly && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 font-medium">
                      {formatPrice(tier.price_monthly)}/mo billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={isEnterprise ? '/contact-sales' : '/register'}>
                  <Button
                    variant={recommended ? 'ghost' : 'outline'}
                    className="w-full group"
                    size="lg"
                  >
                    {isEnterprise ? 'Contact Sales' : 'Start Free Trial'}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">
            All plans include a 14-day free trial with full access. No credit card required.
          </p>
          <Link href="/pricing">
            <Button variant="ghost" className="group">
              View detailed comparison
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export { Pricing }