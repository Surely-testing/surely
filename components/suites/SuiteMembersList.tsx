// ============================================
// components/suites/SuiteMembersList.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import {
  Table,
  TableRow,
  TableGrid,
  TableCell,
  TableEmpty,
  TableHeaderText,
  TableDescriptionText,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
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
      {members.map((member) => (
        <TableRow key={member.id}>
          <TableGrid columns={3}>
            <TableCell className="col-span-1">
              <div className="flex items-center gap-3">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <TableHeaderText>{member.name}</TableHeaderText>
                  <TableDescriptionText>{member.email}</TableDescriptionText>
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
                <Badge variant={member.role === 'admin' ? 'warning' : 'default'}>
                  {member.role === 'admin' ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Admin
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1" />
                      Member
                    </>
                  )}
                </Badge>
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
          </TableGrid>
        </TableRow>
      ))}
    </Table>
  );
}