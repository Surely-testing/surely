// ============================================
// FILE: lib/ai/types.ts
// COMPLETE FILE - Replace your entire types.ts with this
// ============================================

export type ModelName = 'google/gemini-flash-1.5' | 'qwen/qwen-2-7b-instruct:free' | 'meta-llama/llama-3-8b-instruct:free' | 'nousresearch/hermes-3-llama-3.1-405b:free'

export interface ModelConfig {
  name: string
  displayName: string
  inputCostPer1M: number
  outputCostPer1M: number
  contextWindow: number
  description: string
}

export type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    generatedContent?: {
      [x: string]: any
      id: string
      type: 'bug_report' | 'test_case' | 'test_cases' | 'report' | 'document' | 'coverage_analysis' | 'automation_analysis' | 'testing_insights'
      data: any
      isSaved?: boolean
    }
    [key: string]: any
  }
}

export type AIGeneratedContent = {
  id: string
  type: 'bug_report' | 'test_case' | 'test_cases' | 'report' | 'document' | 'coverage_analysis' | 'automation_analysis' | 'testing_insights'
  status: 'draft' | 'reviewed' | 'saved'
  data: any
  createdAt: Date
}

export type DashboardContext = {
  currentPage: string
  suiteId: string
  suiteName: string
  userId: string
  userRole?: string
  recentActions: string[]
  pageData?: Record<string, any>
}

export type Suggestion = {
  id: string
  type: 'tip' | 'action' | 'insight' | 'warning'
  title: string
  description: string
  action?: {
    label: string
    handler: () => void
  }
  priority: 'low' | 'medium' | 'high'
  dismissed: boolean
}

export interface AICallOptions {
  type?: string
  temperature?: number
  maxTokens?: number
  model?: ModelName
  systemInstruction?: string
}

// ============================================
// AI Response Data Types
// ============================================

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

// Extended response data for test data generation
interface TestDataResponseData extends BaseAIResponseData {
  testData: string[]
}

// Extended response data for suggestions
interface SuggestionsResponseData extends BaseAIResponseData {
  suggestions: Array<{
    id: string
    type: 'tip' | 'action' | 'insight' | 'warning'
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
  }>
}

// Extended response data for test execution analysis
interface TestExecutionAnalysisResponseData extends BaseAIResponseData {
  analysis: {
    summary: string
    insights: string[]
    issues: Array<{
      type: 'flaky' | 'blocker' | 'performance'
      description: string
      recommendation: string
    }>
    recommendations: string[]
    metrics: {
      stability: 'high' | 'medium' | 'low'
      coverage: string
    }
  }
}

// Extended response data for risk assessment
interface RiskAssessmentResponseData extends BaseAIResponseData {
  riskAssessment: {
    riskLevel: 'critical' | 'high' | 'medium' | 'low'
    riskScore: number
    riskFactors: Array<{
      factor: string
      severity: 'high' | 'medium' | 'low'
      description: string
    }>
    impactAreas: string[]
    mitigationStrategies: Array<{
      strategy: string
      priority: 'high' | 'medium' | 'low'
      steps: string[]
    }>
    testingRecommendations: string[]
  }
}

// Extended response data for error explanation
interface ErrorExplanationResponseData extends BaseAIResponseData {
  errorExplanation: {
    explanation: string
    possibleCauses: string[]
    solutions: Array<{
      solution: string
      steps: string[]
      difficulty: 'easy' | 'medium' | 'hard'
    }>
    prevention: string
  }
}

// ============================================
// NEW: Test Agent Response Data Types
// ============================================

// Coverage Analysis Response Data
export interface CoverageAnalysisData {
  summary: string
  coverageScore: number
  gaps: Array<{
    area: string
    severity: 'high' | 'medium' | 'low'
    reason: string
    bugCount: number
    recommendation: string
  }>
  strengths: string[]
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    impact: string
  }>
}

interface CoverageAnalysisResponseData extends BaseAIResponseData {
  coverageAnalysis: CoverageAnalysisData
}

