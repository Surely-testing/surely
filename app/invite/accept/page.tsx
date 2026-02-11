// ============================================
// app/invite/accept/page.tsx - FIXED
// The invitations table has NO 'token' column - it uses 'id' as the token
// Changed line 69: .eq('token', invitationId) → .eq('id', invitationId)
// ============================================
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type InvitationStatus = 
  | 'loading' 
  | 'redirecting'
  | 'accepting'
  | 'success'
  | 'expired' 
  | 'already_accepted' 
  | 'not_found' 
  | 'error'

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
  const token = searchParams.get('token') // This is actually the invitation ID
  
  const [status, setStatus] = useState<InvitationStatus>('loading')
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('not_found')
      return
    }
    
    checkInvitationAndUser(token)
  }, [token])

  const checkInvitationAndUser = async (invitationId: string) => {
    const supabase = createClient()
    
    try {
      // FIXED: Use 'id' instead of 'token' - the invitations table has no token column
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
        .eq('id', invitationId)
        .single()

      if (fetchError || !data) {
        console.error('Invitation fetch error:', {
          error: fetchError,
          message: fetchError?.message,
          code: fetchError?.code,
          details: fetchError?.details,
          hint: fetchError?.hint
        })
        setStatus('not_found')
        return
      }

      setInvitation(data as Invitation)

      if (data.status === 'accepted') {
        setStatus('already_accepted')
        return
      }

      const expiresAt = new Date(data.expires_at)
      const now = new Date()

      if (expiresAt < now) {
        setStatus('expired')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setStatus('redirecting')
        
        const params = new URLSearchParams({
          invitation: invitationId,
          email: data.invitee_email,
          type: data.type
        })
        
        setTimeout(() => {
          router.push(`/register?${params.toString()}`)
        }, 1500)
        return
      }

      if (user.email !== data.invitee_email) {
        setError('This invitation was sent to a different email address. Please log out and create an account with the invited email.')
        setStatus('error')
        return
      }

      await acceptInvitation(user.id)

    } catch (err) {
      console.error('Error loading invitation:', err)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to load invitation')
    }
  }

  const acceptInvitation = async (userId: string) => {
    if (!invitation || !token) return
    
    setStatus('accepting')
    const supabase = createClient()

    try {
      if (invitation.type === 'testSuite' && invitation.suite_id) {
        await acceptSuiteInvitation(supabase, userId, invitation)
      } else if (invitation.type === 'organization' && invitation.organization_id) {
        await acceptOrganizationInvitation(supabase, userId, invitation)
      }
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    }
  }

  const acceptSuiteInvitation = async (supabase: any, userId: string, invitation: Invitation) => {
    // Get suite with actual columns
    const { data: suite, error: suiteError } = await supabase
      .from('test_suites')
      .select('owner_id, owner_type, admins, members, viewers')
      .eq('id', invitation.suite_id)
      .single()

    if (suiteError || !suite) throw new Error('Suite not found')

    // Get organization ID from suite owner's profile
    let organizationId = invitation.organization_id

    if (!organizationId && suite.owner_id) {
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', suite.owner_id)
        .single()
      
      organizationId = ownerProfile?.organization_id || null
    }

    // Create org membership if doesn't exist (suite invites = org member)
    if (organizationId) {
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .maybeSingle()

      if (!existingMember) {
        const { error: orgError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: organizationId,
            user_id: userId,
            role: 'member',
            status: 'active',
          })

        if (orgError) throw orgError
      }
    }

    // Add to suite arrays based on role
    let updates: any = {}
    
    if (invitation.role === 'admin') {
      const newAdmins = [...(suite.admins || []), userId]
      updates.admins = Array.from(new Set(newAdmins))
    } else if (invitation.role === 'viewer') {
      const newViewers = [...(suite.viewers || []), userId]
      updates.viewers = Array.from(new Set(newViewers))
    } else {
      const newMembers = [...(suite.members || []), userId]
      updates.members = Array.from(new Set(newMembers))
    }

    const { error: updateError } = await supabase
      .from('test_suites')
      .update(updates)
      .eq('id', invitation.suite_id)

    if (updateError) throw updateError

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    setStatus('success')
    
    setTimeout(() => {
      router.push(`/suite/${invitation.suite_id}`)
    }, 2000)
  }

  const acceptOrganizationInvitation = async (supabase: any, userId: string, invitation: Invitation) => {
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMember) {
      await supabase
        .from('organization_members')
        .update({
          role: invitation.role,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMember.id)
    } else {
      await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: userId,
          role: invitation.role,
          status: 'active',
        })
    }

    await supabase
      .from('invitations')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    setStatus('success')
    
    setTimeout(() => {
      router.push(`/organization/${invitation.organization_id}`)
    }, 2000)
  }

  const getInvitationTitle = () => {
    if (!invitation) return ''
    if (invitation.type === 'testSuite') {
      return invitation.suite?.name || 'a test suite'
    }
    return invitation.organization?.name || 'an organization'
  }

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

        {status === 'redirecting' && invitation && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Redirecting to signup...</h2>
            <p className="text-gray-600">
              Creating your account to join{' '}
              <span className="font-semibold">{getInvitationTitle()}</span>
            </p>
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
            <p className="text-gray-600 mb-4">You've successfully joined!</p>
            <p className="text-sm text-gray-500">Redirecting you...</p>
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
            <Button onClick={() => router.push('/login')}>
              Go to Login
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
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push('/login')} variant="outline">
                Try Logging In
              </Button>
              <Button onClick={() => router.push('/')}>
                Go Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}