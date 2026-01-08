// ============================================
// components/test-data/TestDataItemRow.tsx
// Fixed to work as a table row - matches custom table format
// ============================================

'use client'

import React, { useState } from 'react'
import { TestDataItem } from '@/types/test-data'
import { Copy, Check } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

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
      logger.log('Failed to copy:', err)
    }
  }

  const handleToggleSelection = (event: React.MouseEvent) => {
    event.stopPropagation()
    onSelect(item.id)
  }

  return (
    <div
      className={`flex items-center border-b border-border last:border-b-0 transition-colors min-w-max ${
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

      {/* Value */}
      <div className={`flex-1 px-4 py-3 border-r border-border min-w-0 ${
        isSelected ? 'bg-primary/5' : 'bg-card'
      }`}>
        <code className="font-mono text-sm text-foreground break-all block">
          {item.value || '<empty>'}
        </code>
      </div>

      {/* Copy Button */}
      <div className={`w-32 px-4 py-3 flex items-center justify-end ${
        isSelected ? 'bg-primary/5' : 'bg-card'
      }`}>
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
      </div>
    </div>
  )
}