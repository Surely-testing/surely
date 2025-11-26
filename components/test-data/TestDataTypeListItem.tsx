// components/test-data/TestDataTypeListItem.tsx
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

  return (
    <div
      onDoubleClick={() => onDoubleClick(type.id)}
      className={cn(
        "group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm",
        isSelected 
          ? "ring-2 ring-primary border-primary bg-primary/5" 
          : "border-border hover:border-muted bg-card"
      )}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation()
          onSelect(type.id)
        }}
        className="w-4 h-4 rounded border-input text-primary focus:ring-primary flex-shrink-0"
      />
      
      <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0", iconColorClass)}>
        <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      
      <div className="flex-1 min-w-0 pr-2">
        <h3 className="font-medium text-foreground text-sm truncate">
          {type.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {type.description}
        </p>
      </div>
      
      <div className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
        {type.item_count || 0} item{type.item_count !== 1 ? 's' : ''}
      </div>
    </div>
  )
}