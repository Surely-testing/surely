// ============================================
// app/admin/layout.tsx (Server Component - Fetch User)
// ============================================
import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile with system_role
  const { data: profile } = await supabase
    .from('profiles')
    .select('system_role, name, email')
    .eq('id', user.id)
    .single();

  // Verify system_admin access
  if (profile?.system_role !== 'system_admin') {
    redirect('/dashboard');
  }

  // Pass user info to client component
  return (
    <AdminLayoutClient
      userEmail={user.email || ''}
      userName={profile?.name || 'Admin'}
    >
      {children}
    </AdminLayoutClient>
  );
}
