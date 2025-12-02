// ============================================
// app/dashboard/reports/page.tsx
// Reports page with suite context
// ============================================
'use client';

import { ReportsView } from "@/components/reports/ReportsView";
import { useSuiteContext } from "@/providers/SuiteContextProvider";
import { Toaster } from "sonner";

export default function ReportsPage() {
  const { suite } = useSuiteContext();

  if (!suite) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Loading suite...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <ReportsView suiteId={suite.id} />
    </>
  );
}