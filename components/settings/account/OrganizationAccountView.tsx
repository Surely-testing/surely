// ============================================
// components/settings/account/OrganizationAccountView.tsx
// ============================================
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import OrgGeneralSettings from '../organizations/OrgGeneralSettings'
import OrgMembersSettings from '../organizations/OrgMembersSettings'
import OrgBillingSettings from '../organizations/OrgBillingSettings'
import { CheckCircle2, Building2, Users, Crown, Shield } from 'lucide-react'

export interface OrganizationAccountViewProps {
  user: any
  profile: any
  organization: any
  members: any[]
  currentUserId: string
  isAdmin: boolean
}

export default function OrganizationAccountView({
  user,
  profile,
  organization,
  members,
  currentUserId,
  isAdmin,
}: OrganizationAccountViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Left Side */}
      <div className="lg:col-span-2">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <OrgGeneralSettings
              user={user}
              profile={profile}
              organization={organization}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="members">
            <OrgMembersSettings
              organization={organization}
              members={members}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="billing">
            <OrgBillingSettings
              organization={organization}
              isAdmin={isAdmin}
              subscription={undefined}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Organization Features Guide - Right Side */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Collaboration */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-sm font-semibold">Team Collaboration</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Invite unlimited team members</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Shared test suites & cases</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Real-time collaboration</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Team activity tracking</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t"></div>

            {/* Access Control */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-sm font-semibold">Access Control</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Role-based permissions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Admin, member, viewer roles</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Custom permissions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Audit logs</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t"></div>

            {/* Advanced Features */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 className="text-sm font-semibold">Enterprise Features</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Advanced reporting & analytics</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Centralized billing</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Priority support</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Custom integrations</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t"></div>

            {/* Member Count */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Team Members</span>
                <span className="text-xs font-semibold">{members?.length || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'You can manage members in the Members tab' : 'Contact your admin to invite more members'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}