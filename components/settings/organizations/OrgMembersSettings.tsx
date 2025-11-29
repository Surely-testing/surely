// ============================================
// FILE 1: components/settings/organizations/OrgMembersSettings.tsx
// DROP-IN REPLACEMENT - INTEGRATES EVERYTHING
// ============================================
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { UserPlus } from 'lucide-react'
import MembersList from './MembersList'
import InviteMemberForm from './InviteMemberForm'

interface OrgMembersSettingsProps {
  organization: any
  members: any[]
  currentUserId: string
  isAdmin: boolean
}

export default function OrgMembersSettings({ 
  organization, 
  members, 
  currentUserId, 
  isAdmin 
}: OrgMembersSettingsProps) {
  const [showInvite, setShowInvite] = useState(false)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold">Team Members</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage who has access to your organization
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setShowInvite(true)}
            className="w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      <MembersList
        members={members}
        organizationId={organization.id}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />

      <InviteMemberForm
        open={showInvite}
        onOpenChange={setShowInvite}
        organizationId={organization.id}
      />
    </div>
  )
}