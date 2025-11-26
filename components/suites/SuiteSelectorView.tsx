// ============================================
// components/dashboard/SuiteSwitcher.tsx (FIXED)
// ============================================
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTestSuites } from '@/lib/hooks/useTestSuites';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { CreateSuitePortal } from '@/components/suites/CreateSuitePortal';
import { ChevronDown, Plus, Check } from 'lucide-react';

interface SuiteSwitcherProps {
  currentSuiteId: string;
  userId: string; // Add userId prop
}

export function SuiteSwitcher({ currentSuiteId, userId }: SuiteSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatePortalOpen, setIsCreatePortalOpen] = useState(false);
  const router = useRouter();
  const { suites, isLoading } = useTestSuites();

  const currentSuite = suites?.find(s => s.id === currentSuiteId);

  const handleSuiteChange = (suiteId: string) => {
    setIsOpen(false);
    router.push(`/${suiteId}`);
  };

  const handleCreateSuite = () => {
    setIsOpen(false);
    setIsCreatePortalOpen(true);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-semibold text-sm">
                {currentSuite?.name.charAt(0).toUpperCase() || 'S'}
              </span>
            </div>
            <div className="text-left min-w-0">
              <p className="font-medium text-foreground truncate">
                {currentSuite?.name || 'Select Suite'}
              </p>
              <p className="text-xs text-muted-foreground">
                Current Suite
              </p>
            </div>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg shadow-theme-lg border border-border z-50 max-h-96 overflow-hidden">
              {isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div className="p-2 max-h-80 overflow-y-auto">
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Your Suites
                    </p>
                    {suites && suites.length > 0 ? (
                      suites.map((suite) => (
                        <button
                          key={suite.id}
                          onClick={() => handleSuiteChange(suite.id)}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                              <span className="text-primary-foreground font-semibold text-sm">
                                {suite.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="text-left min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {suite.name}
                              </p>
                              {suite.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                  {suite.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {suite.id === currentSuiteId && (
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No suites found
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border p-2 bg-muted/30">
                    <button
                      onClick={handleCreateSuite}
                      className="w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-primary hover:bg-primary/5 active:scale-[0.98] border border-dashed border-primary/30 hover:border-primary/50"
                    >
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span>Create New Suite</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Suite Portal */}
      <CreateSuitePortal
        userId={userId}
        isOpen={isCreatePortalOpen}
        onClose={() => setIsCreatePortalOpen(false)}
        onSuccess={(suiteId) => {
          // Navigate to the new suite or refresh
          router.push(`/${suiteId}`);
          router.refresh();
        }}
      />
    </>
  );
}