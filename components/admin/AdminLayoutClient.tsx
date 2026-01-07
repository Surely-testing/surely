// ============================================
// components/admin/AdminLayoutClient.tsx (Client Component)
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import { getAdminDashboardStats } from '@/lib/actions/admin';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
}

export default function AdminLayoutClient({
  children,
  userEmail,
  userName,
}: AdminLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [pendingContacts, setPendingContacts] = useState(0);

  useEffect(() => {
    loadPendingCounts();
    
    // Refresh counts every 5 minutes
    const interval = setInterval(loadPendingCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingCounts = async () => {
    try {
      const result = await getAdminDashboardStats();
      if (result.data) {
        setPendingReviews(result.data.pendingReviews);
        setPendingContacts(result.data.pendingContacts);
      }
    } catch (error) {
      console.error('Failed to load pending counts:', error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        pendingReviews={pendingReviews}
        pendingContacts={pendingContacts}
        userEmail={userEmail}
        userName={userName}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
