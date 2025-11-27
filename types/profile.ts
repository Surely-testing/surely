// ============================================
// FILE: types/profile.ts
// ============================================

export interface Profile {
  id: string
  email: string
  name: string | null
  bio: string | null
  company: string | null
  location: string | null
  website: string | null
  avatar_url: string | null
  account_type: string
  organization_id: string | null
  metadata: any
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  role: string | null
  status: string | null
  timezone: string | null
  theme: string | null
}