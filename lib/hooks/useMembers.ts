// ============================================
// lib/hooks/useMembers.ts
// ============================================

import { createClient } from "../supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface InviteMemberFormData {
  email: string;
  role: string;
}

export function useSuiteMembers(suiteId: string) {
  return useQuery({
    queryKey: ['suite-members', suiteId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: suite, error } = await supabase
        .from('test_suites')
        .select('members, admins')
        .eq('id', suiteId)
        .single();
      if (error) throw error;

      const allMemberIds = [...(suite.members || []), ...(suite.admins || [])];
      if (allMemberIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', allMemberIds);
      if (profilesError) throw profilesError;

      return profiles.map(profile => ({
        ...profile,
        role: suite.admins?.includes(profile.id) ? 'admin' : 'member',
        joined_at: new Date().toISOString(),
      }));
    },
    enabled: !!suiteId,
  });
}

export function useInviteMember(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InviteMemberFormData) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert({
          type: 'testSuite',
          suite_id: suiteId,
          invitee_email: data.email,
          invited_by: user.id,
          role: data.role as 'admin' | 'member',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-members', suiteId] });
    },
  });
}

export function useRemoveMember(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = createClient();
      const { data: suite, error: fetchError } = await supabase
        .from('test_suites')
        .select('members, admins')
        .eq('id', suiteId)
        .single();
      if (fetchError) throw fetchError;

      const newMembers = (suite.members || []).filter(id => id !== userId);
      const newAdmins = (suite.admins || []).filter(id => id !== userId);

      const { error } = await supabase
        .from('test_suites')
        .update({ members: newMembers, admins: newAdmins })
        .eq('id', suiteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-members', suiteId] });
    },
  });
}

export function useUpdateMemberRole(suiteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'member' }) => {
      const supabase = createClient();
      const { data: suite, error: fetchError } = await supabase
        .from('test_suites')
        .select('members, admins')
        .eq('id', suiteId)
        .single();
      if (fetchError) throw fetchError;

      let newMembers = suite.members || [];
      let newAdmins = suite.admins || [];

      if (role === 'admin') {
        newMembers = newMembers.filter(id => id !== userId);
        if (!newAdmins.includes(userId)) newAdmins.push(userId);
      } else {
        newAdmins = newAdmins.filter(id => id !== userId);
        if (!newMembers.includes(userId)) newMembers.push(userId);
      }

      const { error } = await supabase
        .from('test_suites')
        .update({ members: newMembers, admins: newAdmins })
        .eq('id', suiteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-members', suiteId] });
    },
  });
}