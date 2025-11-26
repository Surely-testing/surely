// components/test-data/TestDataItemRow.tsx
'use client'

import React, { useState } from 'react'
import { TestDataItem } from '@/types/test-data'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TestDataItemRowProps {
  item: TestDataItem
  isSelected: boolean
  onSelect: (id: string) => void
  isLast: boolean
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
    <div
      className={cn(
        "flex items-center gap-2 sm:gap-4 py-2 sm:py-3 hover:bg-muted transition-colors",
        !isLast && "border-b border-border"
      )}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(item.id)}
        className="w-4 h-4 rounded border-input text-primary focus:ring-primary flex-shrink-0"
      />
      
      <div className="flex-1 font-mono text-sm text-foreground truncate pr-2">
        {item.value || '<empty>'}
      </div>
      
      <button
        onClick={() => copyToClipboard(item.value)}
        className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded hover:bg-muted transition-colors w-auto sm:min-w-[75px] flex-shrink-0"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copy
          </>
        )}
      </button>
    </div>
  )
}