// ============================================
// FILE 2: app/dashboard/members/page.tsx (UPDATED)
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, account_type')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    }

    loadProfile();
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
      />
    </>
  );
}