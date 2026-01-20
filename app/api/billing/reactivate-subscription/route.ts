// ============================================
// FILE: app/api/billing/reactivate-subscription/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodoClient } from '@/lib/dodo/client'

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

    console.log('Reactivating subscription:', subscription.dodo_subscription_id)

    // Reactivate in DodoPayments - set cancel_at_next_billing_date to false
    const result = await dodoClient.subscriptions.update(
      subscription.dodo_subscription_id,
      {
        cancel_at_next_billing_date: false
      } as any
    )

    console.log('Subscription reactivated:', result)

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
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      error: error.error
    })
    
    return NextResponse.json({ 
      error: error.message || 'Failed to reactivate subscription',
      details: error.status ? `DodoPayments API error: ${error.status}` : undefined
    }, { status: error.status || 500 })
  }
}