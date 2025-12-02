// ============================================
// lib/hooks/useDocuments.ts
// ============================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../supabase/client";

interface DocumentFilters {
  sprint_id?: string | null;
  file_type?: string;
  created_by?: string;
  search?: string;
}

interface DocumentFormData {
  title: string;
  content?: string;
  file_url?: string;
  file_type?: string;
  sprint_id?: string | null;
}

export function useDocuments(suiteId: string, filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', suiteId, filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('documents')
        .select('*, creator:created_by(id, name, avatar_url)')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (filters?.sprint_id) query = query.eq('sprint_id', filters.sprint_id);
      if (filters?.file_type) query = query.eq('file_type', filters.file_type);
      if (filters?.created_by) query = query.eq('created_by', filters.created_by);
      if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!suiteId,
  });
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('documents')
        .select('*, creator:created_by(id, name, avatar_url)')
        .eq('id', documentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!documentId,
  });
}

export function useCreateDocument(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DocumentFormData) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          suite_id: suiteId,
          created_by: user.id,
          title: data.title,
          content: data.content,
          file_url: data.file_url,
          file_type: data.file_type,
          sprint_id: data.sprint_id,
        })
        .select()
        .single();
      if (error) throw error;
      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', suiteId] });
    },
  });
}

export function useUpdateDocument(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DocumentFormData> }) => {
      const supabase = createClient();
      const { data: document, error } = await supabase
        .from('documents')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return document;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
    },
  });
}

export function useDeleteDocument(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('documents').delete().eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', suiteId] });
    },
  });
}

function useQuery(arg0: { queryKey: (string | DocumentFilters | undefined)[]; queryFn: () => Promise<any>; enabled: boolean; }) {
    throw new Error("Function not implemented.");
}
