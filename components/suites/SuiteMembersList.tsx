// ============================================
// components/suites/SuiteMembersList.tsx
// Using custom Table components with responsive behavior
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
    <Table>
      {/* Table Header */}
      <TableHeader
        columns={[
          <TableHeaderCell key="member" minWidth="min-w-[240px]">Member</TableHeaderCell>,
          <TableHeaderCell key="role" minWidth="min-w-[140px]">Role</TableHeaderCell>,
          <TableHeaderCell key="actions" minWidth="min-w-[140px]" className="text-right">Actions</TableHeaderCell>,
        ]}
      />

      {/* Table Body */}
      {members.map((member) => (
        <TableRow key={member.id}>
          {/* No checkbox column - just skip it */}
          <div className="w-12 border-r border-border bg-card" />

          {/* Member */}
          <TableCell minWidth="min-w-[240px]">
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

          {/* Role */}
          <TableCell minWidth="min-w-[140px]">
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
              <div className="flex items-center h-full py-1">
                <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap w-24 ${
                  member.role === 'admin' 
                    ? 'bg-yellow-400 text-yellow-900' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.role === 'admin' ? (
                    <>
                      <Crown className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>Member</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </TableCell>

          {/* Actions */}
          <TableCell minWidth="min-w-[140px]">
            <div className="flex justify-end gap-2">
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
            </div>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}