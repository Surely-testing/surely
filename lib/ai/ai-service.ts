// ============================================
// FILE: lib/ai/ai-service.ts
// Production-ready AI service with OpenRouter
// ============================================
import type { AICallOptions, AIResponse, ChatContext, TestCase, BugReport } from './types'
import { logger } from '@/lib/utils/logger'

export const AI_MODELS = {
  'openai/gpt-oss-20b:free': {
    name: 'openai/gpt-oss-20b:free',
    displayName: 'GPT-OSS 20B (Free)',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    contextWindow: 128000,
    description: 'Free - OpenAI open-source model with reasoning'
  },
  'moonshotai/kimi-k2:free': {
    name: 'moonshotai/kimi-k2:free',
    displayName: 'Kimi K2 (Free)',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    contextWindow: 128000,
    description: 'Free - Advanced reasoning and tool use'
  },
  'google/gemini-flash-1.5-8b': {
    name: 'google/gemini-flash-1.5-8b',
    displayName: 'Gemini Flash 1.5 8B',
    inputCostPer1M: 0.0375,
    outputCostPer1M: 0.15,
    contextWindow: 1000000,
    description: 'Fast and affordable (paid)'
  }
} as const

export type ModelName = keyof typeof AI_MODELS

export class AIService {
  private currentModel: ModelName = 'moonshotai/kimi-k2:free'
  private apiKey: string
  private baseURL = 'https://openrouter.ai/api/v1/chat/completions'
  private lastCallTime = 0
  private minInterval = 1000

  constructor(initialModel?: ModelName) {
    if (initialModel && AI_MODELS[initialModel]) {
      this.currentModel = initialModel
    }

    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
      process.env.OPENROUTER_API_KEY || ''
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCallTime

    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastCallTime = Date.now()
  }

