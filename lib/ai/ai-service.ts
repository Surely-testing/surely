// ============================================
// FILE: lib/ai/ai-service.ts
// ============================================
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AICallOptions, AIResponse, ChatContext, TestCase, BugReport } from './types'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

export const AI_MODELS = {
  'gemini-2.0-flash-lite': {
    name: 'gemini-2.0-flash-lite',
    displayName: 'Gemini 2.0 Flash Lite',
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    contextWindow: 1000000,
    description: 'Free model - fast and efficient'
  },
  'gemini-1.5-flash-latest': {
    name: 'gemini-1.5-flash-latest',
    displayName: 'Gemini 1.5 Flash',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    contextWindow: 1000000,
    description: 'Fast and efficient for most tasks'
  },
  'gemini-1.5-pro-latest': {
    name: 'gemini-1.5-pro-latest',
    displayName: 'Gemini 1.5 Pro',
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    contextWindow: 2000000,
    description: 'Advanced reasoning and complex tasks'
  }
} as const

export type ModelName = keyof typeof AI_MODELS

export class AIService {
  private currentModel: ModelName = 'gemini-2.0-flash-lite'

  constructor(initialModel?: ModelName) {
    if (initialModel && AI_MODELS[initialModel]) {
      this.currentModel = initialModel
    }
  }

  async callAI(prompt: string, options: AICallOptions = {}): Promise<AIResponse> {
    try {
      const modelName = options.model || this.currentModel
      const modelConfig = AI_MODELS[modelName]

      const model = genAI.getGenerativeModel({
        model: modelConfig.name,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 2048,
        },
        systemInstruction: options.systemInstruction
      })

      const result = await model.generateContent(prompt)
      const response = result.response
      let text = response.text()

      // Clean markdown from chat responses
      if (options.type === 'dashboard_chat') {
        text = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#{1,6}\s+/gm, '').replace(/^\* /gm, '• ').replace(/^- /gm, '• ')
      }

      const usage = response.usageMetadata as {
        promptTokenCount?: number
        candidatesTokenCount?: number
        totalTokenCount?: number
      } | undefined

      const inputTokens = usage?.promptTokenCount || 0
      const outputTokens = usage?.candidatesTokenCount || 0
      const totalTokens = usage?.totalTokenCount || 0

      const inputCost = (inputTokens / 1000000) * modelConfig.inputCostPer1M
      const outputCost = (outputTokens / 1000000) * modelConfig.outputCostPer1M
      const totalCost = inputCost + outputCost

      return {
        success: true,
        data: {
          content: text,
          model: modelName,
          tokensUsed: totalTokens,
          inputTokens,
          outputTokens,
          cost: totalCost,
          costBreakdown: { input_cost: inputCost, output_cost: outputCost }
        }
      }
    } catch (error: any) {
      console.error('AI Service Error:', error)
      return {
        success: false,
        error: error.message || 'AI generation failed',
        userMessage: 'Failed to generate content. Please try again.'
      }
    }
  }

  async chatWithContext(message: string, context: ChatContext): Promise<AIResponse> {
    const systemPrompt = this.buildDashboardSystemPrompt(context)

    const conversationContext = context.conversationHistory
      .slice(-5)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n')

    const fullPrompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversationContext}

USER: ${message}

Respond naturally and professionally without markdown formatting. Use the data provided above to answer.`

    return this.callAI(fullPrompt, {
      type: 'dashboard_chat',
      temperature: 0.7,
      maxTokens: 1500
    })
  }

  private buildDashboardSystemPrompt(context: ChatContext): string {
    const pageData = context.pageData || {}

    // Extract clean page name
    const pathSegments = context.currentPage.split('/').filter(Boolean)
    const rawPageName = pathSegments[pathSegments.length - 1] || 'dashboard'
    const cleanPageName = rawPageName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    let dataSection = ''
    let hasData = false

    if (pageData.bugs && Array.isArray(pageData.bugs) && pageData.bugs.length > 0) {
      hasData = true
      const stats = pageData.bugStats
      dataSection += `\n\nBUG DATA FROM DATABASE:
Total: ${pageData.bugs.length} bugs
Severity: ${stats?.bySeverity.critical || 0} critical, ${stats?.bySeverity.high || 0} high, ${stats?.bySeverity.medium || 0} medium, ${stats?.bySeverity.low || 0} low
Status: ${stats?.byStatus.open || 0} open, ${stats?.byStatus.inProgress || 0} in progress, ${stats?.byStatus.resolved || 0} resolved, ${stats?.byStatus.closed || 0} closed

