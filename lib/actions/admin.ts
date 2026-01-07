// ============================================
// lib/actions/admin.ts (FIXED FOR RLS)
// ============================================
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Check if user is system admin
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('system_role')
    .eq('id', user.id)
    .single();

  if (profile?.system_role !== 'system_admin') {
    redirect('/dashboard');
  }

  return { supabase, user };
}

// Dashboard Stats
export async function getAdminDashboardStats() {
  try {
    const { supabase } = await requireAdmin();

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: trialingSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'trialing');

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'succeeded');

    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const monthlyRecurringRevenue = (activeSubscriptions || 0) * 2900;

    const { count: pendingReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: pendingContacts } = await supabase
      .from('contact_sales')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, name, email, account_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentSubscriptions } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        created_at,
        profiles!inner(email),
        subscription_tiers(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    const formattedSubscriptions = recentSubscriptions?.map(sub => ({
      id: sub.id,
      status: sub.status,
      user_email: (sub.profiles as any).email || '',
      tier_name: (sub.subscription_tiers as any)?.name || null,
      created_at: sub.created_at
    })) || [];

    const { data: recentPayments } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        created_at,
        user_id,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    const formattedPayments = recentPayments?.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      user_email: (payment.profiles as any).email || '',
      created_at: payment.created_at
    })) || [];

    return {
      data: {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        trialingSubscriptions: trialingSubscriptions || 0,
        totalRevenue: totalRevenue / 100,
        monthlyRecurringRevenue: monthlyRecurringRevenue / 100,
        pendingReviews: pendingReviews || 0,
        pendingContacts: pendingContacts || 0,
        recentUsers: recentUsers || [],
        recentSubscriptions: formattedSubscriptions,
        recentPayments: formattedPayments
      }
    };
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    return { error: 'Failed to load dashboard stats' };
  }
}

// Get all users with pagination and filters
export async function getAdminUsers(
  page = 1, 
  limit = 50,
  filters?: {
    search?: string
    accountType?: string
    status?: string
  }
) {
  try {
    const { supabase } = await requireAdmin();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select(`
        *,
        subscriptions(status, tier_id, subscription_tiers(name))
      `, { count: 'exact' });

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.accountType) {
      query = query.eq('account_type', filters.accountType);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // DEBUG: Log the query result
    if (error) {
      console.error('❌ Query error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✓ Query successful. Found users:', users?.length || 0);
    }

    return {
      data: {
        users: users || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Get admin users error:', error);
    return { error: 'Failed to load users' };
  }
}

// Get all subscriptions with pagination and filters
export async function getAdminSubscriptions(
  page = 1, 
  limit = 50,
  filters?: {
    status?: string
    search?: string
  }
) {
  try {
    const { supabase } = await requireAdmin();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        profiles!inner(name, email),
        subscription_tiers(name)
      `, { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.ilike('profiles.email', `%${filters.search}%`);
    }

    const { data: subscriptions, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const formatted = subscriptions?.map(sub => ({
      ...sub,
      user_email: (sub.profiles as any)?.email,
      user_name: (sub.profiles as any)?.name,
      tier_name: (sub.subscription_tiers as any)?.name
    })) || [];

    return {
      data: {
        subscriptions: formatted,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Get admin subscriptions error:', error);
    return { error: 'Failed to load subscriptions' };
  }
}

// Get all payments with pagination and filters
export async function getAdminPayments(
  page = 1, 
  limit = 50,
  filters?: {
    status?: string
    search?: string
  }
) {
  try {
    const { supabase } = await requireAdmin();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('payments')
      .select(`
        *,
        profiles!inner(name, email)
      `, { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.ilike('profiles.email', `%${filters.search}%`);
    }

    const { data: payments, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const formatted = payments?.map(payment => ({
      ...payment,
      user_email: (payment.profiles as any)?.email,
      user_name: (payment.profiles as any)?.name
    })) || [];

    return {
      data: {
        payments: formatted,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Get admin payments error:', error);
    return { error: 'Failed to load payments' };
  }
}

// Get all reviews with pagination and filters
export async function getAdminReviews(
  page = 1, 
  limit = 50,
  filters?: {
    status?: string
    rating?: number
  }
) {
  try {
    const { supabase } = await requireAdmin();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.rating) {
      query = query.eq('rating', filters.rating);
    }

    const { data: reviews, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      data: {
        reviews: reviews || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Get admin reviews error:', error);
    return { error: 'Failed to load reviews' };
  }
}

// Update review status
export async function updateReviewStatus(reviewId: string, status: string) {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from('reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reviewId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Update review status error:', error);
    return { error: 'Failed to update review status' };
  }
}

// Get all contact sales with pagination and filters
export async function getAdminContacts(
  page = 1, 
  limit = 50,
  filters?: {
    status?: string
    search?: string
  }
) {
  try {
    const { supabase } = await requireAdmin();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('contact_sales')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
    }

    const { data: contacts, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      data: {
        contacts: contacts || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Get admin contacts error:', error);
    return { error: 'Failed to load contacts' };
  }
}

// Update contact status
export async function updateContactStatus(contactId: string, status: string) {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from('contact_sales')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', contactId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Update contact status error:', error);
    return { error: 'Failed to update contact status' };
  }
}

// DEBUG FUNCTION: Check JWT and RLS access
export async function debugAdminAccess() {
  try {
    const { supabase, user } = await requireAdmin();

    // Test 1: Check profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('system_role')
      .eq('id', user.id)
      .single();

    // Test 2: Try to count all profiles
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Test 3: Try to get all profiles
    const { data: allProfiles, error: queryError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .limit(10);

    return {
      data: {
        userId: user.id,
        userEmail: user.email,
        systemRole: profile?.system_role,
        totalProfilesCount: count,
        countError: error,
        sampleProfiles: allProfiles,
        queryError: queryError,
        message: queryError 
          ? '❌ RLS is blocking admin access. JWT might not have system_role claim.' 
          : '✓ Admin can see all profiles'
      }
    };
  } catch (error) {
    console.error('Debug admin access error:', error);
    return { error: 'Failed to debug admin access' };
  }
}