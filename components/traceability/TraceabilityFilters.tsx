// ============================================
// components/traceability/TraceabilityFilters.tsx
// ============================================
'use client';

import React from 'react';
import { Search } from 'lucide-react';
import type { ViewType, FilterLevel } from '@/types/traceability';

interface TraceabilityFiltersProps {
  viewType: ViewType;
  setViewType: (type: ViewType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterLevel: FilterLevel;
  setFilterLevel: (level: FilterLevel) => void;
}

export function TraceabilityFilters({
  viewType,
  setViewType,
  searchQuery,
  setSearchQuery,
  filterLevel,
  setFilterLevel
}: TraceabilityFiltersProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* View Type */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('matrix')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              viewType === 'matrix'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary'
            }`}
          >
            Matrix View
          </button>
          <button
            onClick={() => setViewType('coverage')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              viewType === 'coverage'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary'
            }`}
          >
            Coverage
          </button>
          <button
            onClick={() => setViewType('gaps')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              viewType === 'gaps'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary'
            }`}
          >
            Gaps
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search test cases or bugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
          />
        </div>

        {/* Filter Level */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterLevel('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              filterLevel === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterLevel('linked')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              filterLevel === 'linked'
                ? 'bg-success text-white border-success'
                : 'bg-background text-foreground border-border hover:border-success'
            }`}
          >
            Linked
          </button>
          <button
            onClick={() => setFilterLevel('unlinked')}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              filterLevel === 'unlinked'
                ? 'bg-error text-white border-error'
                : 'bg-background text-foreground border-border hover:border-error'
            }`}
          >
            Unlinked
          </button>
        </div>
      </div>
    </div>
  );
}