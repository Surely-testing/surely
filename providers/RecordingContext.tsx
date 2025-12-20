// ============================================
// contexts/RecordingContext.tsx - FIXED
// ============================================

'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { RecordingPreview, ConsoleLog, NetworkLog, RecordingMetadata } from '@/types/recording.types';

interface RecordingContextType {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  countdown: number;
  error: string | null;
  isMicMuted: boolean;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<RecordingPreview | null>;
  toggleMute: () => void;
  clearError: () => void;
}

const RecordingContext = createContext<RecordingContextType | null>(null);

export function RecordingProvider({ children }: { children: React.ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const micTrackRef = useRef<MediaStreamTrack | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const consoleLogsRef = useRef<ConsoleLog[]>([]);
  const networkLogsRef = useRef<NetworkLog[]>([]);

  // Capture console logs during recording
  useEffect(() => {
    if (!isRecording) return;

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    const captureLog = (type: ConsoleLog['type'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      consoleLogsRef.current.push({
        timestamp: Date.now(),
        type,
        message,
      });

      originalConsole[type](...args);
    };

    console.log = (...args) => captureLog('log', args);
    console.warn = (...args) => captureLog('warn', args);
    console.error = (...args) => captureLog('error', args);
    console.info = (...args) => captureLog('info', args);

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, [isRecording]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach(track => track.stop());
      displayStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach(track => track.stop());
      combinedStreamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    consoleLogsRef.current = [];
    networkLogsRef.current = [];
    micTrackRef.current = null;
  }, []);

  const showCountdown = useCallback(async () => {
    return new Promise<void>((resolve) => {
      let count = 3;
      setCountdown(count);

      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          setCountdown(0);
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setDuration(0);
      setIsPaused(false);
      setIsMicMuted(false);
      
      // Step 1: Request screen sharing - browser will show native dialog
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          frameRate: 15,
        } as MediaTrackConstraints,
        audio: true, // System audio
      });

      displayStreamRef.current = displayStream;

      // Step 2: Request microphone - browser will show permission dialog if needed
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStreamRef.current = micStream;
      } catch (micError) {
        console.warn('Microphone access denied:', micError);
        // Continue without mic
      }

      // Step 3: Show countdown AFTER screen selection
      await showCountdown();

      // Step 4: Combine streams
      const combinedStream = new MediaStream();

      // Add video from display
      displayStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      // Add system audio from display
      displayStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      // Add microphone audio if available
      if (micStream) {
        micStream.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track);
          micTrackRef.current = track; // Store for mute control
        });
      }

      combinedStreamRef.current = combinedStream;

      // Step 5: Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
        
      const mediaRecorder = new MediaRecorder(combinedStream, { 
        mimeType,
        videoBitsPerSecond: 1000000 
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      consoleLogsRef.current = [];
      networkLogsRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle stream stop
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (isRecording) {
          stopRecording();
        }
      });

      // Start recording
      mediaRecorder.start(100);
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to start recording'
      );
      cleanup();
    }
  }, [cleanup, isRecording, showCountdown]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<RecordingPreview | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !displayStreamRef.current) {
        cleanup();
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        resolve(null);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });

        const userAgent = navigator.userAgent;
        const browser = /Chrome/.test(userAgent) ? 'Chrome' : 
                       /Firefox/.test(userAgent) ? 'Firefox' :
                       /Safari/.test(userAgent) ? 'Safari' : 'Unknown';
        const os = /Windows/.test(userAgent) ? 'Windows' :
                  /Mac/.test(userAgent) ? 'macOS' :
                  /Linux/.test(userAgent) ? 'Linux' : 'Unknown';

        const metadata: RecordingMetadata = {
          timestamp: new Date().toISOString(),
          browser,
          os,
        };

        const preview: RecordingPreview = {
          videoBlob: blob,
          duration,
          consoleLogs: [...consoleLogsRef.current],
          networkLogs: [...networkLogsRef.current],
          screenshots: [],
          metadata,
        };

        cleanup();
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);

        resolve(preview);
      };

      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }

      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach(track => track.stop());
      }

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });
  }, [duration, cleanup]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMicMuted;
    setIsMicMuted(newMutedState);

    // Only toggle microphone track, not system audio
    if (micTrackRef.current) {
      micTrackRef.current.enabled = !newMutedState;
    }
  }, [isMicMuted]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <RecordingContext.Provider
      value={{
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
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within RecordingProvider');
  }
  return context;
}