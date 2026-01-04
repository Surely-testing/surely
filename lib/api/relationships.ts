// ============================================
// FILE: lib/api/relationships.ts
// ============================================

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
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
      logger.log('Error fetching linked assets:', error);
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
      logger.log('Error fetching relationship:', error);
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

  // Delete a single relationship
  async delete(relationshipId: string) {
    const supabase = createClient();
    const { error } = await (supabase
      .from('asset_relationships' as any)
      .delete()
      .eq('id', relationshipId) as any);

    if (error) throw error;
  },

  // Delete all relationships for an asset (NEW METHOD)
  async deleteAllForAsset(assetType: AssetType, assetId: string) {
    const supabase = createClient();
    
    try {
      // Delete where asset is source
      const { error: sourceError } = await supabase
        .from('asset_relationships' as any)
        .delete()
        .eq('source_type', assetType)
        .eq('source_id', assetId);

      if (sourceError) throw sourceError;

      // Delete where asset is target
      const { error: targetError } = await supabase
        .from('asset_relationships' as any)
        .delete()
        .eq('target_type', assetType)
        .eq('target_id', assetId);

      if (targetError) throw targetError;

      logger.log(`Deleted all relationships for ${assetType}:${assetId}`);
    } catch (error) {
      logger.log('Error deleting relationships:', error);
      throw error;
    }
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
      logger.log('Error fetching relationship count:', error);
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
      logger.log('Error fetching suite stats:', error);
      return [] as { relationship_type: string; count: number }[];
    }
  }
};