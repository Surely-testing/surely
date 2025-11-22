// ==========================================
// FILE: app/create-suite/page.tsx
// ==========================================
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateSuiteForm } from '@/components/test-suites/CreateSuiteForm'

export default async function CreateSuitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create Your First Test Suite</h1>
      <CreateSuiteForm userId={user.id} />
    </div>
  )
}