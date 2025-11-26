'use client'

import React, { useState, useRef, useEffect, JSX } from 'react'
import { useAI } from './AIAssistantProvider'
import { X, Maximize2, Minimize2, Send, Sparkles, Bot, User } from 'lucide-react'

export function AIAssistant() {
  const { 
    isOpen, 
    setIsOpen, 
    messages, 
    sendMessage, 
    isLoading,
    error,
    currentModel 
  } = useAI()
  
  const [input, setInput] = useState('')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 btn-primary rounded-full p-4 shadow-theme-lg hover:shadow-theme-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>
    )
  }

  // Regular window mode
  if (!isFullScreen) {
    return (
      <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-card rounded-2xl shadow-theme-xl border border-border flex flex-col z-50 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border btn-primary text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
              <p className="text-xs opacity-90 text-white">({currentModel})</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Maximize"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'btn-primary text-white'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <div className="prose prose-sm max-w-none [&_*]:text-inherit">
                  {message.content.split('\n').map((line, i) => {
                    if (line.startsWith('#')) {
                      const level = line.match(/^#+/)?.[0].length || 1
                      const text = line.replace(/^#+\s*/, '')
                      const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements
                      return (
                        <HeaderTag key={i} className="font-bold mt-3 mb-2">
                          {text}
                        </HeaderTag>
                      )
                    }
                    if (line.trim().startsWith('-')) {
                      return (
                        <li key={i} className="ml-4">
                          {line.replace(/^-\s*/, '')}
                        </li>
                      )
                    }
                    return line.trim() ? (
                      <p key={i} className="mb-2">
                        {line}
                      </p>
                    ) : null
                  })}
                </div>
                
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
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
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm border border-destructive/20">
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your tests, bugs, or reports..."
              className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="btn-primary px-6 py-3 rounded-xl hover:shadow-theme-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              aria-label="Send message"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    )
  }

  // Fullscreen mode - Claude-style centered layout
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-nav">
        <div className="flex items-center gap-3">
          <div className="p-2 btn-primary rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-nav-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">({currentModel})</p>
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

      {/* Messages Area - Centered with max-width like Claude */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${message.role === 'user' ? '' : 'space-y-3'}`}>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full btn-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">AI Assistant</span>
                  </div>
                )}

                {message.role === 'user' ? (
                  <div className="btn-primary rounded-2xl px-4 py-3 text-white">
                    <div className="prose prose-sm max-w-none [&_*]:text-white">
                      {message.content.split('\n').map((line, i) => {
                        if (line.startsWith('#')) {
                          const level = line.match(/^#+/)?.[0].length || 1
                          const text = line.replace(/^#+\s*/, '')
                          const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements
                          return (
                            <HeaderTag key={i} className="font-bold mt-3 mb-2">
                              {text}
                            </HeaderTag>
                          )
                        }
                        if (line.trim().startsWith('-')) {
                          return (
                            <li key={i} className="ml-4">
                              {line.replace(/^-\s*/, '')}
                            </li>
                          )
                        }
                        return line.trim() ? (
                          <p key={i} className="mb-2">
                            {line}
                          </p>
                        ) : null
                      })}
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="ml-9 prose prose-gray max-w-none [&_p]:text-foreground [&_li]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-foreground">
                      {message.content.split('\n').map((line, i) => {
                        if (line.startsWith('#')) {
                          const level = line.match(/^#+/)?.[0].length || 1
                          const text = line.replace(/^#+\s*/, '')
                          const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements
                          return (
                            <HeaderTag key={i} className="font-bold mt-6 mb-3">
                              {text}
                            </HeaderTag>
                          )
                        }
                        if (line.trim().startsWith('-')) {
                          return (
                            <li key={i} className="ml-4 leading-relaxed">
                              {line.replace(/^-\s*/, '')}
                            </li>
                          )
                        }
                        return line.trim() ? (
                          <p key={i} className="mb-4 leading-relaxed">
                            {line}
                          </p>
                        ) : null
                      })}
                    </div>
                    <div className="ml-9 text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full btn-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">AI Assistant</span>
                </div>
                <div className="ml-9">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 border border-destructive/20">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom, centered */}
      <div className="border-t border-border bg-nav">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your tests, bugs, or reports..."
              className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              disabled={isLoading}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="btn-primary px-6 py-3 rounded-xl hover:shadow-theme-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 flex items-center gap-2"
              aria-label="Send message"
            >
              <Send className="w-5 h-5 text-white" />
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