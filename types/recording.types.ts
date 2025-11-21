// ============================================
// types/recording.types.ts
// ============================================

import { Tables } from "./database.types";

export type Recording = Tables<'recordings'>;

export interface RecordingFormData {
  title: string;
  url: string;
  duration?: number;
  metadata?: Record<string, any>;
  sprint_id?: string | null;
}

