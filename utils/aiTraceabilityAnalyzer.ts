
// ============================================
// utils/aiTraceabilityAnalyzer.ts
// ============================================
import type { TraceabilityData, CoverageStats, AIInsight } from '@/types/traceability';

export class AITraceabilityAnalyzer {
  static analyzeTraceability(
    data: TraceabilityData,
    stats: CoverageStats
  ): AIInsight[] {
    const insights: AIInsight[] = [];

    // Critical: High-severity bugs without test cases
    const criticalBugsUnlinked = data.bugs.filter(
      b => (b.severity === 'critical' || b.severity === 'high') && 
      b.linkedTestCases.length === 0
    );
    if (criticalBugsUnlinked.length > 0) {
      insights.push({
        id: 'critical-bugs-unlinked',
        type: 'critical',
        title: 'Critical Bugs Without Test Coverage',
        description: `${criticalBugsUnlinked.length} high-severity bug(s) are not linked to any test cases. This creates a traceability gap and makes it difficult to verify fixes.`,
        impact: 'high',
        recommendation: 'Link these bugs to existing test cases or create new test cases to ensure proper coverage and verification.',
        affectedItems: criticalBugsUnlinked.map(b => b.id)
      });
    }

    // Warning: Low test case coverage
    if (stats.testCaseCoverage < 50) {
      insights.push({
        id: 'low-coverage',
        type: 'warning',
        title: 'Low Test Case Bug Coverage',
        description: `Only ${stats.testCaseCoverage}% of test cases are linked to bugs. This suggests potential gaps in defect documentation or test effectiveness.`,
        impact: 'medium',
        recommendation: 'Review test cases without bugs to ensure they are properly documenting failures or consider if additional testing is needed.',
        affectedItems: data.testCases.filter(tc => tc.linkedBugs.length === 0).map(tc => tc.id)
      });
    }

    // Optimization: Test cases with multiple bugs
    const testCasesWithManyBugs = data.testCases.filter(tc => tc.linkedBugs.length > 3);
    if (testCasesWithManyBugs.length > 0) {
      insights.push({
        id: 'complex-test-cases',
        type: 'optimization',
        title: 'Test Cases with Multiple Bugs',
        description: `${testCasesWithManyBugs.length} test case(s) have more than 3 linked bugs, indicating potential complexity or instability in tested features.`,
        impact: 'medium',
        recommendation: 'Consider breaking down complex test cases or prioritizing bug fixes for these areas to improve stability.',
        affectedItems: testCasesWithManyBugs.map(tc => tc.id)
      });
    }

    // Suggestion: Failed test cases without bugs
    const failedTestsNoBugs = data.testCases.filter(
      tc => tc.status === 'failed' && tc.linkedBugs.length === 0
    );
    if (failedTestsNoBugs.length > 0) {
      insights.push({
        id: 'failed-no-bugs',
        type: 'suggestion',
        title: 'Failed Tests Without Bug Reports',
        description: `${failedTestsNoBugs.length} failed test case(s) don't have linked bugs. These failures should be investigated and documented.`,
        impact: 'high',
        recommendation: 'Create bug reports for these failures or update test case status if the issues have been resolved.',
        affectedItems: failedTestsNoBugs.map(tc => tc.id)
      });
    }

    // Optimization: Recording usage
    if (stats.recordingsLinked < data.recordings.length * 0.3) {
      insights.push({
        id: 'low-recording-usage',
        type: 'optimization',
        title: 'Underutilized Test Recordings',
        description: `Only ${stats.recordingsLinked} out of ${data.recordings.length} recordings are linked to bugs. Recordings can significantly improve bug reproduction.`,
        impact: 'low',
        recommendation: 'Attach relevant recordings to bugs to provide visual context and improve debugging efficiency.',
        affectedItems: []
      });
    }

    // Suggestion: Open bugs without test cases
    const openBugsNoTests = data.bugs.filter(
      b => b.status === 'open' && b.linkedTestCases.length === 0
    );
    if (openBugsNoTests.length > 0) {
      insights.push({
        id: 'open-bugs-no-tests',
        type: 'suggestion',
        title: 'Open Bugs Need Test Coverage',
        description: `${openBugsNoTests.length} open bug(s) aren't linked to test cases, making regression testing difficult.`,
        impact: 'medium',
        recommendation: 'Create or link test cases to verify these bugs are fixed before closing them.',
        affectedItems: openBugsNoTests.map(b => b.id)
      });
    }

    // Optimization: Perfect coverage celebration
    if (stats.testCaseCoverage === 100 && stats.bugCoverage === 100) {
      insights.push({
        id: 'perfect-coverage',
        type: 'optimization',
        title: 'Excellent Traceability Coverage!',
        description: 'Your project has 100% traceability coverage. All test cases and bugs are properly linked.',
        impact: 'low',
        recommendation: 'Maintain this coverage level as you add new test cases and bugs.',
        affectedItems: []
      });
    }

    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  static async generateAIRecommendations(
    data: TraceabilityData,
    stats: CoverageStats
  ): Promise<AIInsight[]> {
    // This would call your AI service in production
    // For now, return the rule-based insights
    return this.analyzeTraceability(data, stats);
  }
}
