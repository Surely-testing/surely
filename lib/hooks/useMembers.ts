// ============================================
// lib/hooks/useMembers.ts
// ============================================

import { createClient } from "../supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface InviteMemberFormData {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

interface SuiteMember {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
}

export function useSuiteMembers(suiteId: string) {
  return useQuery({
    queryKey: ['suite-members', suiteId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: suite, error } = await supabase
        .from('test_suites')
        .select('members, admins, viewers')
        .eq('id', suiteId)
        .single();
      
      if (error) throw error;

      const allMemberIds = [
        ...(suite.members || []), 
        ...(suite.admins || []),
        ...(suite.viewers || [])
      ];
      
      if (allMemberIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', allMemberIds);
      
      if (profilesError) throw profilesError;

      return profiles.map(profile => ({
        ...profile,
        role: suite.admins?.includes(profile.id) 
          ? 'admin' as const
          : suite.viewers?.includes(profile.id)
          ? 'viewer' as const
          : 'member' as const,
        joined_at: new Date().toISOString(),
      })) as SuiteMember[];
    },
    enabled: !!suiteId,
  });
}

export function useInviteMember(suiteId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InviteMemberFormData) => {
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'testSuite',   // ← required by the route
          email: data.email,
          suiteId,
          role: data.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-members', suiteId] });
      queryClient.invalidateQueries({ queryKey: ['suite-invitations', suiteId] });
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
        .select('members, admins, viewers')
        .eq('id', suiteId)
        .single();
      
      if (fetchError) throw fetchError;

      const newMembers = (suite.members || []).filter((id: string) => id !== userId);
      const newAdmins = (suite.admins || []).filter((id: string) => id !== userId);
      const newViewers = (suite.viewers || []).filter((id: string) => id !== userId);

      const { error } = await supabase
        .from('test_suites')
        .update({ 
          members: newMembers, 
          admins: newAdmins,
          viewers: newViewers 
        })
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
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'member' | 'viewer' }) => {
      const supabase = createClient();
      const { data: suite, error: fetchError } = await supabase
        .from('test_suites')
        .select('members, admins, viewers')
        .eq('id', suiteId)
        .single();
      
      if (fetchError) throw fetchError;

      let newMembers = suite.members || [];
      let newAdmins = suite.admins || [];
      let newViewers = suite.viewers || [];

      newMembers = newMembers.filter((id: string) => id !== userId);
      newAdmins = newAdmins.filter((id: string) => id !== userId);
      newViewers = newViewers.filter((id: string) => id !== userId);

      if (role === 'admin') {
        if (!newAdmins.includes(userId)) newAdmins.push(userId);
      } else if (role === 'viewer') {
        if (!newViewers.includes(userId)) newViewers.push(userId);
      } else {
        if (!newMembers.includes(userId)) newMembers.push(userId);
      }

      const { error } = await supabase
        .from('test_suites')
        .update({ 
          members: newMembers, 
          admins: newAdmins,
          viewers: newViewers 
        })
        .eq('id', suiteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-members', suiteId] });
    },
  });
}

export function useSuiteInvitations(suiteId: string) {
  return useQuery({
    queryKey: ['suite-invitations', suiteId],
    queryFn: async () => {
      const supabase = createClient();

      // Select only columns that exist directly on invitations.
      // Do NOT join profiles via invited_by — that FK points to auth.users,
      // not profiles, so PostgREST returns PGRST200 for that hint.
      const { data, error } = await supabase
        .from('invitations')
        .select('id, invitee_email, role, status, created_at, expires_at, invited_by')
        .eq('suite_id', suiteId)
        .eq('type', 'testSuite')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If you need the inviter's display name, resolve it in a second query
      // against the profiles table using the invited_by UUIDs.
      const inviterIds = [...new Set((data || []).map(inv => inv.invited_by).filter(Boolean))];

      let inviterMap: Record<string, { name: string | null; email: string }> = {};

      if (inviterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', inviterIds);

        if (profiles) {
          inviterMap = Object.fromEntries(profiles.map(p => [p.id, { name: p.name, email: p.email }]));
        }
      }

      return (data || []).map(inv => ({
        ...inv,
        inviter: inviterMap[inv.invited_by] ?? null,
      }));
    },
    enabled: !!suiteId,
  });
}

export function useCancelInvitation(suiteId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-invitations', suiteId] });
    },
  });
}