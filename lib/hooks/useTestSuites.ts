// ============================================
// FILE: lib/hooks/useTestSuites.ts
// ============================================
'use client'

import { useSupabase } from '@/providers/SupabaseProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useTestSuites() {
  const { supabase, user } = useSupabase()
  const queryClient = useQueryClient()

  const { data: suites, isLoading } = useQuery({
    queryKey: ['test-suites', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('test_suites')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const createSuite = useMutation({
    mutationFn: async (suiteData: {
      name: string
      description?: string
      owner_type: 'individual' | 'organization'
      owner_id: string
    }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('test_suites')
        .insert({
          ...suiteData,
          created_by: user.id,
          admins: [user.id],
          members: [user.id],
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] })
    },
  })

  const updateSuite = useMutation({
    mutationFn: async ({
      suiteId,
      updates,
    }: {
      suiteId: string
      updates: { name?: string; description?: string }
    }) => {
      const { data, error } = await supabase
        .from('test_suites')
        .update(updates)
        .eq('id', suiteId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] })
    },
  })

  const deleteSuite = useMutation({
    mutationFn: async (suiteId: string) => {
      const { error } = await supabase
        .from('test_suites')
        .update({ status: 'archived' })
        .eq('id', suiteId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-suites'] })
    },
  })

  return {
    suites: suites || [],
    isLoading,
    createSuite,
    updateSuite,
    deleteSuite,
  }
}
