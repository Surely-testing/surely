// ============================================
// types/report.types.ts
// ============================================

import { Tables } from "./database.types";

export type Report = Tables<'reports'>;
export type ReportSchedule = Tables<'report_schedules'>;

export type ReportType = 
  | 'test_coverage'
  | 'bug_trends'
  | 'sprint_summary'
  | 'team_performance'
  | 'custom';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface ReportMetrics {
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  coveragePercentage?: number;
  totalBugs?: number;
  openBugs?: number;
  resolvedBugs?: number;
  criticalBugs?: number;
  averageResolutionTime?: number;
  sprintVelocity?: number;
  completedStories?: number;
  teamMembers?: number;
  activeMembers?: number;
  [key: string]: any;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'donut';
  title: string;
  data: any[];
  xKey?: string;
  yKey?: string;
  labels?: string[];
}

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  metrics: ReportMetrics;
  charts?: ChartData[];
  summary?: string;
  insights?: string[];
  recommendations?: string[];
}

export interface ReportFormData {
  name: string;
  type: ReportType;
  filters?: {
    date_range?: { start: string; end: string };
    sprint_id?: string;
    user_id?: string;
    suite_id?: string;
    severity?: string[];
    status?: string[];
  };
}

export interface ReportScheduleFormData {
  suite_id: any;
  report_id?: string;
  type: ReportType;
  frequency: ReportFrequency;
  emails: string[];
  is_active: boolean;
  filters?: ReportFormData['filters'];
  name: string;
}

export interface ReportWithCreator extends Report {
  [x: string]: any;
  creator?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  schedule?: ReportSchedule;
}

export interface ReportScheduleWithReport extends ReportSchedule {
  [x: string]: any;
  report?: Report;
}