// ============================================
// FILE: components/settings/SuitesView.tsx
// ============================================
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LayoutGrid, Crown, Shield, Users } from 'lucide-react'
import Link from 'next/link'

export default function SuitesView({ ownedSuites, memberSuites, userId }: any) {
  const getUserRole = (suite: any) => {
    if (suite.created_by === userId) return 'owner'
    if (suite.admins?.includes(userId)) return 'admin'
    return 'member'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />
      case 'admin':
        return <Shield className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const allSuites = [...ownedSuites, ...memberSuites.filter((s: any) => !ownedSuites.find((o: any) => o.id === s.id))]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Test Suites</CardTitle>
          <CardDescription>
            Test suites you own or are a member of
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allSuites.length === 0 ? (
            <div className="text-center py-12">
              <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You don't have any test suites yet
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {allSuites.map((suite: any) => {
                const role = getUserRole(suite)
                return (
                  <Card key={suite.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <LayoutGrid className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{suite.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="primary" className="capitalize">
                              {getRoleIcon(role)}
                              <span className="ml-1">{role}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {suite.owner_type === 'organization' ? 'Organization' : 'Personal'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/${suite.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suite Statistics</CardTitle>
          <CardDescription>
            Overview of your test suite activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Owned Suites</p>
              <p className="text-2xl font-bold">{ownedSuites.length}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Member Of</p>
              <p className="text-2xl font-bold">{memberSuites.length}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Access</p>
              <p className="text-2xl font-bold">{allSuites.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
