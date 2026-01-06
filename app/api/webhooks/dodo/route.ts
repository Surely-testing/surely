// ============================================
// FILE: app/api/webhooks/dodo/route.ts
// DodoPayments Webhook Handler
// ============================================

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin access
)

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headersList = headers()
    const signature = (await headersList).get('x-dodo-signature') || ''
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.DODO_WEBHOOK_SECRET!
    )

    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    
    console.log('Webhook received:', event.type)

    // Handle different webhook events
    switch (event.type) {
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

async function handleSubscriptionActive(data: any) {
  console.log('Subscription activated:', data.subscription_id)
  
  const userId = data.metadata?.user_id || data.customer_id
  
  if (!userId) {
    console.error('No user ID found in subscription data')
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      dodo_subscription_id: data.subscription_id,
      dodo_customer_id: data.customer_id,
      dodo_payment_method_id: data.payment_method_id,
      trial_end: null,
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      had_paid_plan: true,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }

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

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('dodo_subscription_id', data.subscription_id)
    .single()

  if (sub) {
    await supabase.from('activity_logs').insert({
      user_id: sub.user_id,
      action: 'subscription_cancelled',
      entity_type: 'subscription',
      entity_id: data.subscription_id
    })
  }
}

async function handlePaymentSucceeded(data: any) {
  console.log('Payment succeeded:', data.payment_id)
  
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('dodo_subscription_id', data.subscription_id)
    .single()

  if (!sub) {
    console.error('Subscription not found for payment')
    return
  }

  const { error } = await supabase
    .from('payments')
    .insert({
      user_id: sub.user_id,
      subscription_id: data.subscription_id,
      dodo_payment_id: data.payment_id,
      amount: data.total_amount,
      currency: data.currency,
      status: 'succeeded',
      payment_method: data.payment_method,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error recording payment:', error)
    throw error
  }

  await supabase.from('activity_logs').insert({
    user_id: sub.user_id,
    action: 'payment_succeeded',
    entity_type: 'payment',
    entity_id: data.payment_id,
    metadata: {
      amount: data.total_amount,
      currency: data.currency
    }
  })
}

async function handlePaymentFailed(data: any) {
  console.log('Payment failed:', data.payment_id)
  
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('dodo_subscription_id', data.subscription_id)
    .single()

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

  await supabase.from('activity_logs').insert({
    user_id: sub.user_id,
    action: 'payment_failed',
    entity_type: 'payment',
    entity_id: data.payment_id,
    metadata: {
      reason: data.failure_reason
    }
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

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('dodo_subscription_id', data.subscription_id)
    .single()

  if (sub) {
    await supabase.from('activity_logs').insert({
      user_id: sub.user_id,
      action: 'subscription_on_hold',
      entity_type: 'subscription',
      entity_id: data.subscription_id
    })
  }
}

async function handlePlanChanged(data: any) {
  console.log('Plan changed:', data.subscription_id)
  
  const newProductId = data.new_product_id
  
  const { data: tier } = await supabase
    .from('subscription_tiers')
    .select('id, name')
    .or(`dodo_product_id_monthly.eq.${newProductId},dodo_product_id_yearly.eq.${newProductId}`)
    .single()

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

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('dodo_subscription_id', data.subscription_id)
    .single()

  if (sub) {
    await supabase.from('activity_logs').insert({
      user_id: sub.user_id,
      action: 'plan_changed',
      entity_type: 'subscription',
      entity_id: data.subscription_id,
      metadata: {
        new_tier: tier.name
      }
    })
  }
}