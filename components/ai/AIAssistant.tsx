'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAI } from './AIAssistantProvider'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/lib/ai/types'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { AIAssistantMobile } from './ai-assistant/AIAssistantMobile'
import { AIAssistantDesktop } from './ai-assistant/AIAssistantDesktop'

// Hook to detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

// Hook to listen for document context
function useDocumentContext() {
  const [documentContext, setDocumentContext] = useState<any>(null)

  useEffect(() => {
    const handleContextUpdate = (event: CustomEvent) => {
      setDocumentContext(event.detail)
    }

    window.addEventListener('document-context-update', handleContextUpdate as EventListener)
    
    return () => {
      window.removeEventListener('document-context-update', handleContextUpdate as EventListener)
    }
  }, [])

  return documentContext
}

export function AIAssistant() {
  const {
    isOpen,
    setIsOpen,
    messages,
    sendMessage,
    resetMessages,
    isLoading,
    error,
    currentModel,
    generatedContent,
    saveContent,
    discardContent,
    viewSavedContent,
    context,
    currentSessionId,
    loadSession
  } = useAI()

  // Wrapper functions to handle async operations
  const handleSaveContent = async (contentId: string, editedData?: any) => {
    try {
      await saveContent(contentId, editedData)
    } catch (err) {
      logger.log('Error saving content:', err)
      toast.error('Failed to save content')
    }
  }

  const handleDiscardContent = async (contentId: string) => {
    try {
      await discardContent(contentId)
    } catch (err) {
      logger.log('Error discarding content:', err)
      toast.error('Failed to discard content')
    }
  }

  const [input, setInput] = useState('')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  const [localSessionId, setLocalSessionId] = useState<string | null>(null)
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [chatWidth, setChatWidth] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const isMobile = useIsMobile()
  const documentContext = useDocumentContext()
  const isEditingDocument = documentContext !== null

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevContentLengthRef = useRef(0)
  const resizeRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const hasCreatedSessionRef = useRef(false)
  const lastSavedMessageIndexRef = useRef(-1)
  
  // FIX #2: Track if first message succeeded
  const firstMessageSucceededRef = useRef(false)

  // Auto fullscreen on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      setIsFullScreen(true)
    }
  }, [isMobile, isOpen])

  // Sync currentSessionId from provider
  useEffect(() => {
    if (currentSessionId && !localSessionId) {
      setLocalSessionId(currentSessionId)
      hasCreatedSessionRef.current = true
    }
  }, [currentSessionId, localSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Handle generated content notifications
  useEffect(() => {
    const currentLength = generatedContent.length
    const previousLength = prevContentLengthRef.current

    if (currentLength > previousLength && currentLength > 0) {
      if (isMobile) {
        toast.info('Content generated!', {
          description: 'View this on desktop to review and save',
          duration: 4000
        })
      } else {
        if (!isFullScreen) {
          setIsFullScreen(true)
          setShowReviewPanel(true)
          toast.success('Review panel opened', {
            description: 'Your generated content is ready for review'
          })
        } else {
          setShowReviewPanel(true)
          toast.success('Content ready for review', {
            description: `${currentLength} item${currentLength > 1 ? 's' : ''} pending`
          })
        }
      }
    }

    if (currentLength === 0 && previousLength > 0) {
      setShowReviewPanel(false)
    }

    prevContentLengthRef.current = currentLength
  }, [generatedContent.length, isFullScreen, isMobile])

  // Desktop resize handle
  useEffect(() => {
    if (isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !resizeRef.current) return

      const container = resizeRef.current.parentElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const historyWidth = isHistoryCollapsed ? 0 : containerRect.width * 0.2
      const availableWidth = containerRect.width - historyWidth
      const mouseX = e.clientX - containerRect.left - historyWidth

      const newChatWidth = (mouseX / availableWidth) * 100
      setChatWidth(Math.min(Math.max(newChatWidth, 30), 70))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isHistoryCollapsed, isMobile])

  // Error toasts - keep existing toast notifications
  useEffect(() => {
    if (error) {
      let friendlyMessage = 'Unable to send message'
      let description = 'Please try again in a moment'

      if (error.toLowerCase().includes('network')) {
        friendlyMessage = 'Connection issue'
        description = 'Check your internet connection and try again'
      } else if (error.toLowerCase().includes('rate limit')) {
        friendlyMessage = 'Too many requests'
        description = 'Please wait a moment before trying again'
      } else if (error.toLowerCase().includes('timeout')) {
        friendlyMessage = 'Request timed out'
        description = 'The server took too long to respond'
      }

      toast.error(friendlyMessage, { description })
    }
  }, [error])

  // Save messages to database
  useEffect(() => {
    if (!localSessionId) {
      logger.log('No session ID yet, skipping message save')
      return
    }

    if (messages.length === 0) {
      logger.log('No messages to save')
      return
    }

    if (messages.length <= lastSavedMessageIndexRef.current + 1) {
      return
    }

    const lastMessage = messages[messages.length - 1]
    const messageIndex = messages.length - 1

    // Don't save welcome message
    if (messages.length === 1 && lastMessage.role === 'assistant') {
      logger.log('Skipping welcome message save')
      lastSavedMessageIndexRef.current = 0
      return
    }

    // FIX #2: Don't save assistant messages if there was an error AND it's the first response
    if (lastMessage.role === 'assistant' && error && !firstMessageSucceededRef.current) {
      logger.log('Skipping message save - first message failed with error')
      return
    }

    const saveMessage = async () => {
      try {
        logger.log('Saving message to session:', localSessionId, 'Role:', lastMessage.role)

        const { error: saveError } = await supabase
          .from('ai_chat_messages')
          .insert({
            session_id: localSessionId,
            role: lastMessage.role,
            content: lastMessage.content,
            metadata: lastMessage.metadata || {},
            created_at: lastMessage.timestamp.toISOString()
          })

        if (saveError) {
          logger.log('Failed to save message:', saveError)
          toast.error('Failed to save message to history')
        } else {
          logger.log('Message saved successfully to session:', localSessionId)
          lastSavedMessageIndexRef.current = messageIndex
          
          // FIX #2: Mark that first message succeeded if this is an assistant response
          if (lastMessage.role === 'assistant' && !firstMessageSucceededRef.current) {
            firstMessageSucceededRef.current = true
            logger.log('First assistant message saved successfully')
          }
        }
      } catch (err) {
        logger.log('Error saving message:', err)
        toast.error('Failed to save message to history')
      }
    }

    saveMessage()
  }, [messages, localSessionId, supabase, error])

  const generateChatTitle = (firstMessage: string): string => {
    const cleaned = firstMessage.trim().slice(0, 50)
    return cleaned + (firstMessage.length > 50 ? '...' : '')
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    let message = input.trim()
    
    if (documentContext) {
      const docContextPrefix = `[Currently editing document: "${documentContext.title}" (${documentContext.type}) - ${documentContext.sectionCount} sections, ~${documentContext.wordCount} words]\n\n`
      message = docContextPrefix + message
    }
    
    setInput('')

    const userMessageCount = messages.filter(m => m.role === 'user').length
    const isFirstUserMessage = userMessageCount === 0

    // FIX #2: Only create session after successful first message
    if (isFirstUserMessage && !localSessionId && !hasCreatedSessionRef.current) {
      hasCreatedSessionRef.current = true

      try {
        // Send message FIRST
        await sendMessage(message)
        
        // FIX #2: Only create session if message sent successfully (no error)
        // Check if there's an error after sending - if so, don't create session
        await new Promise(resolve => setTimeout(resolve, 500)) // Wait for error state to update
        
        // If sendMessage threw an error, it would be caught below
        // So if we reach here, we can create the session
        const title = generateChatTitle(input.trim())
        logger.log('Creating new chat session with title:', title)

        const { data, error: createError } = await supabase
          .from('ai_chat_sessions')
          .insert({
            user_id: context.userId,
            suite_id: context.suiteId,
            title: title,
            message_count: 0
          })
          .select()
          .single()

        if (createError) {
          logger.log('Failed to create session:', createError)
          toast.error('Failed to create chat session')
          hasCreatedSessionRef.current = false
          return
        }

        if (data) {
          logger.log('Session created successfully:', data.id)
          setLocalSessionId(data.id)
          lastSavedMessageIndexRef.current = -1
        }
        
        return
      } catch (err) {
        logger.log('Error sending first message:', err)
        hasCreatedSessionRef.current = false
        // FIX #2: Don't create session if first message failed
        return
      }
    }

    try {
      await sendMessage(message)
    } catch (err) {
      logger.log('Error sending message:', err)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleReviewPanel = () => {
    if (isMobile) {
      toast.info('Generated content available', {
        description: 'Please view on desktop to review and save generated items',
        duration: 4000
      })
      return
    }
    setShowReviewPanel(!showReviewPanel)
  }

  const handleMessageClick = (message: Message) => {
    if (message.metadata?.generatedContent) {
      if (message.metadata.generatedContent.isDeleted) {
        toast.error('Content was deleted', {
          description: 'This content has been removed and is no longer available'
        })
        return
      }

      if (isMobile) {
        toast.info('View on desktop', {
          description: 'Generated content can be reviewed and saved on desktop',
          duration: 4000
        })
        return
      }

      viewSavedContent(message.metadata)

      if (!isFullScreen) {
        setIsFullScreen(true)
      }
      setShowReviewPanel(true)
    }
  }

  const handleNewChat = () => {
    setLocalSessionId(null)
    hasCreatedSessionRef.current = false
    lastSavedMessageIndexRef.current = -1
    firstMessageSucceededRef.current = false // FIX #2: Reset first message flag
    resetMessages()
    setShowMobileMenu(false)
    toast.success('New chat started')
  }

  const handleSelectSession = async (sessionId: string) => {
    setLocalSessionId(sessionId)
    hasCreatedSessionRef.current = true
    lastSavedMessageIndexRef.current = -1
    firstMessageSucceededRef.current = true // FIX #2: Loading existing session means it already succeeded
    setShowMobileMenu(false)

    await loadSession(sessionId)

    toast.success('Chat session loaded')
  }

  const handleInsertToDocument = (content: string) => {
    if (!documentContext) {
      toast.error('No document open', {
        description: 'Please open a document in the editor first'
      })
      return
    }

    const event = new CustomEvent('document-insert-content', {
      detail: { content }
    })
    window.dispatchEvent(event)
    
    toast.success('Content sent to document', {
      description: 'Check your document editor'
    })
  }

  const getDocumentQuickActions = () => {
    if (!documentContext) return []

    const actions: { [key: string]: string[] } = {
      brainstorm: [
        'Generate 5 creative ideas for this topic',
        'Create a pros and cons list',
        'Help me expand these ideas',
      ],
      meeting_notes: [
        'Extract all action items',
        'Summarize key points',
        'Identify decisions made',
      ],
      test_plan: [
        'Generate test scenarios',
        'Identify coverage gaps',
        'Analyze risks',
      ],
      test_strategy: [
        'Suggest quality metrics',
        'Recommend best practices',
        'Review this strategy',
      ],
      general: [
        'Improve this content',
        'Create an outline',
        'Proofread for errors',
      ]
    }

    return actions[documentContext.type] || actions.general
  }

  // Render mobile or desktop component based on screen size
  if (isMobile) {
    return (
      <AIAssistantMobile
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        messages={messages}
        isLoading={isLoading}
        error={error}
        currentModel={currentModel}
        generatedContent={generatedContent}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleKeyPress={handleKeyPress}
        toggleReviewPanel={toggleReviewPanel}
        handleMessageClick={handleMessageClick}
        handleInsertToDocument={handleInsertToDocument}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        localSessionId={localSessionId}
        handleSelectSession={handleSelectSession}
        handleNewChat={handleNewChat}
        context={context}
        documentContext={documentContext}
        getDocumentQuickActions={getDocumentQuickActions}
      />
    )
  }

  return (
    <AIAssistantDesktop
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      messages={messages}
      isLoading={isLoading}
      error={error}
      currentModel={currentModel}
      generatedContent={generatedContent}
      saveContent={handleSaveContent}
      discardContent={handleDiscardContent}
      input={input}
      setInput={setInput}
      handleSend={handleSend}
      handleKeyPress={handleKeyPress}
      isFullScreen={isFullScreen}
      setIsFullScreen={setIsFullScreen}
      showReviewPanel={showReviewPanel}
      toggleReviewPanel={toggleReviewPanel}
      handleMessageClick={handleMessageClick}
      handleInsertToDocument={handleInsertToDocument}
      isHistoryCollapsed={isHistoryCollapsed}
      setIsHistoryCollapsed={setIsHistoryCollapsed}
      chatWidth={chatWidth}
      isDragging={isDragging}
      setIsDragging={setIsDragging}
      localSessionId={localSessionId}
      handleSelectSession={handleSelectSession}
      handleNewChat={handleNewChat}
      context={context}
      documentContext={documentContext}
      getDocumentQuickActions={getDocumentQuickActions}
    />
  )
}