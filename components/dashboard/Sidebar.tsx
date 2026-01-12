// ============================================
// FILE: components/dashboard/Sidebar.tsx (UPDATED)
// Now with Tests dropdown grouping
// ============================================
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Plus, FolderOpen, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { suiteNavigation, globalNavigation } from '@/config/navigation'
import Image from 'next/image'
import { setCurrentSuite } from '@/lib/suites/session'
import { CreateSuitePortal } from '@/components/suites/CreateSuitePortal'
import type { Suite } from '@/types/dashboard.types'

interface SidebarProps {
  suites: Suite[]
  currentSuiteId: string | null
  userId: string
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ suites, currentSuiteId, userId, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [suiteSwitcherOpen, setSuiteSwitcherOpen] = React.useState(false)
  const [isSwitching, setIsSwitching] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isCreatePortalOpen, setIsCreatePortalOpen] = React.useState(false)
  const [openDropdowns, setOpenDropdowns] = React.useState<Record<string, boolean>>({})

  const currentSuite = suites.find(s => s.id === currentSuiteId)

  const handleSwitchSuite = async (suiteId: string) => {
    if (suiteId === currentSuiteId || isSwitching) return

    setIsSwitching(true)
    const result = await setCurrentSuite(suiteId)

    if (result.success) {
      setSuiteSwitcherOpen(false)
      router.refresh()
      if (window.innerWidth < 1024) {
        onToggle()
      }
    } else {
      alert('Failed to switch suite: ' + result.error)
    }

    setIsSwitching(false)
  }

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onToggle()
    }
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    if (!isCollapsed) {
      setSuiteSwitcherOpen(false)
      setOpenDropdowns({})
    }
  }

  const handleCreateSuite = () => {
    setSuiteSwitcherOpen(false)
    setIsCreatePortalOpen(true)
    if (window.innerWidth < 1024) {
      onToggle()
    }
  }

  const toggleDropdown = (itemTitle: string) => {
    if (isCollapsed) return
    setOpenDropdowns(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }))
  }

  // Check if any child is active
  const isDropdownActive = (items?: any[]) => {
    if (!items) return false
    return items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 h-screen border-r border-border flex flex-col transition-all duration-300 ease-in-out z-50 bg-background',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:w-20' : 'w-72 lg:w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-border shrink-0",
          isCollapsed ? "lg:justify-center lg:px-4" : "justify-between px-6"
        )}>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group transition-all duration-300"
            onClick={handleNavClick}
          >
            <div className="relative w-8 h-8">
              <Image
                src={process.env.NEXT_PUBLIC_CLOUDINARY_LOGO_URL || '/logo.svg'}
                alt="Surely"
                fill
                className="object-contain transition-transform group-hover:rotate-12 group-hover:scale-110 duration-300"
                priority
              />
            </div>
            <span className={cn(
              "text-xl font-bold text-foreground tracking-tight transition-all duration-300",
              isCollapsed && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
            )}>
              Surely
            </span>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Suite Switcher */}
        {currentSuite && (
          <div className={cn(
            "py-6 border-b border-border shrink-0",
            isCollapsed ? "lg:px-2" : "px-4"
          )}>
            <button
              onClick={() => setSuiteSwitcherOpen(!suiteSwitcherOpen)}
              className={cn(
                "w-full flex items-center rounded-xl transition-all duration-200",
                "hover:bg-muted/50 active:scale-[0.98] group",
                suiteSwitcherOpen && "bg-muted/30",
                isCollapsed ? "lg:justify-center lg:px-2 lg:py-2" : "justify-between px-4 py-3"
              )}
              disabled={isSwitching}
            >
              <div className={cn(
                "flex items-center min-w-0 flex-1",
                isCollapsed ? "lg:justify-center" : "gap-3"
              )}>
                <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center shrink-0 group-hover:border-primary transition-colors">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div className={cn(
                  "min-w-0 flex-1 text-left transition-all duration-300",
                  isCollapsed ? "lg:hidden" : "ml-3"
                )}>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {currentSuite.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {currentSuite.owner_type}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-all duration-200 shrink-0',
                  suiteSwitcherOpen && 'rotate-180 text-foreground',
                  isCollapsed && "lg:hidden"
                )}
              />
            </button>

            {/* Suite Dropdown */}
            {suiteSwitcherOpen && !isCollapsed && (
              <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {suites.map(suite => (
                    <button
                      key={suite.id}
                      onClick={() => handleSwitchSuite(suite.id)}
                      disabled={isSwitching}
                      className={cn(
                        'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        'hover:bg-muted/50 active:scale-[0.98]',
                        suite.id === currentSuiteId
                          ? 'bg-primary/5 text-primary border border-primary/20'
                          : 'text-foreground border border-transparent',
                        isSwitching && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="truncate">{suite.name}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCreateSuite}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    "text-primary hover:bg-primary/5 active:scale-[0.98] border border-dashed border-primary/30 hover:border-primary/50"
                  )}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>New Suite</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto py-6 space-y-8",
          isCollapsed ? "lg:px-2" : "px-4"
        )}>
          {/* Suite Navigation */}
          {currentSuiteId && suiteNavigation.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <div className={cn(
                "flex items-center justify-between",
                isCollapsed ? "lg:px-0" : "px-4"
              )}>
                {!isCollapsed && (
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                {idx === 0 && (
                  <button
                    onClick={toggleCollapse}
                    className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:scale-110 active:scale-95 shrink-0 ml-auto"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-foreground transition-transform duration-200" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 text-foreground transition-transform duration-200" />
                    )}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon
                  const hasDropdown = item.items && item.items.length > 0
                  const isDropdownOpen = openDropdowns[item.title]
                  const isActive = hasDropdown 
                    ? isDropdownActive(item.items)
                    : pathname === item.href

                  if (hasDropdown) {
                    // Render dropdown item
                    return (
                      <div key={item.title}>
                        <button
                          onClick={() => toggleDropdown(item.title)}
                          title={isCollapsed ? item.title : undefined}
                          className={cn(
                            'w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                            'active:scale-[0.98] group relative',
                            isActive
                              ? 'bg-primary/5 text-primary border border-primary/20'
                              : 'text-foreground hover:bg-muted/50 border border-transparent hover:border-border',
                            isCollapsed ? 'lg:justify-center lg:p-3' : 'gap-3 px-4 py-3'
                          )}
                        >
                          {Icon && (
                            <Icon className={cn(
                              "h-5 w-5 shrink-0 transition-colors",
                              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                          )}
                          <span className={cn(
                            "truncate flex-1 text-left transition-all duration-300",
                            isCollapsed && "lg:hidden"
                          )}>
                            {item.title}
                          </span>
                          <ChevronDown className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200",
                            isActive ? "text-primary" : "text-muted-foreground",
                            isDropdownOpen && "rotate-180",
                            isCollapsed && "lg:hidden"
                          )} />
                        </button>

                        {/* Dropdown Items */}
                        {isDropdownOpen && !isCollapsed && (
                          <div className="mt-1 ml-4 pl-4 border-l-2 border-border space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {item.items!.map(subItem => {
                              const SubIcon = subItem.icon
                              const isSubActive = pathname === subItem.href

                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={handleNavClick}
                                  className={cn(
                                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                    'active:scale-[0.98] group',
                                    isSubActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                  )}
                                >
                                  {SubIcon && (
                                    <SubIcon className={cn(
                                      "h-4 w-4 shrink-0",
                                      isSubActive ? "text-primary" : "text-muted-foreground"
                                    )} />
                                  )}
                                  <span className="truncate">{subItem.title}</span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Render regular item
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      title={isCollapsed ? item.title : undefined}
                      className={cn(
                        'flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                        'active:scale-[0.98] group relative',
                        isActive
                          ? 'bg-primary/5 text-primary border border-primary/20'
                          : 'text-foreground hover:bg-muted/50 border border-transparent hover:border-border',
                        isCollapsed ? 'lg:justify-center lg:p-3' : 'gap-3 px-4 py-3'
                      )}
                    >
                      {Icon && (
                        <Icon className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                      )}
                      <span className={cn(
                        "truncate transition-all duration-300",
                        isCollapsed && "lg:hidden"
                      )}>
                        {item.title}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Global Navigation */}
          {globalNavigation.map((section, idx) => (
            <div key={idx} className="space-y-2">
              {!isCollapsed && (
                <h3 className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                      onClick={handleNavClick}
                      title={isCollapsed ? item.title : undefined}
                      className={cn(
                        'flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                        'active:scale-[0.98] group',
                        isActive
                          ? 'bg-primary/5 text-primary border border-primary/20'
                          : 'text-foreground hover:bg-muted/50 border border-transparent hover:border-border',
                        isCollapsed ? 'lg:justify-center lg:p-3' : 'gap-3 px-4 py-3'
                      )}
                    >
                      {Icon && (
                        <Icon className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                      )}
                      <span className={cn(
                        "truncate transition-all duration-300",
                        isCollapsed && "lg:hidden"
                      )}>
                        {item.title}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Create Suite Portal */}
      <CreateSuitePortal
        userId={userId}
        isOpen={isCreatePortalOpen}
        onClose={() => setIsCreatePortalOpen(false)}
        onSuccess={(suiteId) => {
          handleSwitchSuite(suiteId)
        }}
      />
    </>
  )
}