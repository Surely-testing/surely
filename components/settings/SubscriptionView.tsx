'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Check, AlertCircle, Download, RefreshCw, CreditCard, Loader2, X, AlertTriangle } from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'

interface SubscriptionViewProps {
  userId: string
}

export default function SubscriptionView({ userId }: SubscriptionViewProps) {
  const { supabase } = useSupabase()
  const [subscription, setSubscription] = useState<any>(null)
  const [tiers, setTiers] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  useEffect(() => {
    fetchData()
    
    const searchParams = new URLSearchParams(window.location.search)
    
    if (searchParams.get('success') === 'true') {
      const subscriptionId = searchParams.get('subscription_id')
      const status = searchParams.get('status')
      
      if (status === 'active' || subscriptionId) {
        toast.success('Subscription activated!', {
          description: 'Your premium features are now active.'
        })
      } else {
        toast.success('Checkout completed!')
      }
      
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('success')
      newUrl.searchParams.delete('subscription_id')
      newUrl.searchParams.delete('status')
      window.history.replaceState({}, '', newUrl.toString())
    }
    
    if (searchParams.get('payment_updated') === 'true') {
      toast.success('Payment method updated successfully!')
      
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('payment_updated')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [userId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError)
        toast.error('Failed to load subscription data')
      }

      let tierData = null
      if (subData?.tier_id) {
        const { data: tier } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('id', subData.tier_id)
          .single()
        
        tierData = tier
      }

      setSubscription(subData ? { ...subData, tier: tierData } : null)

      const { data: tiersData, error: tiersError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('price_monthly', { ascending: true })

      if (tiersError) {
        console.error('Tiers fetch error:', tiersError)
        toast.error('Failed to load pricing tiers')
      } else {
        setTiers(tiersData || [])
      }

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

      if (subData) {
        const status = subData.status
        const trialEnd = subData.trial_end
        const trialDays = trialEnd ? Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0

        if (status === 'trialing' && trialDays > 0 && trialDays <= 3) {
          toast.warning(`Your trial ends in ${trialDays} day${trialDays === 1 ? '' : 's'}!`, {
            description: 'Subscribe now to avoid losing access to premium features.'
          })
        } else if (status === 'past_due') {
          toast.error('Payment failed', {
            description: 'Please update your payment method to continue using your plan.'
          })
        } else if (status === 'on_hold') {
          toast.error('Subscription on hold', {
            description: 'Update your payment method to reactivate your subscription.'
          })
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      toast.error('Failed to load billing information')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncSubscription = async () => {
    setActionLoading('sync')

    try {
      const response = await fetch('/api/billing/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync subscription')
      }

      toast.success('Subscription synced successfully!')
      await fetchData()
    } catch (err: any) {
      console.error('Sync error:', err)
      toast.error(err.message || 'Failed to sync subscription')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSubscribe = async (tierId: string, billingCycle: 'monthly' | 'yearly') => {
    setActionLoading(tierId)

    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, billingCycle })
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error('Server error: Please check if the API route exists')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      if (data.checkoutUrl) {
        toast.success('Redirecting to checkout...')
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (err: any) {
      console.error('Checkout error:', err)
      toast.error(err.message || 'Failed to create checkout session')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    setActionLoading('cancel')

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

      toast.success('Subscription cancelled', {
        description: 'You will have access until the end of your billing period.'
      })

      setShowCancelDialog(false)
      await fetchData()
    } catch (err: any) {
      console.error('Cancel error:', err)
      toast.error(err.message || 'Failed to cancel subscription')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivateSubscription = async () => {
    setActionLoading('reactivate')

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

      toast.success('Subscription reactivated!', {
        description: 'Your subscription will continue at the end of the current period.'
      })

      await fetchData()
    } catch (err: any) {
      console.error('Reactivate error:', err)
      toast.error(err.message || 'Failed to reactivate subscription')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdatePaymentMethod = async () => {
    setActionLoading('payment')

    try {
      const response = await fetch('/api/billing/update-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          returnUrl: `${window.location.origin}/dashboard/settings?tab=subscription&payment_updated=true`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get update URL')
      }

      if (data.updateUrl) {
        toast.success('Redirecting to update payment method...')
        window.location.href = data.updateUrl
      } else {
        throw new Error('No update URL received')
      }

    } catch (err: any) {
      console.error('Payment method update error:', err)
      toast.error(err.message || 'Failed to update payment method')
    } finally {
      setActionLoading(null)
    }
  }

  const handleContactSales = () => {
    window.location.href = '/contact-sales'
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
  const isCancelled = subscription?.cancel_at_period_end === true
  const isPastDue = status === 'past_due'
  const isOnHold = status === 'on_hold'
  const isExpired = status === 'expired'
  
  const isFreeState = !subscription || isExpired || (!isTrialing && !isActive && !isPastDue && !isOnHold)

  const trialDaysRemaining = subscription?.trial_end 
    ? Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  const canCancelSubscription = (isActive || isTrialing) && !isCancelled
  const canReactivate = isCancelled && subscription?.current_period_end

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            {subscription && !isFreeState && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncSubscription}
                disabled={actionLoading === 'sync'}
              >
                {actionLoading === 'sync' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold capitalize">
                  {isFreeState ? 'Free Tier' : `${currentTier?.name} Plan`}
                </h3>
                {!isFreeState && currentTier?.price_monthly && currentTier.price_monthly > 0 && (
                  <p className="text-muted-foreground">
                    ${(currentTier.price_monthly / 100).toFixed(2)}/month
                    {subscription?.billing_cycle === 'yearly' && currentTier?.price_yearly && (
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
                  isPastDue || isOnHold ? 'danger' : 
                  'default'
                }
              >
                {isTrialing ? `Trial (${trialDaysRemaining}d)` : 
                 isFreeState ? 'Free' : 
                 isCancelled ? 'Cancelling' :
                 status}
              </Badge>
            </div>

            {/* Cancellation Warning with Reactivate */}
            {isCancelled && subscription?.current_period_end && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    Subscription Ending
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}. 
                    You'll still have access until then.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading === 'reactivate'}
                  className="flex-shrink-0"
                >
                  {actionLoading === 'reactivate' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Reactivate'
                  )}
                </Button>
              </div>
            )}

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
                    {isCancelled ? 'Access Until' : 'Next Billing'}
                  </p>
                  <p className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {canCancelSubscription && (
              <div className="pt-4 border-t flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  Cancel Plan
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <Card className="border-2 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <AlertTriangle className="w-5 h-5" />
              Cancel Subscription?
            </CardTitle>
            <CardDescription>
              Are you sure you want to cancel your subscription?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>You'll lose access to premium features at the end of your billing period</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You can reactivate anytime before then</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>No charges after {subscription?.current_period_end && new Date(subscription.current_period_end).toLocaleDateString()}</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={!!actionLoading}
              >
                Keep Plan
              </Button>
              <Button
                variant="error"
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm Cancel'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method */}
      {!isFreeState && subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Payment Method on File</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.payment_method_last4 ? (
                      <>
                        {subscription.payment_method_brand && (
                          <span className="capitalize">{subscription.payment_method_brand} </span>
                        )}
                        •••• •••• •••• {subscription.payment_method_last4}
                      </>
                    ) : (
                      'Managed by payment provider'
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpdatePaymentMethod}
                disabled={actionLoading === 'payment'}
              >
                {actionLoading === 'payment' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Update'
                )}
              </Button>
            </div>
            {(isPastDue || isOnHold) && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 dark:text-red-100">
                    Payment Issue
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Your last payment failed. Please update your payment method to continue your subscription.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Recent transactions</CardDescription>
              </div>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      payment.status === 'succeeded' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {payment.status === 'succeeded' ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
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

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>{isFreeState ? 'Choose Your Plan' : 'Available Plans'}</CardTitle>
          <CardDescription>
            {isFreeState ? 'Start your 14-day free trial' : 'Upgrade or change your plan'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tiers
              .filter((tier: any) => tier.name.toLowerCase() !== 'free')
              .map((tier: any) => {
                const isCurrentPlan = tier.id === currentTier?.id && !isFreeState
                const isEnterprise = tier.name.toLowerCase() === 'enterprise'
                
                return (
                  <Card 
                    key={tier.id} 
                    className={isCurrentPlan ? 'border-primary border-2' : ''}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="capitalize">{tier.name}</CardTitle>
                        {tier.name.toLowerCase() === 'pro' && (
                          <Badge variant="primary">Popular</Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {isEnterprise ? (
                          <div className="text-3xl font-bold">Custom</div>
                        ) : (
                          <>
                            <div className="text-3xl font-bold">
                              ${tier.price_monthly ? (tier.price_monthly / 100).toFixed(0) : '0'}
                              <span className="text-sm font-normal text-muted-foreground">/mo</span>
                            </div>
                            {tier.price_yearly && (
                              <p className="text-sm text-muted-foreground">
                                or ${(tier.price_yearly / 100).toFixed(0)}/year (save 17%)
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          {tier.limits?.test_suites === -1 ? 'Unlimited' : tier.limits?.test_suites || '∞'} test suites
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          {tier.limits?.test_cases_per_suite === -1 ? 'Unlimited' : tier.limits?.test_cases_per_suite || '∞'} test cases/suite
                        </li>
                        {tier.limits?.ai_features && (
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            AI-powered features
                          </li>
                        )}
                        {tier.limits?.has_collaboration && (
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            Team collaboration
                          </li>
                        )}
                        {isEnterprise && (
                          <>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                              Dedicated support
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                              Custom integrations
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                              SLA guarantees
                            </li>
                          </>
                        )}
                      </ul>
                      <div className="space-y-2">
                        {isEnterprise ? (
                          <Button 
                            className="w-full"
                            variant="outline"
                            onClick={handleContactSales}
                          >
                            Contact Sales
                          </Button>
                        ) : (
                          <>
                            <Button 
                              className="w-full"
                              variant={isCurrentPlan ? 'ghost' : 'primary'}
                              disabled={isCurrentPlan || !!actionLoading}
                              onClick={() => handleSubscribe(tier.id, 'monthly')}
                            >
                              {actionLoading === tier.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                isCurrentPlan ? 'Current Plan' : isFreeState ? 'Start Trial' : 'Monthly'
                              )}
                            </Button>
                            {tier.price_yearly && !isCurrentPlan && (
                              <Button 
                                className="w-full"
                                variant="outline"
                                disabled={!!actionLoading}
                                onClick={() => handleSubscribe(tier.id, 'yearly')}
                              >
                                Yearly (Save 17%)
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}