// ============================================
// app/dashboard/recordings/[recordingId]/page.tsx
// ============================================

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { RecordingPlayer } from '@/components/Recordings/RecordingPlayer';

export default async function RecordingDetailPage({
  params,
}: {
  params: { recordingId: string };
}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get the recording
  const { data: recording, error: recordingError } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', params.recordingId)
    .single();

  if (recordingError || !recording) {
    notFound();
  }

  // Get the suite
  const { data: suite } = await supabase
    .from('test_suites')
    .select('id, name')
    .eq('id', recording.suite_id)
    .single();

  if (!suite) {
    notFound();
  }

  // Check if user has access to this suite
  const { data: hasAccess } = await supabase
    .from('test_suites')
    .select('id')
    .eq('id', suite.id)
    .or(`owner_id.eq.${user.id},admins.cs.{${user.id}},members.cs.{${user.id}}`)
    .single();

  if (!hasAccess) {
    redirect('/dashboard');
  }

  // Get sprint if exists
  let sprint = null;
  if (recording.sprint_id) {
    const { data: sprintData } = await supabase
      .from('sprints')
      .select('id, name')
      .eq('id', recording.sprint_id)
      .single();

    sprint = sprintData;
  }

  return (
    <div className="container py-8">
      <RecordingPlayer
        recording={recording}
        suite={suite}
        sprint={sprint}
      />
    </div>
  );
}