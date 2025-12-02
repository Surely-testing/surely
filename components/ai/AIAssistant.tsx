'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAI } from './AIAssistantProvider'
import { X, Maximize2, Minimize2, Send, Sparkles, Bot, User, Check, Edit, Save, Trash2, AlertCircle, FileText, Bug } from 'lucide-react'

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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, generatedContent])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

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
        <div className="bg-card border-2 border-red-200 dark:border-red-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Bug className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Bug Report Generated</p>
                <p className="text-xs text-muted-foreground">Review and save</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              content.data.severity === 'critical' ? 'bg-red-600 text-white' :
              content.data.severity === 'high' ? 'bg-orange-500 text-white' :
              content.data.severity === 'medium' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {content.data.severity?.toUpperCase()}
            </span>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-sm max-h-60 overflow-y-auto">
            <div>
              <span className="font-semibold text-foreground">Title:</span>
              <p className="text-muted-foreground mt-1">{content.data.title}</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">Description:</span>
              <p className="text-muted-foreground mt-1">{content.data.description}</p>
            </div>
            {content.data.stepsToReproduce && content.data.stepsToReproduce.length > 0 && (
              <div>
                <span className="font-semibold text-foreground">Steps:</span>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-muted-foreground">
                  {content.data.stepsToReproduce.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveContent(content.id)}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Save className="w-4 h-4" />
              Save to Database
            </button>
            <button
              onClick={() => handleDiscardContent(content.id)}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-sm text-foreground transition-colors"
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
        <div className="bg-card border-2 border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {testCases.length} Test Case{testCases.length !== 1 ? 's' : ''} Generated
                </p>
                <p className="text-xs text-muted-foreground">Review and save</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {testCases.map((tc: any, idx: number) => (
              <div key={idx} className="bg-secondary/50 rounded-lg p-3 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm text-foreground">
                    {tc.id || `TC${idx + 1}`}: {tc.title}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tc.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                    tc.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {tc.priority?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{tc.description}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveContent(content.id)}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Save className="w-4 h-4" />
              Save All to Database
            </button>
            <button
              onClick={() => handleDiscardContent(content.id)}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-sm text-foreground transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    }

    // Default preview
    return (
      <div className="bg-card border-2 border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Generated Content</p>
        </div>
        <pre className="text-xs bg-secondary/50 p-3 rounded-lg overflow-auto max-h-60 text-foreground">
          {JSON.stringify(content.data, null, 2)}
        </pre>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveContent(content.id)}
            className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={() => handleDiscardContent(content.id)}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-sm"
          >
            Discard
          </button>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    )
  }

  // Regular window mode
  if (!isFullScreen) {
    return (
      <div className="fixed bottom-6 right-6 w-[500px] h-[700px] bg-card rounded-2xl shadow-xl border border-border flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Surely AI</h3>
              <p className="text-xs opacity-90">{currentModel}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(true)}
              className="p-2 hover:bg-primary-foreground/20 rounded-lg transition-colors"
              aria-label="Maximize"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-primary-foreground/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mr-2">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-transparent border-2 border-primary text-foreground'
                    : 'bg-secondary text-foreground'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
                
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 ml-2">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Generated Content Cards */}
          {generatedContent && generatedContent.length > 0 && generatedContent.map((content) => (
            <div key={content.id}>
              {renderGeneratedContent(content)}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start items-start">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mr-2">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-secondary rounded-2xl px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to generate bugs, test cases, or help with QA..."
              className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              disabled={isLoading}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    )
  }

  // Fullscreen mode
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Surely AI</h3>
            <p className="text-xs text-muted-foreground">{currentModel}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullScreen(false)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground"
            aria-label="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}>
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
                <div className={`rounded-2xl px-5 py-4 ${
                  message.role === 'user'
                    ? 'bg-transparent border-2 border-primary text-foreground'
                    : 'bg-secondary text-foreground'
                }`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                  <div className="text-xs opacity-70 mt-3">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 order-2">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {/* Generated Content Cards */}
          {generatedContent && generatedContent.length > 0 && generatedContent.map((content) => (
            <div key={content.id}>
              {renderGeneratedContent(content)}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-secondary rounded-2xl px-5 py-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to generate bugs, test cases, or help with QA..."
              className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  )
}