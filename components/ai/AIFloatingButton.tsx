// ============================================
// FILE: components/ai/AIFloatingButton.tsx
// ============================================
'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { useAI } from './AIAssistantProvider'

export function AIFloatingButton() {
  const { isOpen, setIsOpen, suggestions } = useAI()

  // Show button when chat is closed
  if (isOpen) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-white border-2 border-purple-200 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center group z-[9999] hover:scale-110"
        style={{ zIndex: 9999 }}
      >
        {/* AI Icon - Simple pencil/sparkle design */}
        <div className="relative">
          <Sparkles className="h-6 w-6 text-purple-600 group-hover:text-purple-700 group-hover:rotate-12 transition-all" />
        </div>
        
        {/* Notification Badge - positioned at top-right like screenshot */}
        {suggestions.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white animate-pulse">
            {suggestions.length}
          </div>
        )}
        
        {/* Pulse Animation */}
        <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20"></div>
      </button>
    </>
  )
}