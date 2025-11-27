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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function IndividualAccountView({ user, profile }: any) {
  const [email, setEmail] = useState(user.email)
  const [isLoading, setIsLoading] = useState(false)

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
    <div className="space-y-6">
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
            <p className="text-sm text-muted-foreground">
              We'll send a verification email to confirm changes
            </p>
          </div>
          
          <Button 
            onClick={handleUpdateEmail} 
            disabled={isLoading || email === user.email}
          >
            {isLoading ? 'Updating...' : 'Update Email'}
          </Button>

          <div className="pt-4 border-t space-y-4">
            <div>
              <Label>Account Type</Label>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                Individual Account
              </p>
            </div>

            <div>
              <Label>Account Status</Label>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                {profile?.status || 'Active'}
              </p>
            </div>

            <div>
              <Label>Member Since</Label>
              <p className="text-sm text-muted-foreground mt-1">
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="error">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers including all
                    test suites, test cases, bugs, and reports.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}