// ============================================
// components/settings/account/OrganizationAccountView.tsx
// ============================================
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import OrgGeneralSettings from '../organizations/OrgGeneralSettings'
import OrgMembersSettings from '../organizations/OrgMembersSettings'
import OrgBillingSettings from '../organizations/OrgBillingSettings'

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
  )
}