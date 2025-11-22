// ============================================
// app/(dashboard)/[suiteId]/sprints/[sprintId]/page.tsx
// ============================================
import { SprintDetail } from "@/components/sprints/SprintDetail";

interface SprintDetailPageProps {
  params: {
    suiteId: string;
    sprintId: string;
  };
}
