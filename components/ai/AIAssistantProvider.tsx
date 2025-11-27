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

  // Content Management
  generatedContent: AIGeneratedContent[]
  reviewContent: (contentId: string) => Promise<void>
  saveContent: (contentId: string, editedData?: any) => Promise<void>
  discardContent: (contentId: string) => Promise<void>

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

  // Content State
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent[]>([])

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

  // Detect generation intent from message
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

  // Handle generated content
  const handleGeneratedContent = useCallback((response: any, intent: string) => {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return

      const parsed = JSON.parse(jsonMatch[0])
      
      const content: AIGeneratedContent = {
        id: `gen_${Date.now()}`,
        type: intent as AIGeneratedContent['type'],
        status: 'draft',
        data: intent === 'test_cases' ? parsed.testCases : parsed,
        createdAt: new Date()
      }

      setGeneratedContent(prev => [...prev, content])
    } catch (e) {
      console.error('Failed to parse generated content:', e)
    }
  }, [])

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

    // Detect if user wants to generate something
    const intent = detectGenerationIntent(message)

    try {
      // Get page-specific data
      const pageData: Record<string, any> = {}

      if (pathname.includes('/bugs')) {
        pageData.pageName = 'Bug Reports'
      } else if (pathname.includes('/test-cases')) {
        pageData.pageName = 'Test Cases'
      } else if (pathname.includes('/test-runs')) {
        pageData.pageName = 'Test Runs'
      } else if (pathname.includes('/analytics')) {
        pageData.pageName = 'Analytics'
      } else {
        pageData.pageName = 'Dashboard'
      }

      let response, data

      // Route to appropriate generation endpoint
      if (intent === 'bug_report') {
        response = await fetch('/api/ai/bug-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: message, 
            suiteId: context.suiteId 
          })
        })
        data = await response.json()
        
        if (data.success && data.data.bugReport) {
          handleGeneratedContent(JSON.stringify(data.data.bugReport), 'bug_report')
        }
      } else if (intent === 'test_case' || intent === 'test_cases') {
        response = await fetch('/api/ai/test-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: message, 
            suiteId: context.suiteId 
          })
        })
        data = await response.json()
        
        if (data.success && data.data.testCases) {
          handleGeneratedContent(JSON.stringify({ testCases: data.data.testCases }), 'test_cases')
        }
      } else {
        // Regular chat
        response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            context: {
              ...context,
              pageData
            },
            conversationHistory: messages.slice(-10)
          })
        })
        data = await response.json()
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
  }, [context, messages, pathname, detectGenerationIntent, handleGeneratedContent])

  // Review content
  const reviewContent = useCallback(async (contentId: string) => {
    setGeneratedContent(prev => prev.map(c => 
      c.id === contentId ? { ...c, status: 'reviewed' } : c
    ))
  }, [])

  // Save content to database
  const saveContent = useCallback(async (contentId: string, editedData?: any) => {
    const content = generatedContent.find(c => c.id === contentId)
    if (!content) return

    setIsLoading(true)
    try {
      let endpoint = ''
      let payload: any = {
        suiteId: context.suiteId,
        createdBy: context.userId
      }

      switch (content.type) {
        case 'bug_report':
          endpoint = '/api/bugs/create'
          payload = {
            ...payload,
            ...(editedData || content.data),
            stepsToReproduce: (editedData || content.data).stepsToReproduce,
            expectedBehavior: (editedData || content.data).expectedBehavior,
            actualBehavior: (editedData || content.data).actualBehavior,
            possibleCause: (editedData || content.data).possibleCause,
            suggestedFix: (editedData || content.data).suggestedFix
          }
          break
          
        case 'test_case':
          endpoint = '/api/test-cases/create'
          payload = {
            ...payload,
            ...(editedData || content.data)
          }
          break
          
        case 'test_cases':
          endpoint = '/api/test-cases/create/bulk'
          payload = {
            suiteId: context.suiteId,
            testCases: editedData || content.data
          }
          break
          
        case 'report':
          endpoint = '/api/reports/create'
          payload = {
            ...payload,
            ...(editedData || content.data)
          }
          break
          
        case 'document':
          endpoint = '/api/documents/create'
          payload = {
            ...payload,
            ...(editedData || content.data)
          }
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save')
      }

      // Update status and remove from generated content
      setGeneratedContent(prev => prev.filter(c => c.id !== contentId))
      
      // Add success message
      const successMessage: Message = {
        role: 'assistant',
        content: `✅ Successfully saved ${content.type.replace('_', ' ')} to the database!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, successMessage])

      // Trigger page refresh if needed
      window.dispatchEvent(new CustomEvent('ai-content-saved', { 
        detail: { type: content.type } 
      }))

    } catch (err: any) {
      console.error('Save error:', err)
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

  // Discard content
  const discardContent = useCallback(async (contentId: string) => {
    setGeneratedContent(prev => prev.filter(c => c.id !== contentId))
    
    const message: Message = {
      role: 'assistant',
      content: 'Content discarded. Let me know if you need anything else!',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }, [])

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

  // Detect automation opportunities
  const detectAutomation = useCallback(async (testCases: any[]) => {
    setIsLoading(true)
    try {
      return await aiService.detectAutomationOpportunities(testCases)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Generate report
  const generateReport = useCallback(async (data: any, type?: string) => {
    setIsLoading(true)
    try {
      return await aiService.generateQAReport(data, type)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Generate documentation
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