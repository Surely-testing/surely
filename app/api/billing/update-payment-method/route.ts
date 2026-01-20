// ============================================
// FILE: app/api/billing/update-payment-method/route.ts
// Update payment method for a subscription
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

    const { userId, returnUrl } = await request.json()

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

    console.log('Updating payment method for subscription:', subscription.dodo_subscription_id)

    // Use the SDK's updatePaymentMethod method
    // This returns a payment link that redirects the user to update their payment method
    const response = await dodoClient.subscriptions.updatePaymentMethod(
      subscription.dodo_subscription_id,
      {
        type: 'new', // Always use 'new' to let user add a new payment method
        return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
      }
    )

    console.log('Payment method update response:', response)

    // The response contains a payment_link that redirects the user to the payment form
    // For on_hold subscriptions, it also includes payment_id for tracking
    return NextResponse.json({ 
      success: true,
      updateUrl: response.payment_link,
      paymentId: response.payment_id, // Only present for on_hold subscriptions
      expiresOn: response.expires_on
    })

  } catch (error: any) {
    console.error('Update payment method error:', error)
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      error: error.error
    })
    
    return NextResponse.json({ 
      error: error.message || 'Failed to update payment method',
      details: error.status ? `DodoPayments API error: ${error.status}` : undefined
    }, { status: error.status || 500 })
  }
}