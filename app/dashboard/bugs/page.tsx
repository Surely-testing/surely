// ============================================
// app/dashboard/bugs/page.tsx
// ============================================
'use client';

import { BugsView } from "@/components/bugs/BugsView";
import { useSuiteContext } from "@/providers/SuiteContextProvider";
import { Toaster } from "sonner";

export default function BugsPage() {
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
      <BugsView suiteId={suite.id} />
    </>
  );
}