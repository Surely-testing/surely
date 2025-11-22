// ============================================
// components/bugs/BugsView.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import { useBugs } from '@/lib/hooks/useBugs';
import { useSuiteContext } from '../../providers/SuiteContextProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { BugList } from './BugList';
import { BugForm } from './BugForm';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search } from 'lucide-react';

export function BugsView() {
  const { suite } = useSuiteContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);

  const { data: bugs, isLoading } = useBugs(suite.id, {
    search,
    status: statusFilter,
    severity: severityFilter,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bugs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage bugs in your test suite
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Report Bug
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search bugs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          value={statusFilter[0] || ''}
          onChange={(e) => setStatusFilter(e.target.value ? [e.target.value] : [])}
          options={[
            { value: '', label: 'All Status' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
        <Select
          value={severityFilter[0] || ''}
          onChange={(e) => setSeverityFilter(e.target.value ? [e.target.value] : [])}
          options={[
            { value: '', label: 'All Severity' },
            { value: 'critical', label: 'Critical' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
        />
      </div>

      {/* Bug List */}
      {bugs && bugs.length > 0 ? (
        <BugList bugs={bugs} suiteId={suite.id} />
      ) : (
        <EmptyState
          icon="🐛"
          title="No Bugs Reported"
          description="Great! No bugs have been reported yet"
          action={
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Report Bug
            </Button>
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Report Bug"
      >
        <BugForm
          suiteId={suite.id}
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}