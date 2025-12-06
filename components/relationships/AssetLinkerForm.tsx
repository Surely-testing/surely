// ============================================
// components/relationships/AssetLinkerForm.tsx
// Asset linker specifically for forms (create/edit mode)
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AssetType } from '@/types/relationships.types';
import { Search, X, CheckSquare, Layers } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AssetOption {
  id: string;
  title: string;
  type: AssetType;
  metadata?: any;
}

interface AssetLinkerFormProps {
  suiteId: string;
  assetTypes: AssetType[]; // Which asset types to show (e.g., ['test_case', 'sprint'])
  selectedAssets: string[]; // Currently selected asset IDs
  onSelectionChange: (assetIds: string[]) => void;
  label?: string;
  className?: string;
}

export function AssetLinkerForm({
  suiteId,
  assetTypes,
  selectedAssets,
  onSelectionChange,
  label = 'Select Assets',
  className
}: AssetLinkerFormProps) {
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [suiteId, assetTypes]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const allAssets: AssetOption[] = [];

      for (const assetType of assetTypes) {
        const tableName = getTableName(assetType);
        const { data, error } = await (supabase
          .from(tableName as any)
          .select('*')
          .eq('suite_id', suiteId)
          .order('created_at', { ascending: false }) as any);

        if (error) {
          console.error(`Error fetching ${assetType}:`, error);
          continue;
        }

        const mappedAssets = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title || item.name || 'Untitled',
          type: assetType,
          metadata: item
        }));

        allAssets.push(...mappedAssets);
      }

      setAssets(allAssets);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTableName = (assetType: AssetType): string => {
    const tableMap: Record<AssetType, string> = {
      test_case: 'test_cases',
      bug: 'bugs',
      recording: 'recordings',
      document: 'documents',
      recommendation: 'recommendations',
      sprint: 'sprints',
      test_data: 'test_data'
    };
    return tableMap[assetType];
  };

  const getAssetIcon = (type: AssetType): React.ReactElement => {
    const icons: Record<AssetType, React.ReactElement> = {
      test_case: <CheckSquare className="w-4 h-4" />,
      sprint: <Layers className="w-4 h-4" />,
      bug: <span className="text-sm">🐛</span>,
      recording: <span className="text-sm">🎥</span>,
      document: <span className="text-sm">📄</span>,
      recommendation: <span className="text-sm">💡</span>,
      test_data: <span className="text-sm">📊</span>
    };
    return icons[type];
  };

  const getAssetTypeLabel = (type: AssetType): string => {
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

  const toggleAsset = (assetId: string) => {
    const newSelection = selectedAssets.includes(assetId)
      ? selectedAssets.filter(id => id !== assetId)
      : [...selectedAssets, assetId];
    onSelectionChange(newSelection);
  };

  const removeAsset = (assetId: string) => {
    onSelectionChange(selectedAssets.filter(id => id !== assetId));
  };

  const filteredAssets = assets.filter(asset =>
    asset.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAssetObjects = assets.filter(a => selectedAssets.includes(a.id));

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading available assets...
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="text-sm text-primary hover:underline"
        >
          {showSelector ? 'Hide' : 'Browse Assets'}
        </button>
      </div>

      {/* Selected Assets */}
      {selectedAssetObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          {selectedAssetObjects.map(asset => (
            <div
              key={asset.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-sm"
            >
              {getAssetIcon(asset.type)}
              <span className="font-medium">{asset.title}</span>
              <span className="text-xs text-muted-foreground">
                ({getAssetTypeLabel(asset.type)})
              </span>
              <button
                type="button"
                onClick={() => removeAsset(asset.id)}
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Asset Selector */}
      {showSelector && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="p-3 bg-muted border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {filteredAssets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No assets found
              </div>
            ) : (
              filteredAssets.map(asset => (
                <label
                  key={asset.id}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssets.includes(asset.id)}
                    onChange={() => toggleAsset(asset.id)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getAssetIcon(asset.type)}
                      <p className="font-medium text-foreground text-sm">
                        {asset.title}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {getAssetTypeLabel(asset.type)}
                      </span>
                    </div>
                    {asset.metadata?.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {asset.metadata.description}
                      </p>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}