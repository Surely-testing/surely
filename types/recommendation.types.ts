// ============================================
// types/recommendation.types.ts
// ============================================

import { Tables } from "./database.types";

export type Recommendation = Tables<'recommendations'>;

export type RecommendationPriority = 'low' | 'medium' | 'high';
export type RecommendationStatus = 'pending' | 'implemented' | 'rejected';

export interface RecommendationFormData {
  title: string;
  description?: string;
  category?: string;
  priority?: RecommendationPriority;
  sprint_id?: string | null;
}
