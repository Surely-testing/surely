

// ============================================
// FILE: app/dashboard/error.tsx
// ============================================
'use client'

import { useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { useRouter } from 'next/navigation'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Dashboard Error
          </h1>
          <p className="text-muted-foreground">
            We couldn't load your dashboard. This might be a temporary issue.
          </p>
        </div>

        {error.message && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-mono">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}