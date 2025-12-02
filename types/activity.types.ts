// ============================================
// types/activity.types.ts
// ============================================

import { Tables } from "./database.types";

export type ActivityLog = Tables<'activity_logs'>;

export type ActivityAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'archived'
  | 'restored'
  | 'invited'
  | 'joined'
  | 'left';

export type ActivityResourceType = 
  | 'test_case'
  | 'bug'
  | 'sprint'
  | 'document'
  | 'suite'
  | 'organization'
  | 'member';

export interface ActivityLogWithUser extends ActivityLog {
  user?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}