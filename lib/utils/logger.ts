// ============================================
// FILE: lib/utils/logger.ts
// Production-ready logging utility
// ============================================

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

// Don't log anything in test environment
const shouldLog = isDevelopment && !isTest

export const logger = {
  /**
   * General logging - only in development
   */
  log: (...args: any[]) => {
    if (shouldLog) {
      console.log(...args)
    }
  },

  /**
   * Error logging - only in development
   */
  error: (...args: any[]) => {
    if (shouldLog) {
      console.error(...args)
    }
  },

  /**
   * Warning logging - only in development
   */
  warn: (...args: any[]) => {
    if (shouldLog) {
      console.warn(...args)
    }
  },

  /**
   * Info logging - only in development
   */
  info: (...args: any[]) => {
    if (shouldLog) {
      console.info(...args)
    }
  },

  /**
   * Debug logging - only in development
   */
  debug: (...args: any[]) => {
    if (shouldLog) {
      console.debug(...args)
    }
  },

  /**
   * Critical errors - ALWAYS logged (even in production)
   * Use this for errors that need monitoring in production
   */
  critical: (...args: any[]) => {
    console.error('[CRITICAL]', ...args)
  },

  /**
   * Server-side logging with prefix
   */
  server: (...args: any[]) => {
    if (shouldLog) {
      console.log('[Server]', ...args)
    }
  },

  /**
   * Client-side logging with prefix
   */
  client: (...args: any[]) => {
    if (shouldLog) {
      console.log('[Client]', ...args)
    }
  },

  /**
   * Success logging
   */
  success: (...args: any[]) => {
    if (shouldLog) {
      console.log('[SUCCESS]', ...args)
    }
  },

  /**
   * API call logging
   */
  api: (method: string, endpoint: string, ...args: any[]) => {
    if (shouldLog) {
      console.log(`[API] [${method}] ${endpoint}`, ...args)
    }
  },

  /**
   * Database query logging
   */
  db: (operation: string, table: string, ...args: any[]) => {
    if (shouldLog) {
      console.log(`[DB] [${operation}] ${table}`, ...args)
    }
  },

  /**
   * Performance timing
   */
  time: (label: string) => {
    if (shouldLog) {
      console.time(label)
    }
  },

  timeEnd: (label: string) => {
    if (shouldLog) {
      console.timeEnd(label)
    }
  }
}

// Export a no-op logger for production (optional, for explicit production usage)
export const prodLogger = {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
  critical: console.error,
  server: () => {},
  client: () => {},
  success: () => {},
  api: () => {},
  db: () => {},
  time: () => {},
  timeEnd: () => {}
}