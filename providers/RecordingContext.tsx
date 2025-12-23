// ============================================
// contexts/RecordingContext.tsx - SMOOTH AUDIO FIX + PENDING RECOVERY
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

// IndexedDB Configuration - NEW
const DB_NAME = 'SurelyRecordings';
const DB_VERSION = 1;
const STORE_NAME = 'chunks';
const STORAGE_KEY = 'surely_recording_state';

interface RecordingContextType {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  countdown: number;
  error: string | null;
  isMicMuted: boolean;
  remainingTime: number;
  canRecord: boolean; // NEW
  hasPendingRecording: boolean; // NEW
  pendingRecordingPreview: RecordingPreview | null; // NEW
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<RecordingPreview | null>;
  loadPendingRecording: () => Promise<void>; // NEW
  discardPendingRecording: () => Promise<void>; // NEW
  toggleMute: () => void;
  clearError: () => void;
}

const RecordingContext = createContext<RecordingContextType | null>(null);

// ============================================
// IndexedDB Helper Functions - NEW
// ============================================
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const saveChunk = async (sessionId: string, index: number, chunk: Blob) => {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await new Promise((resolve, reject) => {
      const request = store.put(chunk, `${sessionId}-${index}`);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    logger.log('Error saving chunk:', error);
  }
};

const loadChunks = async (sessionId: string): Promise<Blob[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const sessionKeys = keys
      .filter(key => String(key).startsWith(`${sessionId}-`))
      .sort((a, b) => {
        const indexA = parseInt(String(a).split('-')[1]);
        const indexB = parseInt(String(b).split('-')[1]);
        return indexA - indexB;
      });
    
    const chunks: Blob[] = [];
    for (const key of sessionKeys) {
      const chunk = await new Promise<Blob>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      chunks.push(chunk);
    }
    
    db.close();
    return chunks;
  } catch (error) {
    logger.log('Error loading chunks:', error);
    return [];
  }
};

const clearSession = async (sessionId: string) => {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const keys = await new Promise<IDBValidKey[]>((resolve) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
    });
    
    const sessionKeys = keys.filter(key => String(key).startsWith(`${sessionId}-`));
    
    for (const key of sessionKeys) {
      await new Promise((resolve) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve(null);
      });
    }
    
    db.close();
  } catch (error) {
    logger.log('Error clearing session:', error);
  }
};

