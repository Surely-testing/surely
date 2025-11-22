// ============================================
// components/sprints/SprintsView.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import { SprintBoard } from './SprintBoard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import SprintForm from './SprintForm';
import { Plus } from 'lucide-react';
import { useSuiteContext } from '../../providers/SuiteContextProvider';

interface SprintsViewProps {
  suiteId: string;
  sprints: any[];
}

export default function SprintsView({ suiteId, sprints }: SprintsViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { canAdmin } = useSuiteContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sprints
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize and track your testing sprints
          </p>
        </div>
        {canAdmin && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Sprint
          </Button>
        )}
      </div>

      <SprintBoard sprints={sprints} suiteId={suiteId} />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Sprint"
      >
        <SprintForm
          suiteId={suiteId}
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}