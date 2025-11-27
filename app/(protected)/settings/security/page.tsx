// ============================================
// FILE: app/(protected)/settings/security/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SecurityView from '@/components/settings/SecurityView'

export default async function SecurityPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security</h1>
        <p className="text-muted-foreground mt-2">
          Manage your password and security settings
        </p>
      </div>
      <SecurityView user={user} />
    </div>
  )
}
