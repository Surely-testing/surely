// ============================================
// FILE: components/settings/account/IndividualAccountView.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateAccountEmail, deleteAccount } from '@/lib/actions/acount'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, Users, Building2 } from 'lucide-react'

export default function IndividualAccountView({ user, profile }: any) {
  const [email, setEmail] = useState(user.email)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleUpdateEmail = async () => {
    if (email === user.email) {
      toast.info('No changes', {
        description: 'Email address is the same',
      })
      return
    }

    setIsLoading(true)
    const result = await updateAccountEmail(email)
    
    if (result.error) {
      toast.error('Error', {
        description: result.error,
      })
    } else {
      toast.success('Verification email sent', {
        description: 'Check your email to confirm the change',
      })
    }
    setIsLoading(false)
  }

  const handleDeleteAccount = async () => {
    const result = await deleteAccount()
    
    if (result.error) {
      toast.error('Error', {
        description: result.error,
      })
    } else {
      toast.success('Account deleted')
      window.location.href = '/login'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Left Side */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account email and view account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We'll send a verification email to confirm changes
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleUpdateEmail} 
                disabled={isLoading || email === user.email}
              >
                {isLoading ? 'Updating...' : 'Update Email'}
              </Button>
            </div>

            <div className="pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Account Type</Label>
                <p className="text-sm font-medium mt-1">Individual Account</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <p className="text-sm font-medium mt-1 capitalize">
                  {profile?.status || 'Active'}
                </p>
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Member Since</Label>
                <p className="text-sm font-medium mt-1">
                  {new Date(profile?.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="error" onClick={() => setShowDeleteDialog(true)}>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Features Guide - Right Side */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Account Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Individual Account */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Individual</h4>
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Personal test suites</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Unlimited test cases</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Bug tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Session recordings</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">AI test recommendations</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t"></div>

            {/* Organization Account */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Organization</h4>
                  <p className="text-xs text-muted-foreground">Upgrade Available</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Everything in Individual</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Team collaboration</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Shared test suites</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Role-based permissions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Advanced reporting</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Priority support</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                Upgrade to Organization
              </Button>
            </div>

            {/* Divider */}
            <div className="border-t"></div>

            {/* Quick Info */}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Need team features?</strong> Contact us to learn about organization plans and volume pricing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers including all
              test suites, test cases, bugs, and reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={() => {
                setShowDeleteDialog(false)
                handleDeleteAccount()
              }}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}