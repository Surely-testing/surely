// ============================================
// FILE: app/settings/billing/page.tsx
// Billing Settings Page with Success/Failure Handler
// ============================================
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabase } from '@/providers/SupabaseProvider'
import SubscriptionView from '@/components/settings/SubscriptionView'

export default function BillingPage() {
  const { supabase, user } = useSupabase()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  // Get URL parameters
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const subscriptionId = searchParams.get('subscription_id')
  const status = searchParams.get('status')

  useEffect(() => {
    // Handle failed payment
    if (status === 'failed') {
      handlePaymentFailure()
    }
    // Handle successful payment
    else if (success === 'true' && subscriptionId && status === 'active') {
      handlePaymentSuccess()
    }
    // Handle canceled payment
    else if (canceled === 'true') {
      toast.error('Payment canceled', {
        description: 'You canceled the payment process. No charges were made.'
      })
      // Clean up URL
      router.replace('/settings/billing')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, canceled, subscriptionId, status])

  const handlePaymentFailure = () => {
    toast.error('Payment failed', {
      description: 'Your payment could not be processed. Please try again or use a different payment method.',
      duration: 6000
    })
    
    // Clean up URL after showing message
    setTimeout(() => {
      router.replace('/settings/billing')
    }, 1000)
  }

  const handlePaymentSuccess = async () => {
    if (!user?.id) return
    
    setIsProcessing(true)

    try {
      // Show success message immediately
      toast.success('Payment successful!', {
        description: 'Your subscription is being activated...'
      })

      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Refresh the subscription data - fetch separately to avoid relationship ambiguity
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (subError) {
        console.error('Error fetching subscription:', subError)
      }

      // Fetch tier separately if subscription exists
      let tier = null
      if (subscription?.tier_id) {
        const { data: tierData } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('id', subscription.tier_id)
          .single()
        
        tier = tierData
      }

      // Show final success message with tier info
      if (tier?.name) {
        toast.success('Subscription activated!', {
          description: `Welcome to ${tier.name}! You now have access to all premium features.`,
          duration: 5000
        })
      } else {
        toast.success('Subscription activated!', {
          description: 'You now have access to all premium features.',
          duration: 5000
        })
      }

      // Clean up URL
      router.replace('/settings/billing')
    } catch (error) {
      console.error('Error processing success:', error)
      toast.error('Subscription activated, but there was an issue refreshing the page')
      router.replace('/settings/billing')
    } finally {
      setIsProcessing(false)
    }
  }

  // Show processing state
  if (isProcessing) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Card className="border-2 border-primary">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Processing your subscription...</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Please wait while we activate your subscription. This should only take a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine banner type
  const showSuccessBanner = success === 'true' && subscriptionId && status === 'active'
  const showFailureBanner = status === 'failed'

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, billing details, and payment history
        </p>
      </div>

      {/* Success Banner */}
      {showSuccessBanner && (
        <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/10">
          <CardHeader>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <CardTitle className="text-green-900 dark:text-green-100">
                  Payment Successful!
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300 mt-2">
                  Your subscription has been activated. You now have access to all premium features.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.replace('/settings/billing')}
                className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
              >
                Dismiss
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Failure Banner */}
      {showFailureBanner && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <div className="flex items-start gap-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <CardTitle className="text-red-900 dark:text-red-100">
                  Payment Failed
                </CardTitle>
                <CardDescription className="text-red-700 dark:text-red-300 mt-2">
                  Your payment could not be processed. This could be due to insufficient funds, 
                  an incorrect card number, or your bank declining the transaction.
                  <span className="block mt-2 font-medium">
                    Please try again with a different payment method.
                  </span>
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.replace('/settings/billing')}
                className="text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
              >
                Dismiss
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Main Content */}
      {user?.id && <SubscriptionView userId={user.id} />}
    </div>
  )
}