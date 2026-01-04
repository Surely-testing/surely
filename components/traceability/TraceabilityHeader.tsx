// ============================================
// components/traceability/TraceabilityHeader.tsx
// ============================================
'use client';

import React from 'react';
import { Network, Download, RefreshCw, X } from 'lucide-react';

interface TraceabilityHeaderProps {
  onExport: () => void;
  onRefresh: () => void;
  onClose?: () => void;
  isLoading: boolean;
}

export function TraceabilityHeader({ onExport, onRefresh, onClose, isLoading }: TraceabilityHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Network className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Traceability Matrix</h1>
        </div>
        <p className="text-muted-foreground">
          Comprehensive coverage analysis and relationship mapping
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-all"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        )}
      </div>
    </div>
  );
}

