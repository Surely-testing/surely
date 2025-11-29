// ============================================
// FILE 2: components/settings/organizations/OrgBillingSettings.tsx
// DROP-IN REPLACEMENT - WITH UPGRADE AND PAYMENT BUTTONS
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CreditCard, DollarSign, Plus, ExternalLink, CheckCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { createCheckoutSession, createPortalSession } from '@/lib/actions/subscriptions'

interface OrgBillingSettingsProps {
  organization: any
  subscription: any
  isAdmin: boolean
}

export default function OrgBillingSettings({ 
  organization, 
  subscription,
  isAdmin 
}: OrgBillingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Get price IDs from environment or use placeholders
  const getPriceId = (tier: 'pro' | 'enterprise', billing: 'monthly' | 'yearly') => {
    const key = `NEXT_PUBLIC_STRIPE_PRICE_${tier.toUpperCase()}_${billing.toUpperCase()}`
    return process.env[key] || `price_${tier}_${billing}`
  }

  const handleUpgrade = async (tier: 'pro' | 'enterprise', billing: 'monthly' | 'yearly') => {
    const priceId = getPriceId(tier, billing)
    
    setIsLoading(true)
    const result = await createCheckoutSession(priceId)
    
    if (result.error) {
      toast.error('Error', { description: result.error })
    } else if (result.url) {
      window.location.href = result.url
    }
    
    setIsLoading(false)
  }

  const handleManagePayment = async () => {
    setIsLoading(true)
    const result = await createPortalSession()
    
    if (result.error) {
      toast.error('Error', { description: result.error })
    } else if (result.url) {
      window.location.href = result.url
    }
    
    setIsLoading(false)
  }

  const hasPaymentMethod = subscription?.stripe_customer_id
  const currentTier = subscription?.subscription_tiers?.name?.toLowerCase() || 'free'
  const isMonthly = subscription?.current_period_end && subscription?.current_period_start
    ? (new Date(subscription.current_period_end).getTime() - new Date(subscription.current_period_start).getTime()) < (32 * 24 * 60 * 60 * 1000)
    : true

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Payment Method Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Payment Method</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage your payment methods and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base">Payment Method</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {hasPaymentMethod ? 'Card on file' : 'No payment method added'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button 
                variant={hasPaymentMethod ? "secondary" : "outline"}
                size="sm"
                className="w-full sm:w-auto"
                onClick={hasPaymentMethod ? handleManagePayment : () => toast.info('Add a payment method by upgrading to a paid plan')}
                disabled={isLoading}
              >
                {hasPaymentMethod ? (
                  <>
                    Manage
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add Payment Method
                  </>
                )}
              </Button>
            )}
          </div>

          {!isAdmin && (
            <p className="text-xs sm:text-sm text-muted-foreground px-3 sm:px-4">
              Only organization admins can manage billing settings
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Plan */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Current Subscription</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your active plan and usage limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold capitalize">
                  {currentTier} Plan
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {currentTier === 'free' && 'Perfect for getting started'}
                  {currentTier === 'pro' && 'For growing teams'}
                  {currentTier === 'enterprise' && 'Unlimited everything'}
                </p>
              </div>
              <Badge variant="primary" className="text-xs w-fit">
                Active
              </Badge>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Test Suites</span>
                <span className="font-medium text-sm sm:text-base">
                  {currentTier === 'free' ? '1 of 1' : 
                   currentTier === 'pro' ? '10 available' : 
                   'Unlimited'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Test Cases per Suite</span>
                <span className="font-medium text-sm sm:text-base">
                  {currentTier === 'free' ? '50 max' : 
                   currentTier === 'pro' ? '500 max' : 
                   'Unlimited'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">AI Operations/Month</span>
                <span className="font-medium text-sm sm:text-base">
                  {currentTier === 'free' ? '10' : 
                   currentTier === 'pro' ? '100' : 
                   'Unlimited'}
                </span>
              </div>
            </div>

            {hasPaymentMethod && isAdmin && (
              <div className="pt-4 border-t">
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleManagePayment}
                  disabled={isLoading}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Subscription in Stripe
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      {currentTier !== 'enterprise' && isAdmin && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1">Upgrade Your Plan</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Get more features and higher limits
            </p>
          </div>

          {/* Pro Plan */}
          {currentTier === 'free' && (
            <Card className="border-2 border-primary/20">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <h4 className="text-lg sm:text-xl font-bold">Pro Plan</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                        Perfect for growing teams
                      </p>
                      <ul className="space-y-2 text-xs sm:text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <span>10 Test Suites</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <span>500 Test Cases per suite</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <span>100 AI Operations per month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <span>Advanced reporting</span>
                        </li>
                      </ul>
                    </div>
                    <div className="text-center sm:text-right shrink-0">
                      <p className="text-2xl sm:text-3xl font-bold">$29</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">per month</p>
                      <p className="text-xs text-muted-foreground mt-1">or $290/year</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleUpgrade('pro', 'monthly')}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Upgrade Monthly'}
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleUpgrade('pro', 'yearly')}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Upgrade Yearly (Save $58)'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enterprise Plan */}
          <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold">Enterprise Plan</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                      For teams that need everything
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <span><strong>Unlimited</strong> Test Suites</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <span><strong>Unlimited</strong> Test Cases</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <span><strong>Unlimited</strong> AI Operations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <span>Priority support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <span>Custom integrations</span>
                      </li>
                    </ul>
                  </div>
                  <div className="text-center sm:text-right shrink-0">
                    <p className="text-2xl sm:text-3xl font-bold">$99</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">per month</p>
                    <p className="text-xs text-muted-foreground mt-1">or $990/year</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleUpgrade('enterprise', 'monthly')}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Upgrade Monthly'}
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleUpgrade('enterprise', 'yearly')}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Upgrade Yearly (Save $198)'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Billing History */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Billing History</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            View past invoices and payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPaymentMethod ? (
            <div className="text-center py-6 sm:py-8">
              <Button 
                variant="outline"
                onClick={handleManagePayment}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View All Invoices
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">
                No billing history yet
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Your invoices will appear here after upgrading
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}