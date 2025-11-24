'use client';

import { use } from 'react';
import { SprintDetail } from "@/components/sprints/SprintDetail";
import { useSuiteContext } from '@/providers/SuiteContextProvider';

interface SprintDetailPageProps {
  params: Promise<{
    sprintId: string;
  }>;
}

export default function SprintDetailPage({ params }: SprintDetailPageProps) {
  const { suite } = useSuiteContext();
  const { sprintId } = use(params); // Unwrap the Promise

  if (!suite) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading suite...</p>
        </div>
      </div>
    );
  }

  return <SprintDetail suiteId={suite.id} sprintId={sprintId} />;
}