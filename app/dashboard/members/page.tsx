// app/dashboard/members/page.tsx (example path)
'use client';

import { SuiteMembersView } from '@/components/suites/SuiteMembersView';
import { useSuiteContext } from '@/providers/SuiteContextProvider';
import { Toaster } from 'sonner';

export default function SuiteMembersPage() {
  const { suite } = useSuiteContext();

  if (!suite) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading suite...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <SuiteMembersView suiteId={suite.id} />
    </>
  );
}
