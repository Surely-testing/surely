
// ============================================
// FILE: components/settings/organizations/OrgGeneralSettings.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateOrganization } from '@/lib/actions/organizations'
import { updateAccountEmail } from '@/lib/actions/acount'

export default function OrgGeneralSettings({ user, profile, organization, isAdmin }: any) {
  const [orgName, setOrgName] = useState(organization.name)
  const [email, setEmail] = useState(user.email)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateOrgName = async () => {
    if (orgName === organization.name) {
      toast.info('No changes')
      return
    }

    if (orgName.length < 2 || orgName.length > 100) {
      toast.error('Invalid name', {
        description: 'Name must be between 2 and 100 characters',
      })
      return
    }

    setIsLoading(true)
    const result = await updateOrganization(organization.id, { name: orgName })

    if (result.error) {
      toast.error('Error', {
        description: result.error,
      })
    } else {
      toast.success('Organization name updated')
    }

    setIsLoading(false)
  }

  const handleUpdateEmail = async () => {
    if (email === user.email) {
      toast.info('No changes')
      return
    }

    setIsLoading(true)
    const result = await updateAccountEmail(email)
    
    if (result.error) {
      toast.error('Error', {
        description: result.error,
      })
    } else {
      toast.success('Verification email sent')
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Update your organization information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
              maxLength={100}
            />
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">
                Only admins can update organization details
              </p>
            )}
          </div>

          {isAdmin && (
            <Button
              onClick={handleUpdateOrgName}
              disabled={isLoading || orgName === organization.name}
            >
              {isLoading ? 'Updating...' : 'Update Organization Name'}
            </Button>
          )}

          <div className="pt-4 border-t space-y-2">
            <div>
              <Label>Organization ID</Label>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {organization.id}
              </p>
            </div>
            <div>
              <Label>Created</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(organization.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Account Email</CardTitle>
          <CardDescription>
            Update the email address for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleUpdateEmail} 
            disabled={isLoading || email === user.email}
          >
            {isLoading ? 'Updating...' : 'Update Email'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
