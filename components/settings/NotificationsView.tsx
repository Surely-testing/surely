// ============================================
// FILE: components/settings/NotificationsView.tsx
// ============================================
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

export default function NotificationsView({ userId, schedules }: any) {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [testCaseUpdates, setTestCaseUpdates] = useState(true)
  const [bugReports, setBugReports] = useState(true)
  const [teamActivity, setTeamActivity] = useState(false)
  const [weeklyReports, setWeeklyReports] = useState(false)

  const handleSave = () => {
    toast.success('Notification preferences updated')
  }

  return (
    <div className="space-y-6">
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

          {schedules.length > 0 && (
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