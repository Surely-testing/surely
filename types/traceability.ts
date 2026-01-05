// ============================================
// types/traceability.ts
// ============================================

export interface BugTraceabilityProps {
  suiteId: string;
  onClose?: () => void;
}

export interface MatrixItem {
  id: string;
  title: string;
  status?: string | null;
  severity?: string | null;
  priority?: string | null;
}

export interface TestCase extends MatrixItem {
  linkedBugs: string[];
  linkedRecordings: string[];
}

export interface BugItem extends MatrixItem {
  linkedTestCases: string[];
  linkedRecordings: string[];
}

export interface Recording extends MatrixItem {
  linkedBugs: string[];
  linkedTestCases: string[];
}

export interface TraceabilityData {
  testCases: TestCase[];
  bugs: BugItem[];
  recordings: Recording[];
}

export interface CoverageStats {
  testCasesWithBugs: number;
  testCasesWithoutBugs: number;
  bugsWithTestCases: number;
  bugsWithoutTestCases: number;
  testCaseCoverage: number;
  bugCoverage: number;
  recordingsLinked: number;
}

export interface AIInsight {
  id: string;
  type: 'critical' | 'warning' | 'optimization' | 'suggestion';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  affectedItems: string[];
}

export type ViewType = 'matrix' | 'coverage' | 'gaps';
export type FilterLevel = 'all' | 'linked' | 'unlinked';