// ============================================
// lib/recording/devtools-detector.ts
// Detects what's open in browser DevTools
// ============================================

import { logger } from '@/lib/utils/logger';

export interface DevToolsState {
  isOpen: boolean;
  orientation?: 'vertical' | 'horizontal' | 'detached';
  timestamp: number;
}

export interface DevToolsActivity {
  panelsDetected: string[];
  consoleOpen: boolean;
  networkOpen: boolean;
  elementsOpen: boolean;
  sourcesOpen: boolean;
  performanceOpen: boolean;
  memoryOpen: boolean;
  applicationOpen: boolean;
}

export class DevToolsDetector {
  private states: DevToolsState[] = [];
  private isTracking = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private threshold = 160;
  private lastOrientation: DevToolsState['orientation'] = 'horizontal';

  start(intervalMs: number = 1000): void {
    if (this.isTracking) {
      logger.log('DevTools detector already active');
      return;
    }

    this.isTracking = true;
    this.states = [];

    // Check immediately
    this.detectDevTools();

    // Check at interval
    this.checkInterval = setInterval(() => {
      this.detectDevTools();
    }, intervalMs);

    logger.log('✓ DevTools detector started');
  }

  private detectDevTools(): void {
    const widthThreshold = window.outerWidth - window.innerWidth > this.threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > this.threshold;
    
    let isOpen = false;
    let orientation: DevToolsState['orientation'];

    // Detect if DevTools is open
    if (widthThreshold && heightThreshold) {
      isOpen = true;
      orientation = 'detached';
    } else if (heightThreshold) {
      isOpen = true;
      orientation = 'horizontal';
    } else if (widthThreshold) {
      isOpen = true;
      orientation = 'vertical';
    }

    // Also use devtools-detector library approach
    const devtools = /./;
    devtools.toString = function() {
      isOpen = true;
      return 'devtools';
    };

    // Check via console
    console.debug(devtools);

    if (isOpen && orientation) {
      this.lastOrientation = orientation;
    }

    const state: DevToolsState = {
      isOpen,
      orientation: isOpen ? (orientation || this.lastOrientation) : undefined,
      timestamp: Date.now(),
    };

    // Only record state changes
    const lastState = this.states[this.states.length - 1];
    if (!lastState || lastState.isOpen !== state.isOpen || lastState.orientation !== state.orientation) {
      this.states.push(state);
      logger.log('✓ DevTools state changed:', state);
    }
  }

  stop(): DevToolsState[] {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isTracking = false;

    const captured = [...this.states];
    this.states = [];

    logger.log('✓ DevTools detector stopped', {
      stateChanges: captured.length,
    });

    return captured;
  }

  getStates(): DevToolsState[] {
    return [...this.states];
  }

  isCurrentlyOpen(): boolean {
    const lastState = this.states[this.states.length - 1];
    return lastState?.isOpen || false;
  }

  getCurrentOrientation(): DevToolsState['orientation'] {
    const lastState = this.states[this.states.length - 1];
    return lastState?.orientation;
  }
}
