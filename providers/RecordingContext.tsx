// ============================================
// contexts/RecordingContext.tsx - COMPLETE WITH ALL FEATURES
// REPLACE YOUR ENTIRE RecordingContext.tsx WITH THIS FILE
// ============================================

'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { RecordingPreview, ConsoleLog, NetworkLog, RecordingMetadata } from '@/types/recording.types';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

// Import all feature modules
import { networkInterceptor } from '@/lib/recording/network-interceptor';
import { ScreenshotCapture } from '@/lib/recording/screenshot-capture';
import { PerformanceTracker } from '@/lib/recording/performance-tracker';
import { ErrorStackCapture } from '@/lib/recording/error-stack-capture';
import { DevToolsDetector } from '@/lib/recording/devtools-detector';
import { ReduxStateTracker } from '@/lib/recording/redux-state-tracker';
import { CodeSnippetExtractor } from '@/lib/recording/code-snippet-extractor';
import { WebSocketTracker } from '@/lib/recording/websocket-tracker';

// Configuration
const MAX_RECORDING_DURATION = 300; // 5 minutes
const WARNING_DURATION = 240; // 4 minutes
const OPTIMAL_VIDEO_BITRATE = 2500000;
const OPTIMAL_FRAME_RATE = 30;

// IndexedDB Configuration
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
  canRecord: boolean;
  hasPendingRecording: boolean;
  pendingRecordingPreview: RecordingPreview | null;

  // Feature counters
  currentMetrics: any;
  screenshotCount: number;
  networkRequestCount: number;
  errorCount: number;
  stateChangeCount: number;
  codeSnippetCount: number;
  websocketConnectionCount: number;
  devToolsOpen: boolean;

  // Methods
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<RecordingPreview | null>;
  loadPendingRecording: () => Promise<void>;
  discardPendingRecording: () => Promise<void>;
  toggleMute: () => void;
  takeScreenshotNow: () => Promise<void>;
  clearError: () => void;
}

const RecordingContext = createContext<RecordingContextType | null>(null);

