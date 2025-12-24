// ============================================
// lib/recording/screenshot-capture.ts
// Automatic screenshot capture from video stream
// ============================================

import { logger } from '@/lib/utils/logger';

export interface Screenshot {
  id: string;
  timestamp: number;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}

export interface ScreenshotCaptureConfig {
  interval?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxScreenshots?: number;
  width?: number;
  height?: number;
}

export class ScreenshotCapture {
  private screenshotsArray: Screenshot[] = [];
  private isCapturing = false;
  private intervalId: number | null = null;
  private videoStream: MediaStream | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<ScreenshotCaptureConfig>;
  private screenshotCounter = 0;

  constructor(config: ScreenshotCaptureConfig = {}) {
    this.config = {
      interval: config.interval ?? 10000,
      quality: config.quality ?? 0.8,
      format: config.format ?? 'jpeg',
      maxScreenshots: config.maxScreenshots ?? 30,
      width: config.width ?? 0,
      height: config.height ?? 0,
    };

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async start(stream: MediaStream): Promise<void> {
    if (this.isCapturing) {
      logger.log('Screenshot capture already active');
      return;
    }

    this.videoStream = stream;
    this.isCapturing = true;
    this.screenshotsArray = [];
    this.screenshotCounter = 0;

    this.intervalId = window.setInterval(() => {
      this.captureScreenshot();
    }, this.config.interval);

    await this.captureScreenshot();

    logger.log('✓ Screenshot capture started', {
      interval: `${this.config.interval}ms`,
      format: this.config.format,
      quality: this.config.quality,
    });
  }

  private async captureScreenshot(): Promise<Screenshot | null> {
    if (!this.videoStream || !this.isCapturing) {
      return null;
    }

    try {
      const videoTrack = this.videoStream.getVideoTracks()[0];
      if (!videoTrack) {
        logger.log('No video track available for screenshot');
        return null;
      }

      const settings = videoTrack.getSettings();
      const videoWidth = settings.width || 1920;
      const videoHeight = settings.height || 1080;

      let canvasWidth = this.config.width || videoWidth;
      let canvasHeight = this.config.height || videoHeight;

      if (this.config.width && !this.config.height) {
        canvasHeight = (videoHeight / videoWidth) * canvasWidth;
      } else if (this.config.height && !this.config.width) {
        canvasWidth = (videoWidth / videoHeight) * canvasHeight;
      }

      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;

      const video = document.createElement('video');
      video.srcObject = this.videoStream;
      video.muted = true;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      this.ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

      const mimeType = this.getMimeType();
      const dataUrl = this.canvas.toDataURL(mimeType, this.config.quality);

      const size = Math.round((dataUrl.length * 3) / 4);

      const screenshot: Screenshot = {
        id: `screenshot-${this.screenshotCounter++}`,
        timestamp: Date.now(),
        dataUrl,
        width: canvasWidth,
        height: canvasHeight,
        size,
      };

      this.screenshotsArray.push(screenshot);

      if (this.screenshotsArray.length > this.config.maxScreenshots) {
        this.screenshotsArray.shift();
      }

      video.srcObject = null;
      video.remove();

      return screenshot;
    } catch (error) {
      logger.log('Error capturing screenshot:', error);
      return null;
    }
  }

  async captureNow(): Promise<Screenshot | null> {
    return this.captureScreenshot();
  }

  stop(): Screenshot[] {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isCapturing = false;
    this.videoStream = null;

    const captured = [...this.screenshotsArray];
    this.screenshotsArray = [];

    logger.log('✓ Screenshot capture stopped', {
      totalCaptured: captured.length,
      totalSize: `${(captured.reduce((sum, s) => sum + s.size, 0) / 1024 / 1024).toFixed(2)} MB`,
    });

    return captured;
  }

  getScreenshots(): Screenshot[] {
    return [...this.screenshotsArray];
  }

  getCount(): number {
    return this.screenshotsArray.length;
  }

  getLatestScreenshot(): Screenshot | null {
    return this.screenshotsArray[this.screenshotsArray.length - 1] || null;
  }

  getTotalSize(): number {
    return this.screenshotsArray.reduce((sum, s) => sum + s.size, 0);
  }

  clear(): void {
    this.screenshotsArray = [];
    this.screenshotCounter = 0;
  }

  updateConfig(config: Partial<ScreenshotCaptureConfig>): void {
    Object.assign(this.config, config);

    if (config.interval && this.isCapturing && this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = window.setInterval(() => {
        this.captureScreenshot();
      }, this.config.interval);
    }
  }

  private getMimeType(): string {
    switch (this.config.format) {
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'jpeg':
      default:
        return 'image/jpeg';
    }
  }

  exportScreenshots(): string {
    return JSON.stringify(
      this.screenshotsArray.map(s => ({
        id: s.id,
        timestamp: s.timestamp,
        width: s.width,
        height: s.height,
        size: s.size,
      })),
      null,
      2
    );
  }

  exportScreenshotsWithData(): string {
    return JSON.stringify(this.screenshotsArray, null, 2);
  }

  async downloadScreenshot(screenshot: Screenshot, filename?: string): Promise<void> {
    const link = document.createElement('a');
    link.href = screenshot.dataUrl;
    link.download = filename || `screenshot-${screenshot.id}.${this.config.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async downloadAllScreenshots(): Promise<void> {
    for (const screenshot of this.screenshotsArray) {
      await this.downloadScreenshot(screenshot);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}