// ============================================
// FILE: components/settings/SettingsTabs.tsx
// ============================================
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { User, Building2, Shield, CreditCard, Bell, LayoutGrid, Sparkles } from 'lucide-react'
import IndividualAccountView from './account/IndividualAccountView'
import OrganizationAccountView from './account/OrganizationAccountView'
import SubscriptionView from './SubscriptionView'
import ProfileSettings from './ProfileSettingsView'
import ProfileForm from './ProfileForm'
import SecurityView from './SecurityView'
import NotificationsView from './NotificationsView'
import SuitesView from '../test-suites/SuitesView'
import AISettings from './AISettings'

interface SettingsTabsProps {
  user: any
  profile: any
  organizationData?: {
    organization: any
    members: any[]
    isAdmin: boolean
  } | null
  subscription?: any
  tiers?: any[]
  ownedSuites?: any[]
  memberSuites?: any[]
  reportSchedules?: any[]
}

export function SettingsTabs({ 
  user, 
  profile, 
  organizationData, 
  subscription, 
  tiers = [], 
  ownedSuites = [],
  memberSuites = [],
  reportSchedules = []
}: SettingsTabsProps) {
  const isOrgAccount = profile.account_type === 'organization' || 
                       profile.account_type === 'organization-admin'

  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
        <TabsTrigger value="account" className="flex items-center gap-2">
          {isOrgAccount ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
          <span className="hidden sm:inline">{isOrgAccount ? 'Organization' : 'Account'}</span>
        </TabsTrigger>
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Security</span>
        </TabsTrigger>
        <TabsTrigger value="subscription" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Subscription</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Preferences</span>
        </TabsTrigger>
        <TabsTrigger value="suites" className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Suites</span>
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-6">
        {isOrgAccount && organizationData ? (
          <OrganizationAccountView
            user={user}
            profile={profile}
            organization={organizationData.organization}
            members={organizationData.members}
            currentUserId={user.id}
            isAdmin={organizationData.isAdmin}
          />
        ) : (
          <IndividualAccountView user={user} profile={profile} />
        )}
      </TabsContent>

      <TabsContent value="profile" className="mt-6">
        <div className="space-y-6">
          <ProfileSettings profile={profile} />
          <ProfileForm profile={profile} />
        </div>
      </TabsContent>

      <TabsContent value="security" className="mt-6">
        <SecurityView user={user} />
      </TabsContent>

      <TabsContent value="subscription" className="mt-6">
        <SubscriptionView subscription={subscription} tiers={tiers} />
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <NotificationsView userId={user.id} schedules={reportSchedules} profile={profile} />
      </TabsContent>

      <TabsContent value="suites" className="mt-6">
        <SuitesView 
                  ownedSuites={ownedSuites}
                  memberSuites={memberSuites}
                  userId={user.id} accountType={'individual'}        />
      </TabsContent>

      <TabsContent value="ai" className="mt-6">
        <AISettings profile={profile} />
      </TabsContent>
    </Tabs>
  )
}