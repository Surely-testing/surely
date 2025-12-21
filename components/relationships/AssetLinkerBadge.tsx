// ============================================
// components/relationships/AssetLinkerCompact.tsx
// Compact version for tables and inline use
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import { relationshipsApi } from '@/lib/api/relationships';
import { LinkedAsset, AssetType } from '@/types/relationships.types';
import { Link as LinkIcon, ExternalLink, Plus } from 'lucide-react';
import LinkAssetModal from './LinkAssetsModal';
import { logger } from '@/lib/utils/logger';

interface AssetLinkerCompactProps {
  assetType: AssetType;
  assetId: string;
  suiteId: string;
  maxDisplay?: number; // How many to show before "+X more"
  onLink?: () => void;
}

export function AssetLinkerCompact({ 
  assetType, 
  assetId, 
  suiteId, 
  maxDisplay = 2,
  onLink 
}: AssetLinkerCompactProps) {
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
    } catch (error) {
      logger.log('Error fetching linked assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssetTypeColor = (type: AssetType) => {
    const colors: Record<AssetType, string> = {
      test_case: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      recording: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      document: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      recommendation: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      sprint: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      test_data: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
    };
    return colors[type];
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <LinkIcon className="w-3 h-3 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  const displayAssets = linkedAssets.slice(0, maxDisplay);
  const remainingCount = linkedAssets.length - maxDisplay;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {linkedAssets.length === 0 ? (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Plus className="w-3 h-3" />
          <span>Link</span>
        </button>
      ) : (
        <>
          {displayAssets.map((asset) => (
            <a
              key={asset.relationship_id}
              href={`/${suiteId}/${asset.asset_type}s/${asset.asset_id}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getAssetTypeColor(asset.asset_type)} hover:opacity-80 transition-opacity`}
              title={asset.asset_title}
            >
              <span className="truncate max-w-[100px]">{asset.asset_title}</span>
              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
            </a>
          ))}
          {remainingCount > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              +{remainingCount} more
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Link asset"
          >
            <Plus className="w-3 h-3" />
          </button>
        </>
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
            onLink?.();
          }}
        />
      )}
    </div>
  );
}
