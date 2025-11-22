// ============================================
// FILE: components/dashboard/DashboardShell.tsx
// ============================================
'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AIAssistantProvider } from '@/components/ai/AIAssistantProvider'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { AIFloatingButton } from '@/components/ai/AIFloatingButton'
import { ContextualTips } from '@/components/ai/ContextualTips'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useSuiteContext } from '@/providers/SuiteContextProvider'
import type { User, Profile, Suite } from '@/types/dashboard.types'

interface DashboardShellProps {
  user: User
  profile: Profile | null
  suites: Suite[]
  children: React.ReactNode
}

export function DashboardShell({ user, profile, suites, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  
  // Get current suite from context instead of URL
  const { suite: currentSuite } = useSuiteContext()

  console.log('DashboardShell - Current suite:', currentSuite?.id, currentSuite?.name)

  return (
    <AIAssistantProvider
      userId={user.id}
      suiteId={currentSuite.id}
      suiteName={currentSuite.name}
    >
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          suites={suites}
          currentSuiteId={currentSuite.id}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            user={user}
            profile={profile}
            currentSuite={currentSuite}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>

        {/* AI Components - Work across ALL dashboards */}
        <ContextualTips />
        <AIFloatingButton />
        <AIAssistant />
      </div>
    </AIAssistantProvider>
  )
}