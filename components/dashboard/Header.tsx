// ============================================
// FILE: components/dashboard/Header.tsx - FINAL
// ============================================
'use client'

import React, { useState } from 'react'
import { 
  Menu, 
  Bell, 
  Search, 
  LogOut, 
  User, 
  Settings as SettingsIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { signOut } from '@/lib/actions/auth'
import Image from 'next/image'
import Link from 'next/link'
import { getInitials } from '@/lib/utils/formatters'
import { SharedRecordingControls } from '../Recordings/SharedRecordingControls'
import { RecordingPreviewDialog } from '../Recordings/RecordingPreviewDialog'
import { useRecording } from '@/providers/RecordingContext'
import type { Suite } from '@/types/dashboard.types'
import type { RecordingPreview } from '@/types/recording.types'

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

interface HeaderProps {
  user: User
  profile: Profile | null
  currentSuite?: Suite
  onMenuClick: () => void
}

export function Header({ user, profile, currentSuite, onMenuClick }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [quickActionsVisible, setQuickActionsVisible] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [recordingPreview, setRecordingPreview] = useState<RecordingPreview | null>(null)
  
  const { isRecording } = useRecording()

  const handleStopComplete = (preview: RecordingPreview) => {
    setRecordingPreview(preview)
    setShowPreview(true)
  }

  const handleSaved = () => {
    setShowPreview(false)
    setRecordingPreview(null)
  }

  return (
    <>
      <header className="bg-nav border-b border-border">
        {/* Main Header Bar - FIXED HEIGHT */}
        <div className="h-16 flex items-center justify-between px-6">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="h-5 w-5 text-nav-foreground" />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
              <Bell className="h-5 w-5 text-nav-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {profile ? getInitials(profile.name) : 'U'}
                    </span>
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-nav-foreground">
                    {profile?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.email || user.email}
                  </p>
                </div>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-theme-lg z-20">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium text-card-foreground">
                        {profile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/settings/profile"
                        className="flex items-center px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <SettingsIcon className="h-4 w-4 mr-3" />
                        Settings
                      </Link>
                    </div>
                    <div className="border-t border-border py-2">
                      <button
                        onClick={() => signOut()}
                        className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Toggle Button for Quick Actions */}
            <button
              onClick={() => setQuickActionsVisible(!quickActionsVisible)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title={quickActionsVisible ? "Hide quick actions" : "Show quick actions"}
            >
              {quickActionsVisible ? (
                <ChevronUp className="h-5 w-5 text-nav-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-nav-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions Section - COLLAPSIBLE, FIXED HEIGHT */}
        {quickActionsVisible && (
          <div className="border-t border-border bg-muted/30 h-16"> {/* FIXED HEIGHT */}
            <div className="px-6 h-full flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Recording Controls */}
                <SharedRecordingControls 
                  variant="full" 
                  onStopComplete={handleStopComplete}
                  suiteId={currentSuite?.id}
                />
              </div>

              {/* Recording Status Badge */}
              {isRecording && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">
                    Recording Active
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Preview Dialog */}
      {showPreview && recordingPreview && currentSuite && (
        <RecordingPreviewDialog
          preview={recordingPreview}
          suiteId={currentSuite.id}
          sprintId={null}
          onClose={() => {
            setShowPreview(false)
            setRecordingPreview(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}