// ============================================
// FILE: app/dashboard/settings/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsTabs } from '@/components/settings/SettingsTabs'

export default async function SettingsPage() {
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

  // Fetch subscription and tiers
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, subscription_tiers(*)')
    .eq('user_id', user.id)
    .single()

  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('price_monthly', { ascending: true })

  // Fetch user's test suites with member access
  const { data: ownedSuites } = await supabase
    .from('test_suites')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: memberSuites } = await supabase
    .from('suite_members')
    .select(`
      suite_id,
      role,
      test_suites (*)
    `)
    .eq('user_id', user.id)

  // Fetch report schedules
  const { data: reportSchedules } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  let organizationData = null

  if (isOrgAccount && profile.organization_id) {
    // Get organization details
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single()

    // Get user's membership to check role
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', profile.organization_id)
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
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')

    const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'

    // Transform members
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

    organizationData = {
      organization,
      members: transformedMembers,
      isAdmin
    }
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>
      
      <SettingsTabs 
        user={user}
        profile={profile}
        organizationData={organizationData}
        subscription={subscription}
        tiers={tiers || []}
        ownedSuites={ownedSuites || []}
        memberSuites={memberSuites?.map(m => m.test_suites).filter(Boolean) || []}
        reportSchedules={reportSchedules || []}
      />
    </div>
  )
}