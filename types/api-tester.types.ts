// ============================================
// FILE: types/api-tester.types.ts
// ============================================

export interface APIRequest {
  id?: string;
  suite_id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string> | null;
  body: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Workflow {
  id?: string;
  suite_id: string;
  name: string;
  steps: WorkflowStep[] | null;
  total_duration?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface WorkflowStep {
  id: string;
  requestId?: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  delay?: number;
  extractVariables?: Array<{
    name: string;
    jsonPath: string;
  }>;
  assertions?: Array<{
    type: 'status' | 'body' | 'header' | 'time';
    operator: 'equals' | 'contains' | 'lessThan' | 'greaterThan';
    expected: string | number;
  }>;
}

export interface WorkflowResult {
  stepId: string;
  name: string;
  status: 'success' | 'failure';
  response?: {
    status: number;
    statusText: string;
    data: any;
    time: number;
  };
  error?: string;
  extractedVariables?: Record<string, any>;
}

export interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
}

// Helper function to normalize API Request from Supabase
export function normalizeAPIRequest(data: any): APIRequest {
  return {
    ...data,
    headers: (data.headers as Record<string, string>) || { 'Content-Type': 'application/json' },
    body: data.body || ''
  };
}

// Helper function to normalize Workflow from Supabase
export function normalizeWorkflow(data: any): Workflow {
  return {
    ...data,
    steps: Array.isArray(data.steps) ? data.steps : []
  };
}