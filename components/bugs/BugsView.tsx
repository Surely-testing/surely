// ============================================
// components/bugs/BugsView.tsx
// Main container with tabs: Bug Tracking | Suggestions
// Mobile-first responsive with system colors
// ============================================
'use client';

import { useState } from 'react';
import { RefreshCw, Network, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BugTracking } from './BugTracking';
import { Suggestions } from './Suggestions';

interface BugsViewProps {
  suiteId: string;
}

type TabType = 'tracking' | 'suggestions';

export function BugsView({ suiteId }: BugsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tracking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabs = [
    { id: 'tracking', label: 'Bug Tracking' },
    { id: 'suggestions', label: 'Suggestions' },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Refresh based on active tab
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTraceability = () => {
    console.log('Show traceability view');
  };

  const handleImport = () => {
    console.log('Open import dialog');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section - Mobile First */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs Navigation - Scrollable on mobile */}
        <div className="border-b border-border overflow-x-auto">
          <nav className="flex gap-4 sm:gap-6 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-1 py-2 sm:py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons - Only show on Bug Tracking tab */}
        {activeTab === 'tracking' && (
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTraceability}
              className="flex-1 sm:flex-none"
            >
              <Network className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Traceability</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="flex-1 sm:flex-none"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'tracking' && (
          <BugTracking suiteId={suiteId} onRefresh={handleRefresh} />
        )}
        {activeTab === 'suggestions' && (
          <Suggestions suiteId={suiteId} onRefresh={handleRefresh} />
        )}
      </div>
    </div>
  );
}