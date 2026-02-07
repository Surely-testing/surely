'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { eventWithTime } from '@rrweb/types';

interface UseRRWebPlayerProps {
  events: eventWithTime[];
  rootRef: React.RefObject<HTMLDivElement>;
  initialSpeed?: number;
}

export function useRRWebPlayer({
  events,
  rootRef,
  initialSpeed = 1,
}: UseRRWebPlayerProps) {
  const replayerRef = useRef<any>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const normalizedEventsRef = useRef<eventWithTime[]>([]);

  // Normalize timestamps ONCE
  useEffect(() => {
    if (!events.length) return;

    const baseTime = events[0].timestamp;

    normalizedEventsRef.current = events.map(e => ({
      ...e,
      timestamp: e.timestamp - baseTime,
    }));

    setDuration(
      normalizedEventsRef.current.at(-1)?.timestamp ?? 0
    );
  }, [events]);

  // Initialize rrweb
  useEffect(() => {
    if (!rootRef.current || !normalizedEventsRef.current.length) return;

    let destroyed = false;

    (async () => {
      const { Replayer } = await import('rrweb');

      if (destroyed) return;

      rootRef.current!.innerHTML = '';

      const replayer = new Replayer(normalizedEventsRef.current, {
        root: rootRef.current!,
        speed: initialSpeed,
        skipInactive: false,
        showWarning: false,
      });

      replayer.on('ui-update-current-time', (time: unknown) => {
        setCurrentTime(typeof time === 'number' ? time : 0);
      });

      replayerRef.current = replayer;
    })();

    return () => {
      destroyed = true;
      replayerRef.current?.destroy?.();
      replayerRef.current = null;
    };
  }, [rootRef, initialSpeed]);

  // Controls
  const play = useCallback(() => {
    replayerRef.current?.play();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    replayerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const seek = useCallback((ms: number) => {
    replayerRef.current?.pause();
    replayerRef.current?.play(ms);
    replayerRef.current?.pause();
    setCurrentTime(ms);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    replayerRef.current?.setConfig({ speed });
  }, []);

  return {
    play,
    pause,
    seek,
    setSpeed,
    currentTime,
    duration,
    isPlaying,
  };
}
