// ============================================
// components/bugs/BugGrid.tsx
// Grid/Card view for bugs with theme colors
// ============================================
'use client';

import { BugWithCreator, BugSeverity, BugStatus } from '@/types/bug.types';

interface BugGridProps {
  bugs: BugWithCreator[];
  onSelect: (bug: BugWithCreator) => void;
}

export function BugGrid({ bugs, onSelect }: BugGridProps) {
  const getSeverityColor = (severity: BugSeverity | null) => {
    switch (severity) {
      case 'critical': return 'text-error bg-error/10 border-error/20';
      case 'high': return 'text-warning bg-warning/10 border-warning/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-600/10 border-yellow-600/20';
      case 'low': return 'text-primary bg-primary/10 border-primary/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusColor = (status: BugStatus | null) => {
    switch (status) {
      case 'open': return 'text-error bg-error/10 border-error/20';
      case 'in_progress': return 'text-primary bg-primary/10 border-primary/20';
      case 'resolved': return 'text-success bg-success/10 border-success/20';
      case 'closed': return 'text-muted-foreground bg-muted border-border';
      case 'reopened': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bugs.map((bug) => (
        <div
          key={bug.id}
          onClick={() => onSelect(bug)}
          className="p-4 border border-border rounded-lg hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer bg-card group"
        >
          <div className="flex items-start justify-between mb-3 gap-2">
            <h3 className="font-semibold text-foreground flex-1 line-clamp-2 group-hover:text-primary transition-colors">
              {bug.title}
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 border ${getSeverityColor(bug.severity)}`}>
              {bug.severity || 'N/A'}
            </span>
          </div>

          {bug.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {bug.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(bug.status)}`}>
              {bug.status || 'open'}
            </span>
            {bug.creator && (
              <div className="flex items-center gap-2">
                {bug.creator.avatar_url ? (
                  <img 
                    src={bug.creator.avatar_url} 
                    alt={bug.creator.name} 
                    className="w-6 h-6 rounded-full ring-2 ring-border"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary ring-2 ring-border">
                    {bug.creator.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {bug.creator.name.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}