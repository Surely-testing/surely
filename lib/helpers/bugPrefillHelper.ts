// ============================================
// lib/helpers/bugPrefillHelper.ts
// Convert AI Insights to Bug Form Data
// ============================================

import type { AIInsight } from '@/components/ai/AIInsights';
import type { BugFormData, BugSeverity, BugPriority } from '@/types/bug.types';

export interface BugPrefillData extends BugFormData {
  // Additional fields for pre-filling
  recordingId?: string;
  recordingTitle?: string;
  aiInsightId?: string;
}

/**
 * Convert AI Insight to Bug Form Data
 */
export function convertInsightToBugData(
  insight: AIInsight,
  recordingId: string,
  recordingMetadata?: {
    browser?: string;
    os?: string;
    environment?: string;
    consoleLogs?: any[];
    networkLogs?: any[];
  }
): BugPrefillData {
  // Map AI severity to Bug severity
  const severity = mapSeverityToBugSeverity(insight.severity);
  
  // Map AI severity to Bug priority (you can adjust this logic)
  const priority = mapSeverityToBugPriority(insight.severity);
  
  // Extract steps to reproduce from AI recommendations
  const stepsToReproduce = extractStepsFromInsight(insight);
  
  // Build technical details section
  const technicalDetails = buildTechnicalDetails(insight, recordingMetadata);
  
  // Create description with AI context
  const description = buildBugDescription(insight, technicalDetails);
  
  return {
    title: insight.title,
    description,
    severity,
    priority,
    status: 'open',
    steps_to_reproduce: stepsToReproduce,
    expected_behavior: extractExpectedBehavior(insight),
    actual_behavior: extractActualBehavior(insight),
    environment: recordingMetadata?.environment || 'Not specified',
    browser: recordingMetadata?.browser || 'Unknown',
    os: recordingMetadata?.os || 'Unknown',
    linked_recording_id: recordingId,
    tags: extractTagsFromInsight(insight),
    recordingId,
    aiInsightId: insight.id,
  };
}

/**
 * Map AI severity to Bug severity
 */
function mapSeverityToBugSeverity(aiSeverity: string): BugSeverity {
  const severityMap: Record<string, BugSeverity> = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low',
    'info': 'low'
  };
  
  return severityMap[aiSeverity.toLowerCase()] || 'medium';
}

/**
 * Map AI severity to Bug priority
 */
function mapSeverityToBugPriority(aiSeverity: string): BugPriority {
  const priorityMap: Record<string, BugPriority> = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low',
    'info': 'low'
  };
  
  return priorityMap[aiSeverity.toLowerCase()] || 'medium';
}

/**
 * Extract steps to reproduce from AI insight
 */
function extractStepsFromInsight(insight: AIInsight) {
  const steps: Array<{ id: string; order: number; description: string }> = [];
  
  // Try to extract from recommendations
  if (insight.recommendations && insight.recommendations.length > 0) {
    insight.recommendations.forEach((rec, index) => {
      // Only include recommendations that look like reproduction steps
      if (isReproductionStep(rec)) {
        steps.push({
          id: `step_${index + 1}`,
          order: index + 1,
          description: rec
        });
      }
    });
  }
  
  // If no steps found, create a generic step
  if (steps.length === 0) {
    steps.push({
      id: 'step_1',
      order: 1,
      description: `Navigate to the application and perform the action that triggers: ${insight.title}`
    });
    
    steps.push({
      id: 'step_2',
      order: 2,
      description: `Observe the error at timestamp ${formatTime(insight.time)} in the recording`
    });
  }
  
  return steps;
}

/**
 * Check if a recommendation looks like a reproduction step
 */
function isReproductionStep(text: string): boolean {
  const stepIndicators = [
    'click',
    'navigate',
    'enter',
    'select',
    'open',
    'close',
    'submit',
    'verify',
    'check',
    'observe',
    'trigger'
  ];
  
  const lowerText = text.toLowerCase();
  return stepIndicators.some(indicator => lowerText.includes(indicator));
}

/**
 * Build comprehensive bug description
 */
