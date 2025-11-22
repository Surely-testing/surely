// ============================================
// FILE: components/ai/AIAssistantProvider.tsx
// ============================================
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

type AIContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: Message[]
  sendMessage: (message: string) => Promise<void>
  context: DashboardContext
  updateContext: (updates: Partial<DashboardContext>) => void
  suggestions: Suggestion[]
  dismissSuggestion: (id: string) => void
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
      content: "Hi! I'm your AI assistant. I understand your entire platform and can help with anything across all your dashboards. What would you like to accomplish?",
      timestamp: new Date()
    }
  ])
  const [context, setContext] = useState<DashboardContext>({
    currentPage: pathname,
    suiteId,
    suiteName,
    userId,
    recentActions: []
  })
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Update context when route changes
  useEffect(() => {
    updateContext({ currentPage: pathname })
    generateContextualSuggestions(pathname, suiteId)
  }, [pathname, suiteId])

  const updateContext = (updates: Partial<DashboardContext>) => {
    setContext(prev => ({ ...prev, ...updates }))
  }

  const sendMessage = async (message: string) => {
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    // Call AI API with full context
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          context,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        })
      })

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      }
      setMessages(prev => [...prev, assistantMessage])

      // If AI suggests actions, create suggestions
      if (data.suggestions) {
        setSuggestions(prev => [...prev, ...data.suggestions])
      }
    } catch (error) {
      console.error('AI Chat error:', error)
    }
  }

  const generateContextualSuggestions = (path: string, suiteId: string | null) => {
    // Generate suggestions based on current context
    const newSuggestions: Suggestion[] = []

    if (path.includes('/projects') && suiteId) {
      newSuggestions.push({
        id: 'project-tips-1',
        type: 'tip',
        title: 'Optimize Your Project Structure',
        description: 'I can analyze your project and suggest better organization.',
        action: {
          label: 'Analyze Now',
          handler: () => {
            setIsOpen(true)
            sendMessage('Analyze my current project structure and suggest improvements')
          }
        },
        priority: 'medium',
        dismissed: false
      })
    }

    if (path.includes('/tasks')) {
      newSuggestions.push({
        id: 'task-tips-1',
        type: 'insight',
        title: 'Task Prioritization',
        description: 'Let me help you prioritize tasks based on deadlines and dependencies.',
        action: {
          label: 'Get Help',
          handler: () => {
            setIsOpen(true)
            sendMessage('Help me prioritize my tasks')
          }
        },
        priority: 'high',
        dismissed: false
      })
    }

    if (!suiteId) {
      newSuggestions.push({
        id: 'suite-create-1',
        type: 'action',
        title: 'Create Your First Suite',
        description: 'I can guide you through setting up a suite with best practices.',
        action: {
          label: 'Get Started',
          handler: () => {
            setIsOpen(true)
            sendMessage('Help me create my first suite')
          }
        },
        priority: 'high',
        dismissed: false
      })
    }

    setSuggestions(newSuggestions)
  }

  const dismissSuggestion = (id: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === id ? { ...s, dismissed: true } : s
    ))
  }

  return (
    <AIContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      messages, 
      sendMessage, 
      context, 
      updateContext,
      suggestions: suggestions.filter(s => !s.dismissed),
      dismissSuggestion
    }}>
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