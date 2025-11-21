// ============================================
// FILE: lib/hooks/useSubscription.ts
// ============================================
'use client'

import { useSupabase } from '@/providers/SupabaseProvider'
import { useQuery } from '@tanstack/react-query'
import type { SubscriptionTier } from '@/config/features'

export function useSubscription() {
  const { supabase, user } = useSupabase()

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          tier:subscription_tiers(*)
        `)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const tier = (subscription?.tier?.name || 'free') as SubscriptionTier

  return {
    subscription,
    tier,
    isLoading,
    refetch,
  }
}