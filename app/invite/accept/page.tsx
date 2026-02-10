// ============================================
// app/invite/accept/page.tsx
// Accept invitation page - TypeScript null handling fixed
// ============================================
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type InvitationStatus = 'loading' | 'valid' | 'expired' | 'already_accepted' | 'not_found' | 'error' | 'accepting' | 'success'

interface Invitation {
  id: string
  type: 'testSuite' | 'organization'
  suite_id: string | null
  organization_id: string | null
  invitee_email: string
  role: string
  status: 'pending' | 'accepted' | 'declined'
  expires_at: string
  suite?: {
    name: string
    description: string | null
  }
  organization?: {
    name: string
  }
}

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<InvitationStatus>('loading')
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('not_found')
      return
    }
    
    loadInvitation(token)
  }, [token])

  const loadInvitation = async (invitationToken: string) => {
    const supabase = createClient()
    
    try {
      // Get invitation details
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select(`
          *,
          suite:test_suites (
            name,
            description
          ),
          organization:organizations (
            name
          )
        `)
        .eq('id', invitationToken)
        .single()

      if (fetchError || !data) {
        setStatus('not_found')
        return
      }

      setInvitation(data as Invitation)

      // Check if already accepted
      if (data.status === 'accepted') {
        setStatus('already_accepted')
        return
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setStatus('expired')
        return
      }

      setStatus('valid')
    } catch (err) {
      console.error('Error loading invitation:', err)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to load invitation')
    }
  }

  const acceptInvitation = async () => {
    if (!invitation || !token) return
    
    setStatus('accepting')
    const supabase = createClient()

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirect to login with return URL
        router.push(`/login?redirect=/invite/accept?token=${token}`)
        return
      }

      // Verify email matches
      if (user.email !== invitation.invitee_email) {
        setError('This invitation was sent to a different email address')
        setStatus('error')
        return
      }

      if (invitation.type === 'testSuite' && invitation.suite_id) {
        // Handle test suite invitation
        await acceptSuiteInvitation(supabase, user.id, invitation)
      } else if (invitation.type === 'organization' && invitation.organization_id) {
        // Handle organization invitation
        await acceptOrganizationInvitation(supabase, user.id, invitation)
      }

    } catch (err) {
      console.error('Error accepting invitation:', err)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    }
  }

  const acceptSuiteInvitation = async (supabase: any, userId: string, invitation: Invitation) => {
    // Get current suite data
    const { data: suite, error: fetchError } = await supabase
      .from('test_suites')
      .select('members, admins, viewers')
      .eq('id', invitation.suite_id)
      .single()

    if (fetchError) throw fetchError

    // Prepare updated arrays based on role
    let updates: any = {}
    
    if (invitation.role === 'admin') {
      const newAdmins = [...(suite.admins || []), userId]
      updates.admins = Array.from(new Set(newAdmins)) // Remove duplicates
    } else if (invitation.role === 'viewer') {
      const newViewers = [...(suite.viewers || []), userId]
      updates.viewers = Array.from(new Set(newViewers))
    } else {
      const newMembers = [...(suite.members || []), userId]
      updates.members = Array.from(new Set(newMembers))
    }

    // Update suite with new member
    const { error: updateError } = await supabase
      .from('test_suites')
      .update(updates)
      .eq('id', invitation.suite_id)

    if (updateError) throw updateError

    // Update invitation status
    const { error: inviteUpdateError } = await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    if (inviteUpdateError) throw inviteUpdateError

    setStatus('success')
    
    // Redirect to suite after 2 seconds
    setTimeout(() => {
      router.push(`/suite/${invitation.suite_id}`)
    }, 2000)
  }

  const acceptOrganizationInvitation = async (supabase: any, userId: string, invitation: Invitation) => {
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMember) {
      // Update existing membership
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({
          role: invitation.role,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMember.id)

      if (updateError) throw updateError
    } else {
      // Create new membership
      const { error: insertError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: userId,
          role: invitation.role,
          status: 'active'
        })

      if (insertError) throw insertError
    }

    // Update invitation status
    const { error: inviteUpdateError } = await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    if (inviteUpdateError) throw inviteUpdateError

    setStatus('success')
    
    // Redirect to organization after 2 seconds
    setTimeout(() => {
      router.push(`/organization/${invitation.organization_id}`)
    }, 2000)
  }

  const declineInvitation = async () => {
    if (!invitation) return
    
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id)

      if (error) throw error

      router.push('/')
    } catch (err) {
      console.error('Error declining invitation:', err)
      setError(err instanceof Error ? err.message : 'Failed to decline invitation')
    }
  }

  const getInvitationTitle = () => {
    if (!invitation) return ''
    if (invitation.type === 'testSuite') {
      return invitation.suite?.name || 'a test suite'
    }
    return invitation.organization?.name || 'an organization'
  }

  const getRoleDescription = () => {
    if (!invitation) return ''
    
    const role = invitation.role
    const type = invitation.type

    if (type === 'testSuite') {
      if (role === 'admin') return 'Full access to manage the suite'
      if (role === 'member') return 'Can view and edit test cases'
      if (role === 'viewer') return 'View-only access'
    } else if (type === 'organization') {
      if (role === 'admin') return 'Full access to manage the organization'
      if (role === 'manager') return 'Can manage members and projects'
      if (role === 'member') return 'Basic access to organization resources'
    }
    
    return ''
  }

  // Early return for no token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-4">
              This invitation link is invalid.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading invitation...</h2>
          </div>
        )}

        {status === 'valid' && invitation && (
          <div>
            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You're Invited!</h2>
              <p className="text-gray-600">
                You've been invited to join{' '}
                <span className="font-semibold">{getInvitationTitle()}</span>
              </p>
            </div>

            {invitation.type === 'testSuite' && invitation.suite?.description && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">{invitation.suite.description}</p>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Role:</span>{' '}
                {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {getRoleDescription()}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={acceptInvitation}
                className="flex-1"
                size="lg"
              >
                Accept Invitation
              </Button>
              <Button
                onClick={declineInvitation}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Decline
              </Button>
            </div>
          </div>
        )}

        {status === 'accepting' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Accepting invitation...</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-900">Welcome aboard!</h2>
            <p className="text-gray-600 mb-4">Redirecting you...</p>
          </div>
        )}

        {status === 'expired' && (
          <div className="text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
            <p className="text-gray-600 mb-4">
              This invitation has expired. Please ask the admin to send a new one.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </div>
        )}

        {status === 'already_accepted' && (
          <div className="text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Already Accepted</h2>
            <p className="text-gray-600 mb-4">
              You've already accepted this invitation.
            </p>
            <Button onClick={() => router.push('/')}>
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === 'not_found' && (
          <div className="text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invitation Not Found</h2>
            <p className="text-gray-600 mb-4">
              This invitation link is invalid or has been removed.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error || 'Please try again later'}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}