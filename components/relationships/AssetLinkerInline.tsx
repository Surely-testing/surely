// ============================================
// components/relationships/AssetLinkerInline.tsx
// Inline version for forms with multi-select
// ============================================
import { useState, useEffect } from "react";
import { AssetType, LinkedAsset } from "@/types/relationships.types";
import { relationshipsApi } from "@/lib/api/relationships";
import LinkAssetModal from "./LinkAssetsModal";
import { logger } from '@/lib/utils/logger';

interface AssetLinkerInlineProps {
  assetType: AssetType;
  assetId: string;
  suiteId: string;
  onChange?: (linkedAssets: LinkedAsset[]) => void;
  editable?: boolean;
}

export function AssetLinkerInline({ 
  assetType, 
  assetId, 
  suiteId, 
  onChange,
  editable = true 
}: AssetLinkerInlineProps) {
  const [linkedAssets, setLinkedAssets] = useState<LinkedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchLinkedAssets();
  }, [assetType, assetId]);

  const fetchLinkedAssets = async () => {
    try {
      setLoading(true);
      const assets = await relationshipsApi.getLinkedAssets(assetType, assetId);
      setLinkedAssets(assets);
      onChange?.(assets);
    } catch (error) {
      logger.log('Error fetching linked assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (relationshipId: string) => {
    if (!editable) return;
    
    try {
      await relationshipsApi.delete(relationshipId);
      fetchLinkedAssets();
    } catch (error) {
      logger.log('Error removing link:', error);
    }
  };

  const getAssetIcon = (type: AssetType) => {
    const icons: Record<AssetType, string> = {
      test_case: '📋',
      bug: '🐛',
      recording: '🎥',
      document: '📄',
      recommendation: '💡',
      sprint: '🚀',
      test_data: '📊'
    };
    return icons[type];
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading linked assets...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Linked Assets
        </label>
        {editable && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Link
          </button>
        )}
      </div>

      {linkedAssets.length === 0 ? (
        <div className="text-sm text-gray-500 italic">No linked assets</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {linkedAssets.map((asset) => (
            <div
              key={asset.relationship_id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
            >
              <span>{getAssetIcon(asset.asset_type)}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {asset.asset_title}
              </span>
              <span className="text-xs text-gray-500">
                ({asset.relationship_type})
              </span>
              {editable && (
                <button
                  type="button"
                  onClick={() => handleRemove(asset.relationship_id)}
                  className="text-gray-400 hover:text-red-600 ml-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <LinkAssetModal
          sourceType={assetType}
          sourceId={assetId}
          suiteId={suiteId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchLinkedAssets();
          }}
        />
      )}
    </div>
  );
}