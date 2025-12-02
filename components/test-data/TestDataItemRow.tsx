// components/test-data/TestDataItemRow.tsx
'use client'

import React, { useState } from 'react'
import { TestDataItem } from '@/types/test-data'
import { Copy, Check } from 'lucide-react'
import { TableRow, TableGrid, TableCell, TableCheckbox } from '@/components/ui/Table'

interface TestDataItemRowProps {
  item: TestDataItem
  isSelected: boolean
  onSelect: (id: string) => void
  isLast?: boolean
}

export default function TestDataItemRow({
  item,
  isSelected,
  onSelect,
  isLast
}: TestDataItemRowProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <TableRow
      selected={isSelected}
      selectable
      className="cursor-default"
    >
      <TableCheckbox
        checked={isSelected}
        onCheckedChange={() => onSelect(item.id)}
      />

      <div className="flex items-center justify-between gap-4">
        <TableGrid columns={2}>
          {/* Value */}
          <TableCell className="col-span-1">
            <code className="font-mono text-sm text-foreground break-all">
              {item.value || '<empty>'}
            </code>
          </TableCell>

          {/* Copy Button */}
          <TableCell className="col-span-1 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                copyToClipboard(item.value)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors min-w-[75px] justify-center"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </TableCell>
        </TableGrid>
      </div>
    </TableRow>
  )
}