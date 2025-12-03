// ============================================
// components/bugs/BugsView.tsx
// Main container with tabs: Bug Tracking | Suggestions
// Mobile-first responsive aligned with TestCasesView design
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Network, Upload, Plus, ChevronLeft } from 'lucide-react';
import { BugTracking } from './BugTracking';
import { Suggestions } from './Suggestions';
import { BugForm } from './BugForm';
import { createClient } from '@/lib/supabase/client';

interface BugsViewProps {
  suiteId: string;
}

type TabType = 'tracking' | 'suggestions';

export function BugsView({ suiteId }: BugsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tracking');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBugForm, setShowBugForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [bugsCount, setBugsCount] = useState(0);

  const tabs = [
    { id: 'tracking', label: 'Bug Tracking' },
    { id: 'suggestions', label: 'Suggestions' },
  ];

  // Fetch bugs count
  useEffect(() => {
    const fetchBugsCount = async () => {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from('bugs')
          .select('*', { count: 'exact', head: true })
          .eq('suite_id', suiteId);
        
        if (!error && count !== null) {
          setBugsCount(count);
        }
      } catch (error) {
        console.error('Error fetching bugs count:', error);
      }
    };

    if (suiteId) {
      fetchBugsCount();
    }
  }, [suiteId, refreshTrigger]);

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

  const handleToggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  // If form is open, show only the form
  if (showBugForm) {
    return (
      <div className="space-y-4 md:space-y-6">
        <BugForm
          suiteId={suiteId}
          bug={null}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Action Buttons - Matching TestCasesView */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Bugs
          </h1>
          <span className="text-sm text-muted-foreground">
            ({bugsCount})
          </span>
        </div>

        {/* Action Buttons Container - Matching TestCasesView */}
        <div className="relative overflow-hidden">
          <div className="flex items-center justify-end gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {/* Sliding Drawer */}
            <div
              className="flex items-center gap-2 transition-all duration-300 ease-in-out"
              style={{
                maxWidth: isDrawerOpen ? '1000px' : '0px',
                opacity: isDrawerOpen ? 1 : 0,
                marginRight: isDrawerOpen ? '0.5rem' : '0',
                pointerEvents: isDrawerOpen ? 'auto' : 'none',
              }}
            >
              <button
                type="button"
                onClick={handleTraceability}
                className="inline-flex items-center justify-center px-3 lg:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 whitespace-nowrap"
              >
                <Network className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Traceability</span>
              </button>

              <button
                type="button"
                onClick={handleImport}
                className="inline-flex items-center justify-center px-3 lg:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 whitespace-nowrap"
              >
                <Upload className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Import</span>
              </button>
            </div>

            {/* Always Visible Buttons */}
            <button
              type="button"
              onClick={handleToggleDrawer}
              className="inline-flex items-center justify-center p-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted hover:border-primary transition-all duration-200 flex-shrink-0"
              aria-label="Toggle menu"
            >
              <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${isDrawerOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>

            <button
              type="button"
              onClick={handleNewBug}
              className="btn-primary inline-flex items-center justify-center px-3 lg:px-4 py-2 text-sm font-semibold whitespace-nowrap"
            >
              <Plus className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">New Bug</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center p-2 lg:px-4 lg:py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-card shadow-theme-md rounded-lg overflow-hidden border border-border">
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
  );
}