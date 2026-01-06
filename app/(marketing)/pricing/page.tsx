'use client'

import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { formatPrice, formatPriceSimple } from '@/lib/utils/format';

interface SubscriptionTier {
  id: string;
  name: string;
  price_monthly: number | null;
  price_yearly: number | null;
  created_at?: string | null;
  features?: any;
  limits: any;
}

const PricingPage = () => {
  const { supabase } = useSupabase();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiers = async () => {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('price_monthly', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Error fetching tiers:', error);
      } else {
        setTiers(data || []);
      }
      setLoading(false);
    };

    fetchTiers();
  }, [supabase]);

  const getIcon = (tierName: string) => {
    const name = tierName.toLowerCase();
    if (name.includes('freelancer')) return <Zap className="h-6 w-6" />;
    if (name.includes('pro')) return <Sparkles className="h-6 w-6" />;
    if (name.includes('enterprise')) return <Crown className="h-6 w-6" />;
    return <Sparkles className="h-6 w-6" />;
  };

  const getDescription = (tierName: string) => {
    const name = tierName.toLowerCase();
    if (name.includes('freelancer')) return 'Perfect for independent developers and freelancers';
    if (name.includes('pro')) return 'Best for teams that need advanced features and priority support';
    if (name.includes('enterprise')) return 'Tailored solutions for large organizations with custom requirements';
    return 'Great for your needs';
  };

  const isRecommended = (tierName: string) => {
    return tierName.toLowerCase().includes('pro');
  };

  const formatFeatures = (tier: SubscriptionTier) => {
    const features: string[] = [];
    
    if (tier.limits?.test_suites !== undefined) {
      features.push(tier.limits.test_suites === -1 ? 'Unlimited test suites' : `Up to ${tier.limits.test_suites} test suites`);
    }
    
    if (tier.limits?.test_cases_per_suite !== undefined) {
      features.push(`${tier.limits.test_cases_per_suite} test cases per suite`);
    }
    
    if (tier.limits?.ai_features) {
      features.push('AI-powered test generation');
    }

    features.push('Advanced analytics dashboard');
    
    if (tier.limits?.support_response_hours !== undefined) {
      if (tier.limits.support_response_hours === 0) {
        features.push('24/7 premium support');
      } else if (tier.limits.support_response_hours === -1) {
        features.push('Community support');
      } else {
        features.push(`Email support (${tier.limits.support_response_hours}hr response)`);
      }
    }
    
    if (tier.limits?.has_collaboration) {
      features.push('Team collaboration tools');
    }

    if (tier.limits?.test_history_days !== undefined) {
      if (tier.limits.test_history_days === -1) {
        features.push('Unlimited test history');
      } else {
        features.push(`${tier.limits.test_history_days}-day test history`);
      }
    }

    features.push('Standard test runners');

    if (tier.limits?.has_collaboration) {
      features.push('Automated reporting');
    }
    
    return features;
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12;
    const savings = monthlyCost - yearly;
    return { amount: formatPriceSimple(savings) };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const displayTiers = tiers.filter(tier => tier.name.toLowerCase() !== 'free');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:32px_32px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 rounded-full px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Simple Pricing</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6">
                Affordable pricing
                <span className="block text-blue-600 dark:text-blue-400">
                  for everyone
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-muted-foreground mb-10 leading-relaxed">
                Start free, scale as you grow. No hidden fees, cancel anytime.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="inline-flex items-center bg-muted rounded-xl p-1.5 border border-border shadow-sm">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`relative px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    billingCycle === 'monthly'
                      ? 'bg-background text-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`relative px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    billingCycle === 'yearly'
                      ? 'bg-background text-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 sm:py-32 -mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
            {displayTiers.map((tier) => {
              const recommended = isRecommended(tier.name);
              const features = formatFeatures(tier);
              const price = billingCycle === 'monthly' ? tier.price_monthly : tier.price_yearly;
              const isEnterprise = !tier.price_monthly && !tier.price_yearly;

              return (
                <div
                  key={tier.id}
                  className={`relative bg-card rounded-2xl border-2 transition-all duration-300 ${
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

                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
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

                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {getDescription(tier.name)}
                    </p>

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
                          Save ${calculateSavings(tier.price_monthly, tier.price_yearly).amount} per year
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => window.location.href = isEnterprise ? '/contact' : '/register'}
                      className={`w-full mb-8 px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 group ${
                        recommended
                          ? 'btn-primary hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                          : 'bg-card border-2 border-border hover:border-blue-500 text-foreground hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      {isEnterprise ? 'Contact Sales' : 'Start Free Trial'}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        What's included:
                      </p>
                      <ul className="space-y-3">
                        {features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground text-sm leading-relaxed">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Frequently asked questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "Can I try Surely for free?",
                answer: "Yes! All plans come with a 14-day free trial with full access. No credit card required to start."
              },
              {
                question: "Can I change plans later?",
                answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                question: "What happens when I exceed my test suite limit?",
                answer: "We'll notify you when you're approaching your limit. You can either upgrade your plan or archive older test suites."
              },
              {
                question: "Do you offer refunds?",
                answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with Surely."
              },
              {
                question: "Is there a setup fee?",
                answer: "No setup fees, no hidden charges. You only pay the plan price you see above."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of teams already shipping better software
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/register'}
              className="px-8 py-3 btn-primary hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => window.location.href = '/contact'}
              className="px-8 py-3 bg-card border-2 border-border hover:border-blue-500 text-foreground rounded-lg font-semibold transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Talk to Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;