Top bugs:
${pageData.bugs.slice(0, 5).map((b: any, i: number) => `${i + 1}. [${b.severity}] ${b.title} (${b.status})`).join('\n')}`
    }

    if (pageData.testCases && Array.isArray(pageData.testCases) && pageData.testCases.length > 0) {
      hasData = true
      const stats = pageData.testCaseStats
      dataSection += `\n\nTEST CASE DATA FROM DATABASE:
Total: ${pageData.testCases.length} test cases
Status: ${stats?.byStatus.passed || 0} passed, ${stats?.byStatus.failed || 0} failed, ${stats?.byStatus.pending || 0} pending`
    }

    if (pageData.testRuns && Array.isArray(pageData.testRuns) && pageData.testRuns.length > 0) {
      hasData = true
      const latest = pageData.latestRunStats
      dataSection += `\n\nTEST RUN DATA FROM DATABASE:
Latest run: ${latest?.passRate || 0}% pass rate (${latest?.passed || 0}/${latest?.total || 0} passed)`
    }

    return `You are an AI assistant for SURELY QA platform.

Current page: ${cleanPageName}
Suite: ${context.suiteName}
${dataSection}

${hasData
        ? 'IMPORTANT: Use the exact numbers and data above to answer questions. Do NOT say you don\'t have the data or that no data is available.'
        : 'Note: No data has been loaded yet for this page. The user may not have created any items yet, or they may be on a page that doesn\'t have data. Ask what they need help with.'}

