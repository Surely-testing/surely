// ============================================
// types/document.types.ts
// ============================================

import { Tables } from "./database.types";

export type Document = Tables<'documents'>;

export type DocumentWithCreator = Document & {
  creator?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export interface DocumentFormData {
  title: string;
  content?: string;
  file_url?: string;
  file_type?: string;
  sprint_id?: string | null;
}

export interface DocumentFilters {
  sprint_id?: string | null;
  file_type?: string;
  created_by?: string;
  search?: string;
}

export type DocumentSortBy = 'created_at' | 'updated_at' | 'title';
export type DocumentSortOrder = 'asc' | 'desc';

export interface DocumentSort {
  by: DocumentSortBy;
  order: DocumentSortOrder;
}