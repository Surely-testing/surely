import { Play, Pause, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PlayerControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (ms: number) => void;
  onPlayPause: () => void;
  onRestart: () => void;
}

export function PlayerControls({
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onPlayPause,
  onRestart,
}: PlayerControlsProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Timeline */}
        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%, hsl(var(--muted)) 100%)`
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={onRestart}
              className="h-8 w-8 p-0"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={onPlayPause}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <span className="text-sm font-mono text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Use arrow keys to skip • Space to play/pause
          </div>
        </div>
      </div>
    </div>
  );
}