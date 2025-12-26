// ============================================
// lib/recording/annotation-system.ts - COMPLETE FINAL VERSION
// REPLACE YOUR ENTIRE FILE WITH THIS
// ============================================

export type AnnotationType = 
  | 'freehand' 
  | 'blur'
  | 'highlight';

export interface Point {
  x: number
  y: number
}

export interface Annotation {
  id: string
  type: AnnotationType
  timestamp: number // Video time in seconds
  color: string
  strokeWidth: number
  opacity: number
  
  // For shapes
  startPoint?: Point
  endPoint?: Point
  
  // For freehand
  points?: Point[]
  
  // For text
  text?: string
  fontSize?: number
  fontFamily?: string
  
  // Metadata
  createdAt: string
  createdBy?: string
  duration?: number // How long annotation stays visible
}

export interface AnnotationTrack {
  videoId: string
  annotations: Annotation[]
  metadata: {
    videoWidth: number
    videoHeight: number
    videoDuration: number
    createdAt: string
    updatedAt: string
  }
}

export class AnnotationSystem {
  private annotations: Map<string, Annotation> = new Map()
  private tracks: Map<string, AnnotationTrack> = new Map()

  /**
   * Create a new annotation
   */
  createAnnotation(data: Omit<Annotation, 'id' | 'createdAt'>): Annotation {
    const annotation: Annotation = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      duration: data.duration || 2, // Default 2 seconds visibility
    }

