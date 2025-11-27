// ============================================
// FILE: app/(protected)/settings/notifications/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationsView from '@/components/settings/NotificationsView'

export default async function NotificationsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: schedules } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Manage your notification preferences and report schedules
        </p>
      </div>
      <NotificationsView userId={user.id} schedules={schedules || []} />
    </div>
  )
}