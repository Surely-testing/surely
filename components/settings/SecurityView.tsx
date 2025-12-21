// ============================================
// FILE: components/settings/SecurityView.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updatePassword } from '@/lib/actions/security'
import { signOut } from '@/lib/actions/auth'
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SecurityView({ user }: any) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Password validation checks
  const hasMinLength = newPassword.length >= 8
  const hasUpperCase = /[A-Z]/.test(newPassword)
  const hasLowerCase = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && passwordsMatch

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password')
      return
    }

    if (!isPasswordValid) {
      toast.error('Please meet all password requirements')
      return
    }

    setIsLoading(true)
    const result = await updatePassword(newPassword)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setIsLoading(false)
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      toast.error('Failed to sign out')
      setIsSigningOut(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Left Side */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Password Policy */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium mb-3">Password Requirements</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {hasMinLength ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn(
                  hasMinLength ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasUpperCase ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn(
                  hasUpperCase ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasLowerCase ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn(
                  hasLowerCase ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasNumber ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={cn(
                  hasNumber ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  One number
                </span>
              </div>
              {confirmPassword && (
                <div className="flex items-center gap-2 text-sm">
                  {passwordsMatch ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    passwordsMatch ? 'text-green-600' : 'text-muted-foreground'
                  )}>
                    Passwords match
                  </span>
                  </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleUpdatePassword} 
              disabled={isLoading || !currentPassword || !isPasswordValid}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage devices and sessions where you're logged in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-muted-foreground">
                  {user.email} • Active now
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Password Guide - Right Side */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Password Security Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* What Makes a Strong Password */}
            <div>
              <h4 className="text-sm font-semibold mb-3">What Makes a Strong Password?</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Length:</strong> At least 8 characters, longer is better</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Mix:</strong> Uppercase, lowercase, numbers, and symbols</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Unique:</strong> Different from other accounts</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Random:</strong> Avoid personal info or common words</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t"></div>

            {/* Why It Matters */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Why It Matters</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Protect your data:</strong> Your account contains sensitive test cases, recordings, and project information.
                </p>
                <p>
                  <strong className="text-foreground">Prevent breaches:</strong> Weak passwords can be cracked in seconds using automated tools.
                </p>
                <p>
                  <strong className="text-foreground">Team security:</strong> A compromised account can expose your entire team's work.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t"></div>

            {/* Tips */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Pro Tips</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Use a password manager to generate and store complex passwords</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Enable two-factor authentication for extra security</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Change your password regularly, especially if you suspect a breach</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}