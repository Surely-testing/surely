'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Check, AlertCircle, Download, RefreshCw, CreditCard, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSupabase } from '@/providers/SupabaseProvider'

interface SubscriptionViewProps {
  userId: string
}

export default function SubscriptionView({ userId }: SubscriptionViewProps) {
  const { supabase } = useSupabase()
  const [subscription, setSubscription] = useState<any>(null)
  const [tiers, setTiers] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch subscription with tier
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          tier:tier_id (*)
        `)
        .eq('user_id', userId)
        .single()

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError)
      } else {
        setSubscription(subData)
      }

      // Fetch all tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('price_monthly', { ascending: true })

      if (tiersError) {
        console.error('Tiers fetch error:', tiersError)
      } else {
        setTiers(tiersData || [])
      }

      // Fetch payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (paymentsError) {
        console.error('Payments fetch error:', paymentsError)
      } else {
        setPayments(paymentsData || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll lose access at the end of your billing period.')) {
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      await fetchData()
      alert('Subscription cancelled. You\'ll have access until the end of your billing period.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setActionLoading(true)
    setError('')

    try {
      const response = await fetch('/api/billing/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }

      await fetchData()
      alert('Subscription reactivated successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdatePaymentMethod = async () => {
    setActionLoading(true)
    setError('')

    try {
      const response = await fetch('/api/billing/update-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          returnUrl: window.location.href
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment method')
      }

      if (data.updateUrl) {
        window.location.href = data.updateUrl
      }
    } catch (err: any) {
      setError(err.message)
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentTier = subscription?.tier
  const status = subscription?.status || 'inactive'
  const isTrialing = status === 'trialing'
  const isActive = status === 'active'
  const isCancelled = status === 'cancelled' || subscription?.cancel_at_period_end
  const isPastDue = status === 'past_due'
  const isOnHold = status === 'on_hold'
  const isExpired = status === 'expired'
  
  const isFreeState = !subscription || isExpired || (isCancelled && !subscription?.current_period_end) || 
                      (!isTrialing && !isActive && !isPastDue && !isOnHold)

  const trialDaysRemaining = subscription?.trial_end 
    ? Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="space-y-6">
      {/* Status Alerts */}
      {isTrialing && trialDaysRemaining > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You're currently on a <strong>14-day free trial</strong> of the {currentTier?.name} plan. 
            {trialDaysRemaining} days remaining. No payment required until {new Date(subscription.trial_end).toLocaleDateString()}.
          </AlertDescription>
        </Alert>
      )}

      {isFreeState && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You're currently on the <strong>Free tier</strong> with limited access. 
            Choose a plan below to unlock all features with a 14-day free trial.
          </AlertDescription>
        </Alert>
      )}

      {isPastDue && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your payment failed. Please update your payment method to continue using {currentTier?.name}.
          </AlertDescription>
        </Alert>
      )}

      {isOnHold && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your subscription is on hold. Please update your payment method to reactivate.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold capitalize">
                  {isFreeState ? 'Free Tier' : `${currentTier?.name} Plan`}
                </h3>
                {!isFreeState && currentTier?.price_monthly > 0 && (
                  <p className="text-muted-foreground">
                    ${(currentTier.price_monthly / 100).toFixed(2)}/month
                    {subscription?.billing_cycle === 'yearly' && (
                      <span className="ml-2 text-sm">
                        (billed ${(currentTier.price_yearly / 100).toFixed(2)}/year)
                      </span>
                    )}
                  </p>
                )}
              </div>
              <Badge 
                variant={
                  isActive ? 'default' : 
                  isTrialing ? 'primary' : 
                  isCancelled ? 'default' : 
                  isPastDue || isOnHold ? 'danger' : 
                  'default'
                }
              >
                {isTrialing ? `Trial (${trialDaysRemaining}d left)` : 
                 isFreeState ? 'Free Tier' : 
                 status}
              </Badge>
            </div>

            {/* Billing Period Info */}
            {subscription?.current_period_end && !isFreeState && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Period</p>
                  <p className="font-medium">
                    {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {isCancelled ? 'Access Until' : 'Next Billing Date'}
                  </p>
                  <p className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Plan Features */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">
                {isFreeState ? 'Free Tier Limits' : 'Current Plan Features'}
              </h4>
              <ul className="space-y-2">
                {isFreeState ? (
                  <>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <Check className="h-4 w-4 mr-2" />
                      1 test suite
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <Check className="h-4 w-4 mr-2" />
                      10 test cases per suite
                    </li>
                    <li className="flex items-center text-sm text-muted-foreground">
                      <Check className="h-4 w-4 mr-2" />
                      Basic features only
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      {currentTier?.limits?.test_suites === -1 
                        ? 'Unlimited test suites' 
                        : `Up to ${currentTier?.limits?.test_suites} test suites`}
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      {currentTier?.limits?.test_cases_per_suite === -1 
                        ? 'Unlimited test cases per suite' 
                        : `${currentTier?.limits?.test_cases_per_suite} test cases per suite`}
                    </li>
                    {currentTier?.limits?.ai_features && (
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 mr-2 text-primary" />
                        AI-powered features
                      </li>
                    )}
                    {currentTier?.limits?.has_collaboration && (
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 mr-2 text-primary" />
                        Team collaboration
                      </li>
                    )}
                    {currentTier?.limits?.support_response_hours !== undefined && (
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 mr-2 text-primary" />
                        {currentTier.limits.support_response_hours === 0 
                          ? '24/7 premium support'
                          : currentTier.limits.support_response_hours === -1
                          ? 'Community support'
                          : `${currentTier.limits.support_response_hours}hr support response`}
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap gap-2">
              {(isActive || isTrialing) && !isCancelled && (
                <>
                  <Button 
                    onClick={handleUpdatePaymentMethod}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Update Payment Method
                  </Button>
                  <Button 
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}
              
              {isCancelled && subscription?.current_period_end && (
                <Button 
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                  className="w-full"
                >
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reactivate Subscription
                </Button>
              )}
              
              {(isPastDue || isOnHold) && (
                <Button 
                  onClick={handleUpdatePaymentMethod}
                  disabled={actionLoading}
                  className="w-full"
                >
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Card */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your recent transactions</CardDescription>
              </div>
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      payment.status === 'succeeded' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {payment.status === 'succeeded' ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()} • {payment.status}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isFreeState ? 'Choose Your Plan' : 'Available Plans'}
          </CardTitle>
          <CardDescription>
            {isFreeState 
              ? 'Start your 14-day free trial - no credit card required'
              : 'Upgrade or downgrade your subscription'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {tiers
              .filter((tier: any) => tier.name !== 'Free' && tier.name !== 'Enterprise')
              .map((tier: any) => {
                const isCurrentPlan = tier.id === currentTier?.id && !isFreeState
                
                return (
                  <Card 
                    key={tier.id} 
                    className={isCurrentPlan ? 'border-primary border-2' : ''}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="capitalize">{tier.name}</CardTitle>
                        {tier.name.toLowerCase() === 'pro' && (
                          <Badge variant="primary">Most Popular</Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold">
                          ${(tier.price_monthly / 100).toFixed(0)}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </div>
                        {tier.price_yearly && (
                          <p className="text-sm text-muted-foreground">
                            or ${(tier.price_yearly / 100).toFixed(0)}/year (save 17%)
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <Check className="h-4 w-4 mr-2 text-primary" />
                          {tier.limits.test_suites === -1 
                            ? 'Unlimited' 
                            : `Up to ${tier.limits.test_suites}`} test suites
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 mr-2 text-primary" />
                          {tier.limits.test_cases_per_suite} test cases per suite
                        </li>
                        {tier.limits.ai_features && (
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-primary" />
                            AI-powered features
                          </li>
                        )}
                        {tier.limits.has_collaboration && (
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-primary" />
                            Team collaboration
                          </li>
                        )}
                        <li className="flex items-center">
                          <Check className="h-4 w-4 mr-2 text-primary" />
                          {tier.limits.support_response_hours === 0 
                            ? '24/7 premium support'
                            : `${tier.limits.support_response_hours}hr support`}
                        </li>
                      </ul>
                      <Button 
                        className="w-full"
                        variant={isCurrentPlan ? 'ghost' : 'outline'}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan 
                          ? 'Current Plan' 
                          : isFreeState 
                          ? 'Start Free Trial' 
                          : tier.price_monthly > (currentTier?.price_monthly || 0)
                          ? 'Upgrade'
                          : 'Downgrade'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
          </div>

          {/* Enterprise Option */}
          <div className="mt-6 p-6 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Enterprise</h3>
                <p className="text-sm text-muted-foreground">
                  Custom solutions for large organizations
                </p>
              </div>
              <Button variant="outline">
                Contact Sales
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}