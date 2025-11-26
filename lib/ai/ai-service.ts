// ============================================
// FILE: lib/ai/ai-service.ts
// ============================================
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AICallOptions, AIResponse, ChatContext, TestCase, BugReport } from './types'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

// Model configurations with pricing
export const AI_MODELS = {
    'gemini-2.0-flash-lite': {
        name: 'gemini-2.0-flash-lite',
        displayName: 'Gemini 2.0 Flash Lite',
        inputCostPer1M: 0.00,
        outputCostPer1M: 0.00,
        contextWindow: 1000000,
        description: 'Free model - fast and efficient'
    },
    'gemini-1.5-pro': {
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        inputCostPer1M: 1.25,
        outputCostPer1M: 5.00,
        contextWindow: 2000000,
        description: 'Advanced reasoning and complex tasks'
    },
    'gemini-pro': {
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        inputCostPer1M: 0.50,
        outputCostPer1M: 1.50,
        contextWindow: 32768,
        description: 'Balanced performance for general tasks'
    }
} as const

export type ModelName = keyof typeof AI_MODELS

export class AIService {
    [x: string]: any
    private currentModel: ModelName = 'gemini-2.0-flash-lite'

    constructor(initialModel?: ModelName) {
        if (initialModel && AI_MODELS[initialModel]) {
            this.currentModel = initialModel
        }
    }

    // ============= CORE AI CALL =============
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
            const text = response.text()

            // Calculate usage and cost - with proper type handling
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

