// ============================================
// components/Recordings/AnnotationEditor.tsx
// UI for creating and editing annotations on video
// ============================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { Annotation, AnnotationType } from '@/lib/recording/annotation-system';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Pencil,
  Square,
  Circle,
  ArrowRight,
  Type,
  Highlighter,
  Trash2,
  Undo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnotationEditorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  currentTime: number;
}

export function AnnotationEditor({
  videoRef,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  currentTime,
}: AnnotationEditorProps) {
  const [selectedTool, setSelectedTool] = useState<AnnotationType | null>(null);
  const [color, setColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tools: Array<{ type: AnnotationType; icon: any; label: string }> = [
    { type: 'freehand', icon: Pencil, label: 'Draw' },
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { type: 'text', icon: Type, label: 'Text' },
    { type: 'highlight', icon: Highlighter, label: 'Highlight' },
  ];

  const colors = [
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#000000', // Black
    '#FFFFFF', // White
  ];

  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Match canvas size to video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
  }, [videoRef]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTool || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setIsDrawing(true);
    setCurrentAnnotation({
      type: selectedTool,
      timestamp: currentTime,
      color,
      strokeWidth,
      opacity: selectedTool === 'highlight' ? 0.3 : 1,
      startPoint: { x, y },
      points: selectedTool === 'freehand' ? [{ x, y }] : [],
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (currentAnnotation.type === 'freehand') {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...(currentAnnotation.points || []), { x, y }],
      });
    } else {
      setCurrentAnnotation({
        ...currentAnnotation,
        endPoint: { x, y },
      });
    }

    // Redraw canvas
    drawAnnotations();
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    setIsDrawing(false);

    // Add annotation
    onAddAnnotation(currentAnnotation as Annotation);
    setCurrentAnnotation(null);
  };

  const drawAnnotations = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all annotations at current time
    const visibleAnnotations = annotations.filter(
      a => Math.abs(a.timestamp - currentTime) < 0.5
    );

    visibleAnnotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.globalAlpha = annotation.opacity;

      switch (annotation.type) {
        case 'freehand':
          if (annotation.points && annotation.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach((p: { x: number; y: number; }) => ctx.lineTo(p.x, p.y));
            ctx.stroke();
          }
          break;

        case 'rectangle':
          if (annotation.startPoint && annotation.endPoint) {
            const width = annotation.endPoint.x - annotation.startPoint.x;
            const height = annotation.endPoint.y - annotation.startPoint.y;
            ctx.strokeRect(annotation.startPoint.x, annotation.startPoint.y, width, height);
          }
          break;

        case 'circle':
          if (annotation.startPoint && annotation.endPoint) {
            const radius = Math.sqrt(
              Math.pow(annotation.endPoint.x - annotation.startPoint.x, 2) +
              Math.pow(annotation.endPoint.y - annotation.startPoint.y, 2)
            );
            ctx.beginPath();
            ctx.arc(annotation.startPoint.x, annotation.startPoint.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;

        case 'arrow':
          if (annotation.startPoint && annotation.endPoint) {
            // Draw line
            ctx.beginPath();
            ctx.moveTo(annotation.startPoint.x, annotation.startPoint.y);
            ctx.lineTo(annotation.endPoint.x, annotation.endPoint.y);
            ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(
              annotation.endPoint.y - annotation.startPoint.y,
              annotation.endPoint.x - annotation.startPoint.x
            );
            const headlen = 15;
            ctx.beginPath();
            ctx.moveTo(annotation.endPoint.x, annotation.endPoint.y);
            ctx.lineTo(
              annotation.endPoint.x - headlen * Math.cos(angle - Math.PI / 6),
              annotation.endPoint.y - headlen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(annotation.endPoint.x, annotation.endPoint.y);
            ctx.lineTo(
              annotation.endPoint.x - headlen * Math.cos(angle + Math.PI / 6),
              annotation.endPoint.y - headlen * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;

        case 'text':
          if (annotation.startPoint && annotation.text) {
            ctx.font = `${annotation.fontSize}px ${annotation.fontFamily}`;
            ctx.fillStyle = annotation.color;
            ctx.fillText(annotation.text, annotation.startPoint.x, annotation.startPoint.y);
          }
          break;

        case 'highlight':
          if (annotation.startPoint && annotation.endPoint) {
            const width = annotation.endPoint.x - annotation.startPoint.x;
            const height = annotation.endPoint.y - annotation.startPoint.y;
            ctx.fillStyle = annotation.color;
            ctx.fillRect(annotation.startPoint.x, annotation.startPoint.y, width, height);
          }
          break;
      }
    });

    // Draw current annotation being drawn
    if (currentAnnotation && currentAnnotation.startPoint) {
      ctx.strokeStyle = currentAnnotation.color || color;
      ctx.lineWidth = currentAnnotation.strokeWidth || strokeWidth;
      ctx.globalAlpha = currentAnnotation.opacity || 1;

      // Similar drawing logic for current annotation
    }

    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    drawAnnotations();
  }, [annotations, currentTime, currentAnnotation]);

  return (
    <div className="space-y-4">
      {/* Tools */}
      <div className="flex flex-wrap gap-2">
        {tools.map(tool => (
          <Button
            key={tool.type}
            size="sm"
            variant={selectedTool === tool.type ? 'ghost' : 'outline'}
            onClick={() => setSelectedTool(tool.type)}
          >
            <tool.icon className="h-4 w-4 mr-1" />
            {tool.label}
          </Button>
        ))}
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <Label className="text-xs">Color</Label>
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button
              key={c}
              className={cn(
                "w-8 h-8 rounded border-2",
                color === c ? 'border-foreground' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <Label className="text-xs">Stroke Width: {strokeWidth}px</Label>
        <Slider
          value={[strokeWidth]}
          onValueChange={([value]) => setStrokeWidth(value)}
          min={1}
          max={10}
          step={1}
        />
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ pointerEvents: selectedTool ? 'auto' : 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Clear/Undo */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (annotations.length > 0) {
              onDeleteAnnotation(annotations[annotations.length - 1].id);
            }
          }}
        >
          <Undo className="h-4 w-4 mr-1" />
          Undo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            annotations.forEach(a => onDeleteAnnotation(a.id));
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>
    </div>
  );
}