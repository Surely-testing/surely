// ============================================
// FILE: app/(dashboard)/organizations/[orgId]/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import OrganizationView from '@/components/organizations/organizationView'
import { notFound, redirect } from 'next/navigation'

interface OrganizationPageProps {
  params: { orgId: string }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', params.orgId)
    .single()

  if (error || !org) {
    notFound()
  }

  // Get org members
  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      id,
      user_id,
      role,
      status,
      joined_at,
      profiles:user_id (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('organization_id', params.orgId)
    .eq('status', 'active')

  // Get org's test suites
  const { data: suites } = await supabase
    .from('test_suites')
    .select('id, name, description, created_at')
    .eq('owner_type', 'organization')
    .eq('owner_id', params.orgId)
    .order('created_at', { ascending: false })

  return (
    <OrganizationView
      organization={org}
      members={members || []}
      suites={suites || []}
      currentUserId={user.id}
    />
  )
}
