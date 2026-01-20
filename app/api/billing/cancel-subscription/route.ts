// ============================================
// FILE: app/api/billing/cancel-subscription/route.ts
// Cancel subscription at end of billing period
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodoClient } from '@/lib/dodo/client'
import { DodoSubscription } from '@/lib/dodo/types'

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
      .select('dodo_subscription_id, current_period_end')
      .eq('user_id', userId)
      .single()

    if (subError || !subscription?.dodo_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    console.log('Cancelling subscription:', subscription.dodo_subscription_id)

    // Cancel subscription in DodoPayments using cancel_at_next_billing_date
    const result = await dodoClient.subscriptions.update(
      subscription.dodo_subscription_id,
      {
        cancel_at_next_billing_date: true
      } as any
    ) as DodoSubscription

    console.log('Subscription cancelled:', result)

    // Build update object using correct field names
    const updateData: any = {
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    }

    // Use next_billing_date from the response if available
    if (result.next_billing_date) {
      updateData.current_period_end = result.next_billing_date
    }

    // Update local database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      subscription: {
        cancel_at_period_end: true,
        current_period_end: result.next_billing_date || subscription.current_period_end
      }
    })

  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      error: error.error
    })
    
    return NextResponse.json({ 
      error: error.message || 'Failed to cancel subscription',
      details: error.status ? `DodoPayments API error: ${error.status}` : undefined
    }, { status: error.status || 500 })
  }
}