// ============================================
// 1. lib/test-executor/types.ts
// ============================================
export type TestStepAction = 
  | 'navigate' 
  | 'click' 
  | 'fill' 
  | 'select' 
  | 'wait' 
  | 'assert' 
  | 'screenshot' 
  | 'scroll' 
  | 'hover';

export type AssertionType = 
  | 'exists' 
  | 'visible' 
  | 'contains' 
  | 'equals' 
  | 'enabled';

export interface TestDataReference {
  typeId: string;
  typeName: string;
  itemId: string;
  itemValue: string;
}

export interface TestStep {
  id: string;
  order?: number;
  action: TestStepAction;
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
  expectedValue?: string;
  assertionType?: AssertionType;
  description?: string;
  screenshot?: boolean;
  useTestData?: boolean;
  testDataRef?: TestDataReference;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
  priority?: string | null;
  status?: string | null;
}

export interface Environment {
  id: string;
  name: string;
  type: string;
  base_url: string;
  viewport?: { width: number; height: number };
  headers?: Record<string, string>;
  credentials?: Record<string, string>;
  variables?: Record<string, string>;
}

export interface StepResult {
  stepId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface TestExecutionResult {
  testCaseId: string;
  status: 'passed' | 'failed' | 'blocked' | 'skipped';
  duration: number;
  startTime: string;
  endTime: string;
  steps: StepResult[];
  screenshots: string[];
  logs: string[];
  error?: string;
}