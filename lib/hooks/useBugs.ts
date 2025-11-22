// ============================================
// lib/hooks/useBugs.ts
// ============================================

import { createClient } from "../supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface BugFilters {
  status?: string[];
  severity?: string[];
  sprint_id?: string | null;
  created_by?: string;
  search?: string;
}

interface BugFormData {
  title: string;
  description?: string;
  severity?: string;
  status?: string;
  steps_to_reproduce?: any[];
  sprint_id?: string | null;
}

// Helper function to transform null to undefined
function transformBug(bug: any) {
  return {
    ...bug,
    description: bug.description ?? undefined,
    sprint_id: bug.sprint_id ?? undefined,
    steps_to_reproduce: bug.steps_to_reproduce ?? undefined,
    // Add any other fields that might be null but should be undefined
  };
}

export function useBugs(suiteId: string, filters?: BugFilters) {
  return useQuery({
    queryKey: ['bugs', suiteId, filters],
    queryFn: async () => {
      const supabase = await createClient();
      let query = supabase
        .from('bugs')
        .select('*, creator:created_by(id, name, avatar_url)')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (filters?.status?.length) query = query.in('status', filters.status);
      if (filters?.severity?.length) query = query.in('severity', filters.severity);
      if (filters?.sprint_id) query = query.eq('sprint_id', filters.sprint_id);
      if (filters?.created_by) query = query.eq('created_by', filters.created_by);
      if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform null values to undefined
      return data?.map(transformBug) ?? [];
    },
    enabled: !!suiteId,
  });
}

export function useBug(bugId: string) {
  return useQuery({
    queryKey: ['bug', bugId],
    queryFn: async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('bugs')
        .select('*, creator:created_by(id, name, avatar_url)')
        .eq('id', bugId)
        .single();
      if (error) throw error;
      
      // Transform null values to undefined
      return data ? transformBug(data) : null;
    },
    enabled: !!bugId,
  });
}

export function useCreateBug(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BugFormData) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: bug, error } = await supabase
        .from('bugs')
        .insert({
          suite_id: suiteId,
          created_by: user.id,
          title: data.title,
          description: data.description,
          severity: data.severity || 'medium',
          status: data.status || 'open',
          steps_to_reproduce: data.steps_to_reproduce || [],
          sprint_id: data.sprint_id,
        })
        .select()
        .single();
      if (error) throw error;
      return bug ? transformBug(bug) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs', suiteId] });
    },
  });
}

export function useUpdateBug(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BugFormData> }) => {
      const supabase = await createClient();
      const { data: bug, error } = await supabase
        .from('bugs')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return bug ? transformBug(bug) : null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bugs', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['bug', variables.id] });
    },
  });
}

export function useDeleteBug(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bugId: string) => {
      const supabase = await createClient();
      const { error } = await supabase.from('bugs').delete().eq('id', bugId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs', suiteId] });
    },
  });
}

export function useBugStats(suiteId: string) {
  return useQuery({
    queryKey: ['bug-stats', suiteId],
    queryFn: async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('bugs')
        .select('severity, status, sprint_id')
        .eq('suite_id', suiteId);
      if (error) throw error;

      const total = data.length;
      const resolved = data.filter(b => b.status === 'resolved' || b.status === 'closed').length;

      return {
        total,
        by_severity: {
          low: data.filter(b => b.severity === 'low').length,
          medium: data.filter(b => b.severity === 'medium').length,
          high: data.filter(b => b.severity === 'high').length,
          critical: data.filter(b => b.severity === 'critical').length,
        },
        by_status: {
          open: data.filter(b => b.status === 'open').length,
          in_progress: data.filter(b => b.status === 'in_progress').length,
          resolved: data.filter(b => b.status === 'resolved').length,
          closed: data.filter(b => b.status === 'closed').length,
        },
        by_sprint: data.reduce((acc, b) => {
          const sprintId = b.sprint_id || 'unassigned';
          acc[sprintId] = (acc[sprintId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        resolution_rate: total > 0 ? (resolved / total) * 100 : 0,
      };
    },
    enabled: !!suiteId,
  });
}