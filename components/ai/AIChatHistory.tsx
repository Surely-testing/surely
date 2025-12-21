'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, MessageSquare, PanelLeftClose, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { logger } from '@/lib/utils/logger'

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSessions()
  }, [suiteId, userId])

  const fetchSessions = async () => {
    if (!userId || !suiteId) {
      logger.log('Missing userId or suiteId, skipping fetch')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      logger.log('Fetching chat sessions for:', { userId, suiteId })
      
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('suite_id', suiteId)
        .order('updated_at', { ascending: false })

      if (error) {
        logger.log('Supabase error:', error)
        throw error
      }

      logger.log('Fetched sessions:', data)
      
      const validSessions = (data || []).filter(
        session => session.created_at && session.updated_at
      ) as ChatSession[]
      
      setSessions(validSessions)
    } catch (error: any) {
      logger.log('Failed to fetch chat sessions:', error)
      toast.error('Failed to load chat history', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessionToDelete(session)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return

    setDeletingId(sessionToDelete.id)
    setDeleteDialogOpen(false)

    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionToDelete.id)

      if (error) throw error

      setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id))
      
      if (currentSessionId === sessionToDelete.id) {
        onNewChat()
      }
      
      toast.success('Chat deleted successfully')
    } catch (error: any) {
      logger.log('Failed to delete chat:', error)
      toast.error('Failed to delete chat', {
        description: error.message || 'Please try again'
      })
    } finally {
      setDeletingId(null)
      setSessionToDelete(null)
    }
  }

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true)
  }

  const handleConfirmDeleteAll = async () => {
    setDeleteAllDialogOpen(false)

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
      logger.log('Failed to delete all chats:', error)
      toast.error('Failed to delete chats', {
        description: error.message || 'Please try again'
      })
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
    <>
      <div className="h-full flex flex-col bg-background border-r border-border">
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
              <p className="text-xs text-muted-foreground mt-1">Start a conversation to see it here</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectSession(session.id)
                    }
                  }}
                  className={`w-full px-3 py-3 rounded-lg text-left transition-colors group relative cursor-pointer ${
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
                          {session.message_count || 0} messages
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(session.updated_at)}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteClick(session, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                      disabled={deletingId === session.id}
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {sessions.length > 0 && (
          <div className="p-4 border-t border-border">
            <button
              onClick={handleDeleteAllClick}
              className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          </div>
        )}
      </div>

      {/* Delete Single Chat Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle className="text-left">Delete Chat?</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{sessionToDelete?.title}"</span>? 
              This will permanently delete all {sessionToDelete?.message_count || 0} messages in this conversation.
              
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleConfirmDelete}
              className="gap-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Chats Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle className="text-left">Delete All Chats?</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              Are you sure you want to delete all {sessions.length} chat{sessions.length !== 1 ? 's' : ''}? 
              This will permanently delete all chat history and messages for this suite.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteAllDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleConfirmDeleteAll}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}