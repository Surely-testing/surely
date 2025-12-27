// ============================================
// lib/utils/recording-exporter.ts
// Export recordings in multiple formats
// ============================================
import { logger } from '@/lib/utils/logger';

export type ExportFormat = 'webm' | 'mp4' | 'gif' | 'frames';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // 0-1 for compression
  fps?: number; // For GIF
  width?: number; // For resizing
  height?: number; // For resizing
  startTime?: number; // Trim start (seconds)
  endTime?: number; // Trim end (seconds)
}

export class RecordingExporter {
  async export(videoBlob: Blob, options: ExportOptions): Promise<Blob | Blob[]> {
    switch (options.format) {
      case 'webm':
        return this.exportWebM(videoBlob, options);
      case 'mp4':
        return this.exportMP4(videoBlob, options);
      case 'gif':
        return this.exportGIF(videoBlob, options);
      case 'frames':
        return this.exportFrames(videoBlob, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async exportWebM(videoBlob: Blob, options: ExportOptions): Promise<Blob> {
    // WebM is the native format, so we can return as-is or trim
    if (options.startTime !== undefined || options.endTime !== undefined) {
      return this.trimVideo(videoBlob, options.startTime || 0, options.endTime);
    }

    return videoBlob;
  }

  private async exportMP4(videoBlob: Blob, options: ExportOptions): Promise<Blob> {
    // MP4 conversion requires server-side processing or a library like FFmpeg.wasm
    // This is a placeholder that would need proper implementation
    
    logger.log('MP4 export requires server-side processing or FFmpeg.wasm');
    
    // For now, return WebM with a note
    throw new Error('MP4 export not yet implemented. Use server-side conversion or FFmpeg.wasm');
  }

  private async exportGIF(videoBlob: Blob, options: ExportOptions): Promise<Blob> {
    const fps = options.fps || 10;
    const quality = options.quality || 0.8;

    // Create video element
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(() => resolve()).catch(reject);
      };
      video.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    const targetWidth = options.width || video.videoWidth;
    const targetHeight = options.height || video.videoHeight;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Extract frames
    const frames: ImageData[] = [];
    const startTime = options.startTime || 0;
    const endTime = options.endTime || video.duration;
    const frameDuration = 1 / fps;

    video.currentTime = startTime;

    for (let time = startTime; time < endTime; time += frameDuration) {
      video.currentTime = time;
      await new Promise(resolve => {
        video.onseeked = resolve;
      });

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      frames.push(imageData);
    }

    URL.revokeObjectURL(video.src);

    // Convert frames to GIF using a library
    // This would require a GIF encoding library like gif.js
    logger.log(`Extracted ${frames.length} frames for GIF`);
    
    throw new Error('GIF encoding requires gif.js or similar library');
  }

  private async exportFrames(videoBlob: Blob, options: ExportOptions): Promise<Blob[]> {
    const fps = options.fps || 1; // Default: 1 frame per second

    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(() => resolve()).catch(reject);
      };
      video.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    const targetWidth = options.width || video.videoWidth;
    const targetHeight = options.height || video.videoHeight;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const frames: Blob[] = [];
    const startTime = options.startTime || 0;
    const endTime = options.endTime || video.duration;
    const frameDuration = 1 / fps;

    video.currentTime = startTime;

    for (let time = startTime; time < endTime; time += frameDuration) {
      video.currentTime = time;
      await new Promise(resolve => {
        video.onseeked = resolve;
      });

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/png',
          options.quality || 0.9
        );
      });

      frames.push(blob);
    }

    URL.revokeObjectURL(video.src);

    logger.log(`✓ Exported ${frames.length} frames`);
    return frames;
  }

  private async trimVideo(
    videoBlob: Blob,
    startTime: number,
    endTime?: number
  ): Promise<Blob> {
    // This requires re-encoding the video
    // Would need proper implementation with MediaRecorder or FFmpeg.wasm
    
    logger.log('Video trimming during export requires re-encoding');
    throw new Error('Video trim export not yet implemented');
  }

  async downloadBlob(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.log('✓ Download initiated:', filename);
  }

  async downloadMultiple(blobs: Blob[], filenamePrefix: string): Promise<void> {
    for (let i = 0; i < blobs.length; i++) {
      const filename = `${filenamePrefix}_frame_${String(i + 1).padStart(4, '0')}.png`;
      await this.downloadBlob(blobs[i], filename);
      
      // Small delay to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.log(`✓ Downloaded ${blobs.length} files`);
  }

  getEstimatedSize(videoBlob: Blob, targetFormat: ExportFormat): number {
    const originalSize = videoBlob.size;

    // Rough estimates
    switch (targetFormat) {
      case 'webm':
        return originalSize;
      case 'mp4':
        return originalSize * 0.8; // MP4 usually smaller
      case 'gif':
        return originalSize * 2; // GIF usually larger
      case 'frames':
        return originalSize * 3; // Multiple PNGs
      default:
        return originalSize;
    }
  }
}