// ============================================
// components/relationships/LinkAssetModal.tsx
// ============================================
'use client'
import React, {useState, useEffect } from 'react';
import { 
  RelationshipType,
  AssetType 
} from '@/types/relationships.types';
import { createClient } from '@/lib/supabase/client';
import { relationshipsApi } from '@/lib/api/relationships';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface LinkAssetModalProps {
  sourceType: AssetType;
  sourceId: string;
  suiteId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LinkAssetModal({ sourceType, sourceId, suiteId, onClose, onSuccess }: LinkAssetModalProps) {
  const [targetType, setTargetType] = useState<AssetType>('bug');
  const [targetId, setTargetId] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('related_to');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);

  useEffect(() => {
    fetchAvailableAssets();
  }, [targetType]);

  const getTableName = (assetType: AssetType): string => {
    const tableMap: Record<AssetType, string> = {
      test_case: 'test_cases',
      bug: 'bugs',
      recording: 'recordings',
      document: 'documents',
      recommendation: 'recommendations',
      sprint: 'sprints',
      test_data: 'test_data' // Note: singular, not plural
    };
    return tableMap[assetType];
  };

  const fetchAvailableAssets = async () => {
    try {
      const supabase = createClient();
      const tableName = getTableName(targetType);
      
      const { data } = await supabase
        .from(tableName as any)
        .select('id, title, name')
        .eq('suite_id', suiteId)
        .limit(20);
      
      setAvailableAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;

    try {
      setLoading(true);
      await relationshipsApi.create({
        source_type: sourceType,
        source_id: sourceId,
        target_type: targetType,
        target_id: targetId,
        relationship_type: relationshipType,
        notes: notes || undefined
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating relationship:', error);
      alert('Failed to link asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Link Asset
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Asset Type
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as AssetType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="test_case">Test Case</option>
              <option value="bug">Bug</option>
              <option value="recording">Recording</option>
              <option value="document">Document</option>
              <option value="recommendation">Recommendation</option>
              <option value="sprint">Sprint</option>
              <option value="test_data">Test Data</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Asset
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              required
            >
              <option value="">Choose an asset...</option>
              {availableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.title || asset.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Relationship Type
            </label>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="related_to">Related to</option>
              <option value="reproduces">Reproduces</option>
              <option value="blocks">Blocks</option>
              <option value="caused_by">Caused by</option>
              <option value="documents">Documents</option>
              <option value="demonstrates">Demonstrates</option>
              <option value="tests">Tests</option>
              <option value="found_in">Found in</option>
              <option value="requires">Requires</option>
              <option value="validates">Validates</option>
              <option value="fixes">Fixes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Add any additional context..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !targetId}>
              {loading ? 'Linking...' : 'Link Asset'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}