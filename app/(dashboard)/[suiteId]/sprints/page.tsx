// ============================================
// FILE: app/(dashboard)/[suiteId]/sprints/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import SprintsView from '@/components/sprints/SprintsView'

interface SprintsPageProps {
  params: { suiteId: string }
}

export const metadata = {
  title: 'Sprints',
  description: 'Manage your sprints',
}

export default async function SprintsPage({ params }: SprintsPageProps) {
  const supabase = await createClient()

  const { data: sprints } = await supabase
    .from('sprints')
    .select('*')
    .eq('suite_id', params.suiteId)
    .order('created_at', { ascending: false })

  return <SprintsView suiteId={params.suiteId} sprints={sprints || []} />
}
