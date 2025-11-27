// ============================================
// FILE: app/(protected)/settings/suites/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuitesView from '@/components/settings/SuitesView'

export default async function SuitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get suites owned by user
  const { data: ownedSuites } = await supabase
    .from('test_suites')
    .select('*')
    .eq('owner_type', 'individual')
    .eq('owner_id', user.id)
    .eq('status', 'active')

  // Get suites where user is admin or member
  const { data: allSuites } = await supabase
    .from('test_suites')
    .select('*')
    .eq('status', 'active')

  const memberSuites = allSuites?.filter(suite => 
    suite.admins?.includes(user.id) || suite.members?.includes(user.id)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Suites</h1>
        <p className="text-muted-foreground mt-2">
          Manage your test suites and access
        </p>
      </div>
      <SuitesView 
        ownedSuites={ownedSuites || []} 
        memberSuites={memberSuites || []}
        userId={user.id}
      />
    </div>
  )
}