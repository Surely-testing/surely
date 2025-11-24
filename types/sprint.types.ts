import { Tables } from "./database.types";

export type Sprint = Tables<'sprints'> & {
  goals?: string | null;
};

export type SprintWithStats = Sprint & {
  creator?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  stats?: {
    test_cases_count: number;
    bugs_count: number;
    documents_count: number;
    recordings_count: number;
  };
};

export type SprintStatus = 'planning' | 'active' | 'completed' | 'archived';

export interface SprintFormData {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: SprintStatus;
  goals?: string;
}

export interface SprintFilters {
  status?: SprintStatus[];
  search?: string;
}

export type SprintSortBy = 'created_at' | 'start_date' | 'end_date' | 'name';
export type SprintSortOrder = 'asc' | 'desc';

export interface SprintSort {
  by: SprintSortBy;
  order: SprintSortOrder;
}