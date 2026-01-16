// ============================================
// components/extension/ExtensionAuthSync.tsx
// Automatically syncs auth context to extension when app loads
// Place this in DashboardShell to ensure it runs on every page
// ============================================

'use client';

import { useEffect } from 'react';
import { extensionBridge } from '@/lib/extension/extension-bridge';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { Suite } from '@/types/dashboard.types';

interface ExtensionAuthSyncProps {
  userId: string;
  currentSuite: Suite;
  sprintId?: string | null;
}

export function ExtensionAuthSync({ userId, currentSuite, sprintId }: ExtensionAuthSyncProps) {
  useEffect(() => {
    const syncAuthToExtension = async () => {
      try {
        // Check if extension is installed first
        const isInstalled = await extensionBridge.checkExtension();
        
        if (!isInstalled) {
          logger.log('[AuthSync] Extension not installed, skipping sync');
          return;
        }

        logger.log('[AuthSync] Extension detected, syncing auth context');

        // Get current session
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.log('[AuthSync] Error getting session:', error);
          return;
        }

        if (!session) {
          logger.log('[AuthSync] No active session');
          extensionBridge.clearAuthContext();
          return;
        }

        // Get Supabase config
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        if (!supabaseUrl || !supabaseAnonKey) {
          logger.log('[AuthSync] Missing Supabase configuration');
          return;
        }

        // Get user email for display
        const userEmail = session.user.email || 'Unknown User';

        // Send auth context to extension
        extensionBridge.setAuthContext({
          accountId: userId,
          testSuiteId: currentSuite.id,
          testSuiteName: currentSuite.name,
          sprintId: sprintId || null,
          userToken: session.access_token,
          supabaseUrl,
          supabaseAnonKey,
          userEmail, // Add for display in extension popup
        });

        logger.log('[AuthSync] Auth context synced successfully', {
          suite: currentSuite.name,
          user: userEmail,
        });
      } catch (error) {
        logger.log('[AuthSync] Error syncing auth:', error);
      }
    };

    // Sync immediately on mount
    syncAuthToExtension();

    // Re-sync when suite or sprint changes
  }, [userId, currentSuite.id, currentSuite.name, sprintId]);

  // This component doesn't render anything
  return null;
}