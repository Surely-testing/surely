/**
 * ReplayController - Single source of truth for timeline
 */
export class ReplayController {
  currentTime = 0;
  duration = 0;
  isPlaying = false;
  
  private listeners = new Set<(time: number) => void>();
  private rafId: number | null = null;

  constructor(duration: number) {
    this.duration = duration;
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.tick();
  }

  pause() {
    this.isPlaying = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  seek(timeMs: number) {
    this.currentTime = Math.max(0, Math.min(timeMs, this.duration));
    this.emit();
  }

  restart() {
    this.pause();
    this.seek(0);
  }

  private tick = () => {
    if (!this.isPlaying) return;
    
    this.currentTime += 16; // ~60fps
    
    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration;
      this.pause();
    }
    
    this.emit();
    
    if (this.isPlaying) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  private emit() {
    this.listeners.forEach(fn => fn(this.currentTime));
  }

  subscribe(fn: (time: number) => void) {
    this.listeners.add(fn);
    fn(this.currentTime);
    return () => {
      this.listeners.delete(fn);
    };
  }

  destroy() {
    this.pause();
    this.listeners.clear();
  }
}