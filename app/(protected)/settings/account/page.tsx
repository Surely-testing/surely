// ============================================
// FILE: app/(protected)/settings/account/page.tsx (FIXED)
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IndividualAccountView from '@/components/settings/account/IndividualAccountView'
import OrganizationAccountView from '@/components/settings/account/OrganizationAccountView'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const isOrgAccount = profile.account_type === 'organization' || 
                       profile.account_type === 'organization-admin'

  if (isOrgAccount) {
    const orgId = profile.organization_id

    if (!orgId) {
      console.error('Organization account but no organization_id')
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and preferences
            </p>
          </div>
          <IndividualAccountView user={user} profile={profile} />
        </div>
      )
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError || !organization) {
      console.error('Failed to fetch organization:', orgError)
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground mt-2">
              Unable to load organization settings
            </p>
          </div>
          <IndividualAccountView user={user} profile={profile} />
        </div>
      )
    }

    // Get user's membership to check role
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    // Get all members with profile info
    const { data: members } = await supabase
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        status,
        joined_at,
        updated_at,
        profiles!organization_members_user_id_fkey (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', orgId)
      .eq('status', 'active')

    const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'

    // Transform members to match expected type structure
    const transformedMembers = members?.map(member => ({
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      status: member.status,
      joined_at: member.joined_at,
      updated_at: member.updated_at,
      user: Array.isArray(member.profiles) 
        ? member.profiles[0] 
        : member.profiles
    })) || []

    // If no members found but we have a membership, add current user manually
    let finalMembers = transformedMembers
    if (finalMembers.length === 0 && membership) {
      finalMembers = [{
        id: 'temp-' + user.id,
        user_id: user.id,
        role: membership.role,
        status: 'active' as const,
        joined_at: profile.created_at,
        updated_at: profile.created_at,
        user: {
          id: user.id,
          name: profile.name,
          email: profile.email,
          avatar_url: profile.avatar_url
        }
      }] as any
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization account
          </p>
        </div>
        <OrganizationAccountView
          user={user}
          profile={profile}
          organization={organization}
          members={finalMembers}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    )
  }

  // Individual account
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>
      <IndividualAccountView user={user} profile={profile} />
    </div>
  )
}