// ============================================
// FILE: app/(dashboard)/[suiteId]/page.tsx
// ============================================
import { SuiteOverview } from "@/components/suites/SuiteOverview"

interface SuiteDashboardPageProps {
  params: Promise<{ suiteId: string }>
}

export default async function SuiteDashboardPage({ params }: SuiteDashboardPageProps) {
  const { suiteId } = await params
  console.log('🎯 Suite Dashboard Page Hit!', suiteId)
  
  return <SuiteOverview suiteId={suiteId} />
  
}

export const metadata = {
  title: 'Suite Overview',
  description: 'Monitor your testing progress and activity',
}