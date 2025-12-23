// components/recordings/PendingRecordingHandler.tsx - NEW FILE
'use client';

import { useEffect, useState } from 'react';
import { useRecording } from '@/providers/RecordingContext';
import { RecordingPreviewDialog } from './RecordingPreviewDialog';

interface PendingRecordingHandlerProps {
  suiteId: string;
  sprintId?: string | null;
  onRecordingSaved?: () => void;
}

export function PendingRecordingHandler({
  suiteId,
  sprintId,
  onRecordingSaved,
}: PendingRecordingHandlerProps) {
  const { pendingRecordingPreview, discardPendingRecording } = useRecording();
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (pendingRecordingPreview) {
      setShowPreview(true);
    }
  }, [pendingRecordingPreview]);

  if (!showPreview || !pendingRecordingPreview) return null;

  return (
    <RecordingPreviewDialog
      preview={pendingRecordingPreview}
      suiteId={suiteId}
      sprintId={sprintId}
      onClose={() => {
        setShowPreview(false);
        discardPendingRecording();
      }}
      onSaved={() => {
        setShowPreview(false);
        discardPendingRecording();
        onRecordingSaved?.();
      }}
    />
  );
}