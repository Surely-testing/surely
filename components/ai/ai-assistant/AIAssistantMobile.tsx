'use client'

import React, { useRef } from 'react'
import { AIChatHistory } from '../AIChatHistory'
import { X, Send, Bot, User, Sparkles, FileText, AlertCircle, FileEdit, Menu } from 'lucide-react'
import { Message } from '@/lib/ai/types'
import { MessageContent } from '../MessageContent'

interface AIAssistantMobileProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: Message[]
  isLoading: boolean
  error: string | null
  currentModel: string
  generatedContent: any[]
  input: string
  setInput: (input: string) => void
  handleSend: () => void
  handleKeyPress: (e: React.KeyboardEvent) => void
  toggleReviewPanel: () => void
  handleMessageClick: (message: Message) => void
  handleInsertToDocument: (content: string) => void
  showMobileMenu: boolean
  setShowMobileMenu: (show: boolean) => void
  localSessionId: string | null
  handleSelectSession: (sessionId: string) => void
  handleNewChat: () => void
  context: any
  documentContext: any
  getDocumentQuickActions: () => string[]
}

export function AIAssistantMobile({
  isOpen,
  setIsOpen,
  messages,
  isLoading,
  error,
  currentModel,
  generatedContent,
  input,
  setInput,
  handleSend,
  handleKeyPress,
  toggleReviewPanel,
  handleMessageClick,
  handleInsertToDocument,
  showMobileMenu,
  setShowMobileMenu,
  localSessionId,
  handleSelectSession,
  handleNewChat,
  context,
  documentContext,
  getDocumentQuickActions
}: AIAssistantMobileProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isEditingDocument = documentContext !== null

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl">
        <button
          onClick={() => setShowMobileMenu(true)}
          className="p-2 hover:bg-muted/80 rounded-xl transition-all text-muted-foreground hover:text-foreground"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Surely AI</h3>
            <p className="text-xs text-muted-foreground">{currentModel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isEditingDocument && (
            <div className="px-2 py-1 bg-blue-500/10 rounded-lg flex items-center gap-1">
              <FileEdit className="w-3 h-3 text-blue-600" />
            </div>
          )}

          {generatedContent.length > 0 && (
            <button
              onClick={toggleReviewPanel}
              className="px-2 py-1 bg-primary/10 rounded-lg flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary">{generatedContent.length}</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-muted/80 rounded-xl transition-all text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Context Banner */}
      {isEditingDocument && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900/50">
          <div className="flex items-start gap-2">
            <FileEdit className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 truncate">
                {documentContext.title}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {documentContext.sectionCount} sections
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {getDocumentQuickActions().slice(0, 2).map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action)}
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-card z-50 shadow-2xl">
            <AIChatHistory
              userId={context.userId}
              suiteId={context.suiteId}
              currentSessionId={localSessionId}
              onSelectSession={handleSelectSession}
              onNewChat={handleNewChat}
              onCollapse={() => setShowMobileMenu(false)}
              isCollapsed={false}
            />
          </div>
        </>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background/50 to-background">
        <div className="px-4 py-4 space-y-4">
          {messages.length === 1 && messages[0].role === 'assistant' ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {isEditingDocument ? `Help with "${documentContext.title}"` : 'How can I help?'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  {isEditingDocument 
                    ? 'Ask me to improve, expand, or help with your document'
                    : 'Ask me to generate bug reports, test cases, or help with QA tasks'}
                </p>
              </div>
            </div>
          ) : (
            <>
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
                          ? 'bg-gradient-to-br from-primary/5 to-primary/10 text-foreground border-2 border-primary/40 cursor-pointer active:scale-95 relative'
                          : 'bg-muted/80 backdrop-blur-sm text-foreground border border-border/50'
                        }`}
                      onClick={() => message.metadata?.generatedContent && handleMessageClick(message)}
                    >
                      {message.metadata?.generatedContent && (
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-semibold shadow-lg">
                          Tap to View
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

                      {message.role === 'assistant' && isEditingDocument && !message.metadata?.generatedContent && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInsertToDocument(message.content)
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 active:bg-blue-200 dark:active:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors flex items-center gap-1"
                          >
                            <FileEdit className="w-3 h-3" />
                            Insert to Document
                          </button>
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

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-2xl p-3 border border-destructive/30 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Error</p>
                    <p className="text-xs mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Mobile Input */}
      <div className="p-3 border-t border-border bg-background">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isEditingDocument ? `Ask about "${documentContext.title}"...` : 'How can I help you today?'}
            rows={1}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm resize-none max-h-32 leading-5 border-0 focus:ring-0"
            disabled={isLoading}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-foreground text-background active:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}