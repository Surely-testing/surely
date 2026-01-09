// ============================================
// FILE: app/api/billing/create-checkout/route.ts
// DodoPayments Checkout Session Creation - FIXED
// ============================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodoClient } from '@/lib/dodo/client'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { tierId, billingCycle } = await req.json()

    // Fetch tier details
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .single()

    if (tierError || !tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
    }

    // Get existing subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Determine product ID based on billing cycle
    const productId = billingCycle === 'yearly' 
      ? tier.dodo_product_id_yearly 
      : tier.dodo_product_id_monthly

    if (!productId) {
      return NextResponse.json(
        { error: 'Product not configured for this billing cycle' }, 
        { status: 400 }
      )
    }

    // Determine trial period (14 days for new users, 0 for returning paid users)
    const trialPeriodDays = existingSubscription?.had_paid_plan ? 0 : 14

    // Build checkout params according to DodoPayments API spec
    const checkoutParams: any = {
      product_cart: [{
        product_id: productId,
        quantity: 1
      }],
      customer: {
        email: user.email!,
        // Add name if available
        ...(user.user_metadata?.name && { name: user.user_metadata.name })
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      metadata: {
        user_id: user.id,
        tier_id: tierId,
        billing_cycle: billingCycle
      },
      // CRITICAL: Force payment methods to be available
      allowed_payment_method_types: ['credit', 'debit']
    }

    // Add trial period if applicable
    if (trialPeriodDays > 0) {
      checkoutParams.trial_period_days = trialPeriodDays
    }

    // Add customer_id if returning customer (NOT inside customer object)
    if (existingSubscription?.dodo_customer_id) {
      checkoutParams.customer_id = existingSubscription.dodo_customer_id
    }

    console.log('Creating checkout session with params:', {
      ...checkoutParams,
      product_cart: checkoutParams.product_cart
    })

    // Create checkout session
    const session = await dodoClient.checkoutSessions.create(checkoutParams)

    console.log('Checkout session created:', session)

    // Create or update pending subscription in database
    if (!existingSubscription) {
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        tier_id: tierId,
        status: 'pending',
        billing_cycle: billingCycle,
        trial_end: trialPeriodDays > 0 
          ? new Date(Date.now() + trialPeriodDays * 24 * 60 * 60 * 1000).toISOString()
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    // Extract checkout URL - try multiple possible property names
    const checkoutUrl = (session as any).checkout_url || 
                       (session as any).url

    const sessionId = (session as any).session_id || 
                     (session as any).id

    if (!checkoutUrl) {
      console.error('No checkout URL in response:', session)
      throw new Error('No checkout URL returned from DodoPayments')
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      sessionId
    })

  } catch (error: any) {
    console.error('Checkout creation error:', error)
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      error: error.error,
      headers: error.headers
    })
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create checkout',
        details: error.status ? `DodoPayments API error: ${error.status}` : undefined
      },
      { status: error.status || 500 }
    )
  }
}