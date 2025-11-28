// ============================================
// components/recordings/RecordingToolbar.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useScreenRecorder } from '@/lib/hooks/use-screen-recorder';
import { Button } from '@/components/ui/Button';
import {
  Circle,
  Pause,
  Play,
  Square,
  Camera,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const {
    isRecording,
    isPaused,
    duration,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    takeScreenshot,
  } = useScreenRecorder();

  const [showPreview, setShowPreview] = useState(false);
  const [recordingPreview, setRecordingPreview] = useState<RecordingPreview | null>(null);
  const [isStopping, setIsStopping] = useState(false);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    await startRecording();
  };

  const handleStop = async () => {
    setIsStopping(true);
    const preview = await stopRecording();
    setIsStopping(false);
    
    if (preview) {
      setRecordingPreview(preview);
      setShowPreview(true);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this recording?')) {
      cancelRecording();
    }
  };

  const handleSaved = () => {
    setShowPreview(false);
    setRecordingPreview(null);
    onRecordingSaved?.();
  };

  if (!isRecording && !showPreview) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={handleStart}
          size="sm"
          className="shadow-sm"
        >
          <Circle className="h-4 w-4 mr-2 fill-red-500 text-red-500" />
          Start Recording
        </Button>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-3 bg-background border rounded-lg shadow-sm px-4 py-2">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2.5 w-2.5 rounded-full",
            isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
          )} />
          <span className="font-mono text-sm font-semibold tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isPaused ? (
            <Button
              onClick={resumeRecording}
              size="sm"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-1.5" />
              Resume
            </Button>
          ) : (
            <Button
              onClick={pauseRecording}
              size="sm"
              variant="outline"
            >
              <Pause className="h-4 w-4 mr-1.5" />
              Pause
            </Button>
          )}

          <Button
            onClick={takeScreenshot}
            size="sm"
            variant="outline"
            title="Take Screenshot"
          >
            <Camera className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleStop}
            size="sm"
            variant="error"
            disabled={isStopping}
          >
            {isStopping ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-1.5 fill-current" />
                Stop
              </>
            )}
          </Button>

          <Button
            onClick={handleCancel}
            size="sm"
            variant="outline"
            title="Cancel Recording"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
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