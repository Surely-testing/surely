// ============================================
// FILE: lib/hooks/useActivity.ts
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

interface Activity {
  id: string;
  type: 'test_case' | 'bug' | 'sprint' | 'document';
  action: 'created' | 'updated' | 'deleted';
  title: string;
  user: {
    name: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface ActivityLogMetadata {
  suite_id?: string;
  title?: string;
  name?: string;
  [key: string]: any;
}

interface ActivityLog {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: ActivityLogMetadata;
  created_at: string;
  user_id: string;
}

export function useRecentActivity(suiteId: string, limit: number = 10) {
  const [data, setData] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      if (!suiteId) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Fetch activity logs for the suite
        const { data: logs, error: logsError } = await supabase
          .from('activity_logs')
          .select(`
            id,
            action,
            resource_type,
            resource_id,
            metadata,
            created_at,
            user_id
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (logsError) throw logsError;

        // Filter logs by suite_id in metadata
        const filteredLogs = (logs as ActivityLog[])?.filter(log => {
          const metadata = log.metadata as ActivityLogMetadata;
          return metadata?.suite_id === suiteId;
        }) || [];

        // Get unique user IDs
        const userIds = [...new Set(filteredLogs.map(log => log.user_id))];

        if (userIds.length === 0) {
          setData([]);
          setIsLoading(false);
          return;
        }

        // Fetch user profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create user map - convert null to undefined for avatar_url
        const userMap = new Map(
          profiles?.map(p => [
            p.id, 
            { 
              name: p.name, 
              avatar_url: p.avatar_url ?? undefined 
            }
          ]) || []
        );

        // Transform logs into activities
        const activities: Activity[] = filteredLogs.map(log => {
          const user = userMap.get(log.user_id) || { name: 'Unknown User' };
          const metadata = log.metadata as ActivityLogMetadata;
          
          // Determine type from resource_type
          let type: Activity['type'] = 'document';
          if (log.resource_type?.includes('test_case') || log.resource_type?.includes('testCase')) {
            type = 'test_case';
          } else if (log.resource_type?.includes('bug')) {
            type = 'bug';
          } else if (log.resource_type?.includes('sprint')) {
            type = 'sprint';
          }
          
          // Determine action from action string
          let action: Activity['action'] = 'updated';
          const actionLower = log.action.toLowerCase();
          if (actionLower.includes('create')) {
            action = 'created';
          } else if (actionLower.includes('delete')) {
            action = 'deleted';
          }

          // Get title from metadata
          const title = metadata?.title || metadata?.name || `${type.replace('_', ' ')} ${action}`;

          return {
            id: log.id,
            type,
            action,
            title,
            user,
            created_at: log.created_at,
          };
        });

        setData(activities);
      } catch (err) {
        logger.log('Error fetching activity:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();
  }, [suiteId, limit]);

  return { data, isLoading, error };
}