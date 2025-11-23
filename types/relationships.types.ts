// ============================================
// types/relationships.types.ts
// ============================================

export type AssetType = 
  | 'test_case' 
  | 'bug' 
  | 'recording' 
  | 'document' 
  | 'recommendation' 
  | 'sprint' 
  | 'test_data';

export type RelationshipType = 
  | 'reproduces'        // Recording reproduces a Bug
  | 'related_to'        // General relation
  | 'blocks'            // Bug blocks Test Case
  | 'caused_by'         // Bug caused by Test Case
  | 'documents'         // Document documents Bug/Test Case
  | 'demonstrates'      // Recording demonstrates Test Case
  | 'tests'             // Test Case tests functionality
  | 'found_in'          // Bug found in Sprint
  | 'requires'          // Test Case requires Test Data
  | 'validates'         // Test Case validates Document
  | 'fixes';            // Bug fix relationship

export interface AssetRelationship {
  id: string;
  source_type: AssetType;
  source_id: string;
  target_type: AssetType;
  target_id: string;
  relationship_type: RelationshipType;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssetRelationshipWithDetails extends AssetRelationship {
  source_title: string;
  target_title: string;
  creator_name: string;
  creator_avatar: string | null;
}

export interface LinkedAsset {
  relationship_id: string;
  asset_type: AssetType;
  asset_id: string;
  asset_title: string;
  relationship_type: RelationshipType;
  direction: 'outgoing' | 'incoming';
  created_at: string;
}

export interface CreateRelationshipData {
  source_type: AssetType;
  source_id: string;
  target_type: AssetType;
  target_id: string;
  relationship_type: RelationshipType;
  notes?: string;
}