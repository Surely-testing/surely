// ============================================
// components/Recordings/AnnotationPlaybackOverlay.tsx
// Display annotations synced with video playback - SIMPLIFIED
// ============================================

'use client';

import { useEffect, useRef, useState } from 'react';
import type { Annotation } from '@/lib/recording/annotation-system';

interface AnnotationPlaybackOverlayProps {
  annotations: Annotation[];
  currentTime: number;
  isPlaying?: boolean;
}

export function AnnotationPlaybackOverlay({
  annotations,
  currentTime,
  isPlaying = true,
}: AnnotationPlaybackOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleAnnotations, setVisibleAnnotations] = useState<Annotation[]>([]);

  // Setup canvas dimensions to match video
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const updateCanvasSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Redraw after resize
      drawAnnotations();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Update visible annotations based on current time
  useEffect(() => {
    const visible = annotations.filter(annotation => {
      const startTime = annotation.timestamp;
      const endTime = startTime + (annotation.duration || 2);
      return currentTime >= startTime && currentTime <= endTime;
    });

    setVisibleAnnotations(visible);
  }, [currentTime, annotations]);

  // Draw annotations whenever they change
  useEffect(() => {
    drawAnnotations();
  }, [visibleAnnotations]);

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each visible annotation
    visibleAnnotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = annotation.opacity;

      switch (annotation.type) {
        case 'freehand':
          if (annotation.points && annotation.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
          }
          break;

        case 'blur':
          if (annotation.startPoint && annotation.endPoint) {
            const width = annotation.endPoint.x - annotation.startPoint.x;
            const height = annotation.endPoint.y - annotation.startPoint.y;
            
            // Draw black blur box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(annotation.startPoint.x, annotation.startPoint.y, width, height);
            
            // Draw "BLURRED" text
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('BLURRED', annotation.startPoint.x + width / 2, annotation.startPoint.y + height / 2);
          }
          break;

        case 'highlight':
          if (annotation.startPoint && annotation.endPoint) {
            const width = annotation.endPoint.x - annotation.startPoint.x;
            const height = annotation.endPoint.y - annotation.startPoint.y;
            ctx.fillStyle = annotation.color;
            ctx.fillRect(
              annotation.startPoint.x,
              annotation.startPoint.y,
              width,
              height
            );
          }
          break;
      }
    });

    ctx.globalAlpha = 1;
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}