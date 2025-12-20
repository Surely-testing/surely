'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAI } from './AIAssistantProvider'
import { X, Maximize2, Minimize2, Send, Bot, User, Save, Trash2, FileText, Bug, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

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
    reviewContent,
    saveContent,
    discardContent
  } = useAI()
  
  const [input, setInput] = useState('')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [editingContent, setEditingContent] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, generatedContent])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (error) {
      // User-friendly error messages
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const message = input.trim()
    setInput('')
    await sendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveContent = async (contentId: string) => {
    await saveContent(contentId, editedData)
    setEditingContent(null)
    setEditedData(null)
  }

  const handleEditContent = (content: any) => {
    setEditingContent(content.id)
    setEditedData(content.data)
  }

  const handleDiscardContent = async (contentId: string) => {
    await discardContent(contentId)
    setEditingContent(null)
    setEditedData(null)
  }

  // Render generated content preview cards
  const renderGeneratedContent = (content: any) => {
    if (content.type === 'bug_report') {
      return (
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bug className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Bug Report Generated</p>
                <p className="text-xs text-muted-foreground">Review and save to database</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${
              content.data.severity === 'critical' ? 'bg-red-600 text-white' :
              content.data.severity === 'high' ? 'bg-orange-500 text-white' :
              content.data.severity === 'medium' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {content.data.severity?.toUpperCase()}
            </span>
          </div>

          <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl p-4 space-y-3 text-sm max-h-64 overflow-y-auto border border-red-100 dark:border-red-900/30">
            <div>
              <span className="font-semibold text-foreground text-xs uppercase tracking-wide opacity-70">Title</span>
              <p className="text-foreground mt-1.5 font-medium">{content.data.title}</p>
            </div>
            <div>
              <span className="font-semibold text-foreground text-xs uppercase tracking-wide opacity-70">Description</span>
              <p className="text-muted-foreground mt-1.5 leading-relaxed">{content.data.description}</p>
            </div>
            {content.data.stepsToReproduce && content.data.stepsToReproduce.length > 0 && (
              <div>
                <span className="font-semibold text-foreground text-xs uppercase tracking-wide opacity-70">Steps to Reproduce</span>
                <ol className="list-decimal list-inside mt-1.5 space-y-1.5 text-muted-foreground">
                  {content.data.stepsToReproduce.map((step: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveContent(content.id)}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              disabled={isLoading}
            >
              <Save className="w-4 h-4" />
              Save to Database
            </button>
            <button
              onClick={() => handleDiscardContent(content.id)}
              className="px-4 py-2.5 bg-white/80 dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 border border-red-200 dark:border-red-800/50 rounded-xl text-sm font-medium text-foreground transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    }

    if (content.type === 'test_cases') {
      const testCases = Array.isArray(content.data) ? content.data : content.data.testCases || []
      
      return (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {testCases.length} Test Case{testCases.length !== 1 ? 's' : ''} Generated
                </p>
                <p className="text-xs text-muted-foreground">Review and save to database</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testCases.map((tc: any, idx: number) => (
              <div key={idx} className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm text-foreground flex-1">
                    {tc.id || `TC${idx + 1}`}: {tc.title}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                    tc.priority === 'high' ? 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400' :
                    tc.priority === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                    'bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400'
                  }`}>
                    {tc.priority?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tc.description}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveContent(content.id)}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              disabled={isLoading}
            >
              <Save className="w-4 h-4" />
              Save All to Database
            </button>
            <button
              onClick={() => handleDiscardContent(content.id)}
              className="px-4 py-2.5 bg-white/80 dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-sm font-medium text-foreground transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    }

    // Default preview
    return (
      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-sm font-semibold text-foreground">Generated Content</p>
        </div>
        <pre className="text-xs bg-white/80 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl overflow-auto max-h-64 text-foreground border border-purple-100 dark:border-purple-900/30 font-mono">
          {JSON.stringify(content.data, null, 2)}
        </pre>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveContent(content.id)}
            className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-500/20"
          >
            Save
          </button>
          <button
            onClick={() => handleDiscardContent(content.id)}
            className="px-4 py-2.5 bg-white/80 dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 border border-purple-200 dark:border-purple-800/50 rounded-xl text-sm font-medium"
          >
            Discard
          </button>
        </div>
      </div>
    )
  }

  // Don't render anything when closed - AIFloatingButton handles that
  if (!isOpen) {
    return null
  }

  // Regular window mode (mobile-first)
  if (!isFullScreen) {
    return (
      <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[420px] h-[600px] sm:h-[700px] bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 flex flex-col z-50 overflow-hidden">
        {/* Header */}
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

        {/* Messages Area */}
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

          {/* Generated Content Cards */}
          {generatedContent && generatedContent.length > 0 && generatedContent.map((content) => (
            <div key={content.id}>
              {renderGeneratedContent(content)}
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

        {/* Input Area */}
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

  // Fullscreen mode
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
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
        
        <div className="flex items-center gap-1">
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background/50 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {messages.length === 0 && (
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
          )}

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

          {/* Generated Content Cards */}
          {generatedContent && generatedContent.length > 0 && generatedContent.map((content) => (
            <div key={content.id}>
              {renderGeneratedContent(content)}
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
        </div>
      </div>

      {/* Input Area */}
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
  )
}