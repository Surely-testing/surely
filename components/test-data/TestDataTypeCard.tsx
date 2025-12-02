// components/test-data/TestDataTypeCard.tsx
'use client'

import React, { useState } from 'react'
import { TestDataType } from '@/types/test-data'
import { ICON_MAP, COLOR_MAP } from '@/lib/constants/test-data-constants'
import { Database } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TestDataTypeCardProps {
  type: TestDataType
  isSelected: boolean
  onSelect: (id: string) => void
  onDoubleClick: (id: string) => void
}

export default function TestDataTypeCard({
  type,
  isSelected,
  onSelect,
  onDoubleClick
}: TestDataTypeCardProps) {
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)

  const TypeIcon = ICON_MAP[type.icon as keyof typeof ICON_MAP] || Database
  const iconColorClass = COLOR_MAP[type.color as keyof typeof COLOR_MAP] || COLOR_MAP.blue

  const handleCardClick = () => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTime

    // Double click detection (within 300ms)
    if (lastClickedId === type.id && timeSinceLastClick < 300) {
      // Double click - open details
      onDoubleClick(type.id)
      setLastClickTime(0)
      setLastClickedId(null)
    } else {
      // Single click - just record the time
      setLastClickTime(now)
      setLastClickedId(type.id)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "bg-card rounded-lg border transition-all duration-200 cursor-pointer group hover:shadow-lg hover:border-primary/50",
        isSelected 
          ? "border-primary ring-2 ring-primary/20" 
          : "border-border"
      )}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onSelect(type.id)
              }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "mt-1 w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all cursor-pointer",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {type.name}
              </h3>
            </div>
          </div>

          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            iconColorClass
          )}>
            <TypeIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Description */}
        {type.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
            {type.description}
          </p>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Data Type Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Items</span>
            <span className="text-foreground font-medium">
              {type.item_count || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Category</span>
            <span className="text-foreground font-medium capitalize">
              {type.icon || 'Default'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}