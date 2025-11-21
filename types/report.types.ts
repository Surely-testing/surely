// ============================================
// types/report.types.ts
// ============================================

import { Tables } from "./database.types";

export type Report = Tables<'reports'>;

export type ReportType = 
  | 'test_coverage'
  | 'bug_trends'
  | 'sprint_summary'
  | 'team_performance'
  | 'custom';

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  metrics: Record<string, number>;
  charts?: {
    type: 'line' | 'bar' | 'pie' | 'area';
    data: any[];
  }[];
  summary?: string;
}

export interface ReportFormData {
  name: string;
  type: ReportType;
  filters?: {
    date_range?: { start: string; end: string };
    sprint_id?: string;
    user_id?: string;
  };
}

export type ReportSchedule = Tables<'report_schedules'>;

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export interface ReportScheduleFormData {
  type: ReportType;
  frequency: ReportFrequency;
}