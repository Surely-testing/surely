// ============================================
// FILE: config/navigation.ts
// Updated with Tests dropdown grouping
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
  Video,
  Hammer,
  FlaskConical,
  Wrench,
  FileJson,
  ClipboardList,
  PlayCircle,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon?: LucideIcon
  disabled?: boolean
  external?: boolean
  label?: string
  items?: NavItem[] // For dropdown items
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
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Tests',
        href: '/dashboard/tests', // This won't be used, just for active state
        icon: FlaskConical,
        items: [
          {
            title: 'Test Cases',
            href: '/dashboard/test-cases',
            icon: ClipboardList,
          },
          {
            title: 'Test Runs',
            href: '/dashboard/test-runs',
            icon: PlayCircle,
          },
          {
            title: 'Test Data',
            href: '/dashboard/test-data',
            icon: FileJson,
          },
        ],
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
        title: 'Recordings',
        href: '/dashboard/recordings',
        icon: Video,
      },
      {
        title: 'Documents',
        href: '/dashboard/documents',
        icon: FileText,
      },
      {
        title: 'Members',
        href: '/dashboard/members',
        icon: Users,
      },
      {
        title: 'Tools',
        href: '/dashboard/tools',
        icon: Wrench,
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