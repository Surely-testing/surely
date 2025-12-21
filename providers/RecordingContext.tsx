// ============================================
// contexts/RecordingContext.tsx - FIXED AUDIO
// ============================================

'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { RecordingPreview, ConsoleLog, NetworkLog, RecordingMetadata } from '@/types/recording.types';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

// CONFIGURATION
const MAX_RECORDING_DURATION = 300; // 5 minutes in seconds
const WARNING_DURATION = 240; // Show warning at 4 minutes
const OPTIMAL_VIDEO_BITRATE = 2500000; // 2.5 Mbps - good quality, ~15-20MB per 5 mins
const OPTIMAL_FRAME_RATE = 30; // Smooth recording

interface RecordingContextType {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  countdown: number;
  error: string | null;
  isMicMuted: boolean;
  remainingTime: number;
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const consoleLogsRef = useRef<ConsoleLog[]>([]);
  const networkLogsRef = useRef<NetworkLog[]>([]);
  const warningShownRef = useRef(false);

  const remainingTime = MAX_RECORDING_DURATION - duration;

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

  // Check for time limit and show warnings
  useEffect(() => {
    if (!isRecording || isPaused) return;

    // Show warning at 4 minutes
    if (duration === WARNING_DURATION && !warningShownRef.current) {
      toast.warning('1 minute remaining', {
        description: 'Recording will auto-stop at 5 minutes',
      });
      warningShownRef.current = true;
    }

    // Auto-stop at 5 minutes
    if (duration >= MAX_RECORDING_DURATION) {
      toast.info('Maximum recording time reached', {
        description: 'Recording stopped automatically at 5 minutes',
      });
      stopRecording();
    }
  }, [duration, isRecording, isPaused]);

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
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    consoleLogsRef.current = [];
    networkLogsRef.current = [];
    micSourceRef.current = null;
    micGainRef.current = null;
    warningShownRef.current = false;
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
      warningShownRef.current = false;
      
      // Step 1: Request microphone FIRST
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
        logger.log('✓ Microphone access granted');
      } catch (micError) {
        logger.log('Microphone access denied:', micError);
        throw new Error('Microphone access is required for recording. Please allow microphone permissions and try again.');
      }

      // Step 2: Request screen sharing
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          frameRate: OPTIMAL_FRAME_RATE,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        } as MediaTrackConstraints,
        audio: true, // System audio (when available)
      });

      displayStreamRef.current = displayStream;

      // Step 3: Show countdown AFTER screen selection
      await showCountdown();

      // Step 4: Mix audio using Web Audio API (fixes multiple audio track issue)
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();

      // Add system audio from display (if available)
      const systemAudioTracks = displayStream.getAudioTracks();
      if (systemAudioTracks.length > 0) {
        const systemAudioSource = audioContext.createMediaStreamSource(
          new MediaStream(systemAudioTracks)
        );
        systemAudioSource.connect(destination);
        logger.log('✓ System audio mixed');
      } else {
        logger.log('ℹ No system audio from tab/window');
      }

      // Add microphone audio with gain control for muting
      if (micStream) {
        const micSource = audioContext.createMediaStreamSource(micStream);
        const micGain = audioContext.createGain();
        micGain.gain.value = 1; // Unmuted by default
        
        micSource.connect(micGain);
        micGain.connect(destination);
        
        micSourceRef.current = micSource;
        micGainRef.current = micGain;
        
        logger.log('✓ Microphone audio mixed');
      }

      // Create combined stream with video + mixed audio
      const combinedStream = new MediaStream();
      
      // Add video from display
      displayStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      // Add the single mixed audio track
      destination.stream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      logger.log('Combined stream:', {
        video: combinedStream.getVideoTracks().length,
        audio: combinedStream.getAudioTracks().length,
      });

      combinedStreamRef.current = combinedStream;

      // Step 5: Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';
        
      const mediaRecorder = new MediaRecorder(combinedStream, { 
        mimeType,
        videoBitsPerSecond: OPTIMAL_VIDEO_BITRATE,
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

      // Handle stream stop (user clicks browser's stop sharing button)
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (isRecording) {
          stopRecording();
        }
      });

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      logger.log('Error starting recording:', err);
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
      const finalDuration = duration;

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });

        // Get video resolution from the actual video track
        const videoTrack = displayStreamRef.current?.getVideoTracks()[0];
        const settings = videoTrack?.getSettings();
        const resolution = (settings?.width && settings?.height)
          ? `${settings.width}x${settings.height}`
          : '1920x1080';

        const userAgent = navigator.userAgent;
        const browser = /Chrome/.test(userAgent) ? 'Chrome' : 
                       /Firefox/.test(userAgent) ? 'Firefox' :
                       /Safari/.test(userAgent) ? 'Safari' : 'Unknown';
        const os = /Windows/.test(userAgent) ? 'Windows' :
                  /Mac/.test(userAgent) ? 'macOS' :
                  /Linux/.test(userAgent) ? 'Linux' : 'Unknown';

        const metadata: RecordingMetadata = {
          timestamp: new Date().toISOString(),
          resolution,
          browser,
          os,
        };

        const preview: RecordingPreview = {
          videoBlob: blob,
          duration: finalDuration,
          consoleLogs: [...consoleLogsRef.current],
          networkLogs: [...networkLogsRef.current],
          screenshots: [],
          metadata,
        };

        logger.log('Recording complete:', {
          duration: finalDuration,
          size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
          resolution,
          mimeType: blob.type,
        });

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

    // Use gain node to mute/unmute microphone
    if (micGainRef.current) {
      micGainRef.current.gain.value = newMutedState ? 0 : 1;
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
        remainingTime,
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