    this.annotations.set(annotation.id, annotation)
    return annotation
  }

  /**
   * Update an existing annotation
   */
  updateAnnotation(id: string, updates: Partial<Annotation>): Annotation | null {
    const annotation = this.annotations.get(id)
    if (!annotation) return null

    const updated = { ...annotation, ...updates }
    this.annotations.set(id, updated)
    return updated
  }

  /**
   * Delete an annotation
   */
  deleteAnnotation(id: string): boolean {
    return this.annotations.delete(id)
  }

  /**
   * Get annotation by ID
   */
  getAnnotation(id: string): Annotation | undefined {
    return this.annotations.get(id)
  }

  /**
   * Get all annotations
   */
  getAllAnnotations(): Annotation[] {
    return Array.from(this.annotations.values())
  }

  /**
   * Get annotations visible at a specific timestamp
   */
  getAnnotationsAtTime(timestamp: number, tolerance: number = 0.5): Annotation[] {
    return this.getAllAnnotations().filter(annotation => {
      const startTime = annotation.timestamp
      const endTime = startTime + (annotation.duration || 2)
      return timestamp >= startTime - tolerance && timestamp <= endTime + tolerance
    })
  }

  /**
   * Get annotations within a time range
   */
  getAnnotationsInRange(startTime: number, endTime: number): Annotation[] {
    return this.getAllAnnotations().filter(annotation => {
      const annotationStart = annotation.timestamp
      const annotationEnd = annotationStart + (annotation.duration || 2)
      
      // Check if annotation overlaps with the range
      return (
        (annotationStart >= startTime && annotationStart <= endTime) ||
        (annotationEnd >= startTime && annotationEnd <= endTime) ||
        (annotationStart <= startTime && annotationEnd >= endTime)
      )
    })
  }

  /**
   * Create or update an annotation track for a video
   */
  createTrack(
    videoId: string,
    metadata: AnnotationTrack['metadata']
  ): AnnotationTrack {
    const track: AnnotationTrack = {
      videoId,
      annotations: [],
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    this.tracks.set(videoId, track)
    return track
  }

  /**
   * Add annotation to a track
   */
  addAnnotationToTrack(videoId: string, annotation: Annotation): boolean {
    const track = this.tracks.get(videoId)
    if (!track) return false

    track.annotations.push(annotation)
    track.metadata.updatedAt = new Date().toISOString()
    this.annotations.set(annotation.id, annotation)
    return true
  }

  /**
   * Remove annotation from a track
   */
  removeAnnotationFromTrack(videoId: string, annotationId: string): boolean {
    const track = this.tracks.get(videoId)
    if (!track) return false

    const index = track.annotations.findIndex(a => a.id === annotationId)
    if (index === -1) return false

    track.annotations.splice(index, 1)
    track.metadata.updatedAt = new Date().toISOString()
    this.annotations.delete(annotationId)
    return true
  }

  /**
   * Get track for a video
   */
  getTrack(videoId: string): AnnotationTrack | undefined {
    return this.tracks.get(videoId)
  }

  /**
   * Export annotations to JSON
   */
  exportAnnotations(videoId?: string): string {
    if (videoId) {
      const track = this.tracks.get(videoId)
      return JSON.stringify(track, null, 2)
    }

    return JSON.stringify({
      annotations: this.getAllAnnotations(),
      tracks: Array.from(this.tracks.values()),
    }, null, 2)
  }

  /**
   * Import annotations from JSON
   */
  importAnnotations(json: string): boolean {
    try {
      const data = JSON.parse(json)

      // Import individual annotations
      if (data.annotations) {
        data.annotations.forEach((annotation: Annotation) => {
          this.annotations.set(annotation.id, annotation)
        })
      }

      // Import tracks
      if (data.tracks) {
        data.tracks.forEach((track: AnnotationTrack) => {
          this.tracks.set(track.videoId, track)
          track.annotations.forEach((annotation: Annotation) => {
            this.annotations.set(annotation.id, annotation)
          })
        })
      }

      // Import single track
      if (data.videoId && data.annotations) {
        this.tracks.set(data.videoId, data as AnnotationTrack)
        data.annotations.forEach((annotation: Annotation) => {
          this.annotations.set(annotation.id, annotation)
        })
      }

      return true
    } catch (error) {
      console.error('Failed to import annotations:', error)
      return false
    }
  }

  /**
   * Clear all annotations
   */
  clearAll(): void {
    this.annotations.clear()
    this.tracks.clear()
  }

  /**
   * Clear annotations for a specific video
   */
  clearTrack(videoId: string): boolean {
    const track = this.tracks.get(videoId)
    if (!track) return false

    // Remove all annotations from this track
    track.annotations.forEach(annotation => {
      this.annotations.delete(annotation.id)
    })

    return this.tracks.delete(videoId)
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Calculate bounds for an annotation
   */
  static getAnnotationBounds(annotation: Annotation): {
    minX: number
    minY: number
    maxX: number
    maxY: number
  } | null {
    if (annotation.type === 'freehand' && annotation.points) {
      const xs = annotation.points.map(p => p.x)
      const ys = annotation.points.map(p => p.y)
      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
      }
    }

    if (annotation.startPoint && annotation.endPoint) {
      return {
        minX: Math.min(annotation.startPoint.x, annotation.endPoint.x),
        minY: Math.min(annotation.startPoint.y, annotation.endPoint.y),
        maxX: Math.max(annotation.startPoint.x, annotation.endPoint.x),
        maxY: Math.max(annotation.startPoint.y, annotation.endPoint.y),
      }
    }

    if (annotation.startPoint) {
      return {
        minX: annotation.startPoint.x,
        minY: annotation.startPoint.y,
        maxX: annotation.startPoint.x,
        maxY: annotation.startPoint.y,
      }
    }

    return null
  }

  /**
   * Check if a point is within an annotation
   */
  static isPointInAnnotation(
    point: Point,
    annotation: Annotation,
    tolerance: number = 5
  ): boolean {
    const bounds = this.getAnnotationBounds(annotation)
    if (!bounds) return false

    return (
      point.x >= bounds.minX - tolerance &&
      point.x <= bounds.maxX + tolerance &&
      point.y >= bounds.minY - tolerance &&
      point.y <= bounds.maxY + tolerance
    )
  }

  /**
   * Scale annotations when video size changes
   */
  static scaleAnnotations(
    annotations: Annotation[],
    originalWidth: number,
    originalHeight: number,
    newWidth: number,
    newHeight: number
  ): Annotation[] {
    const scaleX = newWidth / originalWidth
    const scaleY = newHeight / originalHeight

    return annotations.map(annotation => {
      const scaled = { ...annotation }

      if (scaled.startPoint) {
        scaled.startPoint = {
          x: scaled.startPoint.x * scaleX,
          y: scaled.startPoint.y * scaleY,
        }
      }

      if (scaled.endPoint) {
        scaled.endPoint = {
          x: scaled.endPoint.x * scaleX,
          y: scaled.endPoint.y * scaleY,
        }
      }

      if (scaled.points) {
        scaled.points = scaled.points.map(p => ({
          x: p.x * scaleX,
          y: p.y * scaleY,
        }))
      }

      if (scaled.fontSize) {
        scaled.fontSize = Math.round(scaled.fontSize * Math.min(scaleX, scaleY))
      }

      return scaled
    })
  }

  /**
   * Get statistics about annotations
   */
  getStatistics(videoId?: string): {
    total: number
    byType: Record<AnnotationType, number>
    totalDuration: number
    averageDuration: number
  } {
    const annotations = videoId
      ? this.tracks.get(videoId)?.annotations || []
      : this.getAllAnnotations()

    const byType: Record<AnnotationType, number> = {
      freehand: 0,
      blur: 0,
      highlight: 0,
    }

    let totalDuration = 0

    annotations.forEach(annotation => {
      byType[annotation.type]++
      totalDuration += annotation.duration || 2
    })

    return {
      total: annotations.length,
      byType,
      totalDuration,
      averageDuration: annotations.length > 0 ? totalDuration / annotations.length : 0,
    }
  }
}

/**
 * Singleton instance
 */
export const annotationSystem = new AnnotationSystem()

/**
 * Helper functions
 */
export const createAnnotation = (data: Omit<Annotation, 'id' | 'createdAt'>) =>
  annotationSystem.createAnnotation(data)

export const updateAnnotation = (id: string, updates: Partial<Annotation>) =>
  annotationSystem.updateAnnotation(id, updates)

export const deleteAnnotation = (id: string) =>
  annotationSystem.deleteAnnotation(id)

export const getAnnotationsAtTime = (timestamp: number, tolerance?: number) =>
  annotationSystem.getAnnotationsAtTime(timestamp, tolerance)

export const getAnnotationsInRange = (startTime: number, endTime: number) =>
  annotationSystem.getAnnotationsInRange(startTime, endTime)