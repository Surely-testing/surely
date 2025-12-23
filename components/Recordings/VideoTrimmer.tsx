'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const [history, setHistory] = useState<[number, number][]>([[0, duration]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const originalRange = useRef<[number, number]>([0, duration]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    originalRange.current = [0, duration];
    setTrimRange([0, duration]);
    setHistory([[0, duration]]);
    setHistoryIndex(0);
  }, [duration]);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      if (isTrimmed) {
        if (video.currentTime < trimRange[0]) {
          video.currentTime = trimRange[0];
        } else if (video.currentTime >= trimRange[1]) {
          video.currentTime = trimRange[0];
          video.pause();
          setIsPlaying(false);
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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoRef, trimRange, isTrimmed]);

  const addToHistory = (newRange: [number, number]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newRange);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleMouseDown = (handle: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(handle);
  };

  useEffect(() => {
    if (!dragging || !trackRef.current) return;

    let lastRange: [number, number] = trimRange;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = trackRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const newTime = percentage * duration;

      if (dragging === 'start') {
        const newStart = Math.max(0, Math.min(newTime, trimRange[1] - 0.1));
        const newRange: [number, number] = [newStart, trimRange[1]];
        setTrimRange(newRange);
        onTrim(newRange[0], newRange[1]);
        lastRange = newRange;
        
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.currentTime = newStart;
          setCurrentTime(newStart);
        }
      } else if (dragging === 'end') {
        const newEnd = Math.min(duration, Math.max(newTime, trimRange[0] + 0.1));
        const newRange: [number, number] = [trimRange[0], newEnd];
        setTrimRange(newRange);
        onTrim(newRange[0], newRange[1]);
        lastRange = newRange;
      }

      setIsTrimmed(true);
    };

    const handleMouseUp = () => {
      setDragging(null);
      addToHistory(lastRange);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, trimRange, duration, onTrim, videoRef]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const newRange = history[newIndex];
      setHistoryIndex(newIndex);
      setTrimRange(newRange);
      onTrim(newRange[0], newRange[1]);
      
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.currentTime = newRange[0];
        setCurrentTime(newRange[0]);
      }
      
      setIsTrimmed(newRange[0] !== originalRange.current[0] || newRange[1] !== originalRange.current[1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const newRange = history[newIndex];
      setHistoryIndex(newIndex);
      setTrimRange(newRange);
      onTrim(newRange[0], newRange[1]);
      
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.currentTime = newRange[0];
        setCurrentTime(newRange[0]);
      }
      
      setIsTrimmed(newRange[0] !== originalRange.current[0] || newRange[1] !== originalRange.current[1]);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (isPlaying) {
      video.pause();
    } else {
      // Only seek if we're outside the trim range or at the very end
      const currentPos = video.currentTime;
      if (currentPos < trimRange[0] || currentPos >= trimRange[1]) {
        video.currentTime = trimRange[0];
      }
      
      video.play().catch(err => {
        console.error('Play failed:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !trackRef.current || dragging) return;

    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    const clampedTime = isTrimmed 
      ? Math.max(trimRange[0], Math.min(trimRange[1], newTime))
      : newTime;

    videoRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate positions - clamp playback to not exceed track width
  const playbackPosition = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;
  const startPosition = duration > 0 ? (trimRange[0] / duration) * 100 : 0;
  const endPosition = duration > 0 ? (trimRange[1] / duration) * 100 : 100;

  return (
    <div className={className}>
      <div className="flex items-center gap-3 mt-4">
        {/* Play/Pause Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayPause}
          className="h-10 w-10 p-0 shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        {/* Timeline Track */}
        <div className="flex-1 relative h-10 py-4">
          <div
            ref={trackRef}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 cursor-pointer"
            onClick={handleProgressClick}
          >
            {/* Background track - thin rectangle */}
            <div className="absolute inset-0 bg-muted" />
            
            {/* Active region (between trim handles) */}
            <div
              className="absolute top-0 bottom-0 bg-primary/20"
              style={{
                left: `${startPosition}%`,
                right: `${100 - endPosition}%`
              }}
            />

            {/* Start handle (left rectangle) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-primary cursor-ew-resize hover:bg-primary/80 z-20"
              style={{ left: `${startPosition}%` }}
              onMouseDown={handleMouseDown('start')}
            />

            {/* End handle (right rectangle) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-primary cursor-ew-resize hover:bg-primary/80 z-20"
              style={{ left: `${endPosition}%` }}
              onMouseDown={handleMouseDown('end')}
            />
          </div>

          {/* Playback indicator - extends beyond track, constrained to track width */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground pointer-events-none z-30"
            style={{ 
              left: `calc(${playbackPosition}%)`,
              maxWidth: '100%'
            }}
          />
        </div>
      </div>

      {/* Time display and Undo/Redo buttons */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={historyIndex === 0}
          className="h-8 w-8 p-0 shrink-0"
        >
          <Undo className="h-3.5 w-3.5" />
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {formatTime(trimRange[1] - trimRange[0])}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={historyIndex === history.length - 1}
          className="h-8 w-8 p-0 shrink-0"
        >
          <Redo className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}