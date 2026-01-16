// ============================================
// types/recording.types.ts - COMPLETE FINAL VERSION
// REPLACE YOUR ENTIRE FILE WITH THIS
// ============================================

import { Tables } from "./database.types";
import type { Annotation } from '@/lib/recording/annotation-system';

// Extend the base Recording type with additional fields
export type Recording = Tables<'recordings'> & {
  thumbnail_url?: string | null;
  logs_count?: number;
  requests_count?: number;
  description?: string | null;
  comment?: string | null;  // ADDED - for user comments/notes
};

export interface RecordingFormData {
  title: string;
  url: string;
  duration?: number;
  metadata?: Record<string, any>;
  sprint_id?: string | null;
  suite_id: string;
  thumbnail_url?: string | null;
  description?: string | null;
  comment?: string | null;  // ADDED
}

export interface RecordingMetadata {
  resolution?: string;
  timestamp?: string;
  browser?: string;
  os?: string;
  consoleLogsUrl?: string;
  networkLogsUrl?: string;
  screenshotUrls?: string[];
  thumbnail_url?: string;
  logs_count?: number;
  requests_count?: number;
  performanceMetrics?: PerformanceMetric[];
  errorStackTraces?: ErrorStackTrace[];
  devToolsStates?: DevToolsState[];
  stateChanges?: StateChange[];
  codeSnippets?: CodeSnippet[];
  websocketConnections?: WebSocketConnection[];
  annotations?: Annotation[];
  annotationsUrl?: string;
  rrwebEvents?: RRWebEvent[];        // ADDED
  rrwebEventsUrl?: string;           // ADDED
  tabActivity?: TabActivity[];       // ADDED
  consoleLogs?: ConsoleLog[];        // Direct logs if not using URL
  networkLogs?: NetworkLog[];        // Direct logs if not using URL
}

export interface ConsoleLog {
  timestamp: number;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  stack?: string;
  args?: any[];
  tabId?: number;
  tabUrl?: string;
  tabTitle?: string;
  sessionTimestamp?: number;
  pageContext?: {
    url: string;
    title: string;
    timestamp: number;
  };
}

export interface Screenshot {
  id: string;
  timestamp: number;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}

export interface NetworkLog {
  id?: string;
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  duration?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: boolean;
  errorMessage?: string;
  type: 'fetch' | 'xhr' | 'websocket' | 'graphql';
  size?: number;
  websocketMessages?: WebSocketMessage[];
  tabId?: number;
  tabUrl?: string;
  tabTitle?: string;
  sessionTimestamp?: number;
  pageContext?: {
    url: string;
    title: string;
    timestamp: number;
  };
}

export interface RecordingSession {
  id: string;
  startTime: number;
  mediaRecorder?: MediaRecorder;
  chunks: Blob[];
  consoleLogs: ConsoleLog[];
  networkLogs: NetworkLog[];
  screenshots: string[];
  rrwebEvents?: RRWebEvent[];
  tabActivity?: TabActivity[];
  annotations?: Annotation[];
}

export interface RecordingPreview {
  videoBlob: Blob;
  duration: number;
  consoleLogs: ConsoleLog[];
  networkLogs: NetworkLog[];
  screenshots: string[];
  metadata: RecordingMetadata;
  thumbnail_url?: string;
  errorStackTraces?: ErrorStackTrace[];
  devToolsStates?: DevToolsState[];
  stateChanges?: StateChange[];
  codeSnippets?: CodeSnippet[];
  websocketConnections?: WebSocketConnection[];
  annotations?: Annotation[];
  rrwebEvents?: RRWebEvent[];        // ADDED
  tabActivity?: TabActivity[];       // ADDED
}

export interface RecordingFilters {
  search?: string;
  sprint_id?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'duration';
}

// RRWeb Events for DOM replay
// Using proper rrweb types
export interface RRWebEvent {
  type: number;
  timestamp: number;
  data: any;  // Required by rrweb
  tabId?: number;
  tabUrl?: string;
  tabTitle?: string;
  delay?: number;
}

// Tab Activity tracking
export interface TabActivity {
  type: 'navigation' | 'page_load' | 'tab_focus' | 'tab_close' | 'browser_navigation';
  url?: string;
  title?: string;
  tabId: number;
  timestamp: number;
  sessionTimestamp: number;
}

// Error Stack Traces
export interface ErrorStackTrace {
  timestamp: number;
  message: string;
  stack: string;
  type: 'error' | 'unhandledRejection' | 'console.error';
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  resolvedStack?: string;
}

// DevTools State
export interface DevToolsState {
  isOpen: boolean;
  orientation?: 'vertical' | 'horizontal' | 'detached';
  timestamp: number;
}

// Redux/State Changes
export interface StateChange {
  timestamp: number;
  library: 'redux' | 'zustand' | 'mobx' | 'recoil' | 'jotai' | 'unknown';
  action?: string;
  previousState?: any;
  nextState?: any;
  diff?: any;
}

// Code Snippets
export interface CodeSnippet {
  timestamp: number;
  language: string;
  code: string;
  source: 'console' | 'sources' | 'elements' | 'network';
  fileName?: string;
  lineNumber?: number;
}

// WebSocket Messages
export interface WebSocketMessage {
  id: string;
  timestamp: number;
  direction: 'sent' | 'received';
  data: any;
  size: number;
  type: string;
  parsed?: any;
}

export interface WebSocketConnection {
  id: string;
  url: string;
  protocols?: string | string[];
  startTime: number;
  endTime?: number;
  state: 'connecting' | 'open' | 'closing' | 'closed';
  messages: WebSocketMessage[];
  totalBytesSent: number;
  totalBytesReceived: number;
}

// Performance Metrics
export interface PerformanceMetric {
  timestamp: number;
  fps: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  } | null;
  cpu: number | null;
  loadTimes: {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
    tti?: number;
  };
  resourceCount: number;
  pageLoadTime: number;
}