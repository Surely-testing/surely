// ============================================
// types/recording.types.ts
// ============================================

import { Tables } from "./database.types";

export type Recording = Tables<'recordings'>;

export interface RecordingFormData {
  title: string;
  url: string;
  duration?: number;
  metadata?: Record<string, any>;
  sprint_id?: string | null;
  suite_id: string;
}

export interface RecordingMetadata {
  resolution?: string;
  timestamp?: string;
  browser?: string;
  os?: string;
  consoleLogsUrl?: string;
  networkLogsUrl?: string;
  screenshotUrls?: string[];
}

export interface ConsoleLog {
  timestamp: number;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  stack?: string;
}

export interface NetworkLog {
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  type: string;
  size?: number;
  duration?: number;
}

export interface RecordingSession {
  id: string;
  startTime: number;
  mediaRecorder?: MediaRecorder;
  chunks: Blob[];
  consoleLogs: ConsoleLog[];
  networkLogs: NetworkLog[];
  screenshots: string[];
}

export interface RecordingPreview {
  videoBlob: Blob;
  duration: number;
  consoleLogs: ConsoleLog[];
  networkLogs: NetworkLog[];
  screenshots: string[];
  metadata: RecordingMetadata;
}

export interface RecordingFilters {
  search?: string;
  sprint_id?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'duration';
}