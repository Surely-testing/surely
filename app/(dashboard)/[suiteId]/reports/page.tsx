// ============================================
// FILE: app/(dashboard)/[suiteId]/reports/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import ReportsView from '@/components/reports/ReportsView'

interface ReportsPageProps {
  params: { suiteId: string }
}

export const metadata = {
  title: 'Reports',
  description: 'View and generate reports',
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('suite_id', params.suiteId)
    .order('created_at', { ascending: false })

  return <ReportsView suiteId={params.suiteId} reports={reports || []} />
}
