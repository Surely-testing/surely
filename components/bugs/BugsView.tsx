// ============================================
// components/bugs/BugsView.tsx
// Main container with tabs: Bug Tracking | Suggestions
// ============================================
'use client';

import { useState } from 'react';
import { BugTracking } from './BugTracking';
import { Suggestions } from './Suggestions';

interface BugsViewProps {
  suiteId: string;
}

type TabType = 'tracking' | 'suggestions';

export function BugsView({ suiteId }: BugsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tracking');

  const tabs = [
    { id: 'tracking', label: 'Bug Tracking' },
    { id: 'suggestions', label: 'Suggestions' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'tracking' && <BugTracking suiteId={suiteId} />}
      {activeTab === 'suggestions' && <Suggestions suiteId={suiteId} />}
    </div>
  );
}
