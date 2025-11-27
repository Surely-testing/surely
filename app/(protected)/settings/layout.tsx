// ============================================
// FILE: app/(protected)/settings/layout.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsSidebar from '@/components/settings/SettingsSidebar'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single()

  // Type assertion to ensure the value matches the expected type
  const accountType = (profile?.account_type as 'individual' | 'organization' | 'organization-admin') || 'individual'

  return (
    <div className="flex h-full">
      <SettingsSidebar accountType={accountType} />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-6 max-w-4xl">
          {children}
        </div>
      </div>
    </div>
  )
}