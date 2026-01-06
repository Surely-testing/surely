// ============================================
// FILE: app/api/billing/upgrade-plan/route.ts
// For upgrading/downgrading between plans
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

    const { userId, newTierId, billingCycle } = await request.json()

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('dodo_subscription_id')
      .eq('user_id', userId)
      .single()

    if (subError || !subscription?.dodo_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Get new tier product ID
    const { data: newTier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', newTierId)
      .single()

    if (tierError || !newTier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
    }

    const newProductId = billingCycle === 'monthly' 
      ? newTier.dodo_product_id_monthly 
      : newTier.dodo_product_id_yearly

    if (!newProductId) {
      return NextResponse.json({ error: 'Product not configured' }, { status: 400 })
    }

    // Change plan in DodoPayments
    const response = await fetch(
      `https://api.dodopayments.com/v1/subscriptions/${subscription.dodo_subscription_id}/change-plan`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: newProductId,
          quantity: 1,
          proration_billing_mode: 'prorated_immediately',
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
        tier_id: newTierId,
        billing_cycle: billingCycle,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Upgrade plan error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}