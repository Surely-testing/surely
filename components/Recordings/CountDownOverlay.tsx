// ============================================
// FILE: components/recordings/CountdownOverlay.tsx
// ============================================

'use client';

import { useRecording } from '@/providers/RecordingContext';

export function CountdownOverlay() {
  const { countdown } = useRecording();

  if (countdown === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-none">
      <div className="text-white text-9xl font-bold animate-bounce">
        {countdown}
      </div>
    </div>
  );
}