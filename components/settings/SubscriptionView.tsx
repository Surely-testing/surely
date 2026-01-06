// ============================================
// FILE: components/settings/SubscriptionView.tsx
// ============================================
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Check, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SubscriptionView({ subscription, tiers }: any) {
  const currentTier = subscription?.tier
  const status = subscription?.status || 'inactive'
  const isTrialing = status === 'trialing'
  const isActive = status === 'active'
  const isCancelled = status === 'cancelled' || status === 'canceled'
  const isPastDue = status === 'past_due'
  const isOnHold = status === 'on_hold'
  const isExpired = status === 'expired'
  
  // Free state: no subscription or expired/cancelled
  const isFreeState = !subscription || isExpired || (isCancelled && !subscription?.current_period_end) || 
                      (!isTrialing && !isActive && !isPastDue && !isOnHold)

  // Calculate trial days remaining
  const trialDaysRemaining = subscription?.trial_end 
    ? Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="space-y-6">
      {/* Current Status Alert */}
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

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your active subscription details
          </CardDescription>
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
              <p className="text-sm text-muted-foreground">
                {isCancelled
                  ? `Access until ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : isTrialing
                  ? `Trial ends ${new Date(subscription.trial_end).toLocaleDateString()}, then $${(currentTier.price_monthly / 100).toFixed(2)}/mo`
                  : `Next billing: ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              </p>
            )}

            {/* Plan Features */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">
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
            <div className="pt-4 flex gap-2">
              {isCancelled && subscription?.current_period_end && (
                <Button className="w-full" variant="ghost">
                  Reactivate Subscription
                </Button>
              )}
              {(isActive || isTrialing) && (
                <Button className="w-full" variant="outline">
                  Cancel Subscription
                </Button>
              )}
              {(isPastDue || isOnHold) && (
                <Button className="w-full" variant="ghost">
                  Update Payment Method
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                        variant={isCurrentPlan ? 'outline' : 'ghost'}
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