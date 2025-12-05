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
  Mic,
  MicOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecordingPreviewDialog } from './RecordingPreviewDialog';
import { RecordingPreview } from '@/types/recording.types';
import { toast } from 'sonner';

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
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      await startRecording();
    } catch (err) {
      toast.error('Failed to start recording', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      const preview = await stopRecording();
      setIsStopping(false);
      
      if (preview) {
        setRecordingPreview(preview);
        setShowPreview(true);
      }
    } catch (err) {
      setIsStopping(false);
      toast.error('Failed to stop recording', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this recording?')) {
      cancelRecording();
      toast.info('Recording cancelled');
    }
  };

  const handleToggleMic = () => {
    setIsMicEnabled(!isMicEnabled);
    toast.success(isMicEnabled ? 'Microphone muted' : 'Microphone enabled');
    // TODO: Implement actual microphone toggle in useScreenRecorder hook
  };

  const handleSaved = () => {
    setShowPreview(false);
    setRecordingPreview(null);
    onRecordingSaved?.();
  };

  // Show error toast when error changes
  if (error) {
    toast.error('Recording error', { description: error });
  }

  if (!isRecording && !showPreview) {
    return (
      <Button
        onClick={handleStart}
        size="sm"
        className="shadow-sm"
        title="Start Recording"
      >
        <Circle className="h-4 w-4 fill-red-500 text-red-500" />
      </Button>
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
          {/* Pause/Resume */}
          {isPaused ? (
            <Button
              onClick={resumeRecording}
              size="sm"
              variant="outline"
              title="Resume Recording"
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={pauseRecording}
              size="sm"
              variant="outline"
              title="Pause Recording"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}

          {/* Microphone Toggle */}
          <Button
            onClick={handleToggleMic}
            size="sm"
            variant="outline"
            title={isMicEnabled ? "Mute Microphone" : "Enable Microphone"}
            className={cn(!isMicEnabled && "text-muted-foreground")}
          >
            {isMicEnabled ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Button>

          {/* Screenshot */}
          <Button
            onClick={takeScreenshot}
            size="sm"
            variant="outline"
            title="Take Screenshot"
          >
            <Camera className="h-4 w-4" />
          </Button>

          {/* Stop */}
          <Button
            onClick={handleStop}
            size="sm"
            variant="error"
            disabled={isStopping}
            title="Stop Recording"
          >
            {isStopping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Square className="h-4 w-4 fill-current" />
            )}
          </Button>

          {/* Cancel */}
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