function buildBugDescription(
  insight: AIInsight,
  technicalDetails: string
): string {
  return `${insight.description}

**AI Analysis Confidence:** ${Math.round(insight.confidence * 100)}%
**Category:** ${insight.category}
**Detected at:** ${formatTime(insight.time)} in recording

${technicalDetails}

**AI Recommendations:**
${insight.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}`;
}

/**
 * Build technical details section
 */
function buildTechnicalDetails(
  insight: AIInsight,
  recordingMetadata?: {
    consoleLogs?: any[];
    networkLogs?: any[];
  }
): string {
  let details = '\n**Technical Details:**\n';
  
  // Add error type specific details
  if (insight.type === 'error' || insight.type === 'network') {
    details += `Error Type: ${insight.type}\n`;
  }
  
  // Add console error if available
  if (recordingMetadata?.consoleLogs) {
    const relevantLogs = findRelevantConsoleLogs(
      recordingMetadata.consoleLogs,
      insight.time
    );
    
    if (relevantLogs.length > 0) {
      details += `\nConsole Errors:\n`;
      relevantLogs.forEach(log => {
        details += `- [${log.type}] ${log.message}\n`;
      });
    }
  }
  
  // Add network error if available
  if (recordingMetadata?.networkLogs && insight.type === 'network') {
    const relevantNetworkLogs = findRelevantNetworkLogs(
      recordingMetadata.networkLogs,
      insight.time
    );
    
    if (relevantNetworkLogs.length > 0) {
      details += `\nNetwork Failures:\n`;
      relevantNetworkLogs.forEach(log => {
        details += `- ${log.method} ${log.url} - Status: ${log.status}\n`;
      });
    }
  }
  
  return details;
}

/**
 * Find console logs near the insight timestamp
 */
function findRelevantConsoleLogs(
  logs: any[],
  insightTime: number,
  windowSeconds: number = 5
): any[] {
  return logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime() / 1000;
    return Math.abs(logTime - insightTime) <= windowSeconds && 
           (log.type === 'error' || log.type === 'warn');
  });
}

/**
 * Find network logs near the insight timestamp
 */
function findRelevantNetworkLogs(
  logs: any[],
  insightTime: number,
  windowSeconds: number = 5
): any[] {
  return logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime() / 1000;
    return Math.abs(logTime - insightTime) <= windowSeconds && 
           log.status && log.status >= 400;
  });
}

/**
 * Extract expected behavior from insight
 */
function extractExpectedBehavior(insight: AIInsight): string {
  // Try to infer expected behavior from insight description
  if (insight.type === 'error') {
    return 'The operation should complete successfully without errors';
  }
  
  if (insight.type === 'network') {
    return 'The network request should complete successfully with a 2xx status code';
  }
  
  if (insight.type === 'performance') {
    return 'The operation should complete within acceptable time limits';
  }
  
  return 'The feature should function as designed without issues';
}

/**
 * Extract actual behavior from insight
 */
function extractActualBehavior(insight: AIInsight): string {
  return insight.description;
}

/**
 * Extract relevant tags from insight
 */
function extractTagsFromInsight(insight: AIInsight): string[] {
  const tags: string[] = [];
  
  // Add type-based tags
  tags.push(insight.type);
  
  // Add severity tag
  tags.push(insight.severity);
  
  // Add category tag
  if (insight.category) {
    tags.push(insight.category);
  }
  
  // Add AI-detected tag
  tags.push('ai-detected');
  
  return tags;
}

/**
 * Format time from seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  const min = Math.floor(seconds / 60).toString();
  return `${min}:${sec}`;
}

/**
 * Generate a summary of all insights for bulk bug creation
 */
export function generateInsightsSummary(insights: AIInsight[]): string {
  const critical = insights.filter(i => i.severity === 'critical').length;
  const high = insights.filter(i => i.severity === 'high').length;
  
  return `
**AI Analysis Summary**
Total Issues Detected: ${insights.length}
- Critical: ${critical}
- High: ${high}
- Medium: ${insights.filter(i => i.severity === 'medium').length}
- Low: ${insights.filter(i => i.severity === 'low').length}

**Issue Breakdown:**
${insights.map((insight, i) => 
  `${i + 1}. [${insight.severity.toUpperCase()}] ${insight.title} @ ${formatTime(insight.time)}`
).join('\n')}
  `.trim();
}