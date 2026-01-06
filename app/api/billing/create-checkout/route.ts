// ============================================
// FILE: app/api/billing/create-checkout/route.ts
// Creates DodoPayments checkout session
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      userId,
      userEmail,
      userName,
      tierId,
      productId,
      billingCycle,
      returnUrl,
      cancelUrl,
    } = body

    // Validate required fields
    if (!userId || !userEmail || !tierId || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      )
    }

    // Get or create DodoPayments customer
    const { data: existingCustomer } = await supabase
      .from('subscriptions')
      .select('dodo_customer_id')
      .eq('user_id', userId)
      .single()

    let dodoCustomerId = existingCustomer?.dodo_customer_id

    // If no customer exists, we'll create one via checkout
    // DodoPayments creates customer automatically during checkout

    // Create checkout session with DodoPayments
    const checkoutResponse = await fetch('https://api.dodopayments.com/v1/checkout-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          }
        ],
        customer_email: userEmail,
        customer_name: userName,
        ...(dodoCustomerId && { customer_id: dodoCustomerId }),
        success_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout?checkout=cancelled`,
        subscription_data: {
          trial_period_days: 14, // 14-day trial
        },
        metadata: {
          user_id: userId,
          tier_id: tierId,
          billing_cycle: billingCycle,
        },
      }),
    })

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json()
      console.error('DodoPayments error:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Failed to create checkout session' },
        { status: checkoutResponse.status }
      )
    }

    const checkoutData = await checkoutResponse.json()

    // Log the checkout attempt
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'checkout_initiated',
      entity_type: 'subscription',
      entity_id: tierId,
      metadata: {
        product_id: productId,
        billing_cycle: billingCycle,
        checkout_session_id: checkoutData.id,
      },
    })

    return NextResponse.json({
      checkoutUrl: checkoutData.url,
      sessionId: checkoutData.id,
    })

  } catch (error: any) {
    console.error('Checkout creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}