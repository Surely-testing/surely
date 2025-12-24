// ============================================
// FILE: components/documents/DocumentCollaborationDialog.tsx
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Users, X, Lock, Globe, UserPlus, Eye, Edit, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
// Avatar import removed - will use custom avatar rendering
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import type { DocumentWithCreator, DocumentCollaborator, TeamMember, CollaboratorPermission } from './document-page.types'

interface DocumentCollaborationDialogProps {
  open: boolean
  onClose: () => void
  document: DocumentWithCreator
  currentUserId: string
}

export function DocumentCollaborationDialog({
  open,
  onClose,
  document,
  currentUserId
}: DocumentCollaborationDialogProps) {
  const [visibility, setVisibility] = useState<'private' | 'public'>(document.visibility || 'private')
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [selectedPermission, setSelectedPermission] = useState<CollaboratorPermission>('view')
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingVisibility, setIsSavingVisibility] = useState(false)

  const supabase = createClient()
  const isOwner = document.created_by === currentUserId

  useEffect(() => {
    if (open) {
      fetchCollaborators()
      fetchTeamMembers()
    }
  }, [open, document.id])

  const fetchCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('document_collaborators')
        .select(`
          id,
          document_id,
          user_id,
          permission,
          added_by,
          added_at,
          profiles!inner (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('document_id', document.id)

      if (error) throw error
      
      // Transform the data to match our interface
      const transformedData: DocumentCollaborator[] = (data || []).map((item: any) => ({
        id: item.id,
        document_id: item.document_id,
        user_id: item.user_id,
        permission: item.permission as CollaboratorPermission,
        added_by: item.added_by,
        added_at: item.added_at,
        user: item.profiles ? {
          id: item.profiles.id,
          name: item.profiles.name,
          email: item.profiles.email,
          avatar_url: item.profiles.avatar_url
        } : undefined
      }))
      
      setCollaborators(transformedData)
    } catch (error: any) {
      logger.log('Error fetching collaborators:', error)
      toast.error('Failed to load collaborators')
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const { data: suite, error: suiteError } = await supabase
        .from('test_suites')
        .select('owner_id, admins, members')
        .eq('id', document.suite_id)
        .single()

      if (suiteError) throw suiteError

      const userIds = [
        suite.owner_id,
        ...(suite.admins || []),
        ...(suite.members || [])
      ].filter(Boolean).filter(id => id !== currentUserId)

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds)

      if (profilesError) throw profilesError
      setTeamMembers(profiles || [])
    } catch (error: any) {
      logger.log('Error fetching team members:', error)
      toast.error('Failed to load team members')
    }
  }

  const handleVisibilityChange = async (newVisibility: 'private' | 'public') => {
    if (!isOwner) {
      toast.error('Only the document owner can change visibility')
      return
    }

    setIsSavingVisibility(true)
    try {
      const { error } = await supabase
        .from('documents')
        .update({ visibility: newVisibility })
        .eq('id', document.id)

      if (error) throw error

      setVisibility(newVisibility)
      toast.success(`Document is now ${newVisibility}`)
    } catch (error: any) {
      logger.log('Error updating visibility:', error)
      toast.error('Failed to update visibility')
    } finally {
      setIsSavingVisibility(false)
    }
  }

  const handleAddCollaborator = async () => {
    if (!selectedMember) {
      toast.error('Please select a team member')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('document_collaborators')
        .insert({
          document_id: document.id,
          user_id: selectedMember,
          permission: selectedPermission,
          added_by: currentUserId
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('User is already a collaborator')
        } else {
          throw error
        }
        return
      }

      toast.success('Collaborator added successfully')
      setSelectedMember('')
      setSelectedPermission('view')
      fetchCollaborators()
    } catch (error: any) {
      logger.log('Error adding collaborator:', error)
      toast.error('Failed to add collaborator')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('document_collaborators')
        .delete()
        .eq('document_id', document.id)
        .eq('user_id', userId)

      if (error) throw error

      toast.success('Collaborator removed')
      fetchCollaborators()
    } catch (error: any) {
      logger.log('Error removing collaborator:', error)
      toast.error('Failed to remove collaborator')
    }
  }

  const handleUpdatePermission = async (userId: string, permission: CollaboratorPermission) => {
    try {
      const { error } = await supabase
        .from('document_collaborators')
        .update({ permission })
        .eq('document_id', document.id)
        .eq('user_id', userId)

      if (error) throw error

      toast.success('Permission updated')
      fetchCollaborators()
    } catch (error: any) {
      logger.log('Error updating permission:', error)
      toast.error('Failed to update permission')
    }
  }

  const availableMembers = teamMembers.filter(
    member => !collaborators.some(collab => collab.user_id === member.id)
  )

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share & Collaborate
          </DialogTitle>
          <DialogDescription>
            Manage who can access "{document.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visibility Toggle */}
          {isOwner && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Document Visibility</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleVisibilityChange('private')}
                  disabled={isSavingVisibility}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    visibility === 'private'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Private</span>
                </button>
                <button
                  onClick={() => handleVisibilityChange('public')}
                  disabled={isSavingVisibility}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    visibility === 'public'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Public</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {visibility === 'private' 
                  ? 'Only you and invited collaborators can access this document'
                  : 'All suite members can view this document'
                }
              </p>
            </div>
          )}

          {/* Add Collaborator */}
          {isOwner && visibility === 'private' && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Collaborator
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background disabled:opacity-50"
                >
                  <option value="">Select team member...</option>
                  {availableMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value as CollaboratorPermission)}
                  disabled={isLoading}
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-background disabled:opacity-50"
                >
                  <option value="view">Can View</option>
                  <option value="edit">Can Edit</option>
                </select>
                <Button
                  onClick={handleAddCollaborator}
                  disabled={isLoading || !selectedMember}
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Collaborators List */}
          {visibility === 'private' && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">
                Collaborators ({collaborators.length})
              </h3>
              {collaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No collaborators yet. Add team members to collaborate.
                </p>
              ) : (
                <div className="space-y-2">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {/* Simple Avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {collab.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{collab.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{collab.user?.email || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <>
                            <select
                              value={collab.permission}
                              onChange={(e) => handleUpdatePermission(collab.user_id, e.target.value as CollaboratorPermission)}
                              className="px-2 py-1 text-xs border border-border rounded bg-background"
                            >
                              <option value="view">Can View</option>
                              <option value="edit">Can Edit</option>
                            </select>
                            <button
                              onClick={() => handleRemoveCollaborator(collab.user_id)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
                              title="Remove collaborator"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {collab.permission === 'edit' ? (
                              <><Edit className="w-3 h-3" /> Can Edit</>
                            ) : (
                              <><Eye className="w-3 h-3" /> Can View</>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}