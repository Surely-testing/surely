// ============================================
// FILE: app/(protected)/settings/profile/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileSettings from '@/components/settings/ProfileSettingsView'
import ProfileForm from '@/components/settings/ProfileForm'

export default async function ProfilePage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your public profile information
        </p>
      </div>
      <ProfileSettings profile={profile} />
      <ProfileForm profile={profile} />
    </div>
  )
}