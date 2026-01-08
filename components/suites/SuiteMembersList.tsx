// ============================================
// components/suites/SuiteMembersList.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableEmpty,
  TableAvatar,
  TableBadge,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useUpdateMemberRole, useRemoveMember } from '@/lib/hooks/useMembers';
import { SuiteMember } from '@/types/member.types';
import { Crown, Shield, Trash, User } from 'lucide-react';

interface SuiteMembersListProps {
  members: SuiteMember[] 
  suiteId: string;
}

export function SuiteMembersList({ members, suiteId }: SuiteMembersListProps) {
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const updateRoleMutation = useUpdateMemberRole(suiteId);
  const removeMemberMutation = useRemoveMember(suiteId);

  if (members.length === 0) {
    return (
      <TableEmpty
        icon={<User className="w-12 h-12 text-muted-foreground" />}
        title="No members yet"
        description="Invite team members to collaborate on this test suite"
      />
    );
  }

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    await updateRoleMutation.mutateAsync({ userId: memberId, role: newRole });
    setEditingMember(null);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (confirm(`Remove ${memberName} from this suite?`)) {
      await removeMemberMutation.mutateAsync(memberId);
    }
  };

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[600px] px-4 sm:px-0">
        <Table>
          <TableHeader columns={3}>
            <div></div>
            <TableHeaderCell>Member</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableHeader>

          {members.map((member) => (
            <TableRow key={member.id} columns={3}>
              <div></div>

              <TableCell>
                <div className="flex items-center gap-3">
                  <TableAvatar
                    src={member.avatar_url || undefined}
                    alt={member.name}
                    fallback={member.name.charAt(0).toUpperCase()}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                {editingMember === member.id ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member')}
                    className="w-32 px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    disabled={updateRoleMutation.isPending}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <div className="inline-flex items-center gap-1.5">
                    {member.role === 'admin' ? (
                      <>
                        <Crown className="w-3.5 h-3.5 text-warning" />
                        <TableBadge variant="yellow">Admin</TableBadge>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <TableBadge variant="default">Member</TableBadge>
                      </>
                    )}
                  </div>
                )}
              </TableCell>

              <TableCell className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
                  disabled={updateRoleMutation.isPending}
                >
                  <Shield className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id, member.name)}
                  disabled={removeMemberMutation.isPending}
                >
                  <Trash className="w-4 h-4 text-error" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    </div>
  );
}