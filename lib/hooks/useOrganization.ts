// ============================================
// FILE: lib/hooks/useOrganization.ts
// ============================================
'use client'

import { useSupabase } from '@/providers/SupabaseProvider'
import { useQuery } from '@tanstack/react-query'

export function useOrganization(organizationId?: string) {
  const { supabase, user } = useSupabase()

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!organizationId,
  })

  const { data: members } = useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      if (error) throw error
      return data
    },
    enabled: !!organizationId,
  })

  const isAdmin = organization?.owner_id === user?.id || 
    members?.some(m => m.user_id === user?.id && m.role === 'admin')

  return {
    organization,
    members: members || [],
    isAdmin,
    isLoading,
  }
}