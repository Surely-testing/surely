// ============================================
// lib/recording/performance-tracker.ts
// Track browser and system performance metrics
// ============================================

import { logger } from '@/lib/utils/logger';
import type { PerformanceMetric } from '@/types/recording.types';

export class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private isTracking = false;
  private intervalId: number | null = null;
  
  // FPS tracking
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;

  constructor() {}

  start(interval: number = 2000): void {
    if (this.isTracking) {
      logger.log('Performance tracker already active');
      return;
    }

    this.isTracking = true;
    this.metrics = [];

    // Start FPS tracking
    this.startFPSTracking();

    // Collect initial metric
    this.collectMetric();

    // Start periodic collection
    this.intervalId = window.setInterval(() => {
      this.collectMetric();
    }, interval);

    logger.log('✓ Performance tracker started', { interval: `${interval}ms` });
  }

  private startFPSTracking(): void {
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;

    const measureFPS = (currentTime: number) => {
      this.frameCount++;
      
      const delta = currentTime - this.lastFrameTime;
      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }

      if (this.isTracking) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  private collectMetric(): void {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      fps: this.fps,
      memory: null,
      cpu: null,
      loadTimes: {},
      resourceCount: 0,
      pageLoadTime: 0,
    };

    // Memory information
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metric.memory = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }

    // Get Web Vitals if available
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        metric.loadTimes.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        metric.pageLoadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
      }

      // Get paint timings
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          metric.loadTimes.fcp = entry.startTime;
        }
      });

      // Get LCP if available
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        const lastEntry = lcpEntries[lcpEntries.length - 1];
        metric.loadTimes.lcp = lastEntry.startTime;
      }

      // Get resource count
      const resources = performance.getEntriesByType('resource');
      metric.resourceCount = resources.length;
    } catch (error) {
      // Ignore errors
    }

    this.metrics.push(metric);
  }

  stop(): PerformanceMetric[] {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isTracking = false;

    const captured = [...this.metrics];
    this.metrics = [];

    logger.log('✓ Performance tracker stopped', {
      totalMetrics: captured.length,
      avgFPS: captured.length > 0 
        ? Math.round(captured.reduce((sum, m) => sum + m.fps, 0) / captured.length)
        : 0,
      avgMemory: captured.length > 0 && captured.some(m => m.memory)
        ? `${Math.round(captured.reduce((sum, m) => sum + (m.memory?.used || 0), 0) / captured.length)} MB`
        : 'N/A',
    });

    return captured;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getLatestMetric(): PerformanceMetric | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getAverages(): {
    avgFPS: number;
    avgMemoryUsed: number;
    avgResourceCount: number;
  } {
    if (this.metrics.length === 0) {
      return {
        avgFPS: 0,
        avgMemoryUsed: 0,
        avgResourceCount: 0,
      };
    }

    const sum = this.metrics.reduce(
      (acc, m) => ({
        fps: acc.fps + m.fps,
        memory: acc.memory + (m.memory?.used || 0),
        resources: acc.resources + m.resourceCount,
      }),
      { fps: 0, memory: 0, resources: 0 }
    );

    const count = this.metrics.length;

    return {
      avgFPS: Math.round(sum.fps / count),
      avgMemoryUsed: Math.round(sum.memory / count),
      avgResourceCount: Math.round(sum.resources / count),
    };
  }

  getPeaks(): {
    maxFPS: number;
    minFPS: number;
    maxMemoryUsed: number;
  } {
    if (this.metrics.length === 0) {
      return {
        maxFPS: 0,
        minFPS: 0,
        maxMemoryUsed: 0,
      };
    }

    return {
      maxFPS: Math.max(...this.metrics.map(m => m.fps)),
      minFPS: Math.min(...this.metrics.map(m => m.fps)),
      maxMemoryUsed: Math.max(...this.metrics.map(m => m.memory?.used || 0)),
    };
  }

  exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        averages: this.getAverages(),
        peaks: this.getPeaks(),
        summary: {
          duration: this.metrics.length > 0
            ? this.metrics[this.metrics.length - 1].timestamp - this.metrics[0].timestamp
            : 0,
          sampleCount: this.metrics.length,
        },
      },
      null,
      2
    );
  }

  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.metrics.length < 3) return 'stable';

    const recentMetrics = this.metrics.slice(-5);
    const memoryValues = recentMetrics
      .filter(m => m.memory)
      .map(m => m.memory!.used);

    if (memoryValues.length < 2) return 'stable';

    const first = memoryValues[0];
    const last = memoryValues[memoryValues.length - 1];
    const diff = last - first;
    const threshold = first * 0.1; // 10% threshold

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  getFPSTrend(): 'improving' | 'degrading' | 'stable' {
    if (this.metrics.length < 3) return 'stable';

    const recentMetrics = this.metrics.slice(-5);
    const fpsValues = recentMetrics.map(m => m.fps);

    if (fpsValues.length < 2) return 'stable';

    const first = fpsValues[0];
    const last = fpsValues[fpsValues.length - 1];
    const diff = last - first;
    const threshold = 5; // 5 FPS threshold

    if (diff > threshold) return 'improving';
    if (diff < -threshold) return 'degrading';
    return 'stable';
  }

  isPerformanceDegrading(): boolean {
    const latest = this.getLatestMetric();
    if (!latest) return false;

    // Check memory usage
    if (latest.memory && latest.memory.used / latest.memory.limit > 0.9) {
      return true;
    }

    // Check FPS
    if (latest.fps < 20) {
      return true;
    }

    // Check memory trend
    if (this.getMemoryTrend() === 'increasing') {
      return true;
    }

    // Check FPS trend
    if (this.getFPSTrend() === 'degrading') {
      return true;
    }

    return false;
  }
}