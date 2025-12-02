// ============================================
// components/settings/SuiteDetailView.tsx
// Mobile-first responsive suite details (modal-optimized)
// ============================================
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutGrid,
  Crown,
  Shield,
  Users,
  TestTube,
  Bug,
  Video,
  Layers,
  Settings,
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';

interface SuiteDetailViewProps {
  suite: any;
  userRole: 'owner' | 'admin' | 'member';
  userId: string;
  isModal?: boolean;
}

export function SuiteDetailView({ suite, userRole, userId, isModal = false }: SuiteDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');

  const canManageMembers = userRole === 'owner' || userRole === 'admin';
  const canEditSuite = userRole === 'owner' || userRole === 'admin';

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'admin':
        return <Shield className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <Users className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={isModal ? 'px-4 sm:px-6 py-4' : 'container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8'}>
      {/* Header - Mobile Optimized */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                {suite.name}
              </h1>
              {suite.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {suite.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="primary" className="capitalize text-xs">
                  {getRoleIcon(userRole)}
                  <span className="ml-1">{userRole}</span>
                </Badge>
                <Badge variant="primary" size='sm'>
                  {suite.owner_type === 'organization' ? 'Organization' : 'Personal'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Created {format(new Date(suite.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Actions - Mobile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {canEditSuite && (
              <>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="sm:hidden">
                  <Edit className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEditSuite && (
                  <DropdownMenuItem className="sm:hidden">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Suite
                  </DropdownMenuItem>
                )}
                {canManageMembers && (
                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </DropdownMenuItem>
                )}
                {userRole === 'owner' && (
                  <DropdownMenuItem className="text-error focus:text-error">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Suite
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs - Mobile Scrollable */}
      <div className="border-b border-border mb-4 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
        <nav className="flex gap-4 sm:gap-6 min-w-max sm:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4 sm:space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards - Mobile Optimized Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <TestTube className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{suite.stats?.totalTestCases || 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Test Cases</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Bug className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{suite.stats?.totalBugs || 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Bugs</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Video className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{suite.stats?.totalRecordings || 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Recordings</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{suite.stats?.activeSprints || 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Sprints</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{suite.stats?.totalMembers || 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Members</p>
                </CardContent>
              </Card>
            </div>

            {/* Suite Owner */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Suite Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 sm:gap-4">
                  {suite.ownerProfile?.avatar_url ? (
                    <img
                      src={suite.ownerProfile.avatar_url}
                      alt={suite.ownerProfile.name}
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg sm:text-xl font-semibold text-primary">
                        {suite.ownerProfile?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{suite.ownerProfile?.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {suite.ownerProfile?.email}
                    </p>
                  </div>
                  <Badge variant="primary" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions - Mobile Stacked */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Common tasks for this suite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Link href={`/dashboard/test-cases?suite=${suite.id}`}>
                    <Button variant="outline" className="w-full justify-start text-sm">
                      <TestTube className="h-4 w-4 mr-2" />
                      View Test Cases
                    </Button>
                  </Link>
                  <Link href={`/dashboard/bugs?suite=${suite.id}`}>
                    <Button variant="outline" className="w-full justify-start text-sm">
                      <Bug className="h-4 w-4 mr-2" />
                      View Bugs
                    </Button>
                  </Link>
                  <Link href={`/dashboard/recordings?suite=${suite.id}`}>
                    <Button variant="outline" className="w-full justify-start text-sm">
                      <Video className="h-4 w-4 mr-2" />
                      View Recordings
                    </Button>
                  </Link>
                  <Link href={`/dashboard/sprints?suite=${suite.id}`}>
                    <Button variant="outline" className="w-full justify-start text-sm">
                      <Layers className="h-4 w-4 mr-2" />
                      View Sprints
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'members' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Team Members</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {suite.memberDetails?.length || 0} member{suite.memberDetails?.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                {canManageMembers && (
                  <Button size="sm" className="w-full sm:w-auto">
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span className="sm:inline">Invite Member</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {suite.memberDetails?.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {member.profile?.avatar_url ? (
                        <img
                          src={member.profile.avatar_url}
                          alt={member.profile.name}
                          className="h-10 w-10 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold">
                            {member.profile?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{member.profile?.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {member.profile?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <Badge variant="primary" className="text-xs capitalize">
                        {getRoleIcon(member.role)}
                        <span className="ml-1">{member.role}</span>
                      </Badge>
                      {canManageMembers && member.user_id !== userId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Change Role</DropdownMenuItem>
                            <DropdownMenuItem className="text-error focus:text-error">
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Suite Settings</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage your test suite configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-sm font-medium">Suite Name</label>
                  <p className="text-sm text-muted-foreground mt-1">{suite.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suite.description || 'No description provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{suite.status}</p>
                </div>
                {userRole === 'owner' && (
                  <div className="pt-4 border-t">
                    <Button variant="error" size="sm" className="w-full sm:w-auto">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Suite
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}