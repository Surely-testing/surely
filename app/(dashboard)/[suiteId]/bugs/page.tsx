// ============================================
// FILE: app/(dashboard)/[suiteId]/bugs/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import BugsView from '@/components/bugs/BugsView'

interface BugsPageProps {
  params: { suiteId: string }
}

export const metadata = {
  title: 'Bugs',
  description: 'Track and manage bugs',
}

export default async function BugsPage({ params }: BugsPageProps) {
  const supabase = await createClient()

  const { data: bugs } = await supabase
    .from('bugs')
    .select('*')
    .eq('suite_id', params.suiteId)
    .order('created_at', { ascending: false })

  return <BugsView suiteId={params.suiteId} bugs={bugs || []} />
}

