// ============================================
// components/test-data/TestDataTypeListItem.tsx
// Fixed to work as a table row - matches custom table format
// ============================================
'use client'

import React from 'react'
import { TestDataType } from '@/types/test-data'
import { ICON_MAP, COLOR_MAP } from '@/lib/constants/test-data-constants'
import { Database } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TestDataTypeListItemProps {
  type: TestDataType
  isSelected: boolean
  onSelect: (id: string) => void
  onDoubleClick: (id: string) => void
}

export default function TestDataTypeListItem({
  type,
  isSelected,
  onSelect,
  onDoubleClick
}: TestDataTypeListItemProps) {
  const TypeIcon = ICON_MAP[type.icon as keyof typeof ICON_MAP] || Database
  const iconColorClass = COLOR_MAP[type.color as keyof typeof COLOR_MAP] || COLOR_MAP.blue

  const handleToggleSelection = (event: React.MouseEvent) => {
    event.stopPropagation()
    onSelect(type.id)
  }

  return (
    <div
      onDoubleClick={() => onDoubleClick(type.id)}
      className={`flex items-center border-b border-border last:border-b-0 transition-colors cursor-pointer min-w-max ${
        isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
      }`}
    >
      {/* Checkbox */}
      <div className={`w-12 px-4 py-3 border-r border-border flex items-center justify-center ${
        isSelected ? 'bg-primary/5' : 'bg-card'
      }`}>
        <div
          role="checkbox"
          aria-checked={isSelected}
          onClick={handleToggleSelection}
          className={`w-4 h-4 rounded border-2 border-border cursor-pointer transition-all flex items-center justify-center ${
            isSelected ? 'bg-primary border-primary' : 'hover:border-primary/50'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Icon & Name & Description */}
      <div className={`flex-1 px-4 py-3 border-r border-border min-w-0 ${
        isSelected ? 'bg-primary/5' : 'bg-card'
      }`}>
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", iconColorClass)}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground truncate">
              {type.name}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {type.description || 'No description'}
            </div>
          </div>
        </div>
      </div>

      {/* Item Count */}
      <div className={`w-32 px-4 py-3 flex items-center justify-end ${
        isSelected ? 'bg-primary/5' : 'bg-card'
      }`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
          <span className="text-sm font-medium text-foreground">
            {type.item_count || 0}
          </span>
          <span className="text-xs text-muted-foreground">
            {type.item_count === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>
    </div>
  )
}