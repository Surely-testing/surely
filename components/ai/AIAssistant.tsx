'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAI } from './AIAssistantProvider'
import { AIChatHistory } from './AIChatHistory'
import { AIGeneratedContentPanel } from './AIGeneratedContentPanel'
import { X, Maximize2, Minimize2, Send, Bot, User, Sparkles, FileText, AlertCircle, PanelRightOpen, PanelRightClose, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/lib/ai/types'
import { MessageContent } from './MessageContent'
import { logger } from '@/lib/utils/logger'

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

  const [input, setInput] = useState('')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  const [localSessionId, setLocalSessionId] = useState<string | null>(null)
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [chatWidth, setChatWidth] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevContentLengthRef = useRef(0)
  const resizeRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const hasCreatedSessionRef = useRef(false)

  // Sync currentSessionId from provider if it exists
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

  useEffect(() => {
    const currentLength = generatedContent.length
    const previousLength = prevContentLengthRef.current

    if (currentLength > previousLength && currentLength > 0) {
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

    if (currentLength === 0 && previousLength > 0) {
      setShowReviewPanel(false)
    }

    prevContentLengthRef.current = currentLength
  }, [generatedContent.length, isFullScreen])

  useEffect(() => {
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
  }, [isDragging, isHistoryCollapsed])

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

  useEffect(() => {
    if (!localSessionId) {
      logger.log('No session ID yet, skipping message save')
      return
    }

    if (messages.length === 0) {
      logger.log('No messages to save')
      return
    }

    const lastMessage = messages[messages.length - 1]

    // Don't save the initial welcome message
    if (messages.length === 1 && lastMessage.role === 'assistant') {
      logger.log('Skipping welcome message save')
      return
    }

    const saveMessage = async () => {
      try {
        logger.log('Saving message to session:', localSessionId, 'Role:', lastMessage.role)

        const { error } = await supabase
          .from('ai_chat_messages')
          .insert({
            session_id: localSessionId,
            role: lastMessage.role,
            content: lastMessage.content,
            metadata: lastMessage.metadata || {},
            created_at: lastMessage.timestamp.toISOString()
          })

        if (error) {
          logger.log('Failed to save message:', error)
        } else {
          logger.log('Message saved successfully to session:', localSessionId)
        }
      } catch (err) {
        logger.log('Error saving message:', err)
      }
    }

    saveMessage()
  }, [messages, localSessionId, supabase])

  const generateChatTitle = (firstMessage: string): string => {
    const cleaned = firstMessage.trim().slice(0, 50)
    return cleaned + (firstMessage.length > 50 ? '...' : '')
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')

    // Create session if this is the first USER message (not counting the welcome assistant message)
    const userMessageCount = messages.filter(m => m.role === 'user').length
    const isFirstUserMessage = userMessageCount === 0

    if (isFirstUserMessage && !localSessionId && !hasCreatedSessionRef.current) {
      hasCreatedSessionRef.current = true

      try {
        const title = generateChatTitle(message)

        logger.log('Creating new chat session with title:', title)

        const { data, error } = await supabase
          .from('ai_chat_sessions')
          .insert({
            user_id: context.userId,
            suite_id: context.suiteId,
            title: title,
            message_count: 0
          })
          .select()
          .single()

        if (error) {
          logger.log('Failed to create session:', error)
          toast.error('Failed to create chat session')
          hasCreatedSessionRef.current = false
        } else if (data) {
          logger.log('Session created successfully:', data.id)
          setLocalSessionId(data.id)

          // Wait a tiny bit to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 100))

          // Now send the message
          await sendMessage(message)
          return
        }
      } catch (err) {
        logger.log('Error creating session:', err)
        toast.error('Failed to create chat session')
        hasCreatedSessionRef.current = false
      }
    }

    // If session already exists or creation failed, just send the message
    await sendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleReviewPanel = () => {
    setShowReviewPanel(!showReviewPanel)
  }

  const handleMessageClick = (message: Message) => {
    if (message.metadata?.generatedContent) {
      // Check if deleted
      if (message.metadata.generatedContent.isDeleted) {
        toast.error('Content was deleted', {
          description: 'This content has been removed and is no longer available'
        })
        return
      }

      // Add content to view
      viewSavedContent(message.metadata)

      // Open panel and expand to fullscreen if not already
      if (!isFullScreen) {
        setIsFullScreen(true)
      }
      setShowReviewPanel(true)
    }
  }

  const handleNewChat = () => {
    setLocalSessionId(null)
    hasCreatedSessionRef.current = false
    resetMessages()
    toast.success('New chat started')
  }

  const handleSelectSession = async (sessionId: string) => {
    setLocalSessionId(sessionId)
    hasCreatedSessionRef.current = true

    await loadSession(sessionId)

    toast.success('Chat session loaded')
  }

  if (!isOpen) {
    return null
  }

  if (!isFullScreen) {
    return (
      <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[420px] h-[600px] sm:h-[700px] bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 flex flex-col z-50 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">Surely AI</h3>
              <p className="text-xs text-muted-foreground">{currentModel}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {generatedContent.length > 0 && (
              <div className="mr-2 px-2 py-1 bg-primary/10 rounded-lg flex items-center gap-1.5 animate-pulse">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">{generatedContent.length}</span>
              </div>
            )}

            <button
              onClick={() => setIsFullScreen(true)}
              className="p-2.5 hover:bg-muted/80 rounded-xl transition-all text-muted-foreground hover:text-foreground"
              aria-label="Maximize"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2.5 hover:bg-muted/80 rounded-xl transition-all text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-background/50 to-background">
          {messages.length === 1 && messages[0].role === 'assistant' && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-2">How can I help?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask me to generate bug reports, test cases, or help with QA tasks
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-muted border border-border/50 text-muted-foreground'
                }`}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className={`rounded-lg px-4 py-3 transition-all ${message.role === 'user'
                    ? 'bg-transparent border-2 border-primary/20 text-foreground'
                    : message.metadata?.generatedContent
                      ? 'bg-gradient-to-br from-primary/5 to-primary/10 text-foreground border-2 border-primary/40 cursor-pointer hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.01] relative group'
                      : 'bg-muted/80 backdrop-blur-sm text-foreground border border-border/50'
                    }`}
                  onClick={() => message.metadata?.generatedContent && handleMessageClick(message)}
                >
                  {message.metadata?.generatedContent && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-semibold shadow-lg animate-pulse group-hover:animate-none">
                      Click to Review
                    </div>
                  )}

                  <MessageContent
                    content={message.content}
                    className="text-sm leading-relaxed"
                  />

                  {message.metadata?.generatedContent?.isSaved && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium text-xs">
                        ✓ Saved
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}


          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted border border-border/50 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="bg-muted/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 border-t border-border/50 bg-background">
          <div className="flex items-end gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="How can I help you today?"
              rows={1}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-[15px] resize-none max-h-32 leading-6 border-0 focus:ring-0 focus:border-0"
              disabled={isLoading}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasGeneratedContent = generatedContent.length > 0 && showReviewPanel

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Surely AI</h3>
            <p className="text-xs text-muted-foreground">{currentModel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {generatedContent.length > 0 && (
            <button
              onClick={toggleReviewPanel}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{generatedContent.length} pending</span>
              {showReviewPanel ? (
                <PanelRightClose className="w-4 h-4 text-primary" />
              ) : (
                <PanelRightOpen className="w-4 h-4 text-primary" />
              )}
            </button>
          )}

          <button
            onClick={() => setIsFullScreen(false)}
            className="p-2.5 hover:bg-muted/80 rounded-xl transition-all text-muted-foreground hover:text-foreground"
            aria-label="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2.5 hover:bg-muted/80 rounded-xl transition-all text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`transition-all duration-200 ${isHistoryCollapsed ? 'w-[60px]' : 'w-[20%] min-w-[200px] max-w-[300px]'}`}>
          <AIChatHistory
            userId={context.userId}
            suiteId={context.suiteId}
            currentSessionId={localSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onCollapse={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            isCollapsed={isHistoryCollapsed}
          />
        </div>

        <div
          className="flex flex-col border-r border-border"
          style={{
            width: isHistoryCollapsed
              ? (hasGeneratedContent ? `calc(100% - 60px - ${100 - chatWidth}%)` : 'calc(100% - 60px)')
              : (hasGeneratedContent ? `${chatWidth * 0.8}%` : '80%')
          }}
        >
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background/50 to-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
              {messages.length === 1 && messages[0].role === 'assistant' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-2xl mb-3">How can I help today?</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-md">
                      Ask me to generate bug reports, test cases, or help with any QA tasks
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div key={index} className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25'
                        : 'bg-muted border border-border/50 text-muted-foreground'
                        }`}>
                        {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 max-w-[75%]">
                        <div
                          className={`rounded-lg px-5 py-4 transition-all ${message.role === 'user'
                            ? 'bg-transparent border-2 border-primary/20 text-foreground'
                            : message.metadata?.generatedContent
                              ? 'bg-gradient-to-br from-primary/5 to-primary/10 text-foreground border-2 border-primary/40 cursor-pointer hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01] relative group'
                              : 'bg-muted/80 backdrop-blur-sm text-foreground border border-border/50'
                            }`}
                          onClick={() => message.metadata?.generatedContent && handleMessageClick(message)}
                        >
                          {message.metadata?.generatedContent && (
                            <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse group-hover:animate-none flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Click to Review
                            </div>
                          )}

                          <MessageContent
                            content={message.content}
                            className="text-sm leading-relaxed"
                          />

                          {message.metadata?.generatedContent?.isSaved && (
                            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold text-xs">
                                ✓ Saved to Database
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 px-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="bg-muted/80 backdrop-blur-sm rounded-2xl px-5 py-4 border border-border/50">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-destructive/10 backdrop-blur-sm text-destructive rounded-2xl p-4 border border-destructive/30 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Error</p>
                        <p className="text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-end gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="How can I help you today?"
                  rows={1}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-[15px] resize-none max-h-32 leading-6 border-0 focus:ring-0 focus:border-0"
                  disabled={isLoading}
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {hasGeneratedContent && (
          <div
            ref={resizeRef}
            onMouseDown={() => setIsDragging(true)}
            className="w-1 hover:w-2 bg-border hover:bg-primary transition-all cursor-col-resize flex items-center justify-center group"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {hasGeneratedContent && (
          <div
            className="flex flex-col bg-card animate-in slide-in-from-right duration-300"
            style={{
              width: isHistoryCollapsed
                ? `${100 - chatWidth}%`
                : `${(100 - chatWidth) * 0.8}%`
            }}
          >
            <AIGeneratedContentPanel
              content={generatedContent}
              onSave={saveContent}
              onDiscard={discardContent}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}