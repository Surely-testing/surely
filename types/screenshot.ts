export interface Screenshot {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_path: string;
  file_size: number;
  suite_id: string;
  created_by: string;
  metadata: {
    url?: string;
    userAgent?: string;
    capturedAt?: string;
    annotations?: Array<{
      type: 'pen' | 'highlight' | 'text';
      color?: string;
      points?: number[][];
      text?: string;
      x?: number;
      y?: number;
    }>;
    width?: number | null;
    height?: number | null;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateScreenshotDTO {
  title: string;
  description?: string;
  suite_id: string;
  metadata: {
    url?: string;
    userAgent?: string;
    capturedAt?: string;
    annotations?: any[];
  };
}