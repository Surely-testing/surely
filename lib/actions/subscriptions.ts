// ============================================
// FILE 2: lib/actions/subscriptions.ts
// ============================================
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { logger } from '@/lib/utils/logger';

export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const sessionConfig: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/organization?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/organization?canceled=true`,
      metadata: {
        userId: user.id,
      },
    }

    if (existingSubscription?.stripe_customer_id) {
      sessionConfig.customer = existingSubscription.stripe_customer_id
    } else {
      sessionConfig.customer_email = user.email
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return { success: true, url: session.url }
  } catch (error: any) {
    logger.log('Checkout session error:', error)
    return { error: error.message || 'Failed to create checkout session' }
  }
}

export async function createPortalSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!subscription?.stripe_customer_id) {
    return { error: 'No subscription found. Please subscribe first.' }
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/organization`,
    })

    return { success: true, url: session.url }
  } catch (error: any) {
    logger.log('Portal session error:', error)
    return { error: error.message || 'Failed to create portal session' }
  }
}

export async function cancelSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  if (!subscription?.stripe_subscription_id) {
    return { error: 'No active subscription found' }
  }

  try {
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/settings/organization')
    return { success: true }
  } catch (error: any) {
    logger.log('Cancel subscription error:', error)
    return { error: error.message || 'Failed to cancel subscription' }
  }
}
