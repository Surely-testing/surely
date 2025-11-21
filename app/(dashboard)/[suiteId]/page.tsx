// ============================================
// FILE: components/suites/SuiteOverview.tsx
// ============================================

interface SuiteOverviewProps {
  suiteId: string
  stats: {
    testCases: number
    bugs: number
    sprints: number
  }
  recentTestCases: {
    id: string
    title: string
    created_at: string | null
    created_by: string
  }[]
  recentBugs: {
    id: string
    title: string
    severity: string | null
    status: string | null
    created_at: string | null
  }[]
}

export default function SuiteOverview({
  suiteId,
  stats,
  recentTestCases,
  recentBugs,
}: SuiteOverviewProps) {
  return (
    <div>
      {/* Your component JSX */}
      <h1>Suite: {suiteId}</h1>
      
      <div className="stats">
        <div>Test Cases: {stats.testCases}</div>
        <div>Bugs: {stats.bugs}</div>
        <div>Sprints: {stats.sprints}</div>
      </div>

      <div className="recent-activity">
        <h2>Recent Test Cases</h2>
        {recentTestCases.map((tc) => (
          <div key={tc.id}>{tc.title}</div>
        ))}

        <h2>Recent Bugs</h2>
        {recentBugs.map((bug) => (
          <div key={bug.id}>{bug.title}</div>
        ))}
      </div>
    </div>
  )
}