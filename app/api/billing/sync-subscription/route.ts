// ============================================
// FILE: app/api/billing/sync-subscription/route.ts
// Sync subscription data from DodoPayments to local database
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

    console.log('Syncing subscription for user:', user.id)

    // Get local subscription
    const { data: localSub, error: subError } = await supabase
      .from('subscriptions')
      .select('dodo_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subError) {
      console.error('Error fetching local subscription:', subError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!localSub?.dodo_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    console.log('Fetching from DodoPayments:', localSub.dodo_subscription_id)

    // Fetch from DodoPayments - cast to DodoSubscription
    const dodoSub = await dodoClient.subscriptions.retrieve(
      localSub.dodo_subscription_id
    ) as DodoSubscription

    console.log('DodoPayments subscription data:', JSON.stringify(dodoSub, null, 2))

    // Build update object using the correct field names from Dodo API
    const updateData: any = {
      status: dodoSub.status,
      updated_at: new Date().toISOString(),
    }

    // Map Dodo's next_billing_date to Supabase's current_period_end
    if (dodoSub.next_billing_date) {
      updateData.current_period_end = dodoSub.next_billing_date
    }

    // Map Dodo's previous_billing_date to Supabase's current_period_start
    if (dodoSub.previous_billing_date) {
      updateData.current_period_start = dodoSub.previous_billing_date
    }

    // Handle cancellation status
    if (dodoSub.cancel_at_next_billing_date !== undefined) {
      updateData.cancel_at_period_end = dodoSub.cancel_at_next_billing_date
    }

    // Update customer ID if available
    if (dodoSub.customer?.customer_id) {
      updateData.dodo_customer_id = dodoSub.customer.customer_id
    }

    console.log('Updating local database with:', updateData)

    // Update local database with fresh data
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    console.log('Subscription synced successfully')

    return NextResponse.json({ 
      success: true, 
      subscription: {
        status: dodoSub.status,
        current_period_start: dodoSub.previous_billing_date,
        current_period_end: dodoSub.next_billing_date,
        cancel_at_period_end: updateData.cancel_at_period_end
      }
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      error: error.error
    })
    
    return NextResponse.json({ 
      error: error.message || 'Failed to sync subscription',
      details: error.status ? `DodoPayments API error: ${error.status}` : undefined
    }, { status: error.status || 500 })
  }
}