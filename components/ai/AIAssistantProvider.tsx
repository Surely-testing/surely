'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { aiService } from '@/lib/ai/ai-service'
import { createClient } from '@/lib/supabase/client'
import type {
  Message,
  AIGeneratedContent,
  DashboardContext,
  Suggestion
} from '@/lib/ai/types'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

type AIContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: Message[]
  sendMessage: (message: string) => Promise<void>
  resetMessages: () => void
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
  viewSavedContent: (messageMetadata: any) => void
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
  currentSessionId: string | null
  loadSession: (sessionId: string) => Promise<void>
  robotPosition: { x: number; y: number }
  setRobotPosition: (pos: { x: number; y: number }) => void
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
  suiteId: string
  suiteName: string
}) {
  const pathname = usePathname()
  const supabase = createClient()

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
  const [currentModel, setCurrentModel] = useState('openai/gpt-oss-20b:free')
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const deletedContentIdsRef = useRef<Set<string>>(new Set())
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [sessionStats, setSessionStats] = useState({
    operations: 0,
    tokens: 0,
    cost: 0
  })
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const [robotPosition, setRobotPosition] = useState<{ x: number; y: number }>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-robot-position')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return { x: window.innerWidth - 100, y: window.innerHeight - 120 }
        }
      }
    }
    return { x: window.innerWidth - 100, y: window.innerHeight - 120 }
  })

  useEffect(() => {
    localStorage.setItem('ai-robot-position', JSON.stringify(robotPosition))
  }, [robotPosition])

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

        logger.log('✅ AI Assistant initialized with model:', modelInfo.currentModel)
      } catch (err: any) {
        logger.log('AI initialization failed:', err)
        setError(err.message)
      }
    }

    init()
  }, [])

  // Update context when route or suite changes
  useEffect(() => {
    setContext(prev => ({
      ...prev,
      currentPage: pathname,
      suiteId,
      suiteName
    }))
  }, [pathname, suiteId, suiteName])

  // Fetch page data
  useEffect(() => {
    const fetchPageData = async () => {
      if (!suiteId) {
        logger.log('No suiteId, skipping data fetch')
        return
      }

      logger.log('Fetching page data for:', pathname, 'Suite:', suiteName)

      try {
        const pageData: Record<string, any> = {
          pageName: pathname.split('/').pop() || 'dashboard',
          suiteId,
          suiteName
        }

        if (pathname.includes('/bugs')) {
          const response = await fetch(`/api/bugs?suiteId=${suiteId}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data && Array.isArray(result.data)) {
              const bugs = result.data
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
            }
          }
        }

        if (pathname.includes('/test-cases')) {
          const response = await fetch(`/api/test-cases?suiteId=${suiteId}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data && Array.isArray(result.data)) {
              const testCases = result.data
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
            }
          }
        }

        if (pathname.includes('/test-runs')) {
          const response = await fetch(`/api/test-runs?suiteId=${suiteId}`)
          if (response.ok) {
            const result = await response.json()
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
            }
          }
        }

        setContext(prev => ({ ...prev, pageData }))
      } catch (error) {
        logger.log('Error fetching page data:', error)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchPageData()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [pathname, suiteId, suiteName])

  // Load generated content when session changes
  useEffect(() => {
    const loadGeneratedContent = async () => {
      if (!currentSessionId) {
        setGeneratedContent([])
        return
      }

      try {
        const { data, error } = await supabase
          .from('ai_generated_content')
          .select('*')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true })

        if (error) throw error

        if (data) {
          const loadedContent: AIGeneratedContent[] = data.map((item: any) => ({
            id: item.id,
            type: item.content_type,
            status: item.is_saved ? 'saved' : 'draft',
            data: item.content_data,
            createdAt: new Date(item.created_at)
          }))

          setGeneratedContent(loadedContent)
          logger.log(`Loaded ${loadedContent.length} generated content items for session ${currentSessionId}`)
        }
      } catch (err) {
        logger.log('Failed to load generated content:', err)
      }
    }

    loadGeneratedContent()
  }, [currentSessionId, supabase])

  const updateContext = useCallback((updates: Partial<DashboardContext>) => {
    setContext(prev => ({ ...prev, ...updates }))
  }, [])

  const resetMessages = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm your AI assistant for SURELY. I can help you generate test cases, analyze bugs, create reports, and provide insights. What would you like to do?",
        timestamp: new Date()
      }
    ])
    setCurrentSessionId(null)
    setGeneratedContent([])
    setError(null)
    logger.log('Messages reset, session cleared')
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true)

      const { data: sessionMessages, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const loadedMessages: Message[] = sessionMessages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata
      }))

      setMessages(loadedMessages)
      setCurrentSessionId(sessionId)

      logger.log(`Loaded ${loadedMessages.length} messages from session ${sessionId}`)
    } catch (err: any) {
      logger.log('Failed to load session:', err)
      setError('Failed to load chat session')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const saveGeneratedContentToDb = useCallback(async (
    sessionId: string,
    contentId: string,
    type: string,
    data: any,
    isSaved: boolean = false
  ) => {
    try {
      const { error } = await supabase
        .from('ai_generated_content')
        .upsert({
          id: contentId,
          session_id: sessionId,
          content_type: type,
          content_data: data,
          is_saved: isSaved,
          created_at: new Date().toISOString()
        })

      if (error) throw error
      logger.log(`Saved generated content ${contentId} to database`)
    } catch (err) {
      logger.log('Failed to save generated content to DB:', err)
    }
  }, [supabase])

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
      const lowerMessage = message.toLowerCase()

      // Bug Report Generation
      if (
        lowerMessage.includes('generate bug') ||
        lowerMessage.includes('create bug') ||
        lowerMessage.includes('bug report') ||
        lowerMessage.includes('write a bug') ||
        lowerMessage.includes('report this bug')
      ) {
        logger.log('🐛 Detected bug report request')

        const response = await fetch('/api/ai/bug-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: message,
            suiteId: context.suiteId
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate bug report')
        }

        if (data.data?.bugReport) {
          const bugReport = data.data.bugReport
          const content: AIGeneratedContent = {
            id: `bug_${Date.now()}`,
            type: 'bug_report',
            status: 'draft',
            data: bugReport,
            createdAt: new Date()
          }

          logger.log('✅ Adding bug report to generatedContent:', content)
          setGeneratedContent(prev => [...prev, content])

          // Save to database with session_id
          if (currentSessionId) {
            await saveGeneratedContentToDb(currentSessionId, content.id, content.type, content.data, false)
          }

          const formattedMessage = `I've generated a bug report for you.`

          const assistantMessage: Message = {
            role: 'assistant',
            content: formattedMessage,
            timestamp: new Date(),
            metadata: {
              generatedContent: {
                id: content.id,
                type: content.type,
                data: content.data,
                isSaved: false
              },
              tokensUsed: data.data.tokensUsed,
              cost: data.data.cost
            }
          }
          setMessages(prev => [...prev, assistantMessage])

          if (data.data.tokensUsed) {
            setSessionStats(prev => ({
              operations: prev.operations + 1,
              tokens: prev.tokens + data.data.tokensUsed,
              cost: prev.cost + (data.data.cost || 0)
            }))
          }
        }

        return
      }

      // Test Cases Generation  
      if (
        lowerMessage.includes('generate test case') ||
        lowerMessage.includes('create test case') ||
        lowerMessage.includes('write test case') ||
        lowerMessage.includes('test case for') ||
        (lowerMessage.includes('test') && lowerMessage.includes('case'))
      ) {
        logger.log('📝 Detected test case request')

        const response = await fetch('/api/ai/test-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: message,
            suiteId: context.suiteId
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate test cases')
        }

        if (data.data?.testCases) {
          const testCases = data.data.testCases
          const content: AIGeneratedContent = {
            id: `test_${Date.now()}`,
            type: 'test_cases',
            status: 'draft',
            data: testCases,
            createdAt: new Date()
          }

          logger.log('✅ Adding test cases to generatedContent:', content)
          setGeneratedContent(prev => [...prev, content])

          // Save to database with session_id
          if (currentSessionId) {
            await saveGeneratedContentToDb(currentSessionId, content.id, content.type, content.data, false)
          }

          const formattedMessage = `I've generated ${testCases.length} test case${testCases.length > 1 ? 's' : ''} for you.`

          const assistantMessage: Message = {
            role: 'assistant',
            content: formattedMessage,
            timestamp: new Date(),
            metadata: {
              generatedContent: {
                id: content.id,
                type: content.type,
                data: content.data,
                isSaved: false
              },
              tokensUsed: data.data.tokensUsed,
              cost: data.data.cost
            }
          }
          setMessages(prev => [...prev, assistantMessage])

          if (data.data.tokensUsed) {
            setSessionStats(prev => ({
              operations: prev.operations + 1,
              tokens: prev.tokens + data.data.tokensUsed,
              cost: prev.cost + (data.data.cost || 0)
            }))
          }
        }

        return
      }

      // Test Plan Document Generation
      if (
        lowerMessage.includes('generate test plan') ||
        lowerMessage.includes('create test plan') ||
        lowerMessage.includes('test plan document') ||
        lowerMessage.includes('write test plan') ||
        (lowerMessage.includes('test') && lowerMessage.includes('plan'))
      ) {
        logger.log('Detected test plan request, calling /api/ai/documentation...')

        const response = await fetch('/api/ai/documentation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: {
              type: 'test_plan',
              description: message,
              suiteId: context.suiteId,
              suiteName: context.suiteName
            },
            documentType: 'test_plan'
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate test plan')
        }

        if (data.data?.document) {
          const content: AIGeneratedContent = {
            id: `doc_${Date.now()}`,
            type: 'document',
            status: 'draft',
            data: {
              ...data.data.document,
              documentType: 'test_plan'
            },
            createdAt: new Date()
          }
          setGeneratedContent(prev => [...prev, content])

          // Save to database with session_id
          if (currentSessionId) {
            await saveGeneratedContentToDb(currentSessionId, content.id, content.type, content.data, false)
          }

          const assistantMessage: Message = {
            role: 'assistant',
            content: "I've generated a test plan document for you.",
            timestamp: new Date(),
            metadata: {
              generatedContent: {
                id: content.id,
                type: content.type,
                data: content.data,
                isSaved: false
              }
            }
          }
          setMessages(prev => [...prev, assistantMessage])
        }

        return
      }

      // General Documentation Generation
      if (
        lowerMessage.includes('generate document') ||
        lowerMessage.includes('create document') ||
        lowerMessage.includes('write document') ||
        lowerMessage.includes('generate documentation') ||
        lowerMessage.includes('create documentation')
      ) {
        logger.log('Detected documentation request, calling /api/ai/documentation...')

        const response = await fetch('/api/ai/documentation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: {
              description: message,
              suiteId: context.suiteId,
              suiteName: context.suiteName
            },
            documentType: 'general'
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate documentation')
        }

        if (data.data?.document) {
          const content: AIGeneratedContent = {
            id: `doc_${Date.now()}`,
            type: 'document',
            status: 'draft',
            data: data.data.document,
            createdAt: new Date()
          }
          setGeneratedContent(prev => [...prev, content])

          // Save to database with session_id
          if (currentSessionId) {
            await saveGeneratedContentToDb(currentSessionId, content.id, content.type, content.data, false)
          }

          const assistantMessage: Message = {
            role: 'assistant',
            content: "I've generated the documentation for you.",
            timestamp: new Date(),
            metadata: {
              generatedContent: {
                id: content.id,
                type: content.type,
                data: content.data,
                isSaved: false
              }
            }
          }
          setMessages(prev => [...prev, assistantMessage])
        }

        return
      }

      // QA Report Generation
      if (
        lowerMessage.includes('generate report') ||
        lowerMessage.includes('create report') ||
        lowerMessage.includes('qa report') ||
        lowerMessage.includes('test report') ||
        lowerMessage.includes('summary report')
      ) {
        logger.log('Detected report request, calling /api/ai/report...')

        const response = await fetch('/api/ai/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              suiteId: context.suiteId,
              suiteName: context.suiteName,
              pageData: context.pageData,
              description: message
            },
            reportType: 'qa_summary'
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate report')
        }

        if (data.data?.report) {
          const content: AIGeneratedContent = {
            id: `report_${Date.now()}`,
            type: 'report',
            status: 'draft',
            data: data.data.report,
            createdAt: new Date()
          }
          setGeneratedContent(prev => [...prev, content])

          // Save to database with session_id
          if (currentSessionId) {
            await saveGeneratedContentToDb(currentSessionId, content.id, content.type, content.data, false)
          }

          const assistantMessage: Message = {
            role: 'assistant',
            content: "I've generated a QA report for you.",
            timestamp: new Date(),
            metadata: {
              generatedContent: {
                id: content.id,
                type: content.type,
                data: content.data,
                isSaved: false
              }
            }
          }
          setMessages(prev => [...prev, assistantMessage])
        }

        return
      }

      // Normal Conversation - use chat API
      logger.log('Normal chat message, using /api/ai/chat...')

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: context,
          conversationHistory: messages.slice(-10)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'I apologize, but I could not generate a response.',
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

    } catch (err: any) {
      logger.log('Chat error:', err)
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
  }, [context, messages, currentSessionId, saveGeneratedContentToDb])

  const reviewContent = useCallback(async (contentId: string) => {
    setGeneratedContent(prev => prev.map(c =>
      c.id === contentId ? { ...c, status: 'reviewed' } : c
    ))
  }, [])

  // Fix for Issue 2: Panel still displaying active save button after saving
  // In AIAssistantProvider.tsx, update the saveContent function:

  const saveContent = useCallback(async (contentId: string, editedData?: any) => {
    const content = generatedContent.find(c => c.id === contentId)
    if (!content) {
      logger.log('Content not found:', contentId)
      return
    }

    if (!context.suiteId) {
      setError('Suite ID is required. Please ensure you are within a suite context.')
      toast.error('Suite ID is missing')
      return
    }

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
            status: bugData.status || 'open',
            stepsToReproduce: bugData.stepsToReproduce || [],
            expectedBehavior: bugData.expectedBehavior,
            actualBehavior: bugData.actualBehavior,
            environment: bugData.environment || {},
            possibleCause: bugData.possibleCause,
            suggestedFix: bugData.suggestedFix
          }
          break

        case 'test_case':
        case 'test_cases':
          endpoint = '/api/test-cases'
          const testCaseData = editedData || content.data

          const testCasesArray = Array.isArray(testCaseData)
            ? testCaseData
            : [testCaseData]

          payload = {
            suiteId: context.suiteId,
            testCases: testCasesArray.map((tc: any) => ({
              title: tc.title,
              description: tc.description,
              steps: tc.steps || [],
              expectedResult: tc.expectedResult || tc.expected_result,
              priority: tc.priority || 'medium',
              type: tc.type || 'manual',
              preconditions: tc.preconditions || null,
              automationPotential: tc.automationPotential || tc.automation_potential || 'medium'
            }))
          }
          break

        case 'document':
          endpoint = '/api/documents'
          const docData = editedData || content.data

          payload = {
            suite_id: context.suiteId,
            title: docData.title,
            content: JSON.stringify(docData.content),
            file_type: docData.file_type || 'general',
            created_by: context.userId
          }
          break

        case 'report':
          endpoint = '/api/reports'
          const reportData = editedData || content.data

          payload = {
            suite_id: context.suiteId,
            name: reportData.name || reportData.title,
            type: reportData.type || 'qa_summary',
            data: reportData.data || reportData,
            created_by: context.userId
          }
          break
      }

      logger.log('Saving to:', endpoint, payload)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        logger.log('Save failed:', result)
        throw new Error(result.error || result.message || 'Failed to save')
      }

      logger.log('Saved successfully:', result)

      // Update generated content status in database
      if (currentSessionId) {
        await saveGeneratedContentToDb(currentSessionId, contentId, content.type, content.data, true)
      }

      // FIXED: Update the generatedContent state to mark as saved
      // This will disable the save button and show "Saved to Database" instead
      setGeneratedContent(prev => prev.map(c =>
        c.id === contentId ? { ...c, status: 'saved' } : c
      ))

      // Update message metadata to reflect saved status
      setMessages(prev => prev.map(msg => {
        if (msg.metadata?.generatedContent?.id === contentId) {
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              generatedContent: {
                ...msg.metadata.generatedContent,
                isSaved: true
              }
            }
          }
        }
        return msg
      }))

      toast.success(`Successfully saved ${content.type.replace('_', ' ')}!`)

      const successMessage: Message = {
        role: 'assistant',
        content: `Successfully saved ${content.type.replace('_', ' ')} to the database!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, successMessage])

      window.dispatchEvent(new CustomEvent('ai-content-saved', {
        detail: { type: content.type }
      }))

    } catch (err: any) {
      logger.log('Save error:', err)
      setError(err.message)
      toast.error('Failed to save', { description: err.message })

      const errorMessage: Message = {
        role: 'assistant',
        content: `Failed to save: ${err.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [generatedContent, context, currentSessionId, saveGeneratedContentToDb])

  const discardContent = useCallback(async (contentId: string) => {
    // Mark as deleted
    deletedContentIdsRef.current.add(contentId)

    // Remove from local state
    setGeneratedContent(prev => prev.filter(c => c.id !== contentId))

    // Update messages to mark content as deleted
    setMessages(prev => prev.map(msg => {
      if (msg.metadata?.generatedContent?.id === contentId) {
        return {
          ...msg,
          metadata: {
            ...msg.metadata,
            generatedContent: {
              ...msg.metadata.generatedContent,
              isDeleted: true
            }
          }
        }
      }
      return msg
    }))

    // Remove from database
    if (currentSessionId) {
      try {
        await supabase
          .from('ai_generated_content')
          .delete()
          .eq('id', contentId)
          .eq('session_id', currentSessionId)
      } catch (err) {
        logger.log('Failed to delete generated content from DB:', err)
      }
    }

    const message: Message = {
      role: 'assistant',
      content: 'Content discarded. Let me know if you need anything else!',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }, [currentSessionId, supabase])

  const viewSavedContent = useCallback((messageMetadata: any) => {
    const genContent = messageMetadata.generatedContent
    if (!genContent) return

    // Check if content was deleted
    if (genContent.isDeleted || deletedContentIdsRef.current.has(genContent.id)) {
      toast.error('Content was deleted', {
        description: 'This content has been removed and is no longer available'
      })
      return
    }

    // Check if content already in array
    const exists = generatedContent.find(c => c.id === genContent.id)
    if (exists) return

    // Add to generatedContent for viewing
    const content: AIGeneratedContent = {
      id: genContent.id,
      type: genContent.type,
      status: genContent.isSaved ? 'saved' : 'draft',
      data: genContent.data,
      createdAt: new Date()
    }

    setGeneratedContent(prev => [...prev, content])
  }, [generatedContent])

  const generateTestCases = useCallback(async (prompt: string, config?: any) => {
    if (!context.suiteId) return { success: false, error: 'No suite selected' }
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, suiteId: context.suiteId, templateConfig: config })
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
      logger.log('Test cases error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [context.suiteId])

  const generateBugReport = useCallback(async (
    prompt: string,
    consoleError?: string,
    additionalContext?: any
  ) => {
    if (!context.suiteId) return { success: false, error: 'No suite selected' }
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, suiteId: context.suiteId, consoleError, additionalContext })
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
      logger.log('Bug report error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }, [context.suiteId])

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
      logger.log('Grammar check error:', err)
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
    resetMessages,
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
    viewSavedContent,
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
    sessionStats,
    currentSessionId,
    loadSession,
    robotPosition,
    setRobotPosition
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