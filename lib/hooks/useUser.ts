// ============================================
// FILE: lib/hooks/useUser.ts
// ============================================
'use client'

import { useSupabase } from '@/providers/SupabaseProvider'
import { useQuery } from '@tanstack/react-query'

export function useUser() {
  const { supabase, user } = useSupabase()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  return {
    user,
    profile,
    isLoading,
  }
}
