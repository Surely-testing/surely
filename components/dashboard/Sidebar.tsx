// ============================================
// FILE: components/dashboard/Sidebar.tsx
// ============================================
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Plus, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSuiteNavigation, globalNavigation } from '@/config/navigation'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

type Suite = {
  id: string
  name: string
  description: string | null
  owner_type: string
  owner_id: string
  created_at: string
}

interface SidebarProps {
  suites: Suite[]
  currentSuiteId: string | null
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ suites, currentSuiteId, isOpen }: SidebarProps) {
  const pathname = usePathname()
  const [suiteSwitcherOpen, setSuiteSwitcherOpen] = React.useState(false)

  const currentSuite = suites.find(s => s.id === currentSuiteId)
  const suiteNavigation = currentSuiteId ? getSuiteNavigation(currentSuiteId) : []

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-sidebar border-r border-border flex flex-col transition-all duration-300',
          isOpen ? 'w-64' : 'w-0 lg:w-20'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center px-4 border-b border-border">
          <Link href="/" className="flex items-center">
            <Image
              src={process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || '/logo.svg'}
              alt="Surely"
              width={32}
              height={32}
              className="flex-shrink-0"
            />
            {isOpen && (
              <span className="ml-2 text-xl font-bold text-sidebar-foreground">
                Surely
              </span>
            )}
          </Link>
        </div>

        {/* Suite Switcher */}
        {currentSuite && (
          <div className="p-4 border-b border-border">
            <button
              onClick={() => setSuiteSwitcherOpen(!suiteSwitcherOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="flex items-center min-w-0 flex-1">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-4 w-4 text-white" />
                </div>
                {isOpen && (
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {currentSuite.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentSuite.owner_type}
                    </p>
                  </div>
                )}
              </div>
              {isOpen && (
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                    suiteSwitcherOpen && 'rotate-180'
                  )}
                />
              )}
            </button>

            {/* Suite Dropdown */}
            {suiteSwitcherOpen && isOpen && (
              <div className="mt-2 space-y-1">
                {suites.map(suite => (
                  <Link
                    key={suite.id}
                    href={`/${suite.id}`}
                    onClick={() => setSuiteSwitcherOpen(false)}
                    className={cn(
                      'block px-3 py-2 rounded-lg text-sm transition-colors',
                      suite.id === currentSuiteId
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-primary font-medium'
                        : 'text-sidebar-foreground hover:bg-muted'
                    )}
                  >
                    {suite.name}
                  </Link>
                ))}
                <Link
                  href="/suites/new"
                  className="flex items-center px-3 py-2 rounded-lg text-sm text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Suite
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Suite Navigation */}
          {suiteNavigation.map((section, idx) => (
            <div key={idx}>
              {isOpen && (
                <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                          : 'text-sidebar-foreground hover:bg-muted'
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                      {isOpen && <span className="ml-3">{item.title}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Global Navigation */}
          {globalNavigation.map((section, idx) => (
            <div key={idx}>
              {isOpen && (
                <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon
                  const isActive = pathname.startsWith(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                          : 'text-sidebar-foreground hover:bg-muted'
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                      {isOpen && <span className="ml-3">{item.title}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* New Suite Button */}
        {!currentSuiteId && isOpen && (
          <div className="p-4 border-t border-border">
            <Link href="/suites/new">
              <Button variant="primary" className="w-full" leftIcon={<Plus className="h-4 w-4" />}>
                Create Suite
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}