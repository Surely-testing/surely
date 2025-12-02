// ============================================
// FILE: app/loading.tsx
// ============================================
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}


