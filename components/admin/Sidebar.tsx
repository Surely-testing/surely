// ============================================
// components/admin/Sidebar.tsx (Updated)
// ============================================
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Star,
  Mail,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  User
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AdminSection } from '@/types/admin.types';

interface NavItem {
  id: AdminSection | 'settings';
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  pendingReviews?: number;
  pendingContacts?: number;
  userEmail: string;
  userName: string;
}

export default function Sidebar({ 
  isCollapsed = false, 
  onToggle,
  pendingReviews = 0,
  pendingContacts = 0,
  userEmail,
  userName
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/admin'
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="w-5 h-5" />,
      href: '/admin/users'
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/admin/subscriptions'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <DollarSign className="w-5 h-5" />,
      href: '/admin/payments'
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: <Star className="w-5 h-5" />,
      href: '/admin/reviews',
      badge: pendingReviews
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <Mail className="w-5 h-5" />,
      href: '/admin/contacts',
      badge: pendingContacts
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      href: '/admin/settings'
    }
  ];

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-bold text-slate-900">Admin</h2>
            <p className="text-xs text-slate-500">System Dashboard</p>
          </div>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <span className={isActive ? 'text-orange-600' : 'text-slate-600'}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute right-2 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        {/* User Info */}
        {!isCollapsed && (
          <div className="px-3 py-2 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-slate-600" />
              <p className="text-xs font-medium text-slate-900 truncate">
                {userName}
              </p>
            </div>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
        )}

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && (
            <span className="flex-1 text-left">
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </span>
          )}
        </button>

        {/* Footer */}
        {!isCollapsed && (
          <div className="text-xs text-slate-500 text-center pt-2">
            <p>Admin Panel v1.0</p>
          </div>
        )}
      </div>
    </aside>
  );
}