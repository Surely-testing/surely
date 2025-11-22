// ============================================
// FILE: app/(dashboard)/settings/profile/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import ProfileSettingsView from '@/components/settings/ProfileSettingsView'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Profile Settings',
  description: 'Manage your profile',
}

export default async function ProfileSettingsPage() {
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

  return <ProfileSettingsView profile={profile} user={user} />
}

