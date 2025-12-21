// ============================================
// app/dashboard/recordings/[recordingId]/page.tsx
// Recording detail page - FIXED
// ============================================

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { RecordingPlayer } from '@/components/Recordings/RecordingPlayer';
import { logger } from '@/lib/utils/logger';

interface PageProps {
  params: Promise<{ recordingId: string }>;
}

export default async function RecordingDetailPage({ params }: PageProps) {
  // Await params in Next.js 15+
  const { recordingId } = await params;
  
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
    .eq('id', recordingId)
    .single();

  if (recordingError || !recording) {
    logger.log('Recording fetch error:', recordingError);
    notFound();
  }

  // Get the suite
  const { data: suite, error: suiteError } = await supabase
    .from('test_suites')
    .select('id, name, owner_id, admins, members')
    .eq('id', recording.suite_id)
    .single();

  if (suiteError || !suite) {
    logger.log('Suite fetch error:', suiteError);
    notFound();
  }

  // Check if user has access to this suite
  const isOwner = suite.owner_id === user.id;
  const isAdmin = Array.isArray(suite.admins) && suite.admins.includes(user.id);
  const isMember = Array.isArray(suite.members) && suite.members.includes(user.id);

  if (!isOwner && !isAdmin && !isMember) {
    console.warn('User does not have access to this suite');
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

    sprint = sprintData || null;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">

      {/* Recording Player */}
      <RecordingPlayer
        recording={recording}
        suite={suite}
        sprint={sprint}
      />
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { recordingId } = await params;
  const supabase = await createClient();

  const { data: recording } = await supabase
    .from('recordings')
    .select('title')
    .eq('id', recordingId)
    .single();

  return {
    title: recording?.title || 'Recording',
    description: 'View test recording details and playback',
  };
}