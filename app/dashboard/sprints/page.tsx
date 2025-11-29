// ============================================
// FILE: app/dashboard/sprints/page.tsx
// Client-side version using suite context
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSuiteContext } from '@/providers/SuiteContextProvider';
import SprintsView from '@/components/sprints/SprintsView';
import { Toaster } from 'sonner';

export default function SprintsPage() {
  const { suite } = useSuiteContext();
  const [sprints, setSprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (suite?.id) {
      fetchSprints();
    }
  }, [suite?.id]);

  const fetchSprints = async () => {
    if (!suite?.id) return;

    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('suite_id', suite.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSprints(data || []);
    } catch (error) {
      console.error('Error fetching sprints:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!suite) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading suite...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <SprintsView 
        suiteId={suite.id} 
        sprints={sprints} 
        onRefresh={fetchSprints}
        isLoading={loading}
      />
    </>
  );
}