// Automation Analysis Response Data
export interface AutomationAnalysisData {
  summary: {
    totalCases: number
    recommendedForAutomation: number
    estimatedEffort: string
    expectedROI: 'high' | 'medium' | 'low'
    framework: string
  }
  recommendations: Array<{
    testCaseId: string
    testCaseTitle: string
    automationScore: number
    roi: 'high' | 'medium' | 'low'
    reasoning: string
    estimatedEffort: string
    complexity: 'simple' | 'moderate' | 'complex'
    benefits: string[]
    suggestedApproach: string
  }>
  notRecommended: Array<{
    testCaseId: string
    testCaseTitle: string
    reason: string
  }>
  overallInsight: string
}

interface AutomationAnalysisResponseData extends BaseAIResponseData {
  automationAnalysis: AutomationAnalysisData
}

// Testing Insights Response Data
export interface TestingInsightsData {
  summary: string
  bugPatterns: {
    totalBugs: number
    bySeverity: Record<string, number>
    byComponent: Record<string, number>
    byStatus: Record<string, number>
  }
  testingPatterns: {
    totalTests: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
  }
  keyInsights: Array<{
    type: 'risk' | 'opportunity' | 'concern' | 'success'
    title: string
    description: string
    severity: 'high' | 'medium' | 'low'
    impact: string
  }>
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    category: 'coverage' | 'quality' | 'process' | 'automation'
    action: string
    reasoning: string
    expectedOutcome: string
  }>
  trends: {
    qualityTrend: 'improving' | 'stable' | 'declining'
    riskAreas: string[]
    successAreas: string[]
  }
}

interface TestingInsightsResponseData extends BaseAIResponseData {
  testingInsights: TestingInsightsData
}

// ============================================
// Union type for all possible response data shapes
// ============================================

export type AIResponseData = 
  | BaseAIResponseData 
  | TestCasesResponseData 
  | BugReportResponseData 
  | TestDataResponseData
  | SuggestionsResponseData
  | TestExecutionAnalysisResponseData
  | RiskAssessmentResponseData
  | ErrorExplanationResponseData
  | CoverageAnalysisResponseData
  | AutomationAnalysisResponseData
  | TestingInsightsResponseData

export interface AIResponse {
  success: boolean
  data?: AIResponseData
  error?: string
  userMessage?: string
}

export interface ChatContext {
  currentPage: string
  suiteId?: string | null
  suiteName?: string | null
  userId: string
  conversationHistory: Array<{ role: string; content: string }>
  pageData?: any
}

export interface AIUsageLogInput {
  user_id: string
  suite_id: string
  operation_type: string
  operation_name?: string
  asset_type?: string
  asset_ids?: string[]
  provider: 'gemini' | 'openrouter'
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

// ============================================
// Type guard functions to check response data shape
// ============================================

export function isTestCasesResponse(data: AIResponseData): data is TestCasesResponseData {
  return 'testCases' in data
}

export function isBugReportResponse(data: AIResponseData): data is BugReportResponseData {
  return 'bugReport' in data
}

export function isTestDataResponse(data: AIResponseData): data is TestDataResponseData {
  return 'testData' in data
}

export function isSuggestionsResponse(data: AIResponseData): data is SuggestionsResponseData {
  return 'suggestions' in data
}

export function isTestExecutionAnalysisResponse(data: AIResponseData): data is TestExecutionAnalysisResponseData {
  return 'analysis' in data
}

export function isRiskAssessmentResponse(data: AIResponseData): data is RiskAssessmentResponseData {
  return 'riskAssessment' in data
}

export function isErrorExplanationResponse(data: AIResponseData): data is ErrorExplanationResponseData {
  return 'errorExplanation' in data
}

// NEW: Type guards for Test Agent responses
export function isCoverageAnalysisResponse(data: AIResponseData): data is CoverageAnalysisResponseData {
  return 'coverageAnalysis' in data
}

export function isAutomationAnalysisResponse(data: AIResponseData): data is AutomationAnalysisResponseData {
  return 'automationAnalysis' in data
}

export function isTestingInsightsResponse(data: AIResponseData): data is TestingInsightsResponseData {
  return 'testingInsights' in data
}

export function isBaseResponse(data: AIResponseData): data is BaseAIResponseData {
  return 'content' in data && 
    !('testCases' in data) && 
    !('bugReport' in data) && 
    !('testData' in data) &&
    !('suggestions' in data) &&
    !('analysis' in data) &&
    !('riskAssessment' in data) &&
    !('errorExplanation' in data) &&
    !('coverageAnalysis' in data) &&
    !('automationAnalysis' in data) &&
    !('testingInsights' in data)
}