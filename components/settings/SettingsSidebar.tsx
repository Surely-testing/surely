// ============================================
// FILE: components/settings/SettingsSidebar.tsx
// ============================================
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  Building2,
  Bell,
  UserCircle,
  Lock,
  CreditCard,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SettingsSidebarProps {
  accountType: 'individual' | 'organization' | 'organization-admin'
}

export default function SettingsSidebar({ accountType }: SettingsSidebarProps) {
  const pathname = usePathname()
  const isOrgAccount = accountType === 'organization' || accountType === 'organization-admin'

  const settingsMenu = [
    {
      label: isOrgAccount ? 'Organization' : 'Account',
      href: '/settings/account',
      icon: isOrgAccount ? Building2 : UserCircle,
    },
    {
      label: 'Profile',
      href: '/settings/profile',
      icon: UserCircle,
    },
    {
      label: 'Security',
      href: '/settings/security',
      icon: Lock,
    },
    {
      label: 'Subscription',
      href: '/settings/subscription',
      icon: CreditCard,
    },
    {
      label: 'Notifications',
      href: '/settings/notifications',
      icon: Bell,
    },
    {
      label: 'Suites',
      href: '/settings/suites',
      icon: LayoutGrid,
    },
  ]

  return (
    <aside className="w-64 border-r bg-muted/30 p-4">
      <div className="mb-6 space-y-4">
        <Link href="/dashboard">
          <Button variant="outline" className="w-full justify-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h2 className="text-lg font-semibold px-2">Settings</h2>
      </div>
      <nav className="space-y-1">
        {settingsMenu.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <ChevronRight className="h-4 w-4" />
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}