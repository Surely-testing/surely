'use client'

import React, { createContext, useContext, ReactNode } from 'react'

export type Suite = {
  id: string
  name: string
  description: string | null
  owner_type: string
  owner_id: string
  admins: string[] | null
  members: string[] | null
  created_at: string | null
  updated_at: string | null
}

interface SuiteContextType {
  suite: Suite
  userId: string
  isAdmin: boolean
  isMember: boolean
  isOwner: boolean
  canWrite: boolean 
  canRead: boolean
  canAdmin: boolean 
}

const SuiteContext = createContext<SuiteContextType | null>(null)

interface SuiteContextProviderProps {
  suite: Suite
  userId: string
  children: ReactNode
}

export function SuiteContextProvider({ suite, userId, children }: SuiteContextProviderProps) {
  const isOwner = suite.owner_type === 'individual' && suite.owner_id === userId
  const isAdmin = suite.admins?.includes(userId) || isOwner
  const isMember = suite.members?.includes(userId) || isAdmin

  // Permissions
  const canWrite = isMember  // Members can create/edit test cases
  const canRead = isMember   // Members can view test cases
  const canAdmin = isAdmin 

  const value: SuiteContextType = {
    suite,
    userId,
    isAdmin,
    isMember,
    isOwner,
    canWrite,
    canRead,
    canAdmin,
  }

  return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>
}

export function useSuiteContext() {
  const context = useContext(SuiteContext)
  if (!context) {
    throw new Error('useSuiteContext must be used within a SuiteContextProvider')
  }
  return context
}