// ============================================
// components/reports/ReportMetricsChart.tsx
// Reusable metrics and chart visualization component
// ============================================
'use client';

interface ReportMetrics {
  // Test Coverage
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  coveragePercentage?: number;
  
  // Bug Trends
  totalBugs?: number;
  openBugs?: number;
  resolvedBugs?: number;
  criticalBugs?: number;
  criticalResolved?: number;
  criticalUnresolved?: number;
  
  // Sprint Summary
  sprintVelocity?: number;
  completedStories?: number;
  inProgressStories?: number;
  
  // Team Performance
  teamMembers?: number;
  activeMembers?: number;
  avgContribution?: number;
}

interface ReportMetricsChartProps {
  type: string;
  metrics: ReportMetrics;
}

export function ReportMetricsChart({ type, metrics }: ReportMetricsChartProps) {
  const renderMetricCard = (label: string, value: any, color: string = 'text-gray-900') => {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className={`text-2xl font-bold ${color}`}>
          {typeof value === 'number' ? value.toLocaleString() : value || '—'}
        </div>
      </div>
    );
  };

  const renderTestCoverageMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {renderMetricCard('Total Tests', metrics.totalTests)}
      {renderMetricCard('Passed', metrics.passedTests, 'text-green-600')}
      {renderMetricCard('Failed', metrics.failedTests, 'text-red-600')}
      {renderMetricCard('Coverage', `${metrics.coveragePercentage}%`, 'text-blue-600')}
    </div>
  );

  const renderBugTrendsMetrics = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {renderMetricCard('Total Bugs', metrics.totalBugs)}
        {renderMetricCard('Open', metrics.openBugs, 'text-red-600')}
        {renderMetricCard('Resolved', metrics.resolvedBugs, 'text-green-600')}
        {renderMetricCard('Critical', metrics.criticalBugs, 'text-orange-500')}
      </div>
      {metrics.criticalResolved !== undefined && (
        <div className="grid grid-cols-2 gap-3">
          {renderMetricCard('Critical Resolved', metrics.criticalResolved, 'text-green-600')}
          {renderMetricCard('Critical Needing Attention', metrics.criticalUnresolved, 'text-red-600')}
        </div>
      )}
    </div>
  );

  const renderSprintMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {renderMetricCard('Velocity', metrics.sprintVelocity)}
      {renderMetricCard('Completed Stories', metrics.completedStories, 'text-green-600')}
      {renderMetricCard('In Progress', metrics.inProgressStories, 'text-blue-600')}
    </div>
  );

  const renderTeamMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {renderMetricCard('Team Members', metrics.teamMembers)}
      {renderMetricCard('Active Members', metrics.activeMembers, 'text-green-600')}
      {renderMetricCard('Avg Contribution', metrics.avgContribution)}
    </div>
  );

  const renderTestCoverageChart = () => (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold mb-4">Test Results Distribution</h4>
      <div className="flex items-end justify-around h-48 gap-4">
        <div className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-green-500 rounded-t transition-all"
            style={{ height: `${((metrics.passedTests || 0) / (metrics.totalTests || 1) * 100)}%` }}
          />
          <div className="text-xs font-medium mt-2">Passed</div>
          <div className="text-lg font-bold text-green-600">{metrics.passedTests || 0}</div>
        </div>
        <div className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-red-500 rounded-t transition-all"
            style={{ height: `${((metrics.failedTests || 0) / (metrics.totalTests || 1) * 100)}%` }}
          />
          <div className="text-xs font-medium mt-2">Failed</div>
          <div className="text-lg font-bold text-red-600">{metrics.failedTests || 0}</div>
        </div>
      </div>
    </div>
  );

  const renderBugTrendsChart = () => {
    const totalBugs = metrics.totalBugs || 1;
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold mb-4">Bug Status Overview</h4>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Open Bugs</span>
              <span className="font-semibold">
                {metrics.openBugs || 0} ({Math.round(((metrics.openBugs || 0) / totalBugs) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all"
                style={{ width: `${((metrics.openBugs || 0) / totalBugs) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Resolved Bugs</span>
              <span className="font-semibold">
                {metrics.resolvedBugs || 0} ({Math.round(((metrics.resolvedBugs || 0) / totalBugs) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${((metrics.resolvedBugs || 0) / totalBugs) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Critical Bugs</span>
              <span className="font-semibold">
                {metrics.criticalBugs || 0} ({Math.round(((metrics.criticalBugs || 0) / totalBugs) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-orange-500 h-3 rounded-full transition-all"
                style={{ width: `${((metrics.criticalBugs || 0) / totalBugs) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSprintChart = () => (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h4 className="text-sm font-semibold mb-4">Sprint Progress</h4>
      <div className="flex items-end justify-around h-48 gap-4">
        <div className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-blue-500 rounded-t transition-all"
            style={{ height: `${((metrics.sprintVelocity || 0) / 100 * 100) || 50}%` }}
          />
          <div className="text-xs font-medium mt-2">Velocity</div>
          <div className="text-lg font-bold text-blue-600">{metrics.sprintVelocity || 0}</div>
        </div>
        <div className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-green-500 rounded-t transition-all"
            style={{ height: `${((metrics.completedStories || 0) / 20 * 100) || 70}%` }}
          />
          <div className="text-xs font-medium mt-2">Completed</div>
          <div className="text-lg font-bold text-green-600">{metrics.completedStories || 0}</div>
        </div>
        <div className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-yellow-500 rounded-t transition-all"
            style={{ height: `${((metrics.inProgressStories || 0) / 10 * 100) || 40}%` }}
          />
          <div className="text-xs font-medium mt-2">In Progress</div>
          <div className="text-lg font-bold text-yellow-600">{metrics.inProgressStories || 0}</div>
        </div>
      </div>
    </div>
  );

  const renderTeamChart = () => {
    const activePercentage = Math.round(((metrics.activeMembers || 0) / (metrics.teamMembers || 1)) * 100);
    const circumference = 251.2;
    const dashArray = `${(activePercentage / 100) * circumference} ${circumference}`;
    
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold mb-4">Team Activity</h4>
        <div className="flex items-center justify-center h-48">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeDasharray={dashArray}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-blue-600">
                {activePercentage}%
              </div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMetrics = () => {
    switch (type) {
      case 'test_coverage':
        return renderTestCoverageMetrics();
      case 'bug_trends':
        return renderBugTrendsMetrics();
      case 'sprint_summary':
        return renderSprintMetrics();
      case 'team_performance':
        return renderTeamMetrics();
      default:
        return (
          <div className="text-center py-8 text-sm text-gray-500">
            No metrics available
          </div>
        );
    }
  };

  const renderChart = () => {
    switch (type) {
      case 'test_coverage':
        return renderTestCoverageChart();
      case 'bug_trends':
        return renderBugTrendsChart();
      case 'sprint_summary':
        return renderSprintChart();
      case 'team_performance':
        return renderTeamChart();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h3>
        {renderMetrics()}
      </div>

      {/* Chart Visualization */}
      {renderChart() && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Visual Analysis</h3>
          {renderChart()}
        </div>
      )}
    </div>
  );
}