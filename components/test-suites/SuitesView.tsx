// ============================================
// components/settings/SuitesView.tsx
// Complete suites view with data fetching
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LayoutGrid, Crown, Shield, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SuiteDetailsModal } from './SuiteDetailsModal';
import { createClient } from '@/lib/supabase/client';

interface SuitesViewProps {
  ownedSuites: any[];
  memberSuites: any[];
  userId: string;
  accountType: 'individual' | 'organization';
}

export default function SuitesView({
  ownedSuites: initialOwned,
  memberSuites: initialMember,
  userId,
  accountType,
}: SuitesViewProps) {
  const [selectedSuite, setSelectedSuite] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSuite, setLoadingSuite] = useState(false);
  const [ownedSuites, setOwnedSuites] = useState(initialOwned);
  const [memberSuites, setMemberSuites] = useState(initialMember);

  const supabase = createClient();

  const getUserRole = (suite: any) => {
    if (suite.created_by === userId) return 'owner';
    
    // Check suite_members table for role
    const member = suite.memberDetails?.find((m: any) => m.user_id === userId);
    if (member) return member.role;
    
    // Fallback to admins array
    if (suite.admins?.includes(userId)) return 'admin';
    return 'member';
  };

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

  const fetchSuiteDetails = async (suiteId: string) => {
    setLoadingSuite(true);
    try {
      // Fetch suite with all related data
      const { data: suite, error } = await supabase
        .from('test_suites')
        .select(`
          *,
          ownerProfile:profiles!test_suites_created_by_fkey(id, name, email, avatar_url),
          memberDetails:suite_members(
            id,
            user_id,
            role,
            profile:profiles(id, name, email, avatar_url)
          )
        `)
        .eq('id', suiteId)
        .single();

      if (error) throw error;

      return suite;
    } catch (error) {
      console.error('Error fetching suite details:', error);
      return null;
    } finally {
      setLoadingSuite(false);
    }
  };

  const handleViewDetails = async (suite: any) => {
    const fullSuite = await fetchSuiteDetails(suite.id);
    if (fullSuite) {
      setSelectedSuite(fullSuite);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedSuite(null), 300);
  };

  const handleRefresh = async () => {
    // Refresh the selected suite data
    if (selectedSuite) {
      const refreshed = await fetchSuiteDetails(selectedSuite.id);
      if (refreshed) {
        setSelectedSuite(refreshed);
        
        // Update the suite in the lists
        setOwnedSuites((prev) =>
          prev.map((s) => (s.id === refreshed.id ? { ...s, ...refreshed } : s))
        );
        setMemberSuites((prev) =>
          prev.map((s) => (s.id === refreshed.id ? { ...s, ...refreshed } : s))
        );
      }
    }
  };

  const allSuites = [
    ...ownedSuites,
    ...memberSuites.filter((s: any) => !ownedSuites.find((o: any) => o.id === s.id)),
  ];
  const totalMemberSuites = allSuites.length;

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Your Test Suites Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Your Test Suites</CardTitle>
            <CardDescription className="text-sm">
              Test suites you own or are a member of
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allSuites.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <LayoutGrid className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  You don't have any test suites yet
                </p>
                <Link href="/dashboard">
                  <Button size="sm" className="sm:size-default">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {allSuites.map((suite: any) => {
                  const role = getUserRole(suite);
                  return (
                    <Card key={suite.id} className="border-border">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          {/* Suite Icon and Info */}
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate">
                                {suite.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                                <Badge variant="primary" className="capitalize text-xs">
                                  {getRoleIcon(role)}
                                  <span className="ml-1">{role}</span>
                                </Badge>
                                <span className="text-xs sm:text-sm text-muted-foreground">
                                  {suite.owner_type === 'organization'
                                    ? 'Organization'
                                    : 'Personal'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => handleViewDetails(suite)}
                            disabled={loadingSuite}
                          >
                            {loadingSuite ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'View Details'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suite Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Suite Statistics</CardTitle>
            <CardDescription className="text-sm">
              Overview of your test suite activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  Owned Suites
                </p>
                <p className="text-xl sm:text-2xl font-bold">{ownedSuites.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Suites you created</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  Member Of
                </p>
                <p className="text-xl sm:text-2xl font-bold">{totalMemberSuites}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All accessible suites
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  Total Access
                </p>
                <p className="text-xl sm:text-2xl font-bold">{allSuites.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Combined total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suite Details Modal */}
      {selectedSuite && (
        <SuiteDetailsModal
          suite={selectedSuite}
          userRole={getUserRole(selectedSuite)}
          userId={userId}
          accountType={accountType}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
}