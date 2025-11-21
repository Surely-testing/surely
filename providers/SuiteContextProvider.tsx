// ============================================
// FILE: providers/SuiteContextProvider.tsx
// ============================================
'use client'

import React, { createContext, useContext } from 'react'

type Suite = {
  id: string
  name: string
  description: string | null
  owner_type: 'individual' | 'organization'
  owner_id: string
  admins: string[]
  members: string[]
  created_at: string
  updated_at: string
}

type SuiteContextType = {
  suite: Suite
  userId: string
  isAdmin: boolean
  isMember: boolean
  canWrite: boolean
  canAdmin: boolean
}

const SuiteContext = createContext<SuiteContextType | undefined>(undefined)

export function SuiteContextProvider({
  suite,
  userId,
  children,
}: {
  suite: Suite
  userId: string
  children: React.ReactNode
}) {
  const isAdmin = suite.admins.includes(userId) || suite.owner_id === userId
  const isMember = suite.members.includes(userId) || isAdmin
  const canWrite = isMember
  const canAdmin = isAdmin

  return (
    <SuiteContext.Provider
      value={{
        suite,
        userId,
        isAdmin,
        isMember,
        canWrite,
        canAdmin,
      }}
    >
      {children}
    </SuiteContext.Provider>
  )
}

export const useSuiteContext = () => {
  const context = useContext(SuiteContext)
  if (context === undefined) {
    throw new Error('useSuiteContext must be used within a SuiteContextProvider')
  }
  return context
}