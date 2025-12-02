// ============================================
// lib/api/relationships.ts
// Fixed - Using proper type casting for custom tables
// ============================================

import { createClient } from '@/lib/supabase/client';
import { 
  AssetRelationship, 
  AssetRelationshipWithDetails, 
  LinkedAsset, 
  CreateRelationshipData,
  AssetType 
} from '@/types/relationships.types';

export const relationshipsApi = {
  // Create a relationship
  async create(data: CreateRelationshipData) {
    const supabase = createClient();
    const { data: relationship, error } = await (supabase
      .from('asset_relationships' as any)
      .insert(data as any)
      .select()
      .single() as any);

    if (error) throw error;
    return relationship as AssetRelationship;
  },

  // Get all linked assets for an asset
  async getLinkedAssets(assetType: AssetType, assetId: string) {
    const supabase = createClient();
    
    try {
      const { data, error } = await (supabase
        .rpc('get_linked_assets' as any, {
          p_asset_type: assetType,
          p_asset_id: assetId
        }) as any);

      if (error) throw error;
      return (data || []) as LinkedAsset[];
    } catch (error) {
      console.error('Error fetching linked assets:', error);
      return [] as LinkedAsset[];
    }
  },

  // Get relationship details
  async getRelationship(relationshipId: string) {
    const supabase = createClient();
    
    try {
      const { data, error } = await (supabase
        .from('asset_relationships_with_details' as any)
        .select('*')
        .eq('id', relationshipId)
        .single() as any);

      if (error) throw error;
      return data as AssetRelationshipWithDetails;
    } catch (error) {
      console.error('Error fetching relationship:', error);
      throw error;
    }
  },

  // Update relationship notes
  async updateNotes(relationshipId: string, notes: string) {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from('asset_relationships' as any)
      .update({ notes })
      .eq('id', relationshipId)
      .select()
      .single() as any);

    if (error) throw error;
    return data as AssetRelationship;
  },

  // Delete a relationship
  async delete(relationshipId: string) {
    const supabase = createClient();
    const { error } = await (supabase
      .from('asset_relationships' as any)
      .delete()
      .eq('id', relationshipId) as any);

    if (error) throw error;
  },

  // Get relationship count for an asset
  async getCount(assetType: AssetType, assetId: string) {
    const supabase = createClient();
    
    try {
      const { data, error } = await (supabase
        .rpc('get_asset_relationship_count' as any, {
          asset_type: assetType,
          asset_id: assetId
        }) as any);

      if (error) throw error;
      return (data || 0) as number;
    } catch (error) {
      console.error('Error fetching relationship count:', error);
      return 0;
    }
  },

  // Get suite relationship statistics
  async getSuiteStats(suiteId: string) {
    const supabase = createClient();
    
    try {
      const { data, error } = await (supabase
        .rpc('get_suite_relationship_stats' as any, {
          p_suite_id: suiteId
        }) as any);

      if (error) throw error;
      return (data || []) as { relationship_type: string; count: number }[];
    } catch (error) {
      console.error('Error fetching suite stats:', error);
      return [] as { relationship_type: string; count: number }[];
    }
  }
};