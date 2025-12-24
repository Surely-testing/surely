
// ============================================
// lib/recording/error-stack-capture.ts
// Captures error stack traces with source maps
// ============================================

import { logger } from '@/lib/utils/logger';

export interface ErrorStackTrace {
  timestamp: number;
  message: string;
  stack: string;
  type: 'error' | 'unhandledRejection' | 'console.error';
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  resolvedStack?: string; // Source-mapped stack trace
}

export class ErrorStackCapture {
  private errors: ErrorStackTrace[] = [];
  private isCapturing = false;
  private errorHandler: ((event: ErrorEvent) => void) | null = null;
  private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
  private originalConsoleError: typeof console.error;

  constructor() {
    this.originalConsoleError = console.error;
  }

  start(): void {
    if (this.isCapturing) {
      logger.log('Error stack capture already active');
      return;
    }

    this.isCapturing = true;
    this.errors = [];

    // Capture window errors
    this.errorHandler = (event: ErrorEvent) => {
      const errorTrace: ErrorStackTrace = {
        timestamp: Date.now(),
        message: event.message,
        stack: event.error?.stack || 'No stack trace available',
        type: 'error',
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
      };

      this.errors.push(errorTrace);
      logger.log('✓ Error captured:', errorTrace.message);
    };

    window.addEventListener('error', this.errorHandler);

    // Capture unhandled promise rejections
    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      const errorTrace: ErrorStackTrace = {
        timestamp: Date.now(),
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || 'No stack trace available',
        type: 'unhandledRejection',
      };

      this.errors.push(errorTrace);
      logger.log('✓ Unhandled rejection captured:', errorTrace.message);
    };

    window.addEventListener('unhandledrejection', this.rejectionHandler);

    // Capture console.error with stack traces
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      // Try to get stack trace
      let stack = 'No stack trace available';
      try {
        throw new Error();
      } catch (e: any) {
        stack = e.stack || stack;
      }

      const errorTrace: ErrorStackTrace = {
        timestamp: Date.now(),
        message,
        stack,
        type: 'console.error',
      };

      this.errors.push(errorTrace);

      // Call original console.error
      this.originalConsoleError.apply(console, args);
    };

    logger.log('✓ Error stack capture started');
  }

  stop(): ErrorStackTrace[] {
    if (!this.isCapturing) return [];

    // Remove event listeners
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler);
      this.errorHandler = null;
    }

    if (this.rejectionHandler) {
      window.removeEventListener('unhandledrejection', this.rejectionHandler);
      this.rejectionHandler = null;
    }

    // Restore console.error
    console.error = this.originalConsoleError;

    this.isCapturing = false;

    const captured = [...this.errors];
    this.errors = [];

    logger.log('✓ Error stack capture stopped', {
      totalErrors: captured.length,
    });

    return captured;
  }

  getErrors(): ErrorStackTrace[] {
    return [...this.errors];
  }

  getCount(): number {
    return this.errors.length;
  }

  clear(): void {
    this.errors = [];
  }
}