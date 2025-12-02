// ============================================
// FILE: hooks/useSuiteActions.ts
// Complete suite management actions
// ============================================
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function useSuiteActions() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const getSuiteStats = async (suiteId: string) => {
    try {
      const [testCases, bugs, recordings, sprints, members] = await Promise.all([
        supabase.from('test_cases').select('id', { count: 'exact' }).eq('suite_id', suiteId),
        supabase.from('bugs').select('id', { count: 'exact' }).eq('suite_id', suiteId),
        supabase.from('recordings').select('id', { count: 'exact' }).eq('suite_id', suiteId),
        supabase.from('sprints').select('id', { count: 'exact' }).eq('suite_id', suiteId).eq('status', 'active'),
        supabase.from('suite_members').select('id', { count: 'exact' }).eq('suite_id', suiteId),
      ])

      return {
        data: {
          totalTestCases: testCases.count || 0,
          totalBugs: bugs.count || 0,
          totalRecordings: recordings.count || 0,
          activeSprints: sprints.count || 0,
          totalMembers: members.count || 0,
        },
        error: null
      }
    } catch (error: any) {
      return { data: null, error: error.message }
    }
  }

  const updateSuite = async (suiteId: string, updates: { name?: string; description?: string }) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('test_suites')
        .update(updates)
        .eq('id', suiteId)

      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const deleteSuite = async (suiteId: string) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('test_suites')
        .delete()
        .eq('id', suiteId)

      if (error) throw error
      
      router.push('/dashboard')
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const inviteMembers = async (suiteId: string, emails: string[], role: 'admin' | 'member') => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create invitations for each email
      const invitations = emails.map(email => ({
        type: 'testSuite' as const,
        suite_id: suiteId,
        invitee_email: email.trim().toLowerCase(),
        invited_by: user.id,
        role,
        status: 'pending' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }))

      const { data, error } = await supabase
        .from('invitations')
        .insert(invitations)
        .select()

      if (error) throw error

      // TODO: Send invitation emails via API route
      // You can implement email sending in /api/invitations/send route

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (suiteId: string, userId: string) => {
    try {
      setLoading(true)
      
      // Remove from suite_members table
      const { error: memberError } = await supabase
        .from('suite_members')
        .delete()
        .eq('suite_id', suiteId)
        .eq('user_id', userId)

      if (memberError) throw memberError

      // Remove from test_suites members array
      const { data: suite } = await supabase
        .from('test_suites')
        .select('members, admins')
        .eq('id', suiteId)
        .single()

      if (suite) {
        const updatedMembers = (suite.members || []).filter((id: string) => id !== userId)
        const updatedAdmins = (suite.admins || []).filter((id: string) => id !== userId)

        await supabase
          .from('test_suites')
          .update({
            members: updatedMembers,
            admins: updatedAdmins,
          })
          .eq('id', suiteId)
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const updateMemberRole = async (suiteId: string, userId: string, newRole: 'admin' | 'member') => {
    try {
      setLoading(true)

      // Update suite_members table
      const { error: memberError } = await supabase
        .from('suite_members')
        .update({ role: newRole })
        .eq('suite_id', suiteId)
        .eq('user_id', userId)

      if (memberError) throw memberError

      // Update test_suites arrays
      const { data: suite } = await supabase
        .from('test_suites')
        .select('members, admins')
        .eq('id', suiteId)
        .single()

      if (suite) {
        let updatedMembers = suite.members || []
        let updatedAdmins = suite.admins || []

        if (newRole === 'admin') {
          // Add to admins if not already there
          if (!updatedAdmins.includes(userId)) {
            updatedAdmins = [...updatedAdmins, userId]
          }
        } else {
          // Remove from admins
          updatedAdmins = updatedAdmins.filter((id: string) => id !== userId)
        }

        // Ensure user is in members array
        if (!updatedMembers.includes(userId)) {
          updatedMembers = [...updatedMembers, userId]
        }

        await supabase
          .from('test_suites')
          .update({
            members: updatedMembers,
            admins: updatedAdmins,
          })
          .eq('id', suiteId)
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getSuiteStats,
    updateSuite,
    deleteSuite,
    inviteMembers,
    removeMember,
    updateMemberRole,
  }
}