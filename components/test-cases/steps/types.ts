// ============================================
// FILE: components/test-cases/types.ts
// Shared types for test case components
// ============================================

export interface TestDataReference {
  typeId: string
  typeName: string
  itemId: string
  itemValue: string
}

export interface ManualStep {
  id: string
  order: number
  description: string
  expectedResult: string
}

export interface AutomatedStep {
  id: string
  order: number
  action: 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'assert' | 'screenshot' | 'scroll' | 'hover'
  selector?: string
  value?: string
  url?: string
  timeout?: number
  expectedValue?: string
  assertionType?: 'exists' | 'visible' | 'enabled' | 'equals' | 'contains'
  description: string
  useTestData?: boolean
  testDataRef?: TestDataReference
}