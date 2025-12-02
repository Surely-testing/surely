// ============================================
// FILE: components/documents/FloatingTOC.tsx
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronDown, List, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FloatingTOC({ headings }: { headings: any[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-100px 0px -66% 0px',
        threshold: 0,
      }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -80
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveId(id)
    }
  }

  if (headings.length === 0) return null

  if (isMinimized) {
    return (
      <div className="fixed top-24 left-6 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="shadow-lg bg-background"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Card className="fixed top-24 left-6 w-64 max-h-[calc(100vh-140px)] overflow-hidden shadow-xl z-40 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Contents</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMinimized(true)}
          className="h-6 w-6 p-0"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-y-auto flex-1 p-2">
        <div className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={cn(
                'w-full text-left text-sm py-2 px-3 rounded-md hover:bg-muted transition-colors',
                'border-l-2 border-transparent',
                activeId === heading.id && 'bg-muted font-medium border-l-2 border-primary',
                heading.level === 1 && 'font-semibold text-base',
                heading.level === 2 && 'pl-6',
                heading.level === 3 && 'pl-10 text-xs text-muted-foreground'
              )}
            >
              <span className="line-clamp-2">{heading.text || 'Untitled'}</span>
            </button>
          ))}
        </div>
      </div>

      {headings.length > 5 && (
        <div className="p-2 border-t text-xs text-center text-muted-foreground">
          {headings.length} sections
        </div>
      )}
    </Card>
  )
}