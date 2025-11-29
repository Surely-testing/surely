// ============================================
// FILE: components/settings/ThemeSettings.tsx
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/label'
import { Sun, Moon, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ThemeSettingsProps {
  profile: any
}

export default function ThemeSettings({ profile }: ThemeSettingsProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    (profile?.theme as 'light' | 'dark' | 'system') || 'system'
  )
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Detect actual theme being used
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setCurrentTheme(isDark ? 'dark' : 'light')
    } else {
      setCurrentTheme(theme)
    }
  }, [theme])

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    
    // Update in database
    const response = await fetch('/api/profile/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme })
    })

    if (response.ok) {
      // Apply theme
      if (newTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.classList.toggle('dark', isDark)
      } else {
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
      }
      toast.success('Theme updated')
    } else {
      toast.error('Failed to update theme')
    }
  }

  const themes = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light mode'
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark mode'
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Use system settings'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Preferences</CardTitle>
        <CardDescription>
          Choose your preferred theme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon
            const isActive = theme === themeOption.value
            
            return (
              <button
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                className={cn(
                  'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200',
                  'hover:border-primary/50 hover:bg-muted/50',
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                )}
              >
                <div className={cn(
                  'p-3 rounded-lg transition-colors',
                  isActive ? 'bg-primary/10' : 'bg-muted'
                )}>
                  <Icon className={cn(
                    'h-6 w-6',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="text-center">
                  <p className={cn(
                    'font-medium',
                    isActive ? 'text-primary' : 'text-foreground'
                  )}>
                    {themeOption.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {themeOption.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="pt-4 border-t">
          <Label>Current Theme</Label>
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {theme === 'system' ? `System (${currentTheme})` : currentTheme}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}