// ============================================
// types/bug.types.ts
// EXACT match to your database schema
// ============================================

import { Tables } from "./database.types";

// Base Bug type from database
export type Bug = Tables<'bugs'>;

// Extended Bug with creator and assignee profiles
export type BugWithCreator = {
  id: string;
  suite_id: string;
  sprint_id: string | null;
  title: string;
  description: string | null;
  severity: BugSeverity;
  priority: BugPriority | null;
  status: BugStatus;
  
  // Reproduction and testing
  steps_to_reproduce: any | null; // jsonb field
  expected_behavior: string | null;
  actual_behavior: string | null;
  
  // Environment and technical details
  environment: string | null;
  browser: string | null;
  os: string | null;
  version: string | null;
  
  // Assignment and organization
  assigned_to: string | null;
  module: string | null;
  component: string | null;
  
  // Linked assets
  linked_recording_id: string | null;
  linked_test_case_id: string | null;
  
  // Tags and metadata
  tags: string[] | null;
  labels: any | null; // jsonb field
  
  // Timestamps
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  
  // Extended fields
  creator?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
};

// Bug type from bugs_with_details view
export type BugWithDetails = {
  id: string;
  suite_id: string;
  sprint_id: string | null;
  title: string;
  description: string | null;
  severity: BugSeverity;
  priority: BugPriority | null;
  status: BugStatus;
  
  // Reproduction and testing
  steps_to_reproduce: any | null;
  expected_behavior: string | null;
  actual_behavior: string | null;
  
  // Environment and technical details
  environment: string | null;
  browser: string | null;
  os: string | null;
  version: string | null;
  
  // Assignment and organization
  assigned_to: string | null;
  module: string | null;
  component: string | null;
  
  // Linked assets
  linked_recording_id: string | null;
  linked_test_case_id: string | null;
  
  // Tags and metadata
  tags: string[] | null;
  labels: any | null;
  
  // Timestamps
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  
  // Extended fields from view
  creator_email: string | null;
  creator_name: string | null;
  assignee_email: string | null;
  assignee_name: string | null;
  attachments: BugAttachment[] | null;
  attachment_count: number | null;
};

export type BugAttachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
};

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugPriority = 'low' | 'medium' | 'high' | 'critical';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';

export interface BugReproductionStep {
  id: string;
  order: number;
  description: string;
}

export interface BugFormData {
  title: string;
  description?: string;
  severity?: BugSeverity;
  priority?: BugPriority;
  status?: BugStatus;
  steps_to_reproduce?: BugReproductionStep[];
  expected_behavior?: string;
  actual_behavior?: string;
  environment?: string;
  browser?: string;
  os?: string;
  version?: string;
  assigned_to?: string | null;
  sprint_id?: string | null;
  module?: string;
  component?: string;
  linked_recording_id?: string | null;
  linked_test_case_id?: string | null;
  tags?: string[];
  labels?: Record<string, any>;
}

export interface BugFilters {
  status?: BugStatus[];
  severity?: BugSeverity[];
  priority?: BugPriority[];
  sprint_id?: string | null;
  created_by?: string;
  assigned_to?: string;
  module?: string;
  component?: string;
  tags?: string[];
  search?: string;
}

export type BugSortBy = 'created_at' | 'updated_at' | 'resolved_at' | 'title' | 'severity' | 'priority' | 'status';
export type BugSortOrder = 'asc' | 'desc';

export interface BugSort {
  by: BugSortBy;
  order: BugSortOrder;
}

export interface BugStats {
  total: number;
  by_severity: Record<BugSeverity, number>;
  by_priority: Record<BugPriority, number>;
  by_status: Record<BugStatus, number>;
  by_sprint: Record<string, number>;
  by_module: Record<string, number>;
  by_assignee: Record<string, number>;
  resolution_rate: number;
  avg_resolution_time_hours: number | null;
}

// For creating bug attachments
export interface BugAttachmentUpload {
  bug_id: string;
  file: File;
}

export interface BugAttachmentInsert {
  bug_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
}