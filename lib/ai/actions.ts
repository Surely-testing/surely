// ============================================
// FILE: lib/ai/actions.ts
// ============================================

export type AIActionType = 'bug_report' | 'test_case' | 'test_cases' | 'report' | 'document'

export interface AIGeneratedContent {
  id: string
  type: AIActionType
  status: 'draft' | 'reviewed' | 'saved'
  data: any
  createdAt: Date
}

export interface BugReportDraft {
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  stepsToReproduce: string[]
  expectedBehavior: string
  actualBehavior: string
  environment?: {
    browser?: string
    os?: string
    version?: string
  }
  possibleCause?: string
  suggestedFix?: string
}

export interface TestCaseDraft {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  type: 'functional' | 'integration' | 'regression' | 'performance' | 'security'
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

export interface ReportDraft {
  title: string
  type: 'sprint' | 'release' | 'test_execution' | 'quality'
  summary: string
  sections: Array<{
    title: string
    content: string
  }>
  metrics?: Record<string, any>
  recommendations?: string[]
}

export interface DocumentDraft {
  title: string
  type: 'test_plan' | 'requirements' | 'release_notes' | 'guide'
  content: string
  sections?: Array<{
    title: string
    content: string
  }>
}

// Format generated content for display in chat
export function formatGeneratedContent(content: AIGeneratedContent): string {
  switch (content.type) {
    case 'bug_report':
      return formatBugReport(content.data)
    case 'test_case':
      return formatTestCase(content.data)
    case 'test_cases':
      return formatTestCases(content.data)
    case 'report':
      return formatReport(content.data)
    case 'document':
      return formatDocument(content.data)
    default:
      return JSON.stringify(content.data, null, 2)
  }
}

function formatBugReport(bug: BugReportDraft): string {
  return `# 🐛 Bug Report

**Title:** ${bug.title}

**Severity:** ${bug.severity.toUpperCase()} | **Priority:** ${bug.priority.toUpperCase()}

## Description
${bug.description}

## Steps to Reproduce
${bug.stepsToReproduce.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Expected Behavior
${bug.expectedBehavior}

## Actual Behavior
${bug.actualBehavior}

${bug.environment ? `
## Environment
- Browser: ${bug.environment.browser || 'N/A'}
- OS: ${bug.environment.os || 'N/A'}
- Version: ${bug.environment.version || 'N/A'}
` : ''}

${bug.possibleCause ? `## Possible Cause\n${bug.possibleCause}\n` : ''}
${bug.suggestedFix ? `## Suggested Fix\n${bug.suggestedFix}` : ''}`
}

function formatTestCase(tc: TestCaseDraft): string {
  return `# ✅ Test Case

**Title:** ${tc.title}

**Priority:** ${tc.priority} | **Type:** ${tc.type}

## Description
${tc.description}

## Preconditions
${tc.preconditions.map(p => `- ${p}`).join('\n')}

## Test Steps
${tc.steps.map(s => `
**Step ${s.step}**
Action: ${s.action}
Expected: ${s.expectedResult}
`).join('\n')}

## Expected Result
${tc.expectedResult}

${tc.testData ? `## Test Data\n${tc.testData}\n` : ''}
${tc.automationPotential ? `**Automation Potential:** ${tc.automationPotential}` : ''}`
}

function formatTestCases(testCases: TestCaseDraft[]): string {
  return `# ✅ Generated Test Cases (${testCases.length})

${testCases.map((tc, i) => `
## ${i + 1}. ${tc.title}
**Priority:** ${tc.priority} | **Type:** ${tc.type}

${tc.description}

### Steps
${tc.steps.map(s => `${s.step}. ${s.action}`).join('\n')}
`).join('\n---\n')}`
}

function formatReport(report: ReportDraft): string {
  return `# 📊 ${report.title}

**Type:** ${report.type}

## Summary
${report.summary}

${report.sections.map(section => `
## ${section.title}
${section.content}
`).join('\n')}

${report.recommendations && report.recommendations.length > 0 ? `
## Recommendations
${report.recommendations.map(r => `- ${r}`).join('\n')}
` : ''}`
}

function formatDocument(doc: DocumentDraft): string {
  return `# 📄 ${doc.title}

**Type:** ${doc.type}

${doc.sections ? doc.sections.map(section => `
## ${section.title}
${section.content}
`).join('\n') : doc.content}`
}