// ============================================
// components/sprints/SprintDetail.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSprint, useSprintStats, useUpdateSprint, useDeleteSprint } from '@/lib/hooks/useSprints';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import SprintForm  from './SprintForm'
import { ArrowLeft, Edit, Trash, Calendar, CheckSquare, Bug, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface SprintDetailProps {
  suiteId: string;
  sprintId: string;
}

export function SprintDetail({ suiteId, sprintId }: SprintDetailProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const { data: sprint, isLoading } = useSprint(sprintId);
  const { data: stats } = useSprintStats(sprintId);
  const deleteMutation = useDeleteSprint(suiteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Sprint not found</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this sprint?')) {
      await deleteMutation.mutateAsync(sprintId);
      router.push(`/${suiteId}/sprints`);
    }
  };

  const getStatusVariant = (status?: string | null): "success" | "primary" | "warning" | "default" | "danger" | "info" => {
    switch (status) {
      case 'planning': return 'default';
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {sprint.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={getStatusVariant(sprint.status)}>
                {sprint.status || 'planning'}
              </Badge>
              {sprint.start_date && sprint.end_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(sprint.start_date), 'MMM d')} - {format(new Date(sprint.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash className="w-4 h-4 mr-2 text-red-500" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.test_cases_count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Test Cases</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Bug className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.bugs_count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bugs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.documents_count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.recordings_count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recordings</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Description */}
      {sprint.description && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Description
          </h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {sprint.description}
          </p>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Sprint"
      >
        <SprintForm
          suiteId={suiteId}
          initialData={sprint}
          onSuccess={() => setIsEditModalOpen(false)}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>
    </div>
  );
}