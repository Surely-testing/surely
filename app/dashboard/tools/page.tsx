// ============================================
// app/dashboard/tools/page.tsx
// ============================================
'use client';

import { ToolsView } from "@/components/tools/ToolsView";
import { useSuiteContext } from "@/providers/SuiteContextProvider";
import { Toaster } from "sonner";

export default function ToolsPage() {
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
      <ToolsView suiteId={suite.id} />
    </>
  );
}