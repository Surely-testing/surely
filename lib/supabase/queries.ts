// ============================================
// lib/supabase/queries.ts
// Common reusable database queries
// ============================================

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { logger } from '@/lib/utils/logger';

type TypedSupabaseClient = SupabaseClient<Database>;

// ============================================
// USER & PROFILE QUERIES
// ============================================

export async function getUserProfile(supabase: TypedSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  supabase: TypedSupabaseClient,
  userId: string,
  updates: {
    name?: string;
    avatar_url?: string;
  }
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// TEST SUITE QUERIES
// ============================================

export async function getUserTestSuites(supabase: TypedSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('test_suites')
    .select('*')
    .or(`owner_id.eq.${userId},members.cs.{${userId}},admins.cs.{${userId}}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTestSuite(supabase: TypedSupabaseClient, suiteId: string) {
  const { data, error } = await supabase
    .from('test_suites')
    .select('*')
    .eq('id', suiteId)
    .single();

  if (error) throw error;
  return data;
}

export async function getTestSuiteWithStats(supabase: TypedSupabaseClient, suiteId: string) {
  // Get suite
  const { data: suite, error: suiteError } = await supabase
    .from('test_suites')
    .select('*')
    .eq('id', suiteId)
    .single();

  if (suiteError) throw suiteError;

  // Get counts in parallel
  const [testCases, bugs, sprints, documents] = await Promise.all([
    supabase.from('test_cases').select('id, status', { count: 'exact', head: false }).eq('suite_id', suiteId),
    supabase.from('bugs').select('id, status, severity', { count: 'exact', head: false }).eq('suite_id', suiteId),
    supabase.from('sprints').select('id, status', { count: 'exact', head: false }).eq('suite_id', suiteId),
    supabase.from('documents').select('id', { count: 'exact', head: false }).eq('suite_id', suiteId),
  ]);

  return {
    ...suite,
    stats: {
      test_cases: {
        total: testCases.data?.length || 0,
        active: testCases.data?.filter(tc => tc.status === 'active').length || 0,
      },
      bugs: {
        total: bugs.data?.length || 0,
        open: bugs.data?.filter(b => b.status === 'open').length || 0,
        critical: bugs.data?.filter(b => b.severity === 'critical').length || 0,
      },
      sprints: {
        total: sprints.data?.length || 0,
        active: sprints.data?.filter(s => s.status === 'active').length || 0,
      },
      documents: {
        total: documents.data?.length || 0,
      },
    },
  };
}

// ============================================
// ORGANIZATION QUERIES
// ============================================

export async function getUserOrganizations(supabase: TypedSupabaseClient, userId: string) {
  // Get organizations where user is a member
  const { data: memberships, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, role, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (memberError) throw memberError;

  if (!memberships || memberships.length === 0) return [];

  const orgIds = memberships.map(m => m.organization_id);

  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds)
    .eq('status', 'active');

  if (orgError) throw orgError;

  // Merge role info
  return organizations.map(org => ({
    ...org,
    role: memberships.find(m => m.organization_id === org.id)?.role || 'member',
  }));
}

export async function getOrganization(supabase: TypedSupabaseClient, orgId: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error) throw error;
  return data;
}

export async function getOrganizationMembers(supabase: TypedSupabaseClient, orgId: string) {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      user:user_id (
        id,
        name:profiles(name),
        email:profiles(email),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('organization_id', orgId)
    .eq('status', 'active');

  if (error) throw error;
  return data;
}

// ============================================
// SUBSCRIPTION QUERIES
// ============================================

export async function getUserSubscription(supabase: TypedSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      tier:tier_id (*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    // No subscription found - return free tier
    const { data: freeTier } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('name', 'free')
      .single();

    return {
      user_id: userId,
      status: 'active',
      tier: freeTier,
    };
  }

  return data;
}

export async function getSubscriptionTiers(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('price_monthly', { ascending: true });

  if (error) throw error;
  return data;
}

// ============================================
// TEST CASE QUERIES
// ============================================

export async function getTestCases(supabase: TypedSupabaseClient, suiteId: string) {
  const { data, error } = await supabase
    .from('test_cases')
    .select(`
      *,
      creator:created_by (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTestCase(supabase: TypedSupabaseClient, testCaseId: string) {
  const { data, error } = await supabase
    .from('test_cases')
    .select(`
      *,
      creator:created_by (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('id', testCaseId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// BUG QUERIES
// ============================================

export async function getBugs(supabase: TypedSupabaseClient, suiteId: string) {
  const { data, error } = await supabase
    .from('bugs')
    .select(`
      *,
      creator:created_by (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBug(supabase: TypedSupabaseClient, bugId: string) {
  const { data, error } = await supabase
    .from('bugs')
    .select(`
      *,
      creator:created_by (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('id', bugId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// SPRINT QUERIES
// ============================================

export async function getSprints(supabase: TypedSupabaseClient, suiteId: string) {
  const { data, error } = await supabase
    .from('sprints')
    .select(`
      *,
      creator:created_by (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSprint(supabase: TypedSupabaseClient, sprintId: string) {
  const { data, error } = await supabase
    .from('sprints')
    .select(`
      *,
      creator:created_by (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('id', sprintId)
    .single();

  if (error) throw error;
  return data;
}

export async function getSprintWithItems(supabase: TypedSupabaseClient, sprintId: string) {
  const { data: sprint, error: sprintError } = await supabase
    .from('sprints')
    .select('*')
    .eq('id', sprintId)
    .single();

  if (sprintError) throw sprintError;

  // Get all items in this sprint
  const [testCases, bugs, documents] = await Promise.all([
    supabase.from('test_cases').select('*').eq('sprint_id', sprintId),
    supabase.from('bugs').select('*').eq('sprint_id', sprintId),
    supabase.from('documents').select('*').eq('sprint_id', sprintId),
  ]);

  return {
    ...sprint,
    test_cases: testCases.data || [],
    bugs: bugs.data || [],
    documents: documents.data || [],
  };
}

// ============================================
// DOCUMENT QUERIES
// ============================================

export async function getDocuments(supabase: TypedSupabaseClient, suiteId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      creator:created_by (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDocument(supabase: TypedSupabaseClient, documentId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      creator:created_by (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('id', documentId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// REPORT QUERIES
// ============================================

export async function getReports(supabase: TypedSupabaseClient, suiteId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      creator:created_by (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .eq('suite_id', suiteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReport(supabase: TypedSupabaseClient, reportId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// ACTIVITY LOG QUERIES
// ============================================

export async function getActivityLogs(
  supabase: TypedSupabaseClient,
  options: {
    userId?: string;
    suiteId?: string;
    limit?: number;
  }
) {
  let query = supabase
    .from('activity_logs')
    .select(`
      *,
      user:user_id (
        id,
        name:profiles(name),
        avatar_url:profiles(avatar_url)
      )
    `)
    .order('created_at', { ascending: false });

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// ============================================
// INVITATION QUERIES
// ============================================

export async function getPendingInvitations(supabase: TypedSupabaseClient, email: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invitee_email', email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  if (error) throw error;
  return data;
}

export async function getInvitation(supabase: TypedSupabaseClient, invitationId: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// PERMISSION CHECKS
// ============================================

export async function canUserAccessSuite(
  supabase: TypedSupabaseClient,
  userId: string,
  suiteId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_read_test_suite', {
    suite_id: suiteId,
    requesting_user_id: userId, // ✅ FIXED: Changed from user_id to requesting_user_id
  });

  if (error) {
    logger.log('Permission check error:', error);
    return false;
  }

  return data === true;
}

export async function canUserAdminSuite(
  supabase: TypedSupabaseClient,
  userId: string,
  suiteId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_admin_test_suite', {
    suite_id: suiteId,
    requesting_user_id: userId, // ✅ FIXED: Changed from user_id to requesting_user_id
  });

  if (error) {
    logger.log('Permission check error:', error);
    return false;
  }

  return data === true;
}

export async function isUserOrgAdmin(
  supabase: TypedSupabaseClient,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_org_admin', {
    org_id: orgId,
    requesting_user_id: userId, // ✅ FIXED: Changed from user_id to requesting_user_id
  });

  if (error) {
    logger.log('Permission check error:', error);
    return false;
  }

  return data === true;
}

// ============================================
// SEARCH QUERIES
// ============================================

export async function searchSuiteContent(
  supabase: TypedSupabaseClient,
  suiteId: string,
  searchTerm: string
) {
  const [testCases, bugs, documents] = await Promise.all([
    supabase
      .from('test_cases')
      .select('id, title, description')
      .eq('suite_id', suiteId)
      .ilike('title', `%${searchTerm}%`)
      .limit(5),
    supabase
      .from('bugs')
      .select('id, title, description')
      .eq('suite_id', suiteId)
      .ilike('title', `%${searchTerm}%`)
      .limit(5),
    supabase
      .from('documents')
      .select('id, title, content')
      .eq('suite_id', suiteId)
      .ilike('title', `%${searchTerm}%`)
      .limit(5),
  ]);

  return {
    test_cases: testCases.data || [],
    bugs: bugs.data || [],
    documents: documents.data || [],
  };
}