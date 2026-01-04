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
    const headersList = await headers()
    const signature = headersList.get('x-dodo-signature') || ''
    
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
      case 'subscription.created':
        await handleSubscriptionCreated(event.data)
        break
        
      case 'subscription.active':
        await handleSubscriptionActive(event.data)
        break
        
      case 'payment.succeeded':
        await handlePaymentSucceeded(event.data)
        break
        
      case 'payment.failed':
        await handlePaymentFailed(event.data)
        break
        
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data)
        break
        
      case 'subscription.on_hold':
        await handleSubscriptionOnHold(event.data)
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

// Handler functions
async function handleSubscriptionCreated(data: any) {
  console.log('Subscription created:', data.subscription_id)
  
  // Store subscription in your database
  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: data.customer_id, // Map to your user
      subscription_id: data.subscription_id,
      product_id: data.product_id,
      status: data.status,
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      trial_end: data.trial_end,
      created_at: new Date().toISOString()
    })

  if (error) console.error('Error storing subscription:', error)
}

async function handleSubscriptionActive(data: any) {
  console.log('Subscription active:', data.subscription_id)
  
  // Update subscription status
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'active',
      trial_end: null // Trial has ended
    })
    .eq('subscription_id', data.subscription_id)

  if (error) console.error('Error updating subscription:', error)
}

async function handlePaymentSucceeded(data: any) {
  console.log('Payment succeeded:', data.payment_id)
  
  // Record payment
  const { error } = await supabase
    .from('payments')
    .insert({
      payment_id: data.payment_id,
      subscription_id: data.subscription_id,
      amount: data.total_amount,
      currency: data.currency,
      status: 'succeeded',
      created_at: new Date().toISOString()
    })

  if (error) console.error('Error recording payment:', error)
}

async function handlePaymentFailed(data: any) {
  console.log('Payment failed:', data.payment_id)
  
  // Notify user, log failed payment
  // You might want to send an email here
}

async function handleSubscriptionCancelled(data: any) {
  console.log('Subscription cancelled:', data.subscription_id)
  
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('subscription_id', data.subscription_id)

  if (error) console.error('Error cancelling subscription:', error)
}

async function handleSubscriptionOnHold(data: any) {
  console.log('Subscription on hold:', data.subscription_id)
  
  const { error } = await supabase
    .from('user_subscriptions')
    .update({ status: 'on_hold' })
    .eq('subscription_id', data.subscription_id)

  if (error) console.error('Error updating subscription:', error)
}