export function RecordingProvider({ children }: { children: React.ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [canRecord, setCanRecord] = useState(true); // NEW
  const [hasPendingRecording, setHasPendingRecording] = useState(false); // NEW
  const [pendingRecordingPreview, setPendingRecordingPreview] = useState<RecordingPreview | null>(null); // NEW
  const [sessionId] = useState(() => `session-${Date.now()}`); // NEW

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
  const recordingStartedRef = useRef(false);
  const chunkIndexRef = useRef(0); // NEW

  const remainingTime = MAX_RECORDING_DURATION - duration;

  // NEW: Check if recording is supported
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasAPI = !!(navigator.mediaDevices?.getDisplayMedia);
    setCanRecord(!isMobile && hasAPI);
  }, []);

  // NEW: Check for pending recording on mount
  useEffect(() => {
    const checkPending = async () => {
      const stateStr = localStorage.getItem(STORAGE_KEY);
      if (!stateStr) return;

      try {
        const state = JSON.parse(stateStr);
        const timeSince = Date.now() - state.timestamp;
        
        // Ignore if older than 10 minutes
        if (timeSince > 10 * 60 * 1000) {
          localStorage.removeItem(STORAGE_KEY);
          await clearSession(state.sessionId);
          return;
        }

        const chunks = await loadChunks(state.sessionId);
        
        if (chunks.length > 0) {
          setHasPendingRecording(true);
          const sizeMB = chunks.reduce((acc, chunk) => acc + chunk.size, 0) / 1024 / 1024;
          
          toast.info('Pending Recording Found', {
            description: `Found ${chunks.length} chunks (${sizeMB.toFixed(2)} MB) from previous session. Click to preview.`,
            duration: Infinity,
            action: {
              label: 'Preview',
              onClick: () => loadPendingRecording(),
            },
            cancel: {
              label: 'Discard',
              onClick: () => discardPendingRecording(),
            },
          });
        }
      } catch (error) {
        logger.log('Error checking pending:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    checkPending();
  }, []);

  // NEW: Prevent page unload during recording
  useEffect(() => {
    if (!isRecording) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Recording in progress. Your recording will be saved but stopped if you leave.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Save state periodically
    const saveState = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessionId,
        duration,
        timestamp: Date.now(),
        isRecording: true,
      }));
    };
    saveState();
    const stateInterval = setInterval(saveState, 2000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(stateInterval);
    };
  }, [isRecording, duration, sessionId]);

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
    recordingStartedRef.current = false;
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

  // NEW: Load pending recording for preview
  const loadPendingRecording = useCallback(async () => {
    const stateStr = localStorage.getItem(STORAGE_KEY);
    if (!stateStr) return;

    try {
      const state = JSON.parse(stateStr);
      const chunks = await loadChunks(state.sessionId);
      
      if (chunks.length === 0) {
        toast.error('No recording data found');
        return;
      }

      const blob = new Blob(chunks, { type: 'video/webm' });
      
      const userAgent = navigator.userAgent;
      const browser = /Chrome/.test(userAgent) ? 'Chrome' : 
                     /Firefox/.test(userAgent) ? 'Firefox' :
                     /Safari/.test(userAgent) ? 'Safari' : 'Unknown';
      const os = /Windows/.test(userAgent) ? 'Windows' :
                /Mac/.test(userAgent) ? 'macOS' :
                /Linux/.test(userAgent) ? 'Linux' : 'Unknown';

      const metadata: RecordingMetadata = {
        timestamp: new Date(state.timestamp).toISOString(),
        resolution: '1920x1080',
        browser,
        os,
      };

      const preview: RecordingPreview = {
        videoBlob: blob,
        duration: state.duration || 0,
        consoleLogs: [],
        networkLogs: [],
        screenshots: [],
        metadata,
      };

      setPendingRecordingPreview(preview);
      toast.success('Recording loaded for preview');
    } catch (error) {
      logger.log('Error loading recording:', error);
      toast.error('Failed to load recording');
    }
  }, []);

  // NEW: Discard pending recording
  const discardPendingRecording = useCallback(async () => {
    const stateStr = localStorage.getItem(STORAGE_KEY);
    if (stateStr) {
      try {
        const state = JSON.parse(stateStr);
        await clearSession(state.sessionId);
      } catch (error) {
        logger.log('Error parsing state:', error);
      }
    }
    
    localStorage.removeItem(STORAGE_KEY);
    setHasPendingRecording(false);
    setPendingRecordingPreview(null);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setDuration(0);
      setIsPaused(false);
      setIsMicMuted(false);
      warningShownRef.current = false;
      recordingStartedRef.current = false;
      chunkIndexRef.current = 0; // NEW
      
      // NEW: Check if mobile browser
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const errorMsg = 'Screen recording is not available on mobile browsers. Please use the Surely mobile app for screen recording.';
        setError(errorMsg);
        toast.error('Recording not available', {
          description: 'Please use the Surely mobile app for screen recording on mobile devices.',
        });
        throw new Error(errorMsg);
      }

      // NEW: Check if getDisplayMedia is available
      if (!navigator.mediaDevices?.getDisplayMedia) {
        const errorMsg = 'Screen recording is not supported in this browser. Please use a desktop browser like Chrome, Firefox, or Edge.';
        setError(errorMsg);
        toast.error('Recording not supported', {
          description: errorMsg,
        });
        throw new Error(errorMsg);
      }
      
      // Step 1: Request microphone FIRST
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000, // High quality audio
            channelCount: 2, // Stereo
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
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
        } as MediaTrackConstraints,
      });

      displayStreamRef.current = displayStream;

      // Step 3: Show countdown AFTER screen selection
      await showCountdown();

      // Step 4: Mix audio using Web Audio API with smooth initialization
      const audioContext = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = audioContext;
      
      // Wait for audio context to be running
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const destination = audioContext.createMediaStreamDestination();

      // Add system audio from display (if available) with smooth fade-in
      const systemAudioTracks = displayStream.getAudioTracks();
      if (systemAudioTracks.length > 0) {
        const systemAudioSource = audioContext.createMediaStreamSource(
          new MediaStream(systemAudioTracks)
        );
        const systemGain = audioContext.createGain();
        
        // Start at 0 and fade in smoothly to prevent pop
        systemGain.gain.setValueAtTime(0, audioContext.currentTime);
        systemGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.1);
        
        systemAudioSource.connect(systemGain);
        systemGain.connect(destination);
        logger.log('✓ System audio mixed with smooth fade-in');
      } else {
        logger.log('ℹ No system audio from tab/window');
      }

      // Add microphone audio with gain control and smooth fade-in
      if (micStream) {
        const micSource = audioContext.createMediaStreamSource(micStream);
        const micGain = audioContext.createGain();
        
        // Start at 0 and fade in smoothly to prevent pop
        micGain.gain.setValueAtTime(0, audioContext.currentTime);
        micGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.1);
        
        micSource.connect(micGain);
        micGain.connect(destination);
        
        micSourceRef.current = micSource;
        micGainRef.current = micGain;
        
        logger.log('✓ Microphone audio mixed with smooth fade-in');
      }

      // Wait a moment for audio to stabilize
      await new Promise(resolve => setTimeout(resolve, 150));

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

      // Step 5: Create MediaRecorder with optimal settings
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';
        
      const mediaRecorder = new MediaRecorder(combinedStream, { 
        mimeType,
        videoBitsPerSecond: OPTIMAL_VIDEO_BITRATE,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      consoleLogsRef.current = [];
      networkLogsRef.current = [];

      // Handle data available - MODIFIED: Save to IndexedDB
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          // NEW: Save chunk to IndexedDB for recovery
          saveChunk(sessionId, chunkIndexRef.current, event.data);
          chunkIndexRef.current++;
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
      recordingStartedRef.current = true;
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      logger.log('✓ Recording started successfully');

    } catch (err) {
      logger.log('Error starting recording:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to start recording'
      );
      cleanup();
    }
  }, [cleanup, isRecording, showCountdown, sessionId]);

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

      // Smooth fade out of audio before stopping
      if (audioContextRef.current && micGainRef.current) {
        const ctx = audioContextRef.current;
        const currentTime = ctx.currentTime;
        
        // Fade out all audio over 50ms to prevent pop
        micGainRef.current.gain.linearRampToValueAtTime(0, currentTime + 0.05);
      }

      // Wait for fade out before stopping
      setTimeout(() => {
        mediaRecorder.onstop = async () => { // MODIFIED: async for cleanup
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

          // NEW: Clear recovery data on successful stop
          await clearSession(sessionId);
          localStorage.removeItem(STORAGE_KEY);
          chunkIndexRef.current = 0;

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
      }, 60);
    });
  }, [duration, cleanup, sessionId]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMicMuted;
    setIsMicMuted(newMutedState);

    // Use gain node to mute/unmute microphone with smooth transition
    if (micGainRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const currentTime = ctx.currentTime;
      
      // Smooth transition to prevent clicks
      micGainRef.current.gain.cancelScheduledValues(currentTime);
      micGainRef.current.gain.setValueAtTime(micGainRef.current.gain.value, currentTime);
      micGainRef.current.gain.linearRampToValueAtTime(newMutedState ? 0 : 1, currentTime + 0.05);
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
        canRecord, // NEW
        hasPendingRecording, // NEW
        pendingRecordingPreview, // NEW
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        loadPendingRecording, // NEW
        discardPendingRecording, // NEW
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