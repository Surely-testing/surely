
// ============================================
// lib/recording/redux-state-tracker.ts
// Hooks into Redux/state management libraries
// ============================================
import { logger } from '@/lib/utils/logger';

export interface StateChange {
  timestamp: number;
  library: 'redux' | 'zustand' | 'mobx' | 'recoil' | 'jotai' | 'unknown';
  action?: string;
  previousState?: any;
  nextState?: any;
  diff?: any;
}

export class ReduxStateTracker {
  private changes: StateChange[] = [];
  private isTracking = false;
  private unsubscribe: (() => void) | null = null;

  start(): void {
    if (this.isTracking) {
      logger.log('Redux state tracker already active');
      return;
    }

    this.isTracking = true;
    this.changes = [];

    // Try to hook into Redux
    this.hookRedux();

    // Try to hook into Zustand
    this.hookZustand();

    // Try to hook into other state libraries
    this.hookOtherLibraries();

    logger.log('✓ Redux state tracker started');
  }

  private hookRedux(): void {
    // Check if Redux DevTools Extension is available
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
      logger.log('✓ Redux DevTools detected');
    }

    // Try to find Redux store in window
    if (typeof window !== 'undefined') {
      const possibleStores = [
        (window as any).store,
        (window as any).__REDUX_STORE__,
        (window as any).__store__,
      ];

      for (const store of possibleStores) {
        if (store && typeof store.subscribe === 'function') {
          let previousState = store.getState();

          this.unsubscribe = store.subscribe(() => {
            const nextState = store.getState();

            const change: StateChange = {
              timestamp: Date.now(),
              library: 'redux',
              previousState: this.deepClone(previousState),
              nextState: this.deepClone(nextState),
              diff: this.calculateDiff(previousState, nextState),
            };

            this.changes.push(change);
            previousState = nextState;

            logger.log('✓ Redux state changed');
          });

          logger.log('✓ Hooked into Redux store');
          return;
        }
      }
    }
  }

  private hookZustand(): void {
    // Zustand stores are typically accessed via hooks
    // We can try to patch the create function
    if (typeof window !== 'undefined' && (window as any).zustand) {
      logger.log('✓ Zustand detected (basic detection)');
      // More advanced hooking would require patching the library
    }
  }

  private hookOtherLibraries(): void {
    // Check for MobX
    if (typeof window !== 'undefined' && (window as any).mobx) {
      logger.log('✓ MobX detected');
    }

    // Check for Recoil
    if (typeof window !== 'undefined' && (window as any).Recoil) {
      logger.log('✓ Recoil detected');
    }

    // Check for Jotai
    if (typeof window !== 'undefined' && (window as any).jotai) {
      logger.log('✓ Jotai detected');
    }
  }

  private deepClone(obj: any): any {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  }

  private calculateDiff(prev: any, next: any): any {
    const diff: any = {};

    // Simple diff calculation
    if (typeof prev === 'object' && typeof next === 'object') {
      const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);

      allKeys.forEach(key => {
        if (prev[key] !== next[key]) {
          diff[key] = {
            from: prev[key],
            to: next[key],
          };
        }
      });
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }

  stop(): StateChange[] {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.isTracking = false;

    const captured = [...this.changes];
    this.changes = [];

    logger.log('✓ Redux state tracker stopped', {
      totalChanges: captured.length,
    });

    return captured;
  }

  getChanges(): StateChange[] {
    return [...this.changes];
  }

  getCount(): number {
    return this.changes.length;
  }

  clear(): void {
    this.changes = [];
  }
}