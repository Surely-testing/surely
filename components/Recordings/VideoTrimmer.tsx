'use client';

import { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoTrimmerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  duration: number;
  onTrim: (startTime: number, endTime: number) => void;
  className?: string;
}

export function VideoTrimmer({ videoRef, duration, onTrim, className }: VideoTrimmerProps) {
  const [trimRange, setTrimRange] = useState<[number, number]>([0, duration]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isTrimmed, setIsTrimmed] = useState(false);
  const originalRange = useRef<[number, number]>([0, duration]);

  useEffect(() => {
    // Update original range when duration changes
    originalRange.current = [0, duration];
    setTrimRange([0, duration]);
  }, [duration]);

  // Track video current time for playback indicator
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Enforce trim boundaries when trimmed
      if (isTrimmed) {
        if (video.currentTime < trimRange[0]) {
          video.currentTime = trimRange[0];
        } else if (video.currentTime >= trimRange[1]) {
          video.currentTime = trimRange[0];
          video.pause();
        }
      }
    };

    const handleSeeking = () => {
      if (isTrimmed) {
        if (video.currentTime < trimRange[0]) {
          video.currentTime = trimRange[0];
        } else if (video.currentTime > trimRange[1]) {
          video.currentTime = trimRange[1];
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
    };
  }, [videoRef, trimRange, isTrimmed]);

  const handleRangeChange = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    setTrimRange(newRange);
    
    // Apply trim in real-time
    onTrim(newRange[0], newRange[1]);
    
    // Update video current time to start of trim if not playing
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.currentTime = newRange[0];
      setCurrentTime(newRange[0]);
    }
    
    // Check if trim was reset to original
    if (newRange[0] === originalRange.current[0] && newRange[1] === originalRange.current[1]) {
      setIsTrimmed(false);
    } else {
      setIsTrimmed(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate playback indicator position (relative to full timeline)
  const playbackPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Trim Video</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative py-5">
          <Slider
            value={trimRange}
            onValueChange={handleRangeChange}
            min={0}
            max={duration}
            step={0.1}
            minStepsBetweenThumbs={1}
            className="w-full"
          />
          {/* Playback indicator - moves along the track */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
            style={{ left: `calc(${playbackPosition}% - 1px)` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(trimRange[0])}</span>
          <span>{formatTime(trimRange[1])}</span>
        </div>
      </div>
    </div>
  );
}