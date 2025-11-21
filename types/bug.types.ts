// ============================================
// types/bug.types.ts
// ============================================

import { Tables } from "./database.types";

export type Bug = Tables<'bugs'>;

export type BugWithCreator = Bug & {
  creator?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface BugReproductionStep {
  id: string;
  order: number;
  description: string;
}

export interface BugFormData {
  title: string;
  description?: string;
  severity?: BugSeverity;
  status?: BugStatus;
  steps_to_reproduce?: BugReproductionStep[];
  sprint_id?: string | null;
}

export interface BugFilters {
  status?: BugStatus[];
  severity?: BugSeverity[];
  sprint_id?: string | null;
  created_by?: string;
  search?: string;
}

export type BugSortBy = 'created_at' | 'updated_at' | 'title' | 'severity' | 'status';
export type BugSortOrder = 'asc' | 'desc';

export interface BugSort {
  by: BugSortBy;
  order: BugSortOrder;
}

export interface BugStats {
  total: number;
  by_severity: Record<BugSeverity, number>;
  by_status: Record<BugStatus, number>;
  by_sprint: Record<string, number>;
  resolution_rate: number;
}