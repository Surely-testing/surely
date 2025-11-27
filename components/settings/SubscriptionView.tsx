// ============================================
// FILE: components/settings/SubscriptionView.tsx
// ============================================
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Check } from 'lucide-react'

export default function SubscriptionView({ subscription, tiers }: any) {
  const currentTier = subscription?.tier

  return (
    <div className="space-y-6">
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
                  {currentTier?.name || 'Free'} Plan
                </h3>
                {currentTier?.price_monthly > 0 && (
                  <p className="text-muted-foreground">
                    ${(currentTier.price_monthly / 100).toFixed(2)}/month
                  </p>
                )}
              </div>
              {subscription?.status && (
                <Badge variant={subscription.status === 'active' ? 'default' : 'info'}>
                  {subscription.status}
                </Badge>
              )}
            </div>

            {subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancel_at_period_end
                  ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              </p>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Plan Features</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  {currentTier?.features?.test_suites === -1 
                    ? 'Unlimited test suites' 
                    : `${currentTier?.features?.test_suites || 1} test suite(s)`}
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  {currentTier?.features?.test_cases === -1 
                    ? 'Unlimited test cases' 
                    : `${currentTier?.features?.test_cases || 50} test cases`}
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  {currentTier?.limits?.ai_operations_per_month === -1 
                    ? 'Unlimited AI operations' 
                    : `${currentTier?.limits?.ai_operations_per_month || 10} AI operations/month`}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Upgrade or downgrade your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {tiers.map((tier: any) => (
              <Card key={tier.id} className={tier.id === currentTier?.id ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle className="capitalize">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {tier.price_monthly === 0 ? (
                      'Free'
                    ) : (
                      <>
                        ${(tier.price_monthly / 100).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      {tier.features.test_suites === -1 ? 'Unlimited' : tier.features.test_suites} test suites
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      {tier.features.test_cases === -1 ? 'Unlimited' : tier.features.test_cases} test cases
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      {tier.limits.ai_operations_per_month === -1 ? 'Unlimited' : tier.limits.ai_operations_per_month} AI ops
                    </li>
                  </ul>
                  <Button 
                    className="w-full"
                    variant={tier.id === currentTier?.id ? 'outline' : 'primary'}
                    disabled={tier.id === currentTier?.id}
                  >
                    {tier.id === currentTier?.id ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}