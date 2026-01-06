// ============================================
// FILE: app/api/billing/reactivate-subscription/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('dodo_subscription_id')
      .eq('user_id', userId)
      .single()

    if (subError || !subscription?.dodo_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Reactivate in DodoPayments
    const response = await fetch(
      `https://api.dodopayments.com/v1/subscriptions/${subscription.dodo_subscription_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_period_end: false,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.message }, { status: response.status })
    }

    // Update local database
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Reactivate subscription error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
