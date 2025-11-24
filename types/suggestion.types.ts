
// ============================================
// types/suggestion.types.ts
// ============================================
export type SuggestionStatus = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'implemented';
export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical';
export type SuggestionCategory = 'feature' | 'improvement' | 'performance' | 'ui_ux' | 'testing' | 'documentation' | 'other';
export type SuggestionImpact = 'low' | 'medium' | 'high';

export interface SuggestionVote {
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}

export interface Suggestion {
  id: string;
  suite_id: string;
  title: string;
  description: string;
  rationale?: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  impact: SuggestionImpact;
  effort_estimate?: string;
  created_by: string;
  assigned_to?: string;
  upvotes: number;
  downvotes: number;
  votes: Record<string, 'upvote' | 'downvote'>;
  tags?: string[];
  attachments?: string[];
  discussion_notes?: string;
  implemented_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SuggestionWithCreator extends Suggestion {
  creator?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}