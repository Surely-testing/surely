// ============================================
// hooks/use-screen-recorder.ts
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingPreview, ConsoleLog, NetworkLog, RecordingMetadata } from '@/types/recording.types';

export function useScreenRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const consoleLogsRef = useRef<ConsoleLog[]>([]);
  const networkLogsRef = useRef<NetworkLog[]>([]);
  const screenshotsRef = useRef<string[]>([]);

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

      // Call original console method
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

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    consoleLogsRef.current = [];
    networkLogsRef.current = [];
    screenshotsRef.current = [];
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        } as MediaTrackConstraints,
        audio: false,
      });

      streamRef.current = stream;

      // Detect browser and OS
      const userAgent = navigator.userAgent;
      const browser = /Chrome/.test(userAgent) ? 'Chrome' : 
                     /Firefox/.test(userAgent) ? 'Firefox' :
                     /Safari/.test(userAgent) ? 'Safari' : 'Unknown';
      const os = /Windows/.test(userAgent) ? 'Windows' :
                /Mac/.test(userAgent) ? 'macOS' :
                /Linux/.test(userAgent) ? 'Linux' : 'Unknown';

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
        
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      consoleLogsRef.current = [];
      networkLogsRef.current = [];
      screenshotsRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle stream stop (user clicks browser's stop sharing button)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (isRecording) {
          stopRecording();
        }
      });

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to start recording. Please ensure you granted screen sharing permissions.'
      );
      cleanup();
    }
  }, [cleanup, isRecording]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      pausedTimeRef.current = Date.now();
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Restart timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<RecordingPreview | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !streamRef.current) {
        cleanup();
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        resolve(null);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = () => {
        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });

        // Get browser and OS info
        const userAgent = navigator.userAgent;
        const browser = /Chrome/.test(userAgent) ? 'Chrome' : 
                       /Firefox/.test(userAgent) ? 'Firefox' :
                       /Safari/.test(userAgent) ? 'Safari' : 'Unknown';
        const os = /Windows/.test(userAgent) ? 'Windows' :
                  /Mac/.test(userAgent) ? 'macOS' :
                  /Linux/.test(userAgent) ? 'Linux' : 'Unknown';

        // Create metadata
        const metadata: RecordingMetadata = {
          timestamp: new Date().toISOString(),
          browser,
          os,
        };

        // Create preview object matching the actual type
        const preview: RecordingPreview = {
          videoBlob: blob,
          duration,
          consoleLogs: [...consoleLogsRef.current],
          networkLogs: [...networkLogsRef.current],
          screenshots: [...screenshotsRef.current],
          metadata,
        };

        cleanup();
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);

        resolve(preview);
      };

      // Stop the recorder
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });
  }, [duration, cleanup]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    cleanup();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setError(null);
  }, [cleanup]);

  // Take screenshot
  const takeScreenshot = useCallback(async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      
      // Create a video element to capture the frame
      const video = document.createElement('video');
      video.srcObject = streamRef.current;
      video.autoplay = true;
      video.muted = true;

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // Wait a bit for the frame to render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create canvas and capture the frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        // Convert to data URL and store
        const dataUrl = canvas.toDataURL('image/png');
        screenshotsRef.current.push(dataUrl);
        
        // Also download it
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `screenshot-${Date.now()}.png`;
        a.click();
      }

      // Cleanup
      video.srcObject = null;
    } catch (err) {
      console.error('Error taking screenshot:', err);
      setError('Failed to capture screenshot');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
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
  };
}