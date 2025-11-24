// ============================================
// components/dashboard/SuiteSwitcher.tsx
// ============================================
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTestSuites } from '@/lib/hooks/useTestSuites';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ChevronDown, Plus, Check } from 'lucide-react';

interface SuiteSwitcherProps {
  currentSuiteId: string;
}

export function SuiteSwitcher({ currentSuiteId }: SuiteSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { suites, isLoading } = useTestSuites();


  const currentSuite = suites?.find(s => s.id === currentSuiteId);

  const handleSuiteChange = (suiteId: string) => {
    setIsOpen(false);
    router.push(`/${suiteId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {currentSuite?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-left min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {currentSuite?.name || 'Select Suite'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Current Suite
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Your Suites
                  </p>
                  {suites && suites.length > 0 ? (
                    suites.map((suite) => (
                      <button
                        key={suite.id}
                        onClick={() => handleSuiteChange(suite.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {suite.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {suite.name}
                            </p>
                            {suite.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {suite.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {suite.id === currentSuiteId && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No suites found
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/suites/new');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Suite
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}