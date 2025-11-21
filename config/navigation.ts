// ============================================
// FILE: config/navigation.ts
// ============================================
import {
  LayoutDashboard,
  FileText,
  Bug,
  Rocket,
  BarChart3,
  FolderOpen,
  Users,
  Settings,
  Building2,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon?: LucideIcon
  disabled?: boolean
  external?: boolean
  label?: string
}

export type NavSection = {
  title: string
  items: NavItem[]
}

// Marketing navigation
export const marketingNav: NavItem[] = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'Features',
    href: '/features',
  },
  {
    title: 'Pricing',
    href: '/pricing',
  },
  {
    title: 'About',
    href: '/about',
  },
  {
    title: 'Contact',
    href: '/contact',
  },
]

// Dashboard navigation (suite context)
export const getSuiteNavigation = (suiteId: string): NavSection[] => [
  {
    title: 'Suite',
    items: [
      {
        title: 'Overview',
        href: `/${suiteId}`,
        icon: LayoutDashboard,
      },
      {
        title: 'Test Cases',
        href: `/${suiteId}/test-cases`,
        icon: FileText,
      },
      {
        title: 'Bugs',
        href: `/${suiteId}/bugs`,
        icon: Bug,
      },
      {
        title: 'Sprints',
        href: `/${suiteId}/sprints`,
        icon: Rocket,
      },
      {
        title: 'Reports',
        href: `/${suiteId}/reports`,
        icon: BarChart3,
      },
      {
        title: 'Documents',
        href: `/${suiteId}/documents`,
        icon: FolderOpen,
      },
      {
        title: 'Members',
        href: `/${suiteId}/members`,
        icon: Users,
      },
    ],
  },
]

// Global navigation (outside suite context)
export const globalNavigation: NavSection[] = [
  {
    title: 'General',
    items: [
      {
        title: 'Organizations',
        href: '/organizations',
        icon: Building2,
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
      },
    ],
  },
]

// Settings navigation
export const settingsNav: NavItem[] = [
  {
    title: 'Profile',
    href: '/settings/profile',
  },
  {
    title: 'Account',
    href: '/settings/account',
  },
  {
    title: 'Subscription',
    href: '/settings/subscription',
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
  },
  {
    title: 'Security',
    href: '/settings/security',
  },
]