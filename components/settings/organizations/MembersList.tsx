// ============================================
// FILE 7: components/settings/organizations/MembersList.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreVertical, Crown, Shield, User, Users } from 'lucide-react'
import { toast } from 'sonner'
import { removeOrgMember, updateOrgMemberRole } from '@/lib/actions/members'
import type { OrganizationMember } from '@/types/member.types'

interface MembersListProps {
  members: OrganizationMember[]
  organizationId: string
  currentUserId: string
  isAdmin: boolean
}

export default function MembersList({
  members,
  organizationId,
  currentUserId,
  isAdmin,
}: MembersListProps) {
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      case 'admin':
        return <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      case 'manager':
        return <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      default:
        return <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string): "success" | "default" | "primary" | "warning" | "danger" | "info" | undefined => {
    switch (role) {
      case 'owner':
        return 'primary'
      case 'admin':
        return 'info'
      case 'manager':
        return 'success'
      default:
        return 'default'
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'manager' | 'member') => {
    const result = await updateOrgMemberRole(organizationId, userId, newRole)

    if (result.error) {
      toast.error('Error', {
        description: result.error,
      })
    } else {
      toast.success('Member role updated')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    const result = await removeOrgMember(organizationId, userId)

    if (result.error) {
      toast.error('Error', {
        description: result.error,
      })
    } else {
      toast.success('Member removed from organization')
    }

    setRemovingMember(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Team Members</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {members.length} {members.length === 1 ? 'member' : 'members'} in this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId
              const canManage = isAdmin && !isCurrentUser && member.role !== 'owner'

              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={member.user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {member.user?.name}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="primary" className="text-xs shrink-0">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {member.user?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 sm:mt-1 flex-wrap">
                        <Badge
                          variant={getRoleBadgeVariant(member.role)}
                          className="capitalize text-xs"
                        >
                          {getRoleIcon(member.role)}
                          <span className="ml-1">{member.role}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex sm:block">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <MoreVertical className="h-4 w-4" />
                            <span className="ml-2 sm:hidden">Manage</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.user_id, 'admin')}
                            disabled={member.role === 'admin'}
                          >
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.user_id, 'manager')}
                            disabled={member.role === 'manager'}
                          >
                            Make Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.user_id, 'member')}
                            disabled={member.role === 'member'}
                          >
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRemovingMember(member.user_id)}
                            className="text-destructive"
                          >
                            Remove from organization
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!removingMember}
        onOpenChange={() => setRemovingMember(null)}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">
              Remove team member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              This member will lose access to all organization resources. They can
              be invited again later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingMember && handleRemoveMember(removingMember)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}