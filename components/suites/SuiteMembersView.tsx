// ============================================
// FILE 1: components/suites/SuiteMembersView.tsx
// ============================================
'use client';

import React, { useState, useMemo } from 'react';
import { useSuiteMembers } from '@/lib/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SuiteMembersList } from './SuiteMembersList';
import { SuiteMembersGrid } from './SuiteMembersGrid';
import { InviteMemberPortal } from '../shared/InviteMemberPortal';
import { Plus, Search, Filter, Grid, List, Sparkles, Crown } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import type { SuiteMember } from '@/types/member.types';

interface SuiteMembersViewProps {
  suiteId: string;
  userId: string;
  accountType: 'individual' | 'organization';
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

type ViewMode = 'grid' | 'table';
type RoleFilter = 'all' | 'owner' | 'admin' | 'member';
type SortField = 'name' | 'email' | 'role' | 'joined_at';
type SortOrder = 'asc' | 'desc';

export function SuiteMembersView({ 
  suiteId,
  userId,
  accountType,
  userName = 'You',
  userEmail = '',
  userAvatar = ''
}: SuiteMembersViewProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const { data: members, isLoading } = useSuiteMembers(suiteId);

  // Cast members to SuiteMember type
  const typedMembers = (members || []) as SuiteMember[];

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = typedMembers.filter(member => {
      const matchesSearch =
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'joined_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? -1 : 1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [typedMembers, search, roleFilter, sortField, sortOrder]);

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setSortField('name');
    setSortOrder('asc');
  };

  const activeFiltersCount = (roleFilter !== 'all' ? 1 : 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ==========================================
  // INDIVIDUAL ACCOUNT - Show upgrade banner
  // ==========================================
  if (accountType === 'individual') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Suite Members
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who has access to this test suite (1)
          </p>
        </div>

        {/* Stats Bar */}
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <p className="text-sm text-muted-foreground">1 of 1 members</p>
        </div>

        {/* Current User Card - Same style as org */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar */}
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{userName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Crown className="w-3 h-3" />
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-2xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Unlock Team Collaboration</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upgrade to an organization account to invite team members, collaborate on test suites, and manage permissions together.
          </p>
          <Link href="/settings/billing">
            <Button size="lg" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Upgrade to Organization
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // ORGANIZATION ACCOUNT - Original UI
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Suite Members
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who has access to this test suite ({typedMembers.length})
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Controls Bar - Mobile First */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-3 py-2">
          <div className="flex flex-col gap-3 lg:gap-0">
            {/* Mobile Layout (< lg screens) */}
            <div className="lg:hidden space-y-3">
              {/* Row 1: Search (Full Width) */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Row 2: Filter & Sort */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 whitespace-nowrap flex-shrink-0"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <Select
                  value={`${sortField}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortField(field as SortField);
                    setSortOrder(order as SortOrder);
                  }}
                >
                  <SelectTrigger className="w-auto min-w-[140px] whitespace-nowrap flex-shrink-0">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                    <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                    <SelectItem value="role-asc">Role (A-Z)</SelectItem>
                    <SelectItem value="joined_at-desc">Newest First</SelectItem>
                    <SelectItem value="joined_at-asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3: View Toggle (Right) */}
              <div className="flex items-center justify-end">
                <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded transition-all duration-200 ${
                      viewMode === 'table'
                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Layout (lg+ screens) */}
            <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
              {/* Left Side: Stats */}
              <div className="text-sm text-muted-foreground">
                {filteredAndSortedMembers.length} of {typedMembers.length} members
              </div>

              {/* Right Side: Search, Filter, Sort, View Toggle */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <Select
                  value={`${sortField}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortField(field as SortField);
                    setSortOrder(order as SortOrder);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                    <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                    <SelectItem value="role-asc">Role (A-Z)</SelectItem>
                    <SelectItem value="joined_at-desc">Newest First</SelectItem>
                    <SelectItem value="joined_at-asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex gap-1 border border-border rounded-lg p-1 bg-background shadow-theme-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded transition-all duration-200 ${
                      viewMode === 'table'
                        ? 'bg-primary text-primary-foreground shadow-theme-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 text-xs font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Role Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                    Role
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'owner', 'admin', 'member'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                          roleFilter === role
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary'
                        }`}
                      >
                        {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar - Mobile */}
      <div className="lg:hidden">
        <p className="text-sm text-muted-foreground">
          {filteredAndSortedMembers.length} of {typedMembers.length} members
        </p>
      </div>

      {/* Content Area */}
      {filteredAndSortedMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4 border border-border rounded-lg bg-card">
          <Filter className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">No members found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <SuiteMembersList members={filteredAndSortedMembers} suiteId={suiteId} />
      ) : (
        <SuiteMembersGrid members={filteredAndSortedMembers} suiteId={suiteId} />
      )}

      {/* Use InviteMemberPortal instead of Modal */}
      <InviteMemberPortal
        suiteId={suiteId}
        userId={userId}
        accountType={accountType}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
