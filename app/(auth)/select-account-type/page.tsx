// ============================================
// FILE 3: app/(auth)/select-account-type/page.tsx (NEW - CORRECT PATH)
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import { User, Building2, CheckCircle2, Loader2, Sparkles } from 'lucide-react'

export default function SelectAccountTypePage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<'individual' | 'organization' | null>(null)

  useEffect(() => {
    // If no user, redirect to login
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const accountTypes = [
    {
      value: 'individual' as const,
      label: 'Individual Account',
      description: 'Perfect for solo testers and freelancers',
      icon: User,
      plan: 'Freelancer',
      features: ['5 test suites', '500 test cases', 'AI features']
    },
    {
      value: 'organization' as const,
      label: 'Organization Account',
      description: 'Best for teams and businesses',
      icon: Building2,
      plan: 'Pro',
      features: ['20 test suites', '999 test cases', 'Team collaboration']
    }
  ]

  const handleContinue = async () => {
    if (!selectedType) {
      toast.error('Please select an account type')
      return
    }

    if (!user) return

    setLoading(true)

    try {
      // Check if user has organization email for organization account
      if (selectedType === 'organization') {
        const email = user.email || ''
        const domain = email.split('@')[1]
        const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
        
        if (commonProviders.includes(domain.toLowerCase())) {
          toast.error('Organization accounts require a custom domain email')
          setLoading(false)
          return
        }
      }

      // Update profile with account type
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          account_type: selectedType,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // If organization, create organization record
      if (selectedType === 'organization') {
        const email = user.email || ''
        const domain = email.split('@')[1] || ''
        const orgName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)

        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            owner_id: user.id,
            created_by: user.id,
            status: 'active',
          })
          .select()
          .single()

        if (orgError) throw orgError

        // Update profile with organization_id
        await supabase
          .from('profiles')
          .update({ organization_id: org.id })
          .eq('id', user.id)
      }

      // Create trial subscription
      const tierName = selectedType === 'individual' ? 'Freelancer' : 'Pro'
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 14)

      await supabase.from('subscriptions').insert({
        user_id: user.id,
        tier_name: tierName,
        status: 'trialing',
        trial_end: trialEndDate.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndDate.toISOString(),
      })

      toast.success(`${tierName} trial started! 🎉`)
      router.push('/onboarding')
      router.refresh()

    } catch (err: any) {
      console.error('Account type selection error:', err)
      toast.error(err.message || 'Failed to set account type')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Choose Your Account Type
          </h1>
          <p className="text-muted-foreground">
            Select the plan that works best for you
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {accountTypes.map((type) => (
            <div
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedType === type.value
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border hover:border-muted-foreground hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-muted flex-shrink-0">
                  <type.icon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {type.label}
                    </h3>
                    <span className="px-2.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {type.plan}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {type.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {type.features.map((feature, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    selectedType === type.value
                      ? 'border-primary bg-primary'
                      : 'border-border'
                  }`}
                >
                  {selectedType === type.value && (
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground -m-0.5" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedType || loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Setting up...
            </>
          ) : (
            'Continue to Setup'
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Start your 14-day free trial - no credit card required
        </p>
      </div>
    </div>
  )
}