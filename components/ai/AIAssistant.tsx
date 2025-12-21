// ============================================
// FILE: components/ai/AIAssistant.tsx
// MINIMAL FIX: Just add session saving
// ============================================
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAI } from './AIAssistantProvider'
import { AIChatHistory } from './AIChatHistory'
import { AIGeneratedContentPanel } from './AIGeneratedContentPanel'
import { X, Maximize2, Minimize2, Send, Bot, User, Sparkles, FileText, AlertCircle, PanelRightOpen, PanelRightClose, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function AIAssistant() {
  const { 
    isOpen, 
    setIsOpen, 
    messages, 
    sendMessage, 
    isLoading,
    error,
    currentModel,
    generatedContent,
    saveContent,
    discardContent,
    context
  } = useAI()
  
  const [input, setInput] = useState('')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [chatWidth, setChatWidth] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevContentLengthRef = useRef(0)
  const resizeRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

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

  // Save messages when they arrive
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    
    supabase
      .from('ai_chat_messages')
      .insert({
        session_id: currentSessionId,
        role: lastMessage.role,
        content: lastMessage.content,
        created_at: lastMessage.timestamp.toISOString()
      })
      .then(({ error }) => {
        if (error) console.error('Save error:', error)
      })
  }, [messages.length, currentSessionId])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const message = input.trim()
    setInput('')

    // Create session if first message
    if (!currentSessionId && messages.length === 0) {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: context.userId,
          suite_id: context.suiteId || '',
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        })
        .select()
        .single()

      if (!error && data) {
        setCurrentSessionId(data.id)
      }
    }

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

  const handleNewChat = () => {
    setCurrentSessionId(null)
  }

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    toast.info('Session selected - load functionality needs provider update')
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
          {messages.length === 0 && (
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
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25' 
                  : 'bg-muted border border-border/50 text-muted-foreground'
              }`}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-transparent border-2 border-primary/20 text-foreground'
                    : 'bg-muted/80 backdrop-blur-sm text-foreground border border-border/50'
                }`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
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
            suiteId={context.suiteId || ''}
            currentSessionId={currentSessionId}
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
              {messages.length === 0 ? (
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25' 
                          : 'bg-muted border border-border/50 text-muted-foreground'
                      }`}>
                        {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 max-w-[75%]">
                        <div className={`rounded-lg px-5 py-4 ${
                          message.role === 'user'
                            ? 'bg-transparent border-2 border-primary/20 text-foreground'
                            : 'bg-muted/80 backdrop-blur-sm text-foreground border border-border/50'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </div>
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