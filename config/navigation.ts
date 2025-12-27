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

// Suite navigation - NO suite ID in URLs
export const suiteNavigation: NavSection[] = [
  {
    title: 'Suite',
    items: [
      {
        title: 'Overview',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Test Cases',
        href: '/dashboard/test-cases',
        icon: FileText,
      },
      {
        title: 'Bugs',
        href: '/dashboard/bugs',
        icon: Bug,
      },
      {
        title: 'Sprints',
        href: '/dashboard/sprints',
        icon: Rocket,
      },
      {
        title: 'Reports',
        href: '/dashboard/reports',
        icon: BarChart3,
      },
      {
        title: 'Test Data',
        href: '/dashboard/test-data',
        icon: FolderOpen,
      },
      {
        title: 'Recordings',
        href: '/dashboard/recordings',
        icon: FolderOpen,
      },
      {
        title: 'Documents',
        href: '/dashboard/documents',
        icon: FolderOpen,
      },
      {
        title: 'Members',
        href: '/dashboard/members',
        icon: Users,
      },
      {
        title: 'Tools',
        href: '/dashboard/tools',
        icon: FolderOpen,
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
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
]