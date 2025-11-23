// ============================================
// components/relationships/AssetLinker.tsx
// ============================================

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { relationshipsApi } from '@/lib/api/relationships';
import { LinkedAsset, AssetType, RelationshipType } from '@/types/relationships.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import LinkAssetModal from './LinkAssetsModal';
import { 
  Link as LinkIcon, 
  X, 
  ExternalLink, 
  ArrowRight, 
  ArrowLeft,
  FileCheck,
  Bug,
  Video,
  FileText,
  Lightbulb,
  Rocket,
  Database
} from 'lucide-react';

interface AssetLinkerProps {
  assetType: AssetType;
  assetId: string;
  suiteId: string;
  onLink?: () => void;
}

export function AssetLinker({ assetType, assetId, suiteId, onLink }: AssetLinkerProps) {
  const [linkedAssets, setLinkedAssets] = useState<LinkedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    fetchLinkedAssets();
  }, [assetType, assetId]);

  const fetchLinkedAssets = async () => {
    try {
      setLoading(true);
      const assets = await relationshipsApi.getLinkedAssets(assetType, assetId);
      setLinkedAssets(assets);
    } catch (error) {
      console.error('Error fetching linked assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to remove this link?')) return;

    try {
      await relationshipsApi.delete(relationshipId);
      fetchLinkedAssets();
    } catch (error) {
      console.error('Error unlinking asset:', error);
    }
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'test_case': return <FileCheck className="w-4 h-4" />;
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'recording': return <Video className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4" />;
      case 'sprint': return <Rocket className="w-4 h-4" />;
      case 'test_data': return <Database className="w-4 h-4" />;
    }
  };

  const getRelationshipLabel = (type: RelationshipType) => {
    const labels: Record<RelationshipType, string> = {
      reproduces: 'Reproduces',
      related_to: 'Related to',
      blocks: 'Blocks',
      caused_by: 'Caused by',
      documents: 'Documents',
      demonstrates: 'Demonstrates',
      tests: 'Tests',
      found_in: 'Found in',
      requires: 'Requires',
      validates: 'Validates',
      fixes: 'Fixes'
    };
    return labels[type];
  };

  const getAssetTypeLabel = (type: AssetType) => {
    const labels: Record<AssetType, string> = {
      test_case: 'Test Case',
      bug: 'Bug',
      recording: 'Recording',
      document: 'Document',
      recommendation: 'Recommendation',
      sprint: 'Sprint',
      test_data: 'Test Data'
    };
    return labels[type];
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading linked assets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Linked Assets
          </h3>
          <Badge variant="default" size="sm">{linkedAssets.length}</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowLinkModal(true)}
        >
          <LinkIcon className="w-3 h-3 mr-1" />
          Link Asset
        </Button>
      </div>

      {linkedAssets.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <LinkIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No linked assets</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLinkModal(true)}
            className="mt-2"
          >
            Link your first asset
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {linkedAssets.map((asset) => (
            <Card key={asset.relationship_id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                    {getAssetIcon(asset.asset_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {asset.asset_title}
                      </p>
                      <Badge variant="default" size="sm">
                        {getAssetTypeLabel(asset.asset_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {asset.direction === 'outgoing' ? (
                        <ArrowRight className="w-3 h-3" />
                      ) : (
                        <ArrowLeft className="w-3 h-3" />
                      )}
                      <span>{getRelationshipLabel(asset.relationship_type)}</span>
                      <span>•</span>
                      <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Navigate to asset
                      window.location.href = `/${suiteId}/${asset.asset_type}s/${asset.asset_id}`;
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnlink(asset.relationship_id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showLinkModal && (
        <LinkAssetModal
          sourceType={assetType}
          sourceId={assetId}
          suiteId={suiteId}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => {
            setShowLinkModal(false);
            fetchLinkedAssets();
            onLink?.();
          }}
        />
      )}
    </div>
  );
}