Respond naturally without markdown formatting (no **, *, or #). Never mention page routes like "/dashboard/bugs" - just say "Bugs page" or use the page name.`
  }

  async generateTestCases(prompt: string, templateConfig: any = {}): Promise<AIResponse> {
    const systemInstruction = `You are an expert QA engineer. Generate comprehensive test cases in JSON format.

REQUIRED FORMAT:
{
  "testCases": [
    {
      "id": "TC001",
      "title": "Test case title",
      "description": "What this test validates",
      "priority": "high|medium|low",
      "type": "functional|integration|regression|performance",
      "preconditions": ["Precondition 1", "Precondition 2"],
      "steps": [
        {
          "step": 1,
          "action": "What to do",
          "expectedResult": "What should happen"
        }
      ],
      "expectedResult": "Overall expected outcome",
      "testData": "Sample data needed",
      "automationPotential": "high|medium|low"
    }
  ]
}`

    const result = await this.callAI(
      `Generate test cases for: ${prompt}\n\nTemplate preferences: ${JSON.stringify(templateConfig)}`,
      {
        type: 'test_cases',
        temperature: 0.5,
        systemInstruction
      }
    )

    if (result.success && result.data) {
      try {
        const jsonMatch = result.data.content.match(/\{[\s\S]*\}/)?.[0]
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch)
          return {
            ...result,
            data: {
              ...result.data,
              testCases: parsed.testCases || []
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse test cases:', e)
      }
    }

    return result
  }

  async generateBugReport(
    prompt: string,
    consoleError?: string,
    additionalContext: any = {}
  ): Promise<AIResponse> {
    const systemInstruction = `You are an expert bug reporter. Generate detailed bug reports in structured format.

REQUIRED FORMAT:
{
  "title": "Concise bug title",
  "severity": "critical|high|medium|low",
  "priority": "urgent|high|medium|low",
  "description": "Clear description of the issue",
  "stepsToReproduce": ["Step 1", "Step 2", "Step 3"],
  "expectedBehavior": "What should happen",
  "actualBehavior": "What actually happens",
  "environment": {
    "browser": "Browser name",
    "os": "Operating system",
    "version": "App version"
  },
  "possibleCause": "Potential root cause",
  "suggestedFix": "Recommended solution"
}`

    let fullPrompt = `Bug Description: ${prompt}`
    if (consoleError) {
      fullPrompt += `\n\nConsole Error:\n${consoleError}`
    }
    if (Object.keys(additionalContext).length > 0) {
      fullPrompt += `\n\nAdditional Context:\n${JSON.stringify(additionalContext, null, 2)}`
    }

    const result = await this.callAI(fullPrompt, {
      type: 'bug_report',
      temperature: 0.4,
      systemInstruction
    })

    if (result.success && result.data) {
      try {
        const jsonMatch = result.data.content.match(/\{[\s\S]*\}/)?.[0]
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch)
          return {
            ...result,
            data: {
              ...result.data,
              bugReport: parsed
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse bug report:', e)
      }
    }

    return result
  }

  async generateTestData(prompt: string, dataType: string, count: number = 3): Promise<AIResponse> {
    const isPersonaRequest = dataType.toLowerCase().includes('persona') ||
      dataType.toLowerCase().includes('profile') ||
      dataType.toLowerCase().includes('user') ||
      prompt.toLowerCase().includes('persona') ||
      prompt.toLowerCase().includes('profile')

    const systemInstruction = isPersonaRequest
      ? `Generate realistic user personas. Return ONLY a JSON array of formatted strings.`
      : `Generate realistic test data. Return ONLY a JSON array of strings.`

    const fullPrompt = `Generate ${count} ${dataType} values. Return ONLY JSON array, no markdown.`

    const result = await this.callAI(fullPrompt, {
      type: 'test_data_generation',
      temperature: 0.8,
      maxTokens: 1000,
      systemInstruction
    })

    if (result.success && result.data) {
      try {
        let content = result.data.content.trim()
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '')

        const arrayMatch = content.match(/\[[\s\S]*\]/)
        if (arrayMatch) {
          const parsed = JSON.parse(arrayMatch[0])
          if (Array.isArray(parsed)) {
            return {
              ...result,
              data: {
                ...result.data,
                testData: parsed
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse test data:', e)
      }
    }

    return result
  }

  async checkGrammar(text: string, options: { style?: string } = {}): Promise<AIResponse> {
    const systemInstruction = `You are a professional editor. Check grammar, spelling, and style.`
    const prompt = `Check and improve this text:\n\n${text}`
    return this.callAI(prompt, { type: 'grammar_check', temperature: 0.3, systemInstruction })
  }

  async detectAutomationOpportunities(testCases: TestCase[]): Promise<AIResponse> {
    const systemInstruction = `You are a test automation expert. Analyze test cases.`
    const prompt = `Analyze these test cases:\n\n${JSON.stringify(testCases, null, 2)}`
    return this.callAI(prompt, { type: 'automation_analysis', temperature: 0.6, systemInstruction })
  }

  async generateQAReport(reportData: any, reportType: string = 'sprint'): Promise<AIResponse> {
    const systemInstruction = `You are a QA manager. Generate QA reports.`
    const prompt = `Generate a ${reportType} report:\n\n${JSON.stringify(reportData, null, 2)}`
    return this.callAI(prompt, { type: 'qa_report', temperature: 0.5, maxTokens: 3000, systemInstruction })
  }

  async generateDocumentation(content: any, docType: string = 'test_plan'): Promise<AIResponse> {
    const systemInstruction = `You are a technical writer.`
    const prompt = `Generate ${docType} documentation:\n\n${JSON.stringify(content, null, 2)}`
    return this.callAI(prompt, { type: 'documentation', temperature: 0.6, maxTokens: 3000, systemInstruction })
  }

  async generateTeamImprovements(teamData: any): Promise<AIResponse> {
    const systemInstruction = `You are an agile coach.`
    const prompt = `Analyze this team data:\n\n${JSON.stringify(teamData, null, 2)}`
    return this.callAI(prompt, { type: 'team_improvement', temperature: 0.7, systemInstruction })
  }

  switchModel(modelName: ModelName) {
    if (!AI_MODELS[modelName]) {
      return { success: false, error: `Invalid model: ${modelName}` }
    }
    this.currentModel = modelName
    return { success: true, currentModel: this.currentModel, modelInfo: AI_MODELS[modelName] }
  }

  getCurrentModelInfo() {
    return {
      currentModel: this.currentModel,
      ...AI_MODELS[this.currentModel],
      apiKeyConfigured: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY
    }
  }

  getAvailableModels() {
    return Object.entries(AI_MODELS).map(([key, model]) => ({
      id: key,
      ...model
    }))
  }

  async testConnection() {
    try {
      const result = await this.callAI('Respond with: OK', { type: 'health_check', maxTokens: 10 })
      return { success: result.success, healthy: result.success, model: this.currentModel, error: result.error }
    } catch (error: any) {
      return { success: false, healthy: false, error: error.message }
    }
  }
}

export const aiService = new AIService()