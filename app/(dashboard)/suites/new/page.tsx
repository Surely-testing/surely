// ============================================
// FILE: app/(dashboard)/suites/new/page.tsx
// ============================================
import { CreateSuiteView } from '@/components/suites/CreateSuiteView'

export const metadata = {
  title: 'Create Test Suite',
  description: 'Create a new test suite for your project',
}

export default function NewSuitePage() {
  return <CreateSuiteView />
}