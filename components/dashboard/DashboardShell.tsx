// ============================================
// FILE: components/dashboard/DashboardShell.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
// import { Sidebar } from './Sidebar'
// import { Header } from './Header'

type User = {
  id: string
  email?: string
}

type Profile = {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

type Suite = {
  id: string
  name: string
  description: string | null
  owner_type: string
  owner_id: string
  created_at: string
}

interface DashboardShellProps {
  user: User
  profile: Profile | null
  suites: Suite[]
  children: React.ReactNode
}

export function DashboardShell({ user, profile, suites, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  // Extract current suite ID from pathname
  const getCurrentSuiteId = () => {
    const match = pathname.match(/^\/([a-f0-9-]{36})/)
    return match ? match[1] : null
  }

  const currentSuiteId = getCurrentSuiteId()
  const currentSuite = suites.find(s => s.id === currentSuiteId)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      {/* <Sidebar
        suites={suites}
        currentSuiteId={currentSuiteId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      /> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <Header
          user={user}
          profile={profile}
          currentSuite={currentSuite}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        /> */}
        
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}