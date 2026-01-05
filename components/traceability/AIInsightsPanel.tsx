// ============================================
// components/traceability/AIInsightsPanel.tsx
// Updated to show full item details
// ============================================
'use client';

import React, { useState } from 'react';
import { Brain, AlertTriangle, Lightbulb, Target, Zap, X, ChevronDown, ChevronUp, Bug, FileText } from 'lucide-react';
import type { AIInsight, TraceabilityData } from '@/types/traceability';

interface AIInsightsPanelProps {
  insights: AIInsight[];
  data: TraceabilityData;
  onDismiss?: (insightId: string) => void;
  onAction?: (insight: AIInsight) => void;
}

export function AIInsightsPanel({ insights, data, onDismiss, onAction }: AIInsightsPanelProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const toggleExpanded = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  const getItemDetails = (itemId: string) => {
    // Safety check for data
    if (!data || !data.testCases || !data.bugs) {
      return {
        title: itemId,
        type: 'Unknown',
        icon: Brain
      };
    }

    // Check if it's a test case
    const testCase = data.testCases.find(tc => tc.id === itemId);
    if (testCase) {
      return {
        title: testCase.title,
        type: 'Test Case',
        status: testCase.status,
        priority: testCase.priority,
        icon: FileText
      };
    }

    // Check if it's a bug
    const bug = data.bugs.find(b => b.id === itemId);
    if (bug) {
      return {
        title: bug.title,
        type: 'Bug',
        status: bug.status,
        severity: bug.severity,
        priority: bug.priority,
        icon: Bug
      };
    }

    // Fallback
    return {
      title: itemId,
      type: 'Unknown',
      icon: Brain
    };
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'optimization': return Target;
      case 'suggestion': return Lightbulb;
      default: return Brain;
    }
  };

  const getColors = (type: string, impact: string) => {
    if (type === 'critical' || impact === 'high') {
      return {
        bg: 'bg-error/10 border-error',
        icon: 'text-error',
        badge: 'bg-error text-white'
      };
    }
    if (type === 'warning' || impact === 'medium') {
      return {
        bg: 'bg-warning/10 border-warning',
        icon: 'text-warning',
        badge: 'bg-warning text-white'
      };
    }
    return {
      bg: 'bg-primary/10 border-primary',
      icon: 'text-primary',
      badge: 'bg-primary text-white'
    };
  };

  const getStatusColor = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'passed':
      case 'resolved':
      case 'closed':
        return 'text-success';
      case 'failed':
      case 'open':
        return 'text-error';
      case 'in_progress':
      case 'pending':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSeverityColor = (severity?: string | null) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-error';
      case 'high': return 'text-warning';
      case 'medium': return 'text-primary';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-success/10 border border-success rounded-lg p-6 text-center">
        <Zap className="w-12 h-12 text-success mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Perfect Traceability!
        </h3>
        <p className="text-sm text-muted-foreground">
          No issues detected. Your traceability matrix is well-maintained.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const Icon = getIcon(insight.type);
        const colors = getColors(insight.type, insight.impact);
        const isExpanded = expandedInsights.has(insight.id);

        return (
          <div
            key={insight.id}
            className={`${colors.bg} border rounded-lg p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      {insight.title}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {insight.impact.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  <div className="bg-muted/50 rounded p-2 text-xs text-foreground">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </div>
                  {insight.affectedItems.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Affects {insight.affectedItems.length} item(s)
                    </div>
                  )}
                </div>
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(insight.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {insight.affectedItems.length > 0 && (
              <>
                <button
                  onClick={() => toggleExpanded(insight.id)}
                  className="w-full mt-2 px-3 py-2 bg-background hover:bg-muted border border-border rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Affected Items
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      View {insight.affectedItems.length} Affected Item{insight.affectedItems.length === 1 ? '' : 's'}
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-3 bg-background border border-border rounded-lg p-3 space-y-2">
                    <h5 className="text-xs font-semibold text-foreground mb-2">
                      Affected Items:
                    </h5>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {insight.affectedItems.map((itemId, index) => {
                        const itemDetails = getItemDetails(itemId);
                        const ItemIcon = itemDetails.icon;

                        return (
                          <div
                            key={index}
                            className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border"
                          >
                            <div className="flex items-start gap-2">
                              <ItemIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-foreground truncate">
                                    {itemDetails.title}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 bg-background rounded text-muted-foreground flex-shrink-0">
                                    {itemDetails.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  {itemDetails.status && (
                                    <span className={`flex items-center gap-1 ${getStatusColor(itemDetails.status)}`}>
                                      Status: <span className="font-medium">{itemDetails.status}</span>
                                    </span>
                                  )}
                                  {itemDetails.severity && (
                                    <span className={`flex items-center gap-1 ${getSeverityColor(itemDetails.severity)}`}>
                                      Severity: <span className="font-medium">{itemDetails.severity}</span>
                                    </span>
                                  )}
                                  {itemDetails.priority && (
                                    <span className="text-muted-foreground">
                                      Priority: <span className="font-medium">{itemDetails.priority}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}