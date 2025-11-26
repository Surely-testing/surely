// ============================================
// FILE: lib/ai/types.ts
// TypeScript types for the AI system
// ============================================

export type ModelName = 'gemini-2.0-flash-lite' | 'gemini-1.5-pro' | 'gemini-pro'

export interface ModelConfig {
  name: string
  displayName: string
  inputCostPer1M: number
  outputCostPer1M: number
  contextWindow: number
  description: string
}

export interface AICallOptions {
  type?: string
  temperature?: number
  maxTokens?: number
  model?: ModelName
  systemInstruction?: string
}

// Base AI response data that all responses have
interface BaseAIResponseData {
  content: string
  model: string
  tokensUsed: number
  inputTokens: number
  outputTokens: number
  cost: number
  costBreakdown: {
    input_cost: number
    output_cost: number
  }
}

// Extended response data for test cases
interface TestCasesResponseData extends BaseAIResponseData {
  testCases: TestCase[]
}

// Extended response data for bug reports
interface BugReportResponseData extends BaseAIResponseData {
  bugReport: BugReport
}

// Union type for all possible response data shapes
export type AIResponseData = BaseAIResponseData | TestCasesResponseData | BugReportResponseData

export interface AIResponse {
  success: boolean
  data?: AIResponseData
  error?: string
  userMessage?: string
}

export interface ChatContext {
  currentPage: string
  suiteId: string | null
  suiteName: string | null
  userId: string
  userRole?: string
  recentActions: string[]
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  pageData?: Record<string, any>
}

export interface AIUsageLogInput {
  user_id: string
  suite_id: string
  operation_type: string
  operation_name?: string
  asset_type?: string
  asset_ids?: string[]
  provider: 'gemini'
  model: string
  tokens_used: number
  input_tokens?: number
  output_tokens?: number
  cost: number
  cost_breakdown?: {
    input_cost: number
    output_cost: number
  }
  success: boolean
  error_message?: string
  prompt_summary?: string
  prompt_length?: number
  response_summary?: string
  response_length?: number
  duration_ms?: number
  metadata?: Record<string, any>
}

export interface TestCase {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  type: 'functional' | 'integration' | 'regression' | 'performance'
  preconditions: string[]
  steps: Array<{
    step: number
    action: string
    expectedResult: string
  }>
  expectedResult: string
  testData?: string
  automationPotential?: 'high' | 'medium' | 'low'
}

export interface BugReport {
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  description: string
  stepsToReproduce: string[]
  expectedBehavior: string
  actualBehavior: string
  environment: {
    browser?: string
    os?: string
    version?: string
  }
  possibleCause?: string
  suggestedFix?: string
}

export interface UsageStats {
  totalOperations: number
  totalTokens: number
  totalCost: number
  byOperationType: Record<string, { count: number; tokens: number; cost: number }>
  byModel: Record<string, { count: number; tokens: number; cost: number }>
  averageTokensPerOp: number
  averageCostPerOp: number
}

// Type guard functions to check response data shape
export function isTestCasesResponse(data: AIResponseData): data is TestCasesResponseData {
  return 'testCases' in data
}

export function isBugReportResponse(data: AIResponseData): data is BugReportResponseData {
  return 'bugReport' in data
}

export function isBaseResponse(data: AIResponseData): data is BaseAIResponseData {
  return 'content' in data && !('testCases' in data) && !('bugReport' in data)
}