// IndexedDB helpers
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
  // Core state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [canRecord, setCanRecord] = useState(true);
  const [hasPendingRecording, setHasPendingRecording] = useState(false);
  const [pendingRecordingPreview, setPendingRecordingPreview] = useState<RecordingPreview | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}`);

  // Feature counters
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [networkRequestCount, setNetworkRequestCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [stateChangeCount, setStateChangeCount] = useState(0);
  const [codeSnippetCount, setCodeSnippetCount] = useState(0);
  const [websocketConnectionCount, setWebsocketConnectionCount] = useState(0);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // Core recording refs
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
  const chunkIndexRef = useRef(0);

  // Feature tracker refs
  const screenshotCaptureRef = useRef<ScreenshotCapture | null>(null);
  const performanceTrackerRef = useRef<PerformanceTracker | null>(null);
  const errorStackCaptureRef = useRef<ErrorStackCapture | null>(null);
  const devToolsDetectorRef = useRef<DevToolsDetector | null>(null);
  const reduxStateTrackerRef = useRef<ReduxStateTracker | null>(null);
  const codeSnippetExtractorRef = useRef<CodeSnippetExtractor | null>(null);
  const websocketTrackerRef = useRef<WebSocketTracker | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const remainingTime = MAX_RECORDING_DURATION - duration;

  // Check if recording is supported
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasAPI = !!(navigator.mediaDevices?.getDisplayMedia);
    setCanRecord(!isMobile && hasAPI);
  }, []);

  // Check for pending recording on mount
  useEffect(() => {
    const checkPending = async () => {
      const stateStr = localStorage.getItem(STORAGE_KEY);
      if (!stateStr) return;

      try {
        const state = JSON.parse(stateStr);
        const timeSince = Date.now() - state.timestamp;

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
            description: `Found ${chunks.length} chunks (${sizeMB.toFixed(2)} MB) from previous session.`,
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

  // Prevent page unload during recording
  useEffect(() => {
    if (!isRecording) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Recording in progress.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

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

  // Capture console logs
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

  // Time limit warnings
  useEffect(() => {
    if (!isRecording || isPaused) return;

    if (duration === WARNING_DURATION && !warningShownRef.current) {
      toast.warning('1 minute remaining');
      warningShownRef.current = true;
    }

    if (duration >= MAX_RECORDING_DURATION) {
      toast.info('Maximum recording time reached');
      stopRecording();
    }
  }, [duration, isRecording, isPaused]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
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

    // Stop all feature trackers
    if (screenshotCaptureRef.current) {
      screenshotCaptureRef.current.stop();
      screenshotCaptureRef.current = null;
    }
    if (performanceTrackerRef.current) {
      performanceTrackerRef.current.stop();
      performanceTrackerRef.current = null;
    }
    if (errorStackCaptureRef.current) {
      errorStackCaptureRef.current.stop();
      errorStackCaptureRef.current = null;
    }
    if (devToolsDetectorRef.current) {
      devToolsDetectorRef.current.stop();
      devToolsDetectorRef.current = null;
    }
    if (reduxStateTrackerRef.current) {
      reduxStateTrackerRef.current.stop();
      reduxStateTrackerRef.current = null;
    }
    if (codeSnippetExtractorRef.current) {
      codeSnippetExtractorRef.current.stop();
      codeSnippetExtractorRef.current = null;
    }
    if (websocketTrackerRef.current) {
      websocketTrackerRef.current.stop();
      websocketTrackerRef.current = null;
    }
    networkInterceptor.stop();

    chunksRef.current = [];
    consoleLogsRef.current = [];
    networkLogsRef.current = [];
    micSourceRef.current = null;
    micGainRef.current = null;
    warningShownRef.current = false;
    recordingStartedRef.current = false;

    // Reset counters
    setScreenshotCount(0);
    setNetworkRequestCount(0);
    setErrorCount(0);
    setStateChangeCount(0);
    setCodeSnippetCount(0);
    setWebsocketConnectionCount(0);
    setDevToolsOpen(false);
    setCurrentMetrics(null);
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
      chunkIndexRef.current = 0;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const errorMsg = 'Screen recording not available on mobile browsers.';
        setError(errorMsg);
        toast.error('Recording not available');
        throw new Error(errorMsg);
      }

      if (!navigator.mediaDevices?.getDisplayMedia) {
        const errorMsg = 'Screen recording not supported in this browser.';
        setError(errorMsg);
        toast.error('Recording not supported');
        throw new Error(errorMsg);
      }

      // Request microphone
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 2,
          },
        });
        micStreamRef.current = micStream;
        logger.log('✓ Microphone access granted');
      } catch (micError) {
        logger.log('Microphone access denied:', micError);
        throw new Error('Microphone access required.');
      }

      // Request screen sharing
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
      await showCountdown();

      // Mix audio
      const audioContext = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const destination = audioContext.createMediaStreamDestination();

      const systemAudioTracks = displayStream.getAudioTracks();
      if (systemAudioTracks.length > 0) {
        const systemAudioSource = audioContext.createMediaStreamSource(
          new MediaStream(systemAudioTracks)
        );
        const systemGain = audioContext.createGain();
        systemGain.gain.setValueAtTime(0, audioContext.currentTime);
        systemGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.1);
        systemAudioSource.connect(systemGain);
        systemGain.connect(destination);
        logger.log('✓ System audio mixed');
      }

      if (micStream) {
        const micSource = audioContext.createMediaStreamSource(micStream);
        const micGain = audioContext.createGain();
        micGain.gain.setValueAtTime(0, audioContext.currentTime);
        micGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.1);
        micSource.connect(micGain);
        micGain.connect(destination);
        micSourceRef.current = micSource;
        micGainRef.current = micGain;
        logger.log('✓ Microphone audio mixed');
      }

      await new Promise(resolve => setTimeout(resolve, 150));

      // Create combined stream
      const combinedStream = new MediaStream();
      displayStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
      destination.stream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      combinedStreamRef.current = combinedStream;

      // Create MediaRecorder
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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          saveChunk(sessionId, chunkIndexRef.current, event.data);
          chunkIndexRef.current++;
        }
      };

      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (isRecording) {
          stopRecording();
        }
      });

      // START ALL FEATURE TRACKERS

      // 1. Network Interceptor
      networkInterceptor.start({
        onRequest: (log) => {
          networkLogsRef.current.push(log);
          setNetworkRequestCount(prev => prev + 1);
        },
      });

      // 2. Screenshot Capture
      screenshotCaptureRef.current = new ScreenshotCapture({
        interval: 10000,
        quality: 0.8,
        format: 'jpeg',
        maxScreenshots: 30,
      });
      await screenshotCaptureRef.current.start(displayStream);

      setInterval(() => {
        if (screenshotCaptureRef.current) {
          setScreenshotCount(screenshotCaptureRef.current.getCount());
        }
      }, 1000);

      // 3. Performance Tracker
      performanceTrackerRef.current = new PerformanceTracker();
      performanceTrackerRef.current.start(2000);

      metricsIntervalRef.current = setInterval(() => {
        if (performanceTrackerRef.current) {
          const latest = performanceTrackerRef.current.getLatestMetric();
          setCurrentMetrics(latest);
        }
      }, 2000);

      // 4. Error Stack Capture
      errorStackCaptureRef.current = new ErrorStackCapture();
      errorStackCaptureRef.current.start();

      setInterval(() => {
        if (errorStackCaptureRef.current) {
          setErrorCount(errorStackCaptureRef.current.getCount());
        }
      }, 1000);

      // 5. DevTools Detector
      devToolsDetectorRef.current = new DevToolsDetector();
      devToolsDetectorRef.current.start(1000);

      setInterval(() => {
        if (devToolsDetectorRef.current) {
          setDevToolsOpen(devToolsDetectorRef.current.isCurrentlyOpen());
        }
      }, 1000);

      // 6. Redux State Tracker
      reduxStateTrackerRef.current = new ReduxStateTracker();
      reduxStateTrackerRef.current.start();

      setInterval(() => {
        if (reduxStateTrackerRef.current) {
          setStateChangeCount(reduxStateTrackerRef.current.getCount());
        }
      }, 1000);

      // 7. Code Snippet Extractor
      codeSnippetExtractorRef.current = new CodeSnippetExtractor();
      codeSnippetExtractorRef.current.start();

      setInterval(() => {
        if (codeSnippetExtractorRef.current) {
          setCodeSnippetCount(codeSnippetExtractorRef.current.getCount());
        }
      }, 1000);

      // 8. WebSocket Tracker
      websocketTrackerRef.current = new WebSocketTracker();
      websocketTrackerRef.current.start();

      setInterval(() => {
        if (websocketTrackerRef.current) {
          setWebsocketConnectionCount(websocketTrackerRef.current.getActiveConnections().length);
        }
      }, 1000);

      // Start recording
      mediaRecorder.start(1000);
      recordingStartedRef.current = true;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      logger.log('✓ Recording started with ALL features');

    } catch (err) {
      logger.log('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
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

      // Fade out audio
      if (audioContextRef.current && micGainRef.current) {
        const ctx = audioContextRef.current;
        const currentTime = ctx.currentTime;
        micGainRef.current.gain.linearRampToValueAtTime(0, currentTime + 0.05);
      }

      setTimeout(() => {
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });

          // Collect all captured data
          const screenshotObjects = screenshotCaptureRef.current?.stop() || [];
          const performanceMetrics = performanceTrackerRef.current?.stop() || [];
          const errorStackTraces = errorStackCaptureRef.current?.stop() || [];
          const devToolsStates = devToolsDetectorRef.current?.stop() || [];
          const stateChanges = reduxStateTrackerRef.current?.stop() || [];
          const codeSnippets = codeSnippetExtractorRef.current?.stop() || [];
          const websocketConnections = websocketTrackerRef.current?.stop() || [];

          networkInterceptor.stop();

          // Convert Screenshot objects to dataUrl strings (as per your RecordingPreview type)
          const screenshots = screenshotObjects.map(s => s.dataUrl);

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
            performanceMetrics,
            errorStackTraces,
            devToolsStates,
            stateChanges,
            codeSnippets,
            websocketConnections,
          };

          const preview: RecordingPreview = {
            videoBlob: blob,
            duration: finalDuration,
            consoleLogs: [...consoleLogsRef.current],
            networkLogs: [...networkLogsRef.current],
            screenshots, // Now this is string[] (dataUrls)
            metadata,
            errorStackTraces,
            devToolsStates,
            stateChanges,
            codeSnippets,
            websocketConnections,
          };

          logger.log('Recording complete:', {
            duration: finalDuration,
            size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
            screenshots: screenshots.length,
            networkRequests: networkLogsRef.current.length,
            consoleLogs: consoleLogsRef.current.length,
            errors: errorStackTraces.length,
            stateChanges: stateChanges.length,
            codeSnippets: codeSnippets.length,
            websockets: websocketConnections.length,
          });

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

    if (micGainRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const currentTime = ctx.currentTime;
      micGainRef.current.gain.cancelScheduledValues(currentTime);
      micGainRef.current.gain.setValueAtTime(micGainRef.current.gain.value, currentTime);
      micGainRef.current.gain.linearRampToValueAtTime(newMutedState ? 0 : 1, currentTime + 0.05);
    }
  }, [isMicMuted]);

  const takeScreenshotNow = useCallback(async () => {
    if (!screenshotCaptureRef.current) {
      toast.error('Screenshot capture not available');
      return;
    }

    const screenshot = await screenshotCaptureRef.current.captureNow();
    if (screenshot) {
      toast.success('Screenshot captured');
      setScreenshotCount(screenshotCaptureRef.current.getCount());
    }
  }, []);

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
        canRecord,
        hasPendingRecording,
        pendingRecordingPreview,
        currentMetrics,
        screenshotCount,
        networkRequestCount,
        errorCount,
        stateChangeCount,
        codeSnippetCount,
        websocketConnectionCount,
        devToolsOpen,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        loadPendingRecording,
        discardPendingRecording,
        toggleMute,
        takeScreenshotNow,
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