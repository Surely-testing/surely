// ============================================
// FILE: app/(protected)/settings/subscription/page.tsx
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionView from '@/components/settings/SubscriptionView'

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user || userError) {
    redirect('/login')
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      tier:subscription_tiers(*)
    `)
    .eq('user_id', user.id)
    .maybeSingle() // Changed from .single() to avoid error if no subscription exists

  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('price_monthly')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing
        </p>
      </div>
      <SubscriptionView 
        subscription={subscription} 
        tiers={tiers || []}
      />
    </div>
  )
}