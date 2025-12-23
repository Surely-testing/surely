// ============================================
// FILE: components/recordings/SharedRecordingControls.tsx - UPDATED FINAL
// ============================================

'use client';

import { useState } from 'react';
import { useRecording } from '@/providers/RecordingContext';
import { Button } from '@/components/ui/Button';
import {
  Circle,
  Pause,
  Play,
  Square,
  X,
  Loader2,
  Mic,
  MicOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SharedRecordingControlsProps {
  variant?: 'full' | 'compact';
  onStopComplete?: (preview: any) => void;
  suiteId?: string;
}

export function SharedRecordingControls({ 
  variant = 'full',
  onStopComplete,
  suiteId
}: SharedRecordingControlsProps) {
  const {
    isRecording,
    isPaused,
    duration,
    countdown,
    error,
    isMicMuted,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    toggleMute,
    clearError,
  } = useRecording();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
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
    if (!suiteId) {
      toast.warning('Please select a test suite first');
      return;
    }

    try {
      await startRecording();
      toast.success('Recording started');
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
      
      if (preview) {
        toast.success('Recording stopped');
        onStopComplete?.(preview);
      }
    } catch (err) {
      toast.error('Failed to stop recording', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsStopping(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    setIsStopping(true);
    try {
      await stopRecording();
      setShowCancelDialog(false);
      toast.info('Recording cancelled');
    } finally {
      setIsStopping(false);
    }
  };

  if (error) {
    toast.error('Recording error', { description: error });
    clearError();
  }

  // Don't render controls during countdown
  if (countdown > 0) {
    return (
      <div className="flex items-center h-10 gap-2">
        <div className="h-8 w-8 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
          <span className="text-lg font-bold text-red-500">
            {countdown}
          </span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Starting...
        </span>
      </div>
    );
  }

  // Not recording - show only start button (FIXED HEIGHT)
  if (!isRecording) {
    return (
      <div className="flex items-center h-10">
        <Button
          onClick={handleStart}
          size="md"
          className="shadow-sm btn-primary"
          title="Start Recording"
        >
          <Circle className="h-4 w-4 fill-red-500 text-red-500" />
          <span>Record</span>
        </Button>
      </div>
    );
  }

  // Recording - show full controls (SAME HEIGHT - NO LAYOUT SHIFT)
  return (
    <>
      <div className="flex items-center gap-3 h-10">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2.5 w-2.5 rounded-full",
            isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
          )} />
          <span className="font-mono text-sm font-semibold tabular-nums min-w-[60px]">
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

          {/* Microphone Mute Toggle - ONLY VISIBLE WHEN RECORDING */}
          <Button
            onClick={toggleMute}
            size="sm"
            variant="outline"
            title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
            className={cn(isMicMuted && "text-muted-foreground")}
          >
            {isMicMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* Stop */}
          <Button
            onClick={handleStop}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
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
            onClick={handleCancelClick}
            size="sm"
            variant="outline"
            title="Cancel Recording"
            disabled={isStopping}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Recording?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this recording? All recorded content will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Continue
            </Button>
            <Button
              variant="error"
              onClick={handleCancelConfirm}
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}