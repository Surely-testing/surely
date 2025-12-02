// ============================================
// components/suites/InviteMemberForm.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import { useInviteMember } from '@/lib/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface InviteMemberFormProps {
  suiteId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InviteMemberForm({ suiteId, onSuccess, onCancel }: InviteMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const inviteMutation = useInviteMember(suiteId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteMutation.mutateAsync({ email, role });
      onSuccess();
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address *
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Role
        </label>
        <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'member')}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member - Can view and contribute</SelectItem>
            <SelectItem value="admin">Admin - Full access to suite settings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={inviteMutation.isPending}>
          {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
        </Button>
      </div>
    </form>
  );
}