    // ============= DASHBOARD CHAT =============
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

Provide a helpful, data-driven response with actionable insights.`

        const result = await this.callAI(fullPrompt, {
            type: 'dashboard_chat',
            temperature: 0.7,
            maxTokens: 1500
        })

        // Clean up markdown formatting
        if (result.success && result.data?.content) {
            result.data.content = result.data.content
                .replace(/\*\*(.+?)\*\*/g, '$1') // Remove ** bold markers
                .replace(/^#+\s/gm, '') // Keep headers but remove # symbols
                .trim()
        }

        return result
    }

    // ============= TEST CASES GENERATION =============
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
                // Parse JSON from response
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

    // ============= BUG REPORT GENERATION =============
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

    // ============= GRAMMAR CHECK =============
    async checkGrammar(text: string, options: { style?: string } = {}): Promise<AIResponse> {
        const systemInstruction = `You are a professional editor. Check grammar, spelling, and style. Provide corrections in JSON format:

{
  "correctedText": "Fully corrected version",
  "corrections": [
    {
      "original": "Original text",
      "corrected": "Corrected text",
      "type": "grammar|spelling|style",
      "explanation": "Why this change was made"
    }
  ],
  "overallScore": 0-100,
  "suggestions": ["Overall writing improvement suggestions"]
}`

        const prompt = `Check and improve this text:\n\n${text}\n\nStyle preference: ${options.style || 'professional'}`

        return this.callAI(prompt, {
            type: 'grammar_check',
            temperature: 0.3,
            systemInstruction
        })
    }

    // ============= AUTOMATION OPPORTUNITIES =============
    async detectAutomationOpportunities(testCases: TestCase[]): Promise<AIResponse> {
        const systemInstruction = `You are a test automation expert. Analyze test cases and identify automation opportunities.

Provide response in JSON:
{
  "automationScore": 0-100,
  "recommendations": [
    {
      "testCaseId": "TC001",
      "automationPotential": "high|medium|low",
      "reasoning": "Why automate or not",
      "estimatedEffort": "hours",
      "tools": ["Suggested tools"],
      "complexity": "low|medium|high"
    }
  ],
  "summary": "Overall automation strategy"
}`

        const prompt = `Analyze these test cases for automation potential:\n\n${JSON.stringify(testCases, null, 2)}`

        return this.callAI(prompt, {
            type: 'automation_analysis',
            temperature: 0.6,
            systemInstruction
        })
    }

    // ============= QA REPORT GENERATION =============
    async generateQAReport(reportData: any, reportType: string = 'sprint'): Promise<AIResponse> {
        const systemInstruction = `You are a QA manager. Generate comprehensive QA reports with insights and recommendations.`

        const prompt = `Generate a ${reportType} QA report based on this data:\n\n${JSON.stringify(reportData, null, 2)}\n\nInclude: executive summary, key metrics, quality trends, risk areas, and actionable recommendations.`

        return this.callAI(prompt, {
            type: 'qa_report',
            temperature: 0.5,
            maxTokens: 3000,
            systemInstruction
        })
    }

    // ============= DOCUMENTATION GENERATION =============
    async generateDocumentation(content: any, docType: string = 'test_plan'): Promise<AIResponse> {
        const systemInstruction = `You are a technical writer. Generate clear, comprehensive documentation.`

        const prompt = `Generate ${docType} documentation for:\n\n${JSON.stringify(content, null, 2)}\n\nMake it professional, clear, and actionable.`

        return this.callAI(prompt, {
            type: 'documentation',
            temperature: 0.6,
            maxTokens: 3000,
            systemInstruction
        })
    }

    // ============= TEAM IMPROVEMENTS =============
    async generateTeamImprovements(teamData: any): Promise<AIResponse> {
        const systemInstruction = `You are an agile coach. Analyze team performance and provide actionable improvement suggestions.`

        const prompt = `Analyze this team data and provide improvement recommendations:\n\n${JSON.stringify(teamData, null, 2)}`

        return this.callAI(prompt, {
            type: 'team_improvement',
            temperature: 0.7,
            systemInstruction
        })
    }

    // ============= UTILITY METHODS =============
    switchModel(modelName: ModelName) {
        if (!AI_MODELS[modelName]) {
            return {
                success: false,
                error: `Invalid model: ${modelName}`
            }
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
            const result = await this.callAI('Respond with: OK', {
                type: 'health_check',
                maxTokens: 10
            })

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
                error: error.message
            }
        }
    }

    // Build system prompt for dashboard chat
    private buildDashboardSystemPrompt(context: ChatContext): string {
    // Extract readable page name from URL
    const getPageName = (url: string): string => {
        const segments = url.split('/').filter(Boolean)
        const page = segments[segments.length - 1] || 'dashboard'

        const pageNames: Record<string, string> = {
            'dashboard': 'Dashboard Overview',
            'test-cases': 'Test Cases Management',
            'bugs': 'Bug Reports',
            'test-runs': 'Test Execution',
            'analytics': 'Analytics & Reports',
            'team': 'Team Management',
            'settings': 'Settings'
        }

        return pageNames[page] || page.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const pageName = getPageName(context.currentPage)

    // Build data section if available
    let dataSection = ''
    if (context.pageData && Object.keys(context.pageData).length > 2) {
        dataSection = `

REAL-TIME DATA FROM DATABASE:
${JSON.stringify(context.pageData, null, 2)}

IMPORTANT: Use this actual data to provide specific insights. Don't ask for information you already have!`
    }

    return `You are an AI assistant for SURELY, a QA/Test Management platform helping QA engineers and testers.

CURRENT CONTEXT:
- Current Page: ${pageName}
- Test Suite: ${context.suiteName || 'No suite selected'}
- User: ${context.userId}
${dataSection}

YOUR ROLE:
Help users with QA and testing tasks including:
1. Test Case Management - Generate, analyze, and optimize test cases
2. Bug Tracking - Document bugs, analyze patterns, suggest fixes
3. Test Execution - Track test runs, analyze results, identify failures
4. Quality Metrics - Provide insights on coverage, defect density, pass rates
5. Documentation - Generate test plans, reports, release notes
6. Automation - Identify automation opportunities, suggest frameworks

CRITICAL GUIDELINES:
${context.pageData && Object.keys(context.pageData).length > 2 ? `
- ✅ USE THE ACTUAL DATA PROVIDED ABOVE - Don't ask users for data you already have
- ✅ Be SPECIFIC - Reference actual numbers, bug titles, test results from the data
- ✅ Be PROACTIVE - If you see critical issues in the data, mention them
- ✅ Give ACTIONABLE advice based on real numbers
` : `
- User has not provided specific data yet
- Ask clarifying questions or suggest navigating to relevant pages
`}

RESPONSE FORMAT:
- Use clean formatting with headers (#), lists (-), and paragraphs
- Be conversational and helpful
- Provide specific, actionable advice
- Keep responses concise but informative

Examples of GOOD responses when data is available:
- "I can see you have 3 critical bugs in your suite. The most urgent is '[actual bug title]'. Let me help you prioritize..."
- "Your test suite has a 75% pass rate with 5 failing tests. The main issue areas are..."
- "Based on your 12 open bugs, I recommend..."

Examples of BAD responses (avoid):
- "Can you tell me about your bugs?" (when bug data is already provided)
- "What's your current status?" (when status is in the data)

CURRENT PAGE: ${pageName}
${context.suiteName ? `Working on suite: ${context.suiteName}` : 'No test suite selected'}

Engage naturally with the user's questions and help them accomplish their QA tasks efficiently.`
}
}

// Export singleton instance
export const aiService = new AIService()