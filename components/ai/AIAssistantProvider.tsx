// ============================================
// FILE: components/ai/AIAssistantProvider.tsx
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

type AIContextType = {
  // UI State
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: Message[]

  // Core Functions
  sendMessage: (message: string) => Promise<void>

  // AI Operations
  generateTestCases: (prompt: string, config?: any) => Promise<any>
  generateBugReport: (prompt: string, consoleError?: string, context?: any) => Promise<any>
  checkGrammar: (text: string, options?: any) => Promise<any>
  detectAutomation: (testCases: any[]) => Promise<any>
  generateReport: (data: any, type?: string) => Promise<any>
  generateDocumentation: (content: any, type?: string) => Promise<any>

  // Context Management
  context: DashboardContext
  updateContext: (updates: Partial<DashboardContext>) => void

  // Suggestions
  suggestions: Suggestion[]
  dismissSuggestion: (id: string) => void

  // Model Management
  currentModel: string
  availableModels: any[]
  switchModel: (modelName: string) => Promise<void>

  // Status
  isInitialized: boolean
  isHealthy: boolean
  isLoading: boolean
  error: string | null

  // Stats
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
    handler: string | (() => void)
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

  // UI State
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant for SURELY. I can help you generate test cases, analyze bugs, create reports, and provide insights on your testing activities. What would you like to do?",
      timestamp: new Date()
    }
  ])

  // Context State
  const [context, setContext] = useState<DashboardContext>({
    currentPage: pathname,
    suiteId,
    suiteName,
    userId,
    recentActions: [],
    pageData: {}
  })

  // AI State
  const [isInitialized, setIsInitialized] = useState(false)
  const [isHealthy, setIsHealthy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentModel, setCurrentModel] = useState('gemini-1.5-flash')
  const [availableModels, setAvailableModels] = useState<any[]>([])

  // Suggestions State
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Session Stats
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
    updateContext({ currentPage: pathname })
    generateContextualSuggestions(pathname, suiteId)
  }, [pathname, suiteId])

  const updateContext = useCallback((updates: Partial<DashboardContext>) => {
    setContext(prev => ({ ...prev, ...updates }))
  }, [])

  // Send chat message
  // Send chat message
  const sendMessage = useCallback(async (message: string) => {
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      // Get page-specific data to send with context
      const pageData: Record<string, any> = {}

      // You can extract this from your page's state/props
      // For now, this is a placeholder - you'll need to pass actual data
      if (pathname.includes('/bugs')) {
        pageData.pageName = 'Bug Reports'
        // Add actual bug stats when available
        // pageData.totalBugs = yourBugStats.total
        // pageData.openBugs = yourBugStats.open
        // pageData.resolvedBugs = yourBugStats.resolved
      } else if (pathname.includes('/test-cases')) {
        pageData.pageName = 'Test Cases'
        // Add actual test case stats when available
      } else if (pathname.includes('/test-runs')) {
        pageData.pageName = 'Test Runs'
      } else if (pathname.includes('/analytics')) {
        pageData.pageName = 'Analytics'
      } else {
        pageData.pageName = 'Dashboard'
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            ...context,
            pageData // ADD THIS
          },
          conversationHistory: messages.slice(-10)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      }
      setMessages(prev => [...prev, assistantMessage])

      // Update session stats
      if (data.metadata) {
        setSessionStats(prev => ({
          operations: prev.operations + 1,
          tokens: prev.tokens + (data.metadata.tokensUsed || 0),
          cost: prev.cost + (data.metadata.cost || 0)
        }))
      }

      // Add suggestions
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(prev => [...prev, ...data.suggestions])
      }
    } catch (err: any) {
      console.error('Chat error:', err)
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
  }, [context, messages, pathname]) // ADD pathname to dependencies

  // Generate test cases
  const generateTestCases = useCallback(async (prompt: string, config?: any) => {
    if (!suiteId) {
      return { success: false, error: 'No suite selected' }
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, suiteId, templateConfig: config })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate test cases')
      }

      // Update stats
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

  // Generate bug report
  const generateBugReport = useCallback(async (
    prompt: string,
    consoleError?: string,
    additionalContext?: any
  ) => {
    if (!suiteId) {
      return { success: false, error: 'No suite selected' }
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, suiteId, consoleError, additionalContext })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate bug report')
      }

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

  // Check grammar
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check grammar')
      }

      return data
    } catch (err: any) {
      console.error('Grammar check error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Other AI operations (using direct service calls)
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

  // Switch model
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

  // Generate contextual suggestions
  // Generate contextual suggestions
  const generateContextualSuggestions = useCallback((path: string, suiteId: string | null) => {
    const newSuggestions: Suggestion[] = []

    if (path.includes('/test-cases') && suiteId) {
      newSuggestions.push({
        id: 'testcase-tips-1',
        type: 'tip',
        title: 'Generate More Test Cases',
        description: 'I can help you create comprehensive test cases for your features.',
        action: {
          label: 'Generate Now',
          handler: () => {
            setIsOpen(true)
            sendMessage('Help me generate test cases for my current feature')
          }
        },
        priority: 'high',
        dismissed: false
      })
    }

    if (path.includes('/bugs')) {
      newSuggestions.push({
        id: 'bug-tips-1',
        type: 'insight',
        title: 'Bug Analysis Available',
        description: 'Let me analyze your bug patterns and suggest improvements.',
        action: {
          label: 'Analyze Bugs',
          handler: () => {
            setIsOpen(true)
            sendMessage('Analyze my current bugs and give me insights')
          }
        },
        priority: 'medium',
        dismissed: false
      })
    }

    if (path.includes('/test-runs')) {
      newSuggestions.push({
        id: 'testrun-tips-1',
        type: 'action',
        title: 'Test Execution Insights',
        description: 'I can help you understand test run results and identify issues.',
        action: {
          label: 'Get Insights',
          handler: () => {
            setIsOpen(true)
            sendMessage('Give me insights on my recent test runs')
          }
        },
        priority: 'high',
        dismissed: false
      })
    }

    setSuggestions(newSuggestions)
  }, [sendMessage])

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