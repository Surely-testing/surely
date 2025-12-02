// ============================================
// FILE: app/api/webhooks/supabase/route.ts
// Supabase webhook handler for database events
// ============================================
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Verify webhook signature (you should add a secret to env)
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET

export async function POST(req: Request) {
  try {
    // Verify the webhook signature
    const signature = req.headers.get('x-supabase-signature')
    
    if (WEBHOOK_SECRET && signature !== WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = await req.json()
    const { type, table, record, old_record } = payload

    const supabase = await createClient()

    // Handle different webhook events
    switch (table) {
      case 'profiles': {
        if (type === 'INSERT') {
          console.log('New profile created:', record.id)
          // Add any post-registration logic here
        }
        break
      }

      case 'test_suites': {
        if (type === 'INSERT') {
          console.log('New test suite created:', record.id)
          // You could trigger notifications, analytics, etc.
        }
        break
      }

      case 'bugs': {
        if (type === 'INSERT') {
          console.log('New bug reported:', record.id)
          // Could send notifications to assigned users
        }
        break
      }

      case 'subscriptions': {
        if (type === 'UPDATE') {
          // Handle subscription status changes
          if (old_record.status !== record.status) {
            console.log(`Subscription ${record.id} status changed: ${old_record.status} -> ${record.status}`)
            
            // Handle trial expiration
            if (record.status === 'trialing' && record.current_period_end) {
              const expirationDate = new Date(record.current_period_end)
              const now = new Date()
              
              if (expirationDate <= now) {
                // Trial expired - downgrade to free tier or handle accordingly
                console.log('Trial expired for user:', record.user_id)
              }
            }
          }
        }
        break
      }

      default:
        console.log(`Unhandled table: ${table}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Supabase webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed', message: error.message },
      { status: 500 }
    )
  }
}