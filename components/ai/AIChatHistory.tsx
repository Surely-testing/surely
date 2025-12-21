// ============================================
// FILE: components/ai/AIChatHistory.tsx
// ============================================
'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, MessageSquare, PanelLeftClose } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  suite_id: string
  user_id: string
}

interface AIChatHistoryProps {
  userId: string
  suiteId: string
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onCollapse?: () => void
  isCollapsed?: boolean
}

export function AIChatHistory({
  userId,
  suiteId,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onCollapse,
  isCollapsed = false
}: AIChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSessions()
  }, [suiteId, userId])

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('suite_id', suiteId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setSessions((data || []).filter(session => session.created_at && session.updated_at) as ChatSession[])
    } catch (error: any) {
      console.error('Failed to fetch chat sessions:', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Delete this chat session?')) return

    setDeletingId(sessionId)
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      setSessions(prev => prev.filter(s => s.id !== sessionId))
      
      if (currentSessionId === sessionId) {
        onNewChat()
      }
      
      toast.success('Chat deleted')
    } catch (error: any) {
      console.error('Failed to delete chat:', error)
      toast.error('Failed to delete chat')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Delete all chat history? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('suite_id', suiteId)

      if (error) throw error

      setSessions([])
      onNewChat()
      toast.success('All chats deleted')
    } catch (error: any) {
      console.error('Failed to delete all chats:', error)
      toast.error('Failed to delete chats')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col bg-background border-r border-border items-center py-4">
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground mb-4"
            title="Expand sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={onNewChat}
          className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-foreground">Chat History</h3>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No chat history</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full px-3 py-3 rounded-lg text-left transition-colors group relative ${
                  currentSessionId === session.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted border border-transparent'
                } ${deletingId === session.id ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {session.message_count} messages
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(session.updated_at)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {sessions.length > 0 && (
        <div className="p-4 border-t border-border">
          <button
            onClick={handleDeleteAll}
            className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </button>
        </div>
      )}
    </div>
  )
}