// ============================================
// components/suites/SuiteMembersGrid.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUpdateMemberRole, useRemoveMember } from '@/lib/hooks/useMembers';
import { SuiteMember } from '@/types/member.types';
import { Crown, Shield, Trash, User, Mail } from 'lucide-react';

interface SuiteMembersGridProps {
  members: SuiteMember[];
  suiteId: string;
}

export function SuiteMembersGrid({ members, suiteId }: SuiteMembersGridProps) {
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const updateRoleMutation = useUpdateMemberRole(suiteId);
  const removeMemberMutation = useRemoveMember(suiteId);

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          {/* Avatar & Info */}
          <div className="flex flex-col items-center text-center mb-4">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                className="w-16 h-16 rounded-full object-cover mb-3"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-3">
                <span className="text-primary-foreground font-semibold text-xl">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h3 className="font-semibold text-foreground">{member.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Mail className="w-3 h-3" />
              {member.email}
            </p>
          </div>

          {/* Role Badge */}
          <div className="flex justify-center mb-4">
            {editingMember === member.id ? (
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member')}
                className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
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
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
              disabled={updateRoleMutation.isPending}
              className="flex-1"
            >
              <Shield className="w-4 h-4 mr-1" />
              Change Role
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
        </div>
      ))}
    </div>
  );
}