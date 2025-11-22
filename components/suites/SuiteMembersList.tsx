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
import { Select } from '@/components/ui/Select';
import { useUpdateMemberRole, useRemoveMember } from '@/lib/hooks/useMembers';
import { SuiteMember } from '@/types/member.types';
import { Crown, Shield, Trash } from 'lucide-react';



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
        icon={<span className="text-4xl">👥</span>}
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
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold">
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
                <Select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                              className="w-32" options={[]}                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </Select>
              ) : (
                <Badge variant={member.role === 'admin' ? 'warning' : 'primary'}>
                  {member.role === 'admin' ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Admin
                    </>
                  ) : (
                    'Member'
                  )}
                </Badge>
              )}
            </TableCell>

            <TableCell className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
              >
                <Shield className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveMember(member.id, member.name)}
              >
                <Trash className="w-4 h-4 text-red-500" />
              </Button>
            </TableCell>
          </TableGrid>
        </TableRow>
      ))}
    </Table>
  );
}