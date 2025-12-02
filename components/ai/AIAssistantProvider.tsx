// ============================================
// FILE: components/ai/AIAssistantProvider.tsx
// COMPLETE FIXED VERSION
// ============================================
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { aiService } from '@/lib/ai/ai-service'

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

type AIGeneratedContent = {
  id: string
  type: 'bug_report' | 'test_case' | 'test_cases' | 'report' | 'document'
  status: 'draft' | 'reviewed' | 'saved'
  data: any
  createdAt: Date
}

type AIContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: Message[]
  sendMessage: (message: string) => Promise<void>
  generateTestCases: (prompt: string, config?: any) => Promise<any>
  generateBugReport: (prompt: string, consoleError?: string, context?: any) => Promise<any>
  checkGrammar: (text: string, options?: any) => Promise<any>
  detectAutomation: (testCases: any[]) => Promise<any>
  generateReport: (data: any, type?: string) => Promise<any>
  generateDocumentation: (content: any, type?: string) => Promise<any>
  generatedContent: AIGeneratedContent[]
  reviewContent: (contentId: string) => Promise<void>
  saveContent: (contentId: string, editedData?: any) => Promise<void>
  discardContent: (contentId: string) => Promise<void>
  context: DashboardContext
  updateContext: (updates: Partial<DashboardContext>) => void
  suggestions: Suggestion[]
  dismissSuggestion: (id: string) => void
  currentModel: string
  availableModels: any[]
  switchModel: (modelName: string) => Promise<void>
  isInitialized: boolean
  isHealthy: boolean
  isLoading: boolean
  error: string | null
  sessionStats: {
    operations: number
    tokens: number
    cost: number
  }
}

type DashboardContext = {
  currentPage: string
  suiteId: string | null
  suiteName: string | null
  userId: string
  userRole?: string
  recentActions: string[]
  pageData?: Record<string, any>
}

