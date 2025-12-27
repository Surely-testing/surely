// ============================================
// FILE: components/documents/FloatingTOC.tsx
// Fixed scrolling with better debugging
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

    const scrollContainer = document.getElementById('document-editor-scroll-container')
    if (!scrollContainer) {
      console.warn('TOC: Scroll container not found')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        root: scrollContainer,
        rootMargin: '-100px 0px -66% 0px',
        threshold: 0,
      }
    )

    // Wait a bit for DOM to be ready
    const timeout = setTimeout(() => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id)
        if (element) {
          observer.observe(element)
        } else {
          console.warn('TOC: Heading element not found:', heading.id, heading.text)
        }
      })
    }, 100)

    return () => {
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, [headings])

  const scrollToHeading = (id: string) => {
    console.log('TOC: Attempting to scroll to:', id)
    
    // Find the heading element - try multiple selectors
    let element = document.getElementById(id)
    
    if (!element) {
      // Try finding by data attribute
      element = document.querySelector(`[data-heading-id="${id}"]`) as HTMLElement
    }
    
    if (!element) {
      // Try finding heading by text (last resort)
      const heading = headings.find(h => h.id === id)
      if (heading) {
        const allHeadings = document.querySelectorAll('.prose-editor h1, .prose-editor h2, .prose-editor h3')
        element = Array.from(allHeadings).find(h => h.textContent?.trim() === heading.text) as HTMLElement
      }
    }
    
    if (!element) {
      console.error('TOC: Could not find element for:', id)
      return
    }

    console.log('TOC: Found element:', element)

    const scrollContainer = document.getElementById('document-editor-scroll-container')
    
    if (scrollContainer) {
      const elementRect = element.getBoundingClientRect()
      const containerRect = scrollContainer.getBoundingClientRect()
      
      const scrollTop = scrollContainer.scrollTop
      const elementTop = elementRect.top - containerRect.top + scrollTop
      const offset = 120 // Increased offset to account for toolbar
      
      console.log('TOC: Scrolling container', {
        currentScrollTop: scrollTop,
        elementTop,
        offset,
        finalPosition: elementTop - offset
      })
      
      scrollContainer.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      })
      
      setActiveId(id)
      
      // Highlight the element briefly
      element.style.transition = 'background-color 0.3s'
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
      setTimeout(() => {
        element!.style.backgroundColor = ''
      }, 1000)
    } else {
      console.error('TOC: Scroll container not found')
      
      // Fallback to window scroll
      console.log('TOC: Falling back to window scroll')
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  if (headings.length === 0) return null

  if (isMinimized) {
    return (
      <div className="fixed top-24 left-14 z-40">
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
    <Card className="fixed top-24 left-14 w-80 max-h-[calc(100vh-140px)] overflow-hidden shadow-xl z-40 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Contents</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(true)}
          className="h-6 w-6 p-0"
        >
          <ChevronUp className="h-3 w-3" />
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
                'border-l-2',
                activeId === heading.id 
                  ? 'bg-muted font-medium border-primary' 
                  : 'border-transparent',
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
        <div className="p-2 border-t text-xs text-center text-muted-foreground bg-muted/30">
          {headings.length} sections
        </div>
      )}
    </Card>
  )
}