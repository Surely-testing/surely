// ============================================
// components/bugs/BugsView.tsx
// Main container with tabs: Bug Tracking | Suggestions
// Mobile-first responsive with system colors
// ============================================
'use client';

import { useState } from 'react';
import { RefreshCw, Network, Upload, Plus } from 'lucide-react';
import { BugTracking } from './BugTracking';
import { Suggestions } from './Suggestions';
import { BugForm } from './BugForm';

interface BugsViewProps {
  suiteId: string;
}

type TabType = 'tracking' | 'suggestions';

export function BugsView({ suiteId }: BugsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tracking');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBugForm, setShowBugForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = [
    { id: 'tracking', label: 'Bug Tracking' },
    { id: 'suggestions', label: 'Suggestions' },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTraceability = () => {
    console.log('Show traceability view');
  };

  const handleImport = () => {
    console.log('Open import dialog');
  };

  const handleNewBug = () => {
    setShowBugForm(true);
  };

  const handleFormSuccess = () => {
    setShowBugForm(false);
    handleRefresh();
  };

  const handleFormCancel = () => {
    setShowBugForm(false);
  };

  // If form is open, show only the form
  if (showBugForm) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto lg:px-2">
          <BugForm
            suiteId={suiteId}
            bug={null}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto lg:px-2">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Bugs
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Action Buttons - Only show on Bug Tracking tab */}
              {activeTab === 'tracking' && (
                <>
                  <button
                    onClick={handleTraceability}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200"
                  >
                    <Network className="w-4 h-4" />
                    <span className="hidden sm:inline">Traceability</span>
                  </button>

                  <button
                    onClick={handleImport}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Import</span>
                  </button>
                </>
              )}

              {/* New Bug Button - Always visible */}
              <button
                onClick={handleNewBug}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white btn-primary rounded-lg hover:bg-primary/90 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>New Bug</span>
              </button>

              {/* Refresh Button - Icon Only, Extreme Right */}
              {activeTab === 'tracking' && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center w-10 h-10 text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-card shadow-theme-md rounded-lg overflow-hidden border border-border mb-6">
          <div className="border-b border-border">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-0">
            {activeTab === 'tracking' && (
              <BugTracking 
                key={refreshTrigger}
                suiteId={suiteId} 
                onRefresh={handleRefresh}
              />
            )}
            {activeTab === 'suggestions' && (
              <Suggestions suiteId={suiteId} onRefresh={handleRefresh} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}