// ============================================
// FILE: components/recordings/RecordingToolbar.tsx - FINAL
// ============================================

'use client';

import { useState } from 'react';
import { SharedRecordingControls } from './SharedRecordingControls';
import { RecordingPreviewDialog } from './RecordingPreviewDialog';
import { RecordingPreview } from '@/types/recording.types';

interface RecordingToolbarProps {
  suiteId: string;
  sprintId?: string | null;
  onRecordingSaved?: () => void;
}

export function RecordingToolbar({
  suiteId,
  sprintId,
  onRecordingSaved,
}: RecordingToolbarProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [recordingPreview, setRecordingPreview] = useState<RecordingPreview | null>(null);

  const handleStopComplete = (preview: RecordingPreview) => {
    setRecordingPreview(preview);
    setShowPreview(true);
  };

  const handleSaved = () => {
    setShowPreview(false);
    setRecordingPreview(null);
    onRecordingSaved?.();
  };

  return (
    <>
      {/* Use shared recording controls - EXACT SAME AS HEADER */}
      <SharedRecordingControls 
        variant="full" 
        onStopComplete={handleStopComplete}
        suiteId={suiteId}
      />

      {/* Preview Dialog */}
      {showPreview && recordingPreview && (
        <RecordingPreviewDialog
          preview={recordingPreview}
          suiteId={suiteId}
          sprintId={sprintId}
          onClose={() => {
            setShowPreview(false);
            setRecordingPreview(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}