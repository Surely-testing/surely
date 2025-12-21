// components/test-data/TestDataTypeListItem.tsx
'use client'

import React from 'react'
import { TestDataType } from '@/types/test-data'
import { ICON_MAP, COLOR_MAP } from '@/lib/constants/test-data-constants'
import { Database } from 'lucide-react'
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn'
import { TableRow, TableGrid, TableCell, TableCheckbox, TableHeaderText, TableDescriptionText } from '@/components/ui/Table'

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

  // Debug: Log the type data
  React.useEffect(() => {
    logger.log('Type data:', type)
  }, [type])

  return (
    <TableRow
      selected={isSelected}
      selectable
      onDoubleClick={() => onDoubleClick(type.id)}
      className="cursor-pointer"
    >
      <TableCheckbox
        checked={isSelected}
        onCheckedChange={() => onSelect(type.id)}
      />

      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", iconColorClass)}>
          <TypeIcon className="w-5 h-5" />
        </div>

        {/* Grid Layout for Content */}
        <TableGrid columns={3}>
          {/* Name & Description */}
          <TableCell className="col-span-2">
            <TableHeaderText>{type.name}</TableHeaderText>
            <TableDescriptionText>
              {type.description || 'No description'}
            </TableDescriptionText>
          </TableCell>

          {/* Item Count */}
          <TableCell className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
              <span className="text-sm font-medium text-foreground">
                {type.item_count || 0}
              </span>
              <span className="text-xs text-muted-foreground">
                {type.item_count === 1 ? 'item' : 'items'}
              </span>
            </div>
          </TableCell>
        </TableGrid>
      </div>
    </TableRow>
  )
}