// ============================================
// components/suites/SuiteMembersView.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import { useSuiteMembers, useInviteMember, useRemoveMember, useUpdateMemberRole } from '@/lib/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SuiteMembersList } from './SuiteMembersList';
import { InviteMemberForm } from './InviteMemberForm';
import { Plus, Search } from 'lucide-react';
import type { SuiteMember } from '@/types/member.types';

interface SuiteMembersViewProps {
  suiteId: string;
}

export function SuiteMembersView({ suiteId }: SuiteMembersViewProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: members, isLoading } = useSuiteMembers(suiteId);

  // Cast members to SuiteMember type
  const typedMembers = (members || []) as SuiteMember[];

  const filteredMembers = typedMembers.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Suite Members
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage who has access to this test suite
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      <SuiteMembersList members={filteredMembers} suiteId={suiteId} />

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Suite Member"
      >
        <InviteMemberForm
          suiteId={suiteId}
          onSuccess={() => setIsInviteModalOpen(false)}
          onCancel={() => setIsInviteModalOpen(false)}
        />
      </Modal>
    </div>
  );
}