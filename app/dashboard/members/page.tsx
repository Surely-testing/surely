// ============================================
// app/dashboard/members/page.tsx - FIXED
// Now fetches and passes organization data
// ============================================
'use client';

import { SuiteMembersView } from '@/components/suites/SuiteMembersView';
import { useSuiteContext } from '@/providers/SuiteContextProvider';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';

export default function SuiteMembersPage() {
  const { suite } = useSuiteContext();
  const { supabase, session } = useSupabase();
  const [profile, setProfile] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileAndOrganization() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, account_type, organization_id')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // If user has an organization, load it
        if (profileData.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id, name, domain, owner_id')
            .eq('id', profileData.organization_id)
            .single();

          if (orgData) {
            setOrganization(orgData);
          }
        } else if (profileData.account_type === 'organization') {
          // Fallback: Check if user owns an organization
          const { data: ownedOrg } = await supabase
            .from('organizations')
            .select('id, name, domain, owner_id')
            .eq('owner_id', session.user.id)
            .maybeSingle();

          if (ownedOrg) {
            setOrganization(ownedOrg);
          } else {
            // Fallback: Check organization_members
            const { data: membership } = await supabase
              .from('organization_members')
              .select('organization_id, organizations(id, name, domain, owner_id)')
              .eq('user_id', session.user.id)
              .eq('status', 'active')
              .maybeSingle();

            if (membership?.organizations) {
              setOrganization(membership.organizations);
            }
          }
        }
      }
      
      setLoading(false);
    }

    loadProfileAndOrganization();
  }, [session?.user?.id, supabase]);

  if (!suite || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Unable to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <SuiteMembersView 
        suiteId={suite.id}
        userId={session.user.id}
        accountType={profile.account_type || 'individual'}
        userName={profile.name || session.user.email?.split('@')[0] || 'You'}
        userEmail={profile.email || session.user.email || ''}
        userAvatar={profile.avatar_url || ''}
        organizationId={organization?.id}           // ← FIXED: Now passing org ID
        organizationDomain={organization?.domain}   // ← FIXED: Now passing org domain
      />
    </>
  );
}