  async callAI(prompt: string, options: AICallOptions = {}): Promise<AIResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        userMessage: 'AI service is not properly configured. Please contact support.'
      }
    }

    await this.rateLimit()

    try {
      const modelName = (options.model || this.currentModel) as ModelName
      const modelConfig = AI_MODELS[modelName]

      if (!modelConfig) {
        throw new Error(`Invalid model: ${modelName}`)
      }

      const messages = [
        ...(options.systemInstruction ? [{ role: 'system', content: options.systemInstruction }] : []),
        { role: 'user', content: prompt }
      ]

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          'X-Title': 'SURELY QA Platform'
        },
        body: JSON.stringify({
          model: modelConfig.name,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      let text = data.choices?.[0]?.message?.content || ''

      if (!text) {
        throw new Error('Empty response from AI service')
      }

      const usage = data.usage || {}
      const inputTokens = usage.prompt_tokens || 0
      const outputTokens = usage.completion_tokens || 0
      const totalTokens = usage.total_tokens || 0

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
      logger.log('AI Service Error:', error)
      return {
        success: false,
        error: error.message || 'AI generation failed',
        userMessage: 'Failed to generate content. Please try again.'
      }
    }
  }

  // ============================================
  // COMPLETE chatWithContext METHOD
  // Copy this entire method and replace your current one in /lib/ai/ai-service.ts
  // ============================================

  async chatWithContext(
    message: string,
    context: ChatContext,
    customSystemPrompt?: string
  ): Promise<AIResponse> {
    // Models to try in order (fallback chain)
    const modelsToTry: ModelName[] = [
      this.currentModel,
      'moonshotai/kimi-k2:free',
      'openai/gpt-oss-20b:free'
    ]

    const uniqueModels = Array.from(new Set(modelsToTry))
    let lastError: string = ''

    for (let i = 0; i < uniqueModels.length; i++) {
      const modelToUse = uniqueModels[i]

      try {
        logger.log(`Attempting model ${i + 1}/${uniqueModels.length}: ${modelToUse}`)

        const systemPrompt = customSystemPrompt || this.buildContextualSystemPrompt(context)

        const conversationMessages = (context.conversationHistory || [])
          .slice(-10)
          .map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))

        const messages = [
          { role: 'system', content: systemPrompt },
          ...conversationMessages,
          { role: 'user', content: message }
        ]

        if (!this.apiKey) {
          return {
            success: false,
            error: 'API key not configured',
            userMessage: 'AI service is not properly configured. Please contact support.'
          }
        }

        await this.rateLimit()

        const modelConfig = AI_MODELS[modelToUse]

        const requestBody = {
          model: modelConfig.name,
          messages,
          temperature: 0.7,
          max_tokens: 2048
        }

        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
            'X-Title': 'SURELY QA Platform'
          },
          body: JSON.stringify(requestBody)
        })

        // Handle rate limit - try next model
        if (response.status === 429) {
          logger.log(`Model ${modelToUse} rate-limited, trying next model`)

          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }

          lastError = errorData.error?.message || 'Rate limited'

          if (i < uniqueModels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }

          return {
            success: false,
            error: 'All models are rate-limited',
            userMessage: 'AI service is temporarily busy. Please try again in a moment.'
          }
        }

        // Handle other errors
        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }

          const errorMessage = errorData.error?.message || errorData.message || `API request failed with status ${response.status}`

          return {
            success: false,
            error: errorMessage,
            userMessage: 'Failed to generate response. Please try again.'
          }
        }

        const responseText = await response.text()

        let data
        try {
          data = JSON.parse(responseText)
        } catch (e: any) {
          logger.log('Failed to parse response:', e.message)
          return {
            success: false,
            error: 'Failed to parse AI response',
            userMessage: 'Received invalid response from AI service.'
          }
        }

        const text = data.choices?.[0]?.message?.content || ''

        if (!text) {
          return {
            success: false,
            error: 'Empty response from AI service',
            userMessage: 'AI service returned no content.'
          }
        }

        logger.log(`Success with model: ${modelToUse}`)

        const usage = data.usage || {}
        const inputTokens = usage.prompt_tokens || 0
        const outputTokens = usage.completion_tokens || 0
        const totalTokens = usage.total_tokens || 0

        const inputCost = (inputTokens / 1000000) * modelConfig.inputCostPer1M
        const outputCost = (outputTokens / 1000000) * modelConfig.outputCostPer1M
        const totalCost = inputCost + outputCost

        return {
          success: true,
          data: {
            content: text,
            model: modelToUse,
            tokensUsed: totalTokens,
            inputTokens,
            outputTokens,
            cost: totalCost,
            costBreakdown: { input_cost: inputCost, output_cost: outputCost }
          }
        }

      } catch (error: any) {
        logger.log(`Error with model ${modelToUse}:`, error.message)
        lastError = error.message

        if (i < uniqueModels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        return {
          success: false,
          error: lastError || 'All models failed',
          userMessage: 'Failed to generate response. Please try again.'
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Unknown error occurred',
      userMessage: 'Failed to generate response. Please try again.'
    }
  }

  private buildContextualSystemPrompt(context: ChatContext): string {
    const pageData = context.pageData || {}

    // Extract page name from path
    const pathSegments = context.currentPage.split('/').filter(Boolean)
    const rawPageName = pathSegments[pathSegments.length - 1] || 'dashboard'
    const cleanPageName = rawPageName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    let dataSection = ''
    let hasData = false

    // BUGS DATA
    if (pageData.bugs && Array.isArray(pageData.bugs) && pageData.bugs.length > 0) {
      hasData = true
      const stats = pageData.bugStats

      dataSection += `\n\n=== BUG DATA (${pageData.bugs.length} total) ===
Severity Breakdown:
- Critical: ${stats?.bySeverity?.critical || 0}
- High: ${stats?.bySeverity?.high || 0}
- Medium: ${stats?.bySeverity?.medium || 0}
- Low: ${stats?.bySeverity?.low || 0}

Status Breakdown:
- Open: ${stats?.byStatus?.open || 0}
- In Progress: ${stats?.byStatus?.inProgress || 0}
- Resolved: ${stats?.byStatus?.resolved || 0}
- Closed: ${stats?.byStatus?.closed || 0}

Recent Bugs:
${pageData.bugs.slice(0, 5).map((b: any, i: number) =>
        `${i + 1}. [${b.severity?.toUpperCase()}] ${b.title}
   Status: ${b.status}
   Priority: ${b.priority || 'N/A'}
   ${b.description ? `Description: ${b.description.substring(0, 100)}...` : ''}`
      ).join('\n\n')}`
    }

    // TEST CASES DATA
    if (pageData.testCases && Array.isArray(pageData.testCases) && pageData.testCases.length > 0) {
      hasData = true
      const stats = pageData.testCaseStats

      dataSection += `\n\n=== TEST CASE DATA (${pageData.testCases.length} total) ===
Status Breakdown:
- Passed: ${stats?.byStatus?.passed || 0}
- Failed: ${stats?.byStatus?.failed || 0}
- Pending: ${stats?.byStatus?.pending || 0}
- Skipped: ${stats?.byStatus?.skipped || 0}

Recent Test Cases:
${pageData.testCases.slice(0, 5).map((tc: any, i: number) =>
        `${i + 1}. ${tc.title}
   Priority: ${tc.priority || 'N/A'}
   Status: ${tc.status || 'N/A'}`
      ).join('\n\n')}`
    }

    // TEST RUNS DATA
    if (pageData.testRuns && Array.isArray(pageData.testRuns) && pageData.testRuns.length > 0) {
      hasData = true
      const latest = pageData.latestRunStats

      dataSection += `\n\n=== TEST RUN DATA ===
Latest Test Run:
- Pass Rate: ${latest?.passRate || 0}%
- Passed: ${latest?.passed || 0}
- Failed: ${latest?.failed || 0}
- Total: ${latest?.total || 0}

Recent Runs: ${pageData.testRuns.length}`
    }

    return `You are an intelligent AI assistant for SURELY QA platform. You have full access to the user's dashboard data and can provide detailed insights, analysis, and recommendations.

CURRENT CONTEXT:
- Page: ${cleanPageName}
- Suite: ${context.suiteName || 'No suite selected'}
- User ID: ${context.userId}
${dataSection}

CAPABILITIES:
You can:
1. Analyze bugs and identify patterns, critical issues, and priorities
2. Review test cases and suggest improvements or gaps
3. Assess test run results and identify flaky tests
4. Provide risk assessments for releases or features
5. Generate new test cases, bug reports, or documentation
6. Offer productivity tips and workflow improvements
7. Answer questions about the data shown above

IMPORTANT RULES:
${hasData
        ? '- Use the EXACT numbers and data provided above. Never say you don\'t have access to data.\n- When analyzing, reference specific bugs, test cases, or metrics by name/number.\n- Provide actionable insights based on the actual data.\n- If asked about statistics, use the numbers from above.'
        : '- The user hasn\'t created any items yet on this page, or data hasn\'t loaded.\n- Offer to help them create test cases, bug reports, or explain features.\n- Ask what they need help with to get started.'}

RESPONSE STYLE:
- Be conversational and helpful, not robotic
- Use bullet points for lists but keep them natural
- Don't use markdown formatting (no **, *, or #)
- Be direct and actionable
- When suggesting actions, be specific

Remember: You have FULL ACCESS to all the data shown above. Use it to provide valuable insights!`
  }

  async generateTestCases(prompt: string, templateConfig: any = {}): Promise<AIResponse> {
    const systemInstruction = `You are an expert QA engineer specializing in test case creation.

Generate comprehensive test cases based on the user's requirements.

CRITICAL: You MUST respond with ONLY valid JSON in this exact format, with NO markdown, NO code blocks, NO explanations:

{
  "testCases": [
    {
      "id": "TC001",
      "title": "Test case title",
      "description": "What this test validates",
      "priority": "high",
      "type": "functional",
      "preconditions": ["User is logged in", "Test data is prepared"],
      "steps": [
        {
          "step": 1,
          "action": "Navigate to login page",
          "expectedResult": "Login page loads successfully"
        },
        {
          "step": 2,
          "action": "Enter valid credentials",
          "expectedResult": "Credentials are accepted"
        }
      ],
      "expectedResult": "User successfully logs in and sees dashboard",
      "testData": "Email: test@example.com, Password: Test123!",
      "automationPotential": "high"
    }
  ]
}

RULES:
- Generate 3-5 comprehensive test cases
- Each test case MUST have at least 3-5 detailed steps
- Priority must be one of: high, medium, low, critical
- Type must be one of: functional, integration, regression, performance, security
- automationPotential must be one of: high, medium, low
- Include realistic preconditions and test data
- Steps must have sequential step numbers, clear actions, and expected results
- Return ONLY the JSON object, nothing else`

    const fullPrompt = templateConfig && Object.keys(templateConfig).length > 0
      ? `Generate test cases for: ${prompt}\n\nTemplate preferences: ${JSON.stringify(templateConfig)}\n\nRespond with ONLY the JSON object, no markdown or explanations.`
      : `Generate test cases for: ${prompt}\n\nRespond with ONLY the JSON object, no markdown or explanations.`

    const result = await this.callAI(fullPrompt, {
      type: 'test_cases',
      temperature: 0.7,
      maxTokens: 3000,
      systemInstruction
    })

    if (!result.success || !result.data) {
      logger.log('❌ AI call failed:', result.error)
      return result
    }

    try {
      let content = result.data.content.trim()
      logger.log('📝 Raw AI Response:', content.substring(0, 200) + '...')

      // Remove markdown code blocks if present
      content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

      // Try to extract JSON object
      let jsonStr = content

      // Look for JSON object boundaries
      const startIndex = content.indexOf('{')
      const endIndex = content.lastIndexOf('}')

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonStr = content.substring(startIndex, endIndex + 1)
      }

      logger.log('🔍 Extracted JSON:', jsonStr.substring(0, 200) + '...')

      const parsed = JSON.parse(jsonStr)

      // Validate the structure
      if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
        logger.log('❌ Invalid structure: testCases not found or not an array')
        return {
          success: false,
          error: 'Invalid response structure: missing testCases array',
          userMessage: 'Failed to generate test cases. Please try again.'
        }
      }

      if (parsed.testCases.length === 0) {
        logger.log('❌ Empty test cases array')
        return {
          success: false,
          error: 'Generated test cases array is empty',
          userMessage: 'No test cases were generated. Please try with more specific requirements.'
        }
      }

      logger.log(`✅ Successfully parsed ${parsed.testCases.length} test cases`)
      logger.log('Sample test case:', JSON.stringify(parsed.testCases[0], null, 2))

      return {
        success: true,
        data: {
          ...result.data,
          testCases: parsed.testCases
        }
      }
    } catch (e: any) {
      logger.log('❌ Failed to parse test cases JSON:', e.message)
      logger.log('Content that failed to parse:', result.data.content.substring(0, 500))

      return {
        success: false,
        error: `JSON parsing failed: ${e.message}`,
        userMessage: 'Failed to process test cases. The AI response was not in the expected format.'
      }
    }
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
        logger.log('Failed to parse bug report:', e)
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
        logger.log('Failed to parse test data:', e)
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
    const systemInstruction = `You are a test automation expert. Analyze test cases for automation potential.`
    const prompt = `Analyze these test cases and identify automation opportunities:\n\n${JSON.stringify(testCases, null, 2)}`
    return this.callAI(prompt, { type: 'automation_analysis', temperature: 0.6, systemInstruction })
  }

  async generateQAReport(reportData: any, reportType: string = 'sprint'): Promise<AIResponse> {
    const systemInstruction = `You are a QA manager. Generate comprehensive QA reports.`
    const prompt = `Generate a ${reportType} report based on this data:\n\n${JSON.stringify(reportData, null, 2)}`
    return this.callAI(prompt, { type: 'qa_report', temperature: 0.5, maxTokens: 3000, systemInstruction })
  }

  async generateDocumentation(content: any, docType: string = 'test_plan'): Promise<AIResponse> {
    const systemInstruction = `You are a technical writer specializing in QA documentation.`
    const prompt = `Generate ${docType} documentation for:\n\n${JSON.stringify(content, null, 2)}`
    return this.callAI(prompt, { type: 'documentation', temperature: 0.6, maxTokens: 3000, systemInstruction })
  }

  async generateTeamImprovements(teamData: any): Promise<AIResponse> {
    const systemInstruction = `You are an agile coach specializing in QA team optimization.`
    const prompt = `Analyze this team data and provide improvement recommendations:\n\n${JSON.stringify(teamData, null, 2)}`
    return this.callAI(prompt, { type: 'team_improvement', temperature: 0.7, systemInstruction })
  }

  async generateSuggestions(context: {
    currentPage: string
    recentActions: string[]
    pageData?: any
    userRole?: string
  }): Promise<AIResponse> {
    const systemInstruction = `You are a QA assistant. Generate 2-3 actionable suggestions based on the user's context.

Return ONLY a JSON array:
[
  {
    "id": "suggestion-1",
    "type": "tip|action|insight|warning",
    "title": "Short title",
    "description": "Brief description",
    "priority": "low|medium|high"
  }
]`

    const prompt = `Current page: ${context.currentPage}
Recent actions: ${context.recentActions.join(', ')}
Page data: ${JSON.stringify(context.pageData || {})}
User role: ${context.userRole || 'tester'}

Generate helpful suggestions for what the user should do next.`

    const result = await this.callAI(prompt, {
      type: 'suggestions',
      temperature: 0.7,
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
                suggestions: parsed
              }
            }
          }
        }
      } catch (e) {
        logger.log('Failed to parse suggestions:', e)
      }
    }

    return result
  }

  async rewriteContent(text: string, options: {
    style?: 'professional' | 'casual' | 'technical' | 'concise'
    tone?: 'formal' | 'friendly' | 'neutral'
    action?: 'improve' | 'simplify' | 'expand' | 'fix'
  } = {}): Promise<AIResponse> {
    const style = options.style || 'professional'
    const tone = options.tone || 'neutral'
    const action = options.action || 'improve'

    const systemInstruction = `You are a professional editor. Rewrite the text according to the specified style and tone.

Style: ${style}
Tone: ${tone}
Action: ${action}

Return ONLY the rewritten text, no explanations or markdown.`

    const prompt = `Rewrite this text:\n\n${text}`

    return this.callAI(prompt, {
      type: 'content_rewrite',
      temperature: 0.6,
      systemInstruction
    })
  }

  async analyzeTestExecution(executionData: {
    testRuns: any[]
    testCases: any[]
    failures: any[]
    duration?: number
  }): Promise<AIResponse> {
    const systemInstruction = `You are a QA analyst. Analyze test execution results and provide insights.

Return JSON format:
{
  "summary": "Overall execution summary",
  "insights": ["Insight 1", "Insight 2"],
  "issues": [
    {
      "type": "flaky|blocker|performance",
      "description": "Issue description",
      "recommendation": "How to fix"
    }
  ],
  "recommendations": ["Action 1", "Action 2"],
  "metrics": {
    "stability": "high|medium|low",
    "coverage": "percentage or assessment"
  }
}`

    const prompt = `Analyze this test execution data:\n\n${JSON.stringify(executionData, null, 2)}`

    const result = await this.callAI(prompt, {
      type: 'test_execution_analysis',
      temperature: 0.5,
      maxTokens: 2000,
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
              analysis: parsed
            }
          }
        }
      } catch (e) {
        logger.log('Failed to parse execution analysis:', e)
      }
    }

    return result
  }

  async assessRisk(item: {
    type: 'feature' | 'release' | 'change' | 'bug'
    title: string
    description: string
    context?: any
  }): Promise<AIResponse> {
    const systemInstruction = `You are a QA risk analyst. Assess the risk level and provide mitigation strategies.

Return JSON format:
{
  "riskLevel": "critical|high|medium|low",
  "riskScore": 1-10,
  "riskFactors": [
    {
      "factor": "Factor name",
      "severity": "high|medium|low",
      "description": "Why this is a risk"
    }
  ],
  "impactAreas": ["Area 1", "Area 2"],
  "mitigationStrategies": [
    {
      "strategy": "Strategy name",
      "priority": "high|medium|low",
      "steps": ["Step 1", "Step 2"]
    }
  ],
  "testingRecommendations": ["Recommendation 1", "Recommendation 2"]
}`

    const prompt = `Assess risk for this ${item.type}:

Title: ${item.title}
Description: ${item.description}
${item.context ? `Context: ${JSON.stringify(item.context)}` : ''}`

    const result = await this.callAI(prompt, {
      type: 'risk_assessment',
      temperature: 0.4,
      maxTokens: 2000,
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
              riskAssessment: parsed
            }
          }
        }
      } catch (e) {
        logger.log('Failed to parse risk assessment:', e)
      }
    }

    return result
  }

  async generateReleaseNotes(releaseData: {
    version: string
    features: any[]
    bugFixes: any[]
    improvements: any[]
    breakingChanges?: any[]
  }): Promise<AIResponse> {
    const systemInstruction = `You are a technical writer. Generate clear, professional release notes.

Format the output in markdown with sections for:
- Overview
- New Features
- Bug Fixes
- Improvements
- Breaking Changes (if any)
- Known Issues (if any)

Make it user-friendly and highlight important changes.`

    const prompt = `Generate release notes for version ${releaseData.version}:

Features: ${JSON.stringify(releaseData.features, null, 2)}
Bug Fixes: ${JSON.stringify(releaseData.bugFixes, null, 2)}
Improvements: ${JSON.stringify(releaseData.improvements, null, 2)}
${releaseData.breakingChanges ? `Breaking Changes: ${JSON.stringify(releaseData.breakingChanges, null, 2)}` : ''}`

    return this.callAI(prompt, {
      type: 'release_notes',
      temperature: 0.6,
      maxTokens: 3000,
      systemInstruction
    })
  }

  async explainError(error: {
    message: string
    stack?: string
    code?: string
    context?: any
  }): Promise<AIResponse> {
    const systemInstruction = `You are a debugging assistant. Explain the error in simple terms and provide solutions.

Return JSON format:
{
  "explanation": "What the error means in simple terms",
  "possibleCauses": ["Cause 1", "Cause 2"],
  "solutions": [
    {
      "solution": "Solution description",
      "steps": ["Step 1", "Step 2"],
      "difficulty": "easy|medium|hard"
    }
  ],
  "prevention": "How to prevent this in the future"
}`

    const prompt = `Explain this error:

Message: ${error.message}
${error.stack ? `Stack: ${error.stack}` : ''}
${error.code ? `Code: ${error.code}` : ''}
${error.context ? `Context: ${JSON.stringify(error.context)}` : ''}`

    const result = await this.callAI(prompt, {
      type: 'error_explanation',
      temperature: 0.5,
      maxTokens: 1500,
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
              errorExplanation: parsed
            }
          }
        }
      } catch (e) {
        logger.log('Failed to parse error explanation:', e)
      }
    }

    return result
  }

  switchModel(modelName: ModelName): { success: boolean; currentModel?: ModelName; modelInfo?: any; error?: string } {
    if (!AI_MODELS[modelName]) {
      return { success: false, error: `Invalid model: ${modelName}` }
    }
    this.currentModel = modelName
    return {
      success: true,
      currentModel: this.currentModel,
      modelInfo: AI_MODELS[modelName]
    }
  }

  getCurrentModelInfo() {
    return {
      currentModel: this.currentModel,
      ...AI_MODELS[this.currentModel],
      apiKeyConfigured: !!this.apiKey
    }
  }

  getAvailableModels() {
    return Object.entries(AI_MODELS).map(([key, model]) => ({
      id: key,
      ...model
    }))
  }

  async testConnection(): Promise<{ success: boolean; healthy: boolean; model: string; error?: string }> {
    try {
      const result = await this.callAI('Respond with: OK', { type: 'health_check', maxTokens: 10 })
      return {
        success: result.success,
        healthy: result.success,
        model: this.currentModel,
        error: result.error
      }
    } catch (error: any) {
      return {
        success: false,
        healthy: false,
        model: this.currentModel,
        error: error.message
      }
    }
  }

  // ============================================
  // ADD THESE METHODS TO YOUR EXISTING lib/ai/ai-service.ts
  // Paste them into the AIService class, before the closing brace
  // ============================================

  /**
   * Analyze test coverage and identify gaps
   */
  async analyzeCoverage(data: {
    testCases: any[]
    bugs: any[]
    suiteId: string
    suiteName: string
  }): Promise<AIResponse> {
    const systemInstruction = `You are a QA coverage analyst. Analyze test coverage and identify gaps.

REQUIRED JSON FORMAT:
{
  "summary": "Brief overview of coverage status",
  "coverageScore": 0-100,
  "gaps": [
    {
      "area": "Component/Feature name",
      "severity": "high|medium|low",
      "reason": "Why this is a gap",
      "bugCount": 0,
      "recommendation": "What tests to add"
    }
  ],
  "strengths": ["Area 1", "Area 2"],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "Specific action to take",
      "impact": "Expected improvement"
    }
  ]
}

Return ONLY the JSON object.`

    const prompt = `Analyze test coverage for: ${data.suiteName}

TEST CASES (${data.testCases.length}):
${JSON.stringify(data.testCases.map(tc => ({
      title: tc.title,
      module: tc.module || tc.feature || tc.component,
      status: tc.status,
      priority: tc.priority
    })), null, 2)}

BUGS (${data.bugs.length}):
${JSON.stringify(data.bugs.map(b => ({
      title: b.title,
      component: b.component || b.module || b.feature,
      severity: b.severity,
      status: b.status
    })), null, 2)}

Identify which areas have bugs but no test coverage, and recommend what tests to create.`

    const result = await this.callAI(prompt, {
      type: 'coverage_analysis',
      temperature: 0.4,
      maxTokens: 2000,
      systemInstruction
    })

    if (result.success && result.data) {
      try {
        let content = result.data.content.trim()
        content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            ...result,
            data: {
              ...result.data,
              coverageAnalysis: parsed
            }
          }
        }
      } catch (e) {
        logger.log('Failed to parse coverage analysis:', e)
      }
    }

    return result
  }

  /**
   * Identify automation opportunities with ROI analysis
   */
  async analyzeAutomation(data: {
    testCases: any[]
    suiteId: string
    framework?: string
  }): Promise<AIResponse> {
    const framework = data.framework || 'Playwright'

    const systemInstruction = `You are a test automation architect. Analyze test cases and score automation potential.

REQUIRED JSON FORMAT:
{
  "summary": {
    "totalCases": 0,
    "recommendedForAutomation": 0,
    "estimatedEffort": "X hours",
    "expectedROI": "high|medium|low",
    "framework": "${framework}"
  },
  "recommendations": [
    {
      "testCaseId": "TC_XXX",
      "testCaseTitle": "Test case title",
      "automationScore": 0-100,
      "roi": "high|medium|low",
      "reasoning": "Why automate this",
      "estimatedEffort": "X hours",
      "complexity": "simple|moderate|complex",
      "benefits": ["Benefit 1", "Benefit 2"],
      "suggestedApproach": "Technical approach"
    }
  ],
  "notRecommended": [
    {
      "testCaseId": "TC_XXX",
      "testCaseTitle": "Test case title",
      "reason": "Why not to automate"
    }
  ],
  "overallInsight": "Key takeaway about automation strategy"
}

Scoring criteria:
- Repeatability (0-30): How often is this executed?
- Complexity (0-25): Is it simple to automate?
- Stability (0-25): Is the feature stable?
- ROI (0-20): Time saved vs effort

Return ONLY the JSON object.`

    const prompt = `Analyze these ${data.testCases.length} test cases for automation potential using ${framework}:

${JSON.stringify(data.testCases.map(tc => ({
      id: tc.id,
      title: tc.title,
      description: tc.description,
      type: tc.type,
      priority: tc.priority,
      steps: tc.steps?.length || 0,
      complexity: tc.steps?.length > 10 ? 'complex' : tc.steps?.length > 5 ? 'moderate' : 'simple'
    })), null, 2)}

Consider:
1. Which tests are executed frequently?
2. Which are time-consuming to run manually?
3. Which have stable, predictable steps?
4. What's the ROI (time saved vs automation effort)?`

    const result = await this.callAI(prompt, {
      type: 'automation_analysis',
      temperature: 0.4,
      maxTokens: 3000,
      systemInstruction
    })

    if (result.success && result.data) {
      try {
        let content = result.data.content.trim()
        content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            ...result,
            data: {
              ...result.data,
              automationAnalysis: parsed
            }
          }
        }
      } catch (e) {
        logger.log('Failed to parse automation analysis:', e)
      }
    }

    return result
  }

  /**
   * Generate insights from testing history and bug patterns
   */
  async analyzeTestingInsights(data: {
    bugs: any[]
    testCases: any[]
    testRuns?: any[]
    suiteId: string
    suiteName: string
  }): Promise<AIResponse> {
    const systemInstruction = `You are a QA data analyst. Analyze testing patterns and provide actionable insights.

REQUIRED JSON FORMAT:
{
  "summary": "Executive summary of testing health",
  "bugPatterns": {
    "totalBugs": 0,
    "bySeverity": {"critical": 0, "high": 0, "medium": 0, "low": 0},
    "byComponent": {"Component1": 0, "Component2": 0},
    "byStatus": {"open": 0, "in_progress": 0, "resolved": 0}
  },
  "testingPatterns": {
    "totalTests": 0,
    "byStatus": {"passed": 0, "failed": 0, "pending": 0},
    "byPriority": {"high": 0, "medium": 0, "low": 0}
  },
  "keyInsights": [
    {
      "type": "risk|opportunity|concern|success",
      "title": "Insight title",
      "description": "Detailed explanation",
      "severity": "high|medium|low",
      "impact": "What this means"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "coverage|quality|process|automation",
      "action": "Specific action to take",
      "reasoning": "Why this matters",
      "expectedOutcome": "What will improve"
    }
  ],
  "trends": {
    "qualityTrend": "improving|stable|declining",
    "riskAreas": ["Area1", "Area2"],
    "successAreas": ["Area1", "Area2"]
  }
}

Return ONLY the JSON object.`

    const prompt = `Analyze testing patterns for: ${data.suiteName}

BUGS (${data.bugs.length}):
${JSON.stringify(data.bugs.map(b => ({
      severity: b.severity,
      status: b.status,
      component: b.component || b.module,
      created_at: b.created_at
    })), null, 2)}

TEST CASES (${data.testCases.length}):
${JSON.stringify(data.testCases.map(tc => ({
      priority: tc.priority,
      status: tc.status,
      module: tc.module || tc.feature
    })), null, 2)}

${data.testRuns ? `TEST RUNS (${data.testRuns.length}):
${JSON.stringify(data.testRuns.slice(0, 10).map(tr => ({
      passed: tr.passed,
      failed: tr.failed,
      total: tr.total,
      date: tr.executed_at
    })), null, 2)}` : ''}

Identify:
1. Which components have the most bugs?
2. Are there patterns in bug severity?
3. Where is test coverage weak?
4. What are the biggest risks?
5. What's working well?`

    const result = await this.callAI(prompt, {
      type: 'testing_insights',
      temperature: 0.5,
      maxTokens: 2500,
      systemInstruction
    })

    if (result.success && result.data) {
      try {
        let content = result.data.content.trim()
        content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            ...result,
            data: {
              ...result.data,
              testingInsights: parsed
            }
          }
        }
      } catch (e) {
        logger.log('Failed to parse testing insights:', e)
      }
    }

    return result
  }

  /**
   * Enhanced test case generation with context awareness
   */
  async generateTestCasesWithContext(data: {
    prompt: string
    suiteId: string
    suiteName: string
    existingTestCases?: any[]
    recentBugs?: any[]
    framework?: string
    standards?: string[]
  }): Promise<AIResponse> {
    const standards = data.standards || [
      'Test cases must be independent and atomic',
      'Use Given-When-Then format for acceptance criteria',
      'Include at least one negative test per feature'
    ]

    const systemInstruction = `You are a Senior QA Engineer. Generate comprehensive test cases based on requirements and existing patterns.

CONTEXT:
- Suite: ${data.suiteName}
- Framework: ${data.framework || 'N/A'}
- Team Standards: ${standards.join('; ')}

${data.existingTestCases && data.existingTestCases.length > 0 ? `
EXISTING TEST PATTERNS (learn from these):
${JSON.stringify(data.existingTestCases.slice(0, 3), null, 2)}

Follow similar structure and naming conventions.` : ''}

${data.recentBugs && data.recentBugs.length > 0 ? `
RECENT BUGS (cover these scenarios):
${JSON.stringify(data.recentBugs.slice(0, 3).map((b: any) => ({
      title: b.title,
      severity: b.severity,
      component: b.component
    })), null, 2)}

Include regression tests for these bug areas.` : ''}

REQUIRED JSON FORMAT:
{
  "testCases": [
    {
      "id": "TC_XXX",
      "title": "Clear, action-oriented title",
      "description": "What this test validates",
      "priority": "high|medium|low",
      "type": "functional|integration|regression|smoke",
      "preconditions": ["Precondition 1"],
      "steps": [
        {
          "step": 1,
          "action": "Clear action",
          "expectedResult": "Expected outcome"
        }
      ],
      "expectedResult": "Overall expected result",
      "testData": "Required test data",
      "automationPotential": "high|medium|low"
    }
  ]
}

REQUIREMENTS:
- Generate 3-5 comprehensive test cases
- Include positive, negative, and edge case scenarios
- Each test must have 3-5 detailed steps
- Steps must be clear enough for a junior tester to execute
- Consider the recent bugs when designing test scenarios

Return ONLY the JSON object.`

    const result = await this.callAI(data.prompt, {
      type: 'test_cases_enhanced',
      temperature: 0.7,
      maxTokens: 3000,
      systemInstruction
    })

    if (result.success && result.data) {
      try {
        let content = result.data.content.trim()
        content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])

          if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
            return {
              success: false,
              error: 'Invalid response structure',
              userMessage: 'Failed to generate test cases'
            }
          }

          return {
            ...result,
            data: {
              ...result.data,
              testCases: parsed.testCases
            }
          }
        }
      } catch (e) {
        logger.log('Failed to parse enhanced test cases:', e)
      }
    }

    return result
  }

  /**
   * Enhanced bug report generation with root cause analysis
   */
  async generateBugReportWithContext(data: {
    prompt: string
    consoleError?: string
    suiteId: string
    suiteName: string
    recentBugs?: any[]
    component?: string
  }): Promise<AIResponse> {
    const systemInstruction = `You are a Bug Analysis Specialist. Generate detailed bug reports with root cause analysis.

${data.recentBugs && data.recentBugs.length > 0 ? `
RECENT BUG PATTERNS (for context):
${JSON.stringify(data.recentBugs.slice(0, 3).map((b: any) => ({
      title: b.title,
      severity: b.severity,
      component: b.component,
      possibleCause: b.possibleCause
    })), null, 2)}

Learn from these patterns when analyzing the current issue.` : ''}

REQUIRED JSON FORMAT:
{
  "title": "Concise, descriptive title",
  "severity": "critical|high|medium|low",
  "priority": "urgent|high|medium|low",
  "description": "Detailed description of the issue",
  "stepsToReproduce": ["Step 1", "Step 2", "Step 3"],
  "expectedBehavior": "What should happen",
  "actualBehavior": "What actually happens",
  "environment": {
    "browser": "Browser name/version",
    "os": "Operating system",
    "version": "App version"
  },
  "possibleCause": "Technical root cause hypothesis",
  "suggestedFix": "Recommended solution approach",
  "affectedComponents": ["Component1"],
  "regressionRisk": "high|medium|low",
  "workaround": "Temporary workaround if available"
}

SEVERITY GUIDELINES:
- Critical: System crash, data loss, security breach
- High: Major feature broken, no workaround
- Medium: Feature degraded, workaround exists
- Low: Minor issue, cosmetic, edge case

Return ONLY the JSON object.`

    let fullPrompt = `Suite: ${data.suiteName}
${data.component ? `Component: ${data.component}` : ''}

Bug Description: ${data.prompt}`

    if (data.consoleError) {
      fullPrompt += `

CONSOLE ERROR/STACK TRACE:
${data.consoleError}

Analyze this error and determine the root cause.`
    }

    const result = await this.callAI(fullPrompt, {
      type: 'bug_report_enhanced',
      temperature: 0.4,
      maxTokens: 2000,
      systemInstruction
    })

    if (result.success && result.data) {
      try {
        let content = result.data.content.trim()
        content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '')

        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            ...result,
            data: {
              ...result.data,
              bugReport: parsed
            }
          }
        }
      } catch (e) {
        logger.log('Failed to parse enhanced bug report:', e)
      }
    }

    return result
  }

}

export const aiService = new AIService()