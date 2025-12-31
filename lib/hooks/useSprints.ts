// ============================================
// FILE: lib/hooks/useSprints.ts
// Debug version to identify the 400 error
// ============================================

import { createClient } from "../supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface SprintFilters {
  status?: string[];
  search?: string;
}

interface SprintFormData {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  test_case_ids?: string[];
}

// Fetch all sprints for a suite
export function useSprints(suiteId: string, filters?: SprintFilters) {
  return useQuery({
    queryKey: ['sprints', suiteId, filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from('sprints')
        .select('*')
        .eq('suite_id', suiteId)
        .order('created_at', { ascending: false });

      if (filters?.status?.length) query = query.in('status', filters.status);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(sprint => ({
        ...sprint,
        test_case_ids: Array.isArray(sprint.test_case_ids) ? sprint.test_case_ids : []
      }));
    },
    enabled: !!suiteId,
  });
}

// Fetch single sprint
export function useSprint(sprintId: string) {
  return useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', sprintId)
        .single();
      if (error) throw error;
      return {
        ...data,
        test_case_ids: Array.isArray(data.test_case_ids) ? data.test_case_ids : []
      };
    },
    enabled: !!sprintId,
  });
}

// Create sprint - FIXED: No duplicate toasts
export function useCreateSprint(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SprintFormData) => {
      const supabase = createClient();
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication failed');
      }
      if (!user) {
        throw new Error('Not authenticated - please log in');
      }

      // Prepare the payload
      const payload: any = {
        suite_id: suiteId,
        name: data.name,
        status: data.status || 'planning',
        test_case_ids: data.test_case_ids || [],
      };

      // Only add optional fields if they have values
      if (data.description) payload.description = data.description;
      if (data.start_date) payload.start_date = data.start_date;
      if (data.end_date) payload.end_date = data.end_date;
      payload.created_by = user.id;

      console.log('🔍 Creating sprint with payload:', JSON.stringify(payload, null, 2));

      // Attempt to insert
      const { data: sprint, error } = await supabase
        .from('sprints')
        .insert(payload)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          throw new Error(`Database schema mismatch: ${error.message}. Check your sprints table structure.`);
        }
        
        throw error;
      }
      
      console.log('✅ Sprint created successfully:', sprint);
      return sprint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', suiteId] });
      // Toast is handled in the component, not here
    },
    onError: (error: any) => {
      console.error('🔴 Mutation error:', error);
      logger.log('Error creating sprint:', error);
      // Toast is handled in the component, not here
    },
  });
}

// Update sprint - FIXED: No duplicate toasts
export function useUpdateSprint(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SprintFormData> }) => {
      const supabase = createClient();
      
      // Clean the data - remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      console.log('🔄 Updating sprint:', id, 'with data:', cleanData);
      
      const { data: sprint, error } = await supabase
        .from('sprints')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }
      return sprint;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['sprint', variables.id] });
      // Toast is handled in the component, not here
    },
    onError: (error: any) => {
      logger.log('Error updating sprint:', error);
      // Toast is handled in the component, not here
    },
  });
}

// Delete sprint - FIXED: No duplicate toasts
export function useDeleteSprint(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('sprints').delete().eq('id', sprintId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', suiteId] });
      // Toast is handled in the component, not here
    },
    onError: (error: any) => {
      logger.log('Error deleting sprint:', error);
      // Toast is handled in the component, not here
    },
  });
}

// Get sprint stats
export function useSprintStats(sprintId: string) {
  return useQuery({
    queryKey: ['sprint-stats', sprintId],
    queryFn: async () => {
      const supabase = createClient();
      const [testCases, bugs, suggestions] = await Promise.all([
        supabase.from('test_cases').select('id', { count: 'exact', head: true }).eq('sprint_id', sprintId),
        supabase.from('bugs').select('id', { count: 'exact', head: true }).eq('sprint_id', sprintId),
        supabase.from('suggestions').select('id', { count: 'exact', head: true }).eq('sprint_id', sprintId),
      ]);

      return {
        test_cases_count: testCases.count || 0,
        bugs_count: bugs.count || 0,
        suggestions_count: suggestions.count || 0,
      };
    },
    enabled: !!sprintId,
  });
}