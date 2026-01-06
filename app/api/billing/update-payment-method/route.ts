// ============================================
// FILE: app/api/billing/update-payment-method/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Create payment method update session in DodoPayments
    const response = await fetch(
      `https://api.dodopayments.com/v1/subscriptions/${subscription.dodo_subscription_id}/update-payment-method`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.message }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({ 
      updateUrl: data.url,
      success: true 
    })

  } catch (error: any) {
    console.error('Update payment method error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}