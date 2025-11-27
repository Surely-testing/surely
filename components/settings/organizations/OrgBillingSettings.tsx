// ============================================
// FILE: components/settings/organizations/OrgBillingSettings.tsx
// ============================================
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CreditCard, DollarSign } from 'lucide-react'

export default function OrgBillingSettings({ organization, isAdmin }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>
            Organization billing and payment details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Payment Method</p>
                <p className="text-sm text-muted-foreground">
                  No payment method on file
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button variant="outline">Add Payment Method</Button>
            )}
          </div>

          {!isAdmin && (
            <p className="text-sm text-muted-foreground">
              Only organization admins can manage billing settings
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>
            Current plan and usage limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Free Plan</h3>
                <p className="text-muted-foreground">
                  Perfect for getting started
                </p>
              </div>
              <Badge variant="primary">Current Plan</Badge>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Test Suites</span>
                <span className="font-medium">1 of 1 used</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Test Cases</span>
                <span className="font-medium">0 of 50 used</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Operations</span>
                <span className="font-medium">0 of 10 used this month</span>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t">
                <Button className="w-full">Upgrade to Pro</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            Past invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No billing history available
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Invoices will appear here once you upgrade
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}