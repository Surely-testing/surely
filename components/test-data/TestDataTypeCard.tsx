// components/test-data/TestDataTypeCard.tsx
'use client'

import React from 'react'
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
  const TypeIcon = ICON_MAP[type.icon as keyof typeof ICON_MAP] || Database
  const iconColorClass = COLOR_MAP[type.color as keyof typeof COLOR_MAP] || COLOR_MAP.blue

  return (
    <div
      onDoubleClick={() => onDoubleClick(type.id)}
      className={cn(
        "group relative bg-card border rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected 
          ? "ring-2 ring-primary border-primary" 
          : "border-border hover:border-muted"
      )}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation()
          onSelect(type.id)
        }}
        className="absolute top-2 sm:top-3 left-2 sm:left-3 w-4 h-4 rounded border-input text-primary focus:ring-primary opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
        <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center", iconColorClass)}>
          <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="w-full">
          <h3 className="font-medium text-foreground text-sm truncate">
            {type.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8">
            {type.description}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {type.item_count || 0} item{type.item_count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}