// ============================================
// app/(dashboard)/[suiteId]/test-cases/page.tsx
// ============================================
import { TestCasesView } from '@/components/test-cases/TestCasesView';

interface TestCasesPageProps {
  params: {
    suiteId: string;
  };
}

export default function TestCasesPage({ params }: TestCasesPageProps) {
  return <TestCasesView suiteId={params.suiteId} testCases={[]} />;
}