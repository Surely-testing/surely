// ============================================
// app/dashboard/recordings/page.tsx
// ============================================

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RecordingsView } from '@/components/Recordings/RecordingsView';
import { getRecordings } from '@/lib/actions/recordings';

export const metadata = {
  title: 'Recordings | Test Management',
  description: 'View and manage your test recordings',
};

export default async function RecordingsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get user's profile to find their test suites
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  // Get user's test suites (owned or member)
  const { data: suites } = await supabase
    .from('test_suites')
    .select('id, name')
    .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Get all recordings from user's suites
  let allRecordings: any[] = [];
  if (suites && suites.length > 0) {
    for (const suite of suites) {
      const { data: recordings } = await getRecordings(suite.id);
      if (recordings) {
        allRecordings = [...allRecordings, ...recordings];
      }
    }
  }

  // Sort by newest
  allRecordings.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Get sprints for filtering
  const { data: sprints } = await supabase
    .from('sprints')
    .select('id, name, suite_id')
    .in('suite_id', suites?.map(s => s.id) || [])
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Use first suite as default (or handle multiple suites differently)
  const defaultSuiteId = suites?.[0]?.id || '';

  return (
    <div className="container py-8">
      <RecordingsView
        suiteId={defaultSuiteId}
        initialRecordings={allRecordings}
        sprints={sprints || []}
      />
    </div>
  );
}