type Suggestion = {
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

const AIContext = createContext<AIContextType | null>(null)

export function AIAssistantProvider({
  children,
  userId,
  suiteId,
  suiteName
}: {
  children: React.ReactNode
  userId: string
  suiteId: string | null
  suiteName: string | null
}) {
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant for SURELY. I can help you generate test cases, analyze bugs, create reports, and provide insights. What would you like to do?",
      timestamp: new Date()
    }
  ])

  const [context, setContext] = useState<DashboardContext>({
    currentPage: pathname,
    suiteId,
    suiteName,
    userId,
    recentActions: [],
    pageData: {}
  })

  const [isInitialized, setIsInitialized] = useState(false)
  const [isHealthy, setIsHealthy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentModel, setCurrentModel] = useState('gemini-2.0-flash-lite')
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [sessionStats, setSessionStats] = useState({
    operations: 0,
    tokens: 0,
    cost: 0
  })

  // Initialize AI service
  useEffect(() => {
    const init = async () => {
      try {
        const healthCheck = await aiService.testConnection()
        setIsHealthy(healthCheck.healthy)
        setIsInitialized(true)

        const modelInfo = aiService.getCurrentModelInfo()
        setCurrentModel(modelInfo.currentModel)

        const models = aiService.getAvailableModels()
        setAvailableModels(models)

        console.log('✅ AI Assistant initialized')
      } catch (err: any) {
        console.error('❌ AI initialization failed:', err)
        setError(err.message)
      }
    }

    init()
  }, [])

  // Update context when route changes
  useEffect(() => {
    setContext(prev => ({ ...prev, currentPage: pathname }))
  }, [pathname])

  // ✅ FETCH ACTUAL PAGE DATA
  // ✅ FETCH ACTUAL PAGE DATA
  useEffect(() => {
    const fetchPageData = async () => {
      if (!suiteId) {
        console.log('⚠️ No suiteId, skipping data fetch')
        return
      }

      console.log('🔄 Fetching page data for:', pathname, 'Suite:', suiteName)

      try {
        const pageData: Record<string, any> = {
          pageName: pathname.split('/').pop() || 'dashboard',
          suiteId,
          suiteName
        }

        // Fetch based on current page
        if (pathname.includes('/bugs')) {
          console.log('📡 Fetching bugs for suite:', suiteId)
          const response = await fetch(`/api/bugs?suiteId=${suiteId}`)

          if (!response.ok) {
            console.error('❌ Bugs API failed:', response.status, response.statusText)
            return
          }

          const result = await response.json()
          console.log('📥 Bugs API response:', result)

          if (result.success && result.data && Array.isArray(result.data)) {
            const bugs = result.data
            console.log(`✅ Found ${bugs.length} bugs`)

            pageData.bugs = bugs
            pageData.bugStats = {
              total: bugs.length,
              bySeverity: {
                critical: bugs.filter((b: any) => b.severity === 'critical').length,
                high: bugs.filter((b: any) => b.severity === 'high').length,
                medium: bugs.filter((b: any) => b.severity === 'medium').length,
                low: bugs.filter((b: any) => b.severity === 'low').length
              },
              byStatus: {
                open: bugs.filter((b: any) => b.status === 'open').length,
                inProgress: bugs.filter((b: any) => b.status === 'in_progress').length,
                resolved: bugs.filter((b: any) => b.status === 'resolved').length,
                closed: bugs.filter((b: any) => b.status === 'closed').length
              }
            }
            console.log('✅ Bug stats:', pageData.bugStats)
          } else {
            console.log('⚠️ No bugs found or invalid response')
          }
        }

        if (pathname.includes('/test-cases')) {
          console.log('📡 Fetching test cases for suite:', suiteId)
          const response = await fetch(`/api/test-cases?suiteId=${suiteId}`)

          if (!response.ok) {
            console.error('❌ Test cases API failed:', response.status)
            return
          }

          const result = await response.json()
          console.log('📥 Test cases API response:', result)

          if (result.success && result.data && Array.isArray(result.data)) {
            const testCases = result.data
            console.log(`✅ Found ${testCases.length} test cases`)

            pageData.testCases = testCases
            pageData.testCaseStats = {
              total: testCases.length,
              byStatus: {
                passed: testCases.filter((tc: any) => tc.status === 'passed').length,
                failed: testCases.filter((tc: any) => tc.status === 'failed').length,
                pending: testCases.filter((tc: any) => tc.status === 'pending').length,
                skipped: testCases.filter((tc: any) => tc.status === 'skipped').length
              }
            }
            console.log('✅ Test case stats:', pageData.testCaseStats)
          }
        }

        if (pathname.includes('/test-runs')) {
          console.log('📡 Fetching test runs for suite:', suiteId)
          const response = await fetch(`/api/test-runs?suiteId=${suiteId}`)

          if (!response.ok) {
            console.error('❌ Test runs API failed:', response.status)
            return
          }

          const result = await response.json()
          console.log('📥 Test runs API response:', result)

          if (result.success && result.data && Array.isArray(result.data)) {
            const testRuns = result.data
            pageData.testRuns = testRuns.slice(0, 10)
            if (testRuns.length > 0) {
              const latestRun = testRuns[0]
              pageData.latestRunStats = {
                passed: latestRun.passed,
                failed: latestRun.failed,
                total: latestRun.total,
                passRate: Math.round((latestRun.passed / latestRun.total) * 100)
              }
            }
            console.log('✅ Test run stats:', pageData.latestRunStats)
          }
        }

        console.log('✅ Final pageData being set:', pageData)
        console.log('Has bugs?', !!pageData.bugs, 'Count:', pageData.bugs?.length)
        setContext(prev => {
          console.log('🔄 Updating context with pageData')
          return { ...prev, pageData }
        })
      } catch (error) {
        console.error('❌ Error fetching page data:', error)
      }
    }

    // Add a small delay to ensure the component is mounted
    const timeoutId = setTimeout(() => {
      fetchPageData()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [pathname, suiteId, suiteName])

  const updateContext = useCallback((updates: Partial<DashboardContext>) => {
    setContext(prev => ({ ...prev, ...updates }))
  }, [])

  const detectGenerationIntent = useCallback((message: string): string | null => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('generate bug') || lowerMessage.includes('create bug') || lowerMessage.includes('bug report')) {
      return 'bug_report'
    }
    if (lowerMessage.includes('generate test case') && !lowerMessage.includes('test cases')) {
      return 'test_case'
    }
    if (lowerMessage.includes('generate test cases') || lowerMessage.includes('create test cases')) {
      return 'test_cases'
    }
    if (lowerMessage.includes('generate report') || lowerMessage.includes('create report')) {
      return 'report'
    }
    if (lowerMessage.includes('generate document') || lowerMessage.includes('create document')) {
      return 'document'
    }

    return null
  }, [])

  const handleGeneratedContent = useCallback((response: any, intent: string) => {
    try {
      let parsed: any = null

      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        }
      } else if (response && typeof response === 'object') {
        parsed = response
      }

      if (!parsed) {
        console.error('Could not parse generated content:', response)
        return
      }

      let contentData: any

      if (intent === 'bug_report') {
        contentData = {
          title: parsed.title || 'Untitled Bug Report',
          description: parsed.description || 'No description provided',
          severity: parsed.severity || 'medium',
          priority: parsed.priority || 'medium',
          status: parsed.status || 'open',
          stepsToReproduce: Array.isArray(parsed.stepsToReproduce)
            ? parsed.stepsToReproduce
            : (Array.isArray(parsed.steps_to_reproduce)
              ? parsed.steps_to_reproduce
              : ['No steps provided']),
          expectedBehavior: parsed.expectedBehavior || parsed.expected_behavior || 'Not specified',
          actualBehavior: parsed.actualBehavior || parsed.actual_behavior || 'Not specified',
          environment: parsed.environment || {},
          possibleCause: parsed.possibleCause || parsed.possible_cause || '',
          suggestedFix: parsed.suggestedFix || parsed.suggested_fix || ''
        }
      } else if (intent === 'test_cases') {
        contentData = parsed.testCases || [parsed]
      } else if (intent === 'test_case') {
        contentData = {
          title: parsed.title || 'Untitled Test Case',
          description: parsed.description || 'No description provided',
          steps: Array.isArray(parsed.steps) ? parsed.steps : [],
          expectedResult: parsed.expectedResult || parsed.expected_result || 'Not specified',
          priority: parsed.priority || 'medium',
          type: parsed.type || 'functional'
        }
      } else {
        contentData = parsed
      }

      const content: AIGeneratedContent = {
        id: `gen_${Date.now()}`,
        type: intent as AIGeneratedContent['type'],
        status: 'draft',
        data: contentData,
        createdAt: new Date()
      }

      console.log('✅ Generated content added:', content)
      setGeneratedContent(prev => [...prev, content])
    } catch (e) {
      console.error('❌ Failed to parse generated content:', e)
    }
  }, [])

  const sendMessage = useCallback(async (message: string) => {
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    // 🔍 DEBUG LOGGING
    console.log('===========================================')
    console.log('📤 SENDING TO API')
    console.log('Context object:', context)
    console.log('Context.pageData:', context.pageData)
    console.log('Has bugs?:', context.pageData?.bugs)
    console.log('Bugs length:', context.pageData?.bugs?.length)
    console.log('===========================================')

    const intent = detectGenerationIntent(message)

    try {
      let response, data

      response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: context,
          conversationHistory: messages.slice(-10)
        })
      })
      data = await response.json()

      console.log('📥 RESPONSE FROM API:', data)

      if (data.success && data.data) {
        if (data.data.bugReport) {
          handleGeneratedContent(data.data.bugReport, 'bug_report')
        } else if (data.data.testCases) {
          handleGeneratedContent({ testCases: data.data.testCases }, 'test_cases')
        }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Content generated! Review it above and click "Save to Database" when ready.',
        timestamp: new Date(),
        metadata: data.metadata
      }
      setMessages(prev => [...prev, assistantMessage])

      if (data.metadata) {
        setSessionStats(prev => ({
          operations: prev.operations + 1,
          tokens: prev.tokens + (data.metadata.tokensUsed || 0),
          cost: prev.cost + (data.metadata.cost || 0)
        }))
      }

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(prev => [...prev, ...data.suggestions])
      }
    } catch (err: any) {
      console.error('❌ Chat error:', err)
      setError(err.message)

      const errorMessage: Message = {
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [context, messages, detectGenerationIntent, handleGeneratedContent])

  const reviewContent = useCallback(async (contentId: string) => {
    setGeneratedContent(prev => prev.map(c =>
      c.id === contentId ? { ...c, status: 'reviewed' } : c
    ))
  }, [])

  const saveContent = useCallback(async (contentId: string, editedData?: any) => {
    const content = generatedContent.find(c => c.id === contentId)
    if (!content) return

    setIsLoading(true)
    try {
      let endpoint = ''
      let payload: any = {}

      switch (content.type) {
        case 'bug_report':
          endpoint = '/api/bugs'
          const bugData = editedData || content.data
          payload = {
            suiteId: context.suiteId,
            title: bugData.title,
            description: bugData.description,
            severity: bugData.severity,
            priority: bugData.priority,
            status: bugData.status,
            stepsToReproduce: bugData.stepsToReproduce,
            expectedBehavior: bugData.expectedBehavior,
            actualBehavior: bugData.actualBehavior,
            environment: bugData.environment,
            possibleCause: bugData.possibleCause,
            suggestedFix: bugData.suggestedFix
          }
          break

        case 'test_case':
          endpoint = '/api/test-cases'
          payload = {
            suiteId: context.suiteId,
            ...(editedData || content.data)
          }
          break

        case 'test_cases':
          endpoint = '/api/test-cases'
          payload = {
            suiteId: context.suiteId,
            testCases: editedData || content.data
          }
          break

        case 'report':
          endpoint = '/api/reports'
          payload = {
            suiteId: context.suiteId,
            ...(editedData || content.data)
          }
          break

        case 'document':
          endpoint = '/api/documents'
          payload = {
            suiteId: context.suiteId,
            ...(editedData || content.data)
          }
          break
      }

      console.log('💾 Saving to:', endpoint, payload)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save')
      }

      setGeneratedContent(prev => prev.filter(c => c.id !== contentId))

      const successMessage: Message = {
        role: 'assistant',
        content: `✅ Successfully saved ${content.type.replace('_', ' ')} to the database!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, successMessage])

      window.dispatchEvent(new CustomEvent('ai-content-saved', {
        detail: { type: content.type }
      }))

    } catch (err: any) {
      console.error('❌ Save error:', err)
      setError(err.message)

      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Failed to save: ${err.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [generatedContent, context])

  const discardContent = useCallback(async (contentId: string) => {
    setGeneratedContent(prev => prev.filter(c => c.id !== contentId))

    const message: Message = {
      role: 'assistant',
      content: 'Content discarded. Let me know if you need anything else!',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }, [])

  const generateTestCases = useCallback(async (prompt: string, config?: any) => {
    if (!suiteId) return { success: false, error: 'No suite selected' }
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, suiteId, templateConfig: config })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate test cases')

      if (data.data?.tokensUsed) {
        setSessionStats(prev => ({
          operations: prev.operations + 1,
          tokens: prev.tokens + data.data.tokensUsed,
          cost: prev.cost + (data.data.cost || 0)
        }))
      }

      return data
    } catch (err: any) {
      console.error('Test cases error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [suiteId])

  const generateBugReport = useCallback(async (
    prompt: string,
    consoleError?: string,
    additionalContext?: any
  ) => {
    if (!suiteId) return { success: false, error: 'No suite selected' }
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, suiteId, consoleError, additionalContext })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate bug report')

      if (data.data?.tokensUsed) {
        setSessionStats(prev => ({
          operations: prev.operations + 1,
          tokens: prev.tokens + data.data.tokensUsed,
          cost: prev.cost + (data.data.cost || 0)
        }))
      }

      return data
    } catch (err: any) {
      console.error('Bug report error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [suiteId])

  const checkGrammar = useCallback(async (text: string, options?: any) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, options })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to check grammar')

      return data
    } catch (err: any) {
      console.error('Grammar check error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const detectAutomation = useCallback(async (testCases: any[]) => {
    setIsLoading(true)
    try {
      return await aiService.detectAutomationOpportunities(testCases)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateReport = useCallback(async (data: any, type?: string) => {
    setIsLoading(true)
    try {
      return await aiService.generateQAReport(data, type)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateDocumentation = useCallback(async (content: any, type?: string) => {
    setIsLoading(true)
    try {
      return await aiService.generateDocumentation(content, type)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const switchModel = useCallback(async (modelName: string) => {
    try {
      const result = aiService.switchModel(modelName as any)
      if (result.success) {
        setCurrentModel(modelName)
        await aiService.testConnection()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s =>
      s.id === id ? { ...s, dismissed: true } : s
    ))
  }, [])

  const value: AIContextType = {
    isOpen,
    setIsOpen,
    messages,
    sendMessage,
    generateTestCases,
    generateBugReport,
    checkGrammar,
    detectAutomation,
    generateReport,
    generateDocumentation,
    generatedContent,
    reviewContent,
    saveContent,
    discardContent,
    context,
    updateContext,
    suggestions: suggestions.filter(s => !s.dismissed),
    dismissSuggestion,
    currentModel,
    availableModels,
    switchModel,
    isInitialized,
    isHealthy,
    isLoading,
    error,
    sessionStats
  }

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  )
}

export const useAI = () => {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within AIAssistantProvider')
  }
  return context
}