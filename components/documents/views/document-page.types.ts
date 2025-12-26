// ============================================
// FILE: components/documents/document-page.types.ts
// UI-specific types for the documents page
// ============================================

export type ViewMode = 'grid' | 'table'
export type DocumentType = 'all' | 'meeting_notes' | 'test_plan' | 'test_strategy' | 'brainstorm' | 'general'
export type SortField = 'updated_at' | 'created_at' | 'title'
export type SortOrder = 'asc' | 'desc'
export type GroupBy = 'none' | 'type' | 'creator' | 'date'
export type DocumentVisibility = 'private' | 'public'
export type CollaboratorPermission = 'view' | 'edit'

// Extended document type for the page (includes creator info)
export interface DocumentWithCreator {
  id: string
  title: string
  content: any
  file_type: string | null
  suite_id: string
  created_by: string
  created_at: string
  updated_at: string
  archived?: boolean
  visibility?: DocumentVisibility
  creator: { 
    id: string
    name: string
    avatar_url: string | null 
  }
}

export interface Suite {
  id: string
  name: string
}

export interface DocumentCollaborator {
  id: string
  document_id: string
  user_id: string
  permission: CollaboratorPermission
  added_by: string
  added_at: string
  user?: {
    id: string
    name: string
    avatar_url: string | null
    email?: string
  }
}

export interface TeamMember {
  id: string
  name: string
  email: string
  avatar_url: string | null
}