'use client'

import React, { useRef } from 'react'
import { AIChatHistory } from '../AIChatHistory'
import { AIGeneratedContentPanel } from '../AIGeneratedContentPanel'
import { X, Maximize2, Minimize2, Send, Bot, User, Sparkles, FileText, AlertCircle, PanelRightOpen, PanelRightClose, GripVertical, FileEdit } from 'lucide-react'
import { Message } from '@/lib/ai/types'
import { MessageContent } from '../MessageContent'

interface AIAssistantDesktopProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: Message[]
  isLoading: boolean
  error: string | null
  currentModel: string
  generatedContent: any[]
  saveContent: (contentId: string, editedData?: any) => Promise<void>
  discardContent: (contentId: string) => Promise<void>
  input: string
  setInput: (input: string) => void
  handleSend: () => void
  handleKeyPress: (e: React.KeyboardEvent) => void
  isFullScreen: boolean
  setIsFullScreen: (fullscreen: boolean) => void
  showReviewPanel: boolean
  toggleReviewPanel: () => void
  handleMessageClick: (message: Message) => void
  handleInsertToDocument: (content: string) => void
  isHistoryCollapsed: boolean
  setIsHistoryCollapsed: (collapsed: boolean) => void
  chatWidth: number
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
  localSessionId: string | null
  handleSelectSession: (sessionId: string) => void
  handleNewChat: () => void
  context: any
  documentContext: any
  getDocumentQuickActions: () => string[]
}

export function AIAssistantDesktop({
  isOpen,
  setIsOpen,
  messages,
  isLoading,
  currentModel,
  generatedContent,
  saveContent,
  discardContent,
  input,
  setInput,
  handleSend,
  handleKeyPress,
  isFullScreen,
  setIsFullScreen,
  showReviewPanel,
  toggleReviewPanel,
  handleMessageClick,
  handleInsertToDocument,
  isHistoryCollapsed,
  setIsHistoryCollapsed,
  chatWidth,
  isDragging,
  setIsDragging,
  localSessionId,
  handleSelectSession,
  handleNewChat,
  context,
  documentContext,
  getDocumentQuickActions
}: AIAssistantDesktopProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  const isEditingDocument = documentContext !== null

  if (!isOpen) {
    return null
  }

  // Desktop compact view (non-fullscreen)
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
            {isEditingDocument && (
              <div className="mr-2 px-2 py-1 bg-blue-500/10 rounded-lg flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600">Editing Doc</span>
              </div>
            )}

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

        {isEditingDocument && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900/50">
            <div className="flex items-start gap-2">
              <FileEdit className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 truncate">
                  {documentContext.title}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {documentContext.type.replace('_', ' ')} • {documentContext.sectionCount} sections
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

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-background/50 to-background">
          {messages.length === 1 && messages[0].role === 'assistant' && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {isEditingDocument ? `Help with "${documentContext.title}"` : 'How can I help?'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isEditingDocument 
                    ? 'Ask me to improve, expand, or help with your document'
                    : 'Ask me to generate bug reports, test cases, or help with QA tasks'}
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
                  
                  {message.role === 'assistant' && isEditingDocument && !message.metadata?.generatedContent && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInsertToDocument(message.content)
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors flex items-center gap-1"
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

          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 sm:p-4 border-t border-border/50 bg-background">
          <div className="flex items-end gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isEditingDocument ? `Ask about "${documentContext.title}"...` : 'How can I help you today?'}
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

  // Desktop fullscreen view
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
          {isEditingDocument && (
            <div className="px-3 py-1.5 bg-blue-500/10 rounded-lg flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-blue-600" />
              <div className="text-sm">
                <span className="font-semibold text-blue-600">Editing:</span>
                <span className="text-blue-700 dark:text-blue-300 ml-1">{documentContext.title}</span>
              </div>
            </div>
          )}

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
          {isEditingDocument && (
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900/50">
              <div className="flex items-start gap-3 max-w-4xl mx-auto">
                <FileEdit className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Editing: {documentContext.title}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                    {documentContext.type.replace('_', ' ')} • {documentContext.sectionCount} sections • ~{documentContext.wordCount} words
                  </p>
                  
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {getDocumentQuickActions().map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(action)}
                        className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background/50 to-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
              {messages.length === 1 && messages[0].role === 'assistant' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-2xl mb-3">
                      {isEditingDocument ? `Help with "${documentContext.title}"` : 'How can I help today?'}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed max-w-md">
                      {isEditingDocument 
                        ? `I can help improve, expand, or refine your ${documentContext.type.replace('_', ' ')}`
                        : 'Ask me to generate bug reports, test cases, or help with any QA tasks'}
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
                          
                          {message.role === 'assistant' && isEditingDocument && !message.metadata?.generatedContent && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleInsertToDocument(message.content)
                                }}
                                className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors flex items-center gap-1.5"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                Insert to Document
                              </button>
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
                  placeholder={isEditingDocument ? `Ask about "${documentContext.title}"...` : 'How can I help you today?'}
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