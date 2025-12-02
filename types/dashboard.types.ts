// ============================================
// FILE: types/dashboard.types.ts
// ============================================

export type User = {
  id: string
  email?: string
}

export type Profile = {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

export type Suite = {
  id: string
  name: string
  description: string | null
  owner_type: string
  owner_id: string
  created_at: string | null
}