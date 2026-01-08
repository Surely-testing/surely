// ============================================
// FILE: app/api/webhooks/dodo/route.ts
// DodoPayments Webhook Handler with Svix Verification
// ============================================

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Webhook } from 'svix'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headersList = headers()
    
    const svix_id = (await headersList).get('webhook-id')
    const svix_timestamp = (await headersList).get('webhook-timestamp')
    const svix_signature = (await headersList).get('webhook-signature')

    console.log('========================================')
    console.log('🔔 WEBHOOK INCOMING')
    console.log('Svix ID:', svix_id)
    console.log('Svix Timestamp:', svix_timestamp)
    console.log('Svix Signature:', svix_signature)
    console.log('========================================')

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Missing svix headers')
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 401 }
      )
    }

    const wh = new Webhook(process.env.DODO_WEBHOOK_SECRET!)
    
    let event
    try {
      event = wh.verify(body, {
        'webhook-id': svix_id,
        'webhook-timestamp': svix_timestamp,
        'webhook-signature': svix_signature,
      }) as any
    } catch (err) {
      console.error('❌ Webhook verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log('✅ Signature verified')
    console.log('========================================')
    console.log('WEBHOOK RECEIVED:', event.type)
    console.log('Full payload:', JSON.stringify(event, null, 2))
    console.log('========================================')

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data)
        break

      case 'subscription.created':
        await handleSubscriptionCreated(event.data)
        break

      case 'subscription.active':
        await handleSubscriptionActive(event.data)
        break

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data)
        break

      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.data)
        break

      case 'subscription.on_hold':
        await handleSubscriptionOnHold(event.data)
        break

      case 'subscription.plan_changed':
        await handlePlanChanged(event.data)
        break

      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// ============================================
// Handler Functions
// ============================================

async function handleCheckoutCompleted(data: any) {
  console.log('Checkout completed:', JSON.stringify(data, null, 2))

  const subscriptionId = data.subscription_id || data.subscription?.id
  const customerId = data.customer_id || data.customer?.id
  const userId = data.metadata?.user_id

  console.log('Extracted IDs:', { subscriptionId, customerId, userId })

  if (!userId || !subscriptionId) {
    console.error('Missing required IDs in checkout.session.completed')
    return
  }

  // Extract payment method info from card data
  const paymentMethodInfo: any = {}

  if (data.card_last_four) {
    paymentMethodInfo.payment_method_last4 = data.card_last_four
  }
  if (data.card_network) {
    paymentMethodInfo.payment_method_brand = data.card_network
  }
  if (data.payment_method_id) {
    paymentMethodInfo.dodo_payment_method_id = data.payment_method_id
  }

  console.log('Payment method info to store:', paymentMethodInfo)

  const updateData = {
    status: 'active',
    dodo_subscription_id: subscriptionId,
    dodo_customer_id: customerId,
    ...paymentMethodInfo,
    trial_end: null,
    had_paid_plan: true,
    updated_at: new Date().toISOString()
  }

  console.log('Updating subscription with:', updateData)

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating subscription after checkout:', error)
    throw error
  }

  console.log('✅ Subscription updated successfully')
}

async function handleSubscriptionCreated(data: any) {
  console.log('Subscription created:', JSON.stringify(data, null, 2))
  // This might fire before checkout.completed, so we'll handle the main update there
}

async function handleSubscriptionActive(data: any) {
  console.log('🎯 handleSubscriptionActive called')
  console.log('Data received:', JSON.stringify(data, null, 2))

  const userId = data.metadata?.user_id

  console.log('Extracted userId:', userId)

  if (!userId) {
    console.error('❌ No user ID found in subscription data')
    console.error('metadata:', data.metadata)
    return
  }

  // Extract payment method info
  const paymentMethodInfo: any = {}
  
  if (data.payment_method_id) {
    paymentMethodInfo.dodo_payment_method_id = data.payment_method_id
  }

  const updateData = {
    status: 'active',
    dodo_subscription_id: data.subscription_id,
    dodo_customer_id: data.customer?.customer_id,
    ...paymentMethodInfo,
    trial_end: null,
    had_paid_plan: true,
    updated_at: new Date().toISOString()
  }

  console.log('Attempting to update subscription with:', updateData)
  console.log('For user_id:', userId)

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', userId)

  if (error) {
    console.error('❌ Error updating subscription:', error)
    throw error
  }

  console.log('✅ Subscription updated successfully!')

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'subscription_activated',
    entity_type: 'subscription',
    entity_id: data.subscription_id,
    metadata: {
      dodo_subscription_id: data.subscription_id,
      converted_from_trial: true
    }
  })

  console.log('✅ Activity log created')
}

async function handleSubscriptionCancelled(data: any) {
  console.log('Subscription cancelled:', data.subscription_id)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('dodo_subscription_id', data.subscription_id)

  if (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

async function handlePaymentSucceeded(data: any) {
  console.log('Payment succeeded:', JSON.stringify(data, null, 2))

  const subscriptionId = data.subscription_id

  if (!subscriptionId) {
    console.error('No subscription ID in payment.succeeded')
    return
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('dodo_subscription_id', subscriptionId)
    .maybeSingle()

  if (!sub) {
    console.error('Subscription not found for payment')
    return
  }

  // Update payment method info if provided
  const paymentMethodUpdate: any = {}
  
  if (data.card_last_four) {
    paymentMethodUpdate.payment_method_last4 = data.card_last_four
  }
  if (data.card_network) {
    paymentMethodUpdate.payment_method_brand = data.card_network
  }
  if (data.payment_method_id) {
    paymentMethodUpdate.dodo_payment_method_id = data.payment_method_id
  }

  if (Object.keys(paymentMethodUpdate).length > 0) {
    console.log('Updating payment method:', paymentMethodUpdate)
    await supabase
      .from('subscriptions')
      .update(paymentMethodUpdate)
      .eq('dodo_subscription_id', subscriptionId)
  }

  // Record payment
  const { error } = await supabase
    .from('payments')
    .insert({
      user_id: sub.user_id,
      subscription_id: subscriptionId,
      dodo_payment_id: data.payment_id,
      amount: data.total_amount,
      currency: data.currency || 'usd',
      status: 'succeeded',
      payment_method: data.card_network || 'card',
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error recording payment:', error)
    throw error
  }

  console.log('✅ Payment recorded successfully')
}

async function handlePaymentFailed(data: any) {
  console.log('Payment failed:', data.payment_id)

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('dodo_subscription_id', data.subscription_id)
    .maybeSingle()

  if (!sub) return

  await supabase.from('payments').insert({
    user_id: sub.user_id,
    subscription_id: data.subscription_id,
    dodo_payment_id: data.payment_id,
    amount: data.total_amount,
    currency: data.currency,
    status: 'failed',
    created_at: new Date().toISOString()
  })
}

async function handleSubscriptionOnHold(data: any) {
  console.log('Subscription on hold:', data.subscription_id)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'on_hold',
      updated_at: new Date().toISOString()
    })
    .eq('dodo_subscription_id', data.subscription_id)

  if (error) {
    console.error('Error updating subscription to on_hold:', error)
    throw error
  }
}

async function handlePlanChanged(data: any) {
  console.log('Plan changed:', data.subscription_id)

  const newProductId = data.new_product_id

  const { data: tier } = await supabase
    .from('subscription_tiers')
    .select('id, name')
    .or(`dodo_product_id_monthly.eq.${newProductId},dodo_product_id_yearly.eq.${newProductId}`)
    .maybeSingle()

  if (!tier) {
    console.error('Tier not found for product ID:', newProductId)
    return
  }

  await supabase
    .from('subscriptions')
    .update({
      tier_id: tier.id,
      updated_at: new Date().toISOString()
    })
    .eq('dodo_subscription_id', data.subscription_id)
}

async function handleSubscriptionUpdated(data: any) {
  console.log('Subscription updated:', JSON.stringify(data, null, 2))

  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  // Update payment method info if provided
  if (data.payment_method_id) {
    updateData.dodo_payment_method_id = data.payment_method_id
  }

  if (data.status) {
    updateData.status = data.status
  }

  if (data.cancel_at_next_billing_date !== undefined) {
    updateData.cancel_at_period_end = data.cancel_at_next_billing_date
  }

  console.log('Updating subscription with:', updateData)

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('dodo_subscription_id', data.subscription_id)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }

  console.log('✅ Subscription updated successfully')
}