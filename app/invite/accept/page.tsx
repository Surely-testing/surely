// ============================================
// 2. Invitation Accept Page: app/invite/accept/page.tsx
// ============================================
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase, session, loading: authLoading } = useSupabase()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [invitation, setInvitation] = useState<any>(null)

  useEffect(() => {
    if (authLoading) return

    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Invalid invitation link')
      return
    }

    handleInvitation(token)
  }, [authLoading, searchParams, session])

  const handleInvitation = async (token: string) => {
    try {
      // Fetch invitation
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select(`
          *,
          test_suites (
            id,
            name,
            description
          )
        `)
        .eq('id', token)
        .eq('type', 'testSuite')
        .single()

      if (inviteError || !invite) {
        setStatus('error')
        setMessage('Invitation not found')
        return
      }

      setInvitation(invite)

      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        setStatus('expired')
        setMessage('This invitation has expired')
        return
      }

      // Check if already accepted
      if (invite.status === 'accepted') {
        setStatus('error')
        setMessage('This invitation has already been accepted')
        return
      }

      // If user is not logged in, redirect to signup with invitation token
      if (!session?.user) {
        router.push(`/signup?invite=${token}&email=${encodeURIComponent(invite.invitee_email)}`)
        return
      }

      // Verify email matches
      if (session.user.email?.toLowerCase() !== invite.invitee_email.toLowerCase()) {
        setStatus('error')
        setMessage(`This invitation is for ${invite.invitee_email}. Please log out and sign in with the correct email.`)
        return
      }

      // Accept invitation - add user to suite
      const memberData: any = {
        suite_id: invite.suite_id,
        user_id: session.user.id,
        role: invite.role,
      }

      if (invite.invited_by) {
        memberData.invited_by = invite.invited_by
      }

      const { error: memberError } = await supabase
        .from('suite_members')
        .insert(memberData)

      if (memberError) {
        // Check if already a member
        if (memberError.code === '23505') {
          setStatus('error')
          setMessage('You are already a member of this suite')
          return
        }
        throw memberError
      }

      // Update invitation status
      await supabase
        .from('invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', token)

      setStatus('success')
      setMessage(`Welcome to ${invite.test_suites?.name}!`)

      // Redirect to suite after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/suites/${invite.suite_id}`)
      }, 2000)

    } catch (error: any) {
      console.error('Error accepting invitation:', error)
      setStatus('error')
      setMessage(error.message || 'Failed to accept invitation')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Invitation...</h2>
            <p className="text-gray-600">Please wait while we verify your invitation</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you to the suite...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Accept</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'expired' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Expired</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-4">
              Please contact the person who invited you to send a new invitation.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}