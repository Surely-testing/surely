// ============================================
// FILE: components/settings/NotificationsView.tsx
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/Button'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export default function NotificationsView({ userId, schedules, profile }: any) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [testCaseUpdates, setTestCaseUpdates] = useState(true)
  const [bugReports, setBugReports] = useState(true)
  const [teamActivity, setTeamActivity] = useState(false)
  const [weeklyReports, setWeeklyReports] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = () => {
    toast.success('Notification preferences updated')
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    toast.success('Theme updated')
  }

  const themes = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Light mode active'
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Dark mode active'
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Use system settings'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Theme Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Theme Preferences
          </CardTitle>
          <CardDescription>
            Choose your preferred theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mounted && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon
                  const isActive = theme === themeOption.value
                  
                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => handleThemeChange(themeOption.value)}
                      className={cn(
                        'group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200',
                        'hover:border-primary/50 hover:bg-muted/30 active:scale-[0.98]',
                        isActive
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border'
                      )}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                      <div className={cn(
                        'p-3 rounded-lg transition-all duration-200',
                        isActive 
                          ? 'bg-primary/10 ring-2 ring-primary/20' 
                          : 'bg-muted group-hover:bg-muted/80'
                      )}>
                        <Icon className={cn(
                          'h-6 w-6 transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="text-center">
                        <p className={cn(
                          'font-semibold text-sm transition-colors',
                          isActive ? 'text-primary' : 'text-foreground'
                        )}>
                          {themeOption.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {themeOption.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div>
                  <Label className="text-sm font-medium">Current Theme</Label>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {theme === 'system' ? 'Following system preferences' : `${theme} mode active`}
                  </p>
                </div>
                <div className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center',
                  theme === 'dark' ? 'bg-slate-900' : theme === 'light' ? 'bg-white border' : 'bg-gradient-to-br from-white to-slate-900'
                )}>
                  {theme === 'dark' && <Moon className="h-4 w-4 text-white" />}
                  {theme === 'light' && <Sun className="h-4 w-4 text-amber-500" />}
                  {theme === 'system' && <Monitor className="h-4 w-4 text-foreground" />}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what email notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important events
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Test Case Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when test cases are created or updated
              </p>
            </div>
            <Switch
              checked={testCaseUpdates}
              onCheckedChange={setTestCaseUpdates}
              disabled={!emailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bug Reports</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about new bugs and status changes
              </p>
            </div>
            <Switch
              checked={bugReports}
              onCheckedChange={setBugReports}
              disabled={!emailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Team Activity</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when team members make changes
              </p>
            </div>
            <Switch
              checked={teamActivity}
              onCheckedChange={setTeamActivity}
              disabled={!emailNotifications}
            />
          </div>

          <Button onClick={handleSave}>Save Preferences</Button>
        </CardContent>
      </Card>

      {/* Report Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Report Schedules</CardTitle>
          <CardDescription>
            Automated reports sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Summary Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of test activity
              </p>
            </div>
            <Switch
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
            />
          </div>

          {schedules && schedules.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-4">Active Schedules</h4>
              <div className="space-y-3">
                {schedules.map((schedule: any) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{schedule.type} Report</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {schedule.frequency} • Next run: {new Date(schedule.next_run).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}