// ============================================
// lib/utils/recording-metadata.ts
// Enhanced metadata utilities
// ============================================

export interface EnhancedMetadata {
  basic: {
    duration: number;
    fileSize: number;
    resolution: string;
    fps: number;
    codec: string;
    hasAudio: boolean;
  };
  capture: {
    timestamp: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    screenResolution: string;
    devicePixelRatio: number;
  };
  performance: {
    avgFps: number;
    minFps: number;
    maxFps: number;
    avgMemoryMB: number;
    peakMemoryMB: number;
    avgCpuPercent: number;
  };
  activity: {
    totalConsoleLog: number;
    totalNetworkRequests: number;
    totalErrors: number;
    totalScreenshots: number;
    totalAnnotations: number;
    totalComments: number;
  };
  network: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    totalDataTransferred: number;
    graphqlRequests: number;
    websocketConnections: number;
  };
}

export class RecordingMetadataUtils {
  static generateEnhancedMetadata(preview: any): EnhancedMetadata {
    const videoBlob = preview.videoBlob;
    const metadata = preview.metadata;
    const performanceMetrics = metadata.performanceMetrics || [];
    const networkLogs = preview.networkLogs || [];
    const consoleLogs = preview.consoleLogs || [];

    return {
      basic: {
        duration: preview.duration,
        fileSize: videoBlob.size,
        resolution: metadata.resolution || 'unknown',
        fps: this.calculateAverageFps(performanceMetrics),
        codec: this.detectCodec(videoBlob.type),
        hasAudio: this.hasAudioTrack(videoBlob),
      },
      capture: {
        timestamp: metadata.timestamp,
        browser: metadata.browser || 'Unknown',
        browserVersion: this.getBrowserVersion(),
        os: metadata.os || 'Unknown',
        osVersion: this.getOSVersion(),
        screenResolution: this.getScreenResolution(),
        devicePixelRatio: window.devicePixelRatio || 1,
      },
      performance: {
        avgFps: this.calculateAverageFps(performanceMetrics),
        minFps: this.calculateMinFps(performanceMetrics),
        maxFps: this.calculateMaxFps(performanceMetrics),
        avgMemoryMB: this.calculateAverageMemory(performanceMetrics),
        peakMemoryMB: this.calculatePeakMemory(performanceMetrics),
        avgCpuPercent: this.calculateAverageCpu(performanceMetrics),
      },
      activity: {
        totalConsoleLog: consoleLogs.length,
        totalNetworkRequests: networkLogs.length,
        totalErrors: this.countErrors(consoleLogs, networkLogs),
        totalScreenshots: preview.screenshots?.length || 0,
        totalAnnotations: 0, // Would come from annotation system
        totalComments: 0, // Would come from comment system
      },
      network: {
        totalRequests: networkLogs.length,
        successfulRequests: this.countSuccessfulRequests(networkLogs),
        failedRequests: this.countFailedRequests(networkLogs),
        avgResponseTime: this.calculateAverageResponseTime(networkLogs),
        totalDataTransferred: this.calculateTotalDataTransferred(networkLogs),
        graphqlRequests: this.countGraphQLRequests(networkLogs),
        websocketConnections: this.countWebSocketConnections(networkLogs),
      },
    };
  }

  private static calculateAverageFps(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + (m.fps || 0), 0);
    return Math.round(sum / metrics.length);
  }

  private static calculateMinFps(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    return Math.min(...metrics.map(m => m.fps || 0));
  }

  private static calculateMaxFps(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    return Math.max(...metrics.map(m => m.fps || 0));
  }

  private static calculateAverageMemory(metrics: any[]): number {
    const memoryMetrics = metrics.filter(m => m.memory?.used);
    if (memoryMetrics.length === 0) return 0;
    const sum = memoryMetrics.reduce((acc, m) => acc + m.memory.used, 0);
    return Math.round(sum / memoryMetrics.length);
  }

  private static calculatePeakMemory(metrics: any[]): number {
    const memoryMetrics = metrics.filter(m => m.memory?.used);
    if (memoryMetrics.length === 0) return 0;
    return Math.max(...memoryMetrics.map(m => m.memory.used));
  }

  private static calculateAverageCpu(metrics: any[]): number {
    const cpuMetrics = metrics.filter(m => m.cpu !== null && m.cpu !== undefined);
    if (cpuMetrics.length === 0) return 0;
    const sum = cpuMetrics.reduce((acc, m) => acc + m.cpu, 0);
    return Math.round(sum / cpuMetrics.length);
  }

  private static countErrors(consoleLogs: any[], networkLogs: any[]): number {
    const consoleErrors = consoleLogs.filter(log => log.type === 'error').length;
    const networkErrors = networkLogs.filter(log => 
      !log.status || log.status >= 400 || log.error
    ).length;
    return consoleErrors + networkErrors;
  }

  private static countSuccessfulRequests(logs: any[]): number {
    return logs.filter(log => log.status >= 200 && log.status < 400).length;
  }

  private static countFailedRequests(logs: any[]): number {
    return logs.filter(log => !log.status || log.status >= 400 || log.error).length;
  }

  private static calculateAverageResponseTime(logs: any[]): number {
    const logsWithDuration = logs.filter(log => log.duration);
    if (logsWithDuration.length === 0) return 0;
    const sum = logsWithDuration.reduce((acc, log) => acc + log.duration, 0);
    return Math.round(sum / logsWithDuration.length);
  }

  private static calculateTotalDataTransferred(logs: any[]): number {
    return logs.reduce((acc, log) => acc + (log.size || 0), 0);
  }

  private static countGraphQLRequests(logs: any[]): number {
    return logs.filter(log => log.type === 'graphql').length;
  }

  private static countWebSocketConnections(logs: any[]): number {
    return logs.filter(log => log.type === 'websocket').length;
  }

  private static detectCodec(mimeType: string): string {
    if (mimeType.includes('vp9')) return 'VP9';
    if (mimeType.includes('vp8')) return 'VP8';
    if (mimeType.includes('h264')) return 'H.264';
    return 'Unknown';
  }

  private static hasAudioTrack(blob: Blob): boolean {
    // This would need actual detection from blob
    return blob.type.includes('audio') || blob.type.includes('opus');
  }

  private static getBrowserVersion(): string {
    const ua = navigator.userAgent;
    const match = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private static getOSVersion(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows NT 10')) return '10';
    if (ua.includes('Windows NT 6.3')) return '8.1';
    if (ua.includes('Mac OS X')) {
      const match = ua.match(/Mac OS X (\d+[._]\d+)/);
      return match ? match[1].replace('_', '.') : 'Unknown';
    }
    return 'Unknown';
  }

  private static getScreenResolution(): string {
    return `${window.screen.width}x${window.screen.height}`;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }
}