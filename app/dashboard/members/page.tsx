// ============================================
// FILE: app/(dashboard)/[suiteId]/members/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import SuiteMembersView from '@/components/suites/SuiteMembersView'

interface SuiteMembersPageProps {
  params: { suiteId: string }
}

export const metadata = {
  title: 'Suite Members',
  description: 'Manage test suite members',
}

export default async function SuiteMembersPage({ params }: SuiteMembersPageProps) {
  const supabase = await createClient()

  const { data: suite } = await supabase
    .from('test_suites')
    .select('admins, members, owner_type, owner_id')
    .eq('id', params.suiteId)
    .single()

  // Get member details
  const memberIds = [...(suite?.admins || []), ...(suite?.members || [])]
  const { data: members } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url')
    .in('id', memberIds)

  return (
    <SuiteMembersView
      suiteId={params.suiteId}
      suite={suite}
      members={members || []}
    />
  )
}

