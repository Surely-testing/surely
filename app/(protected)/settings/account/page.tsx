// ============================================
// FILE: app/(protected)/settings/account/page.tsx
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

  const isOrgAccount = profile?.account_type === 'organization' || 
                       profile?.account_type === 'organization-admin'

  if (isOrgAccount) {
    // Get organization data
    const { data: membership } = await supabase
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      redirect('/settings')
    }

    // Get all members
    const { data: members } = await supabase
      .from('organization_members')
      .select(`
        *,
        user:profiles(
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', membership.organization.id)
      .eq('status', 'active')

    const isAdmin = membership.role === 'owner' || membership.role === 'admin'

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
          organization={membership.organization}
          members={members || []}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    )
  }

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
