// ============================================
// FILE: components/settings/organizations/OrgMembersSettings.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { UserPlus } from 'lucide-react'
import MembersList from './MembersList'
import InviteMemberForm from './InviteMemberForm'

export default function OrgMembersSettings({ organization, members, currentUserId, isAdmin }: any) {
  const [showInvite, setShowInvite] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage who has access to your organization
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)}>
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
