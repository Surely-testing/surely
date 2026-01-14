// ============================================
// FILE: components/ai/AIFloatingButton.tsx
// ============================================
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAI } from './AIAssistantProvider'

export function AIFloatingButton() {
  const { isOpen, setIsOpen, suggestions, robotPosition, setRobotPosition } = useAI()
  const [isBlinking, setIsBlinking] = useState(false)
  const [animation, setAnimation] = useState<'idle' | 'squat' | 'float' | 'sway' | 'bounce' | 'wave'>('idle')
  const [showHiBubble, setShowHiBubble] = useState(false)
  const [lastInteraction, setLastInteraction] = useState(Date.now())
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false) // Track if actually dragged
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLDivElement>(null)

  // Random blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, Math.random() * 5000 + 3000)
    return () => clearInterval(blinkInterval)
  }, [])

  // Check for inactivity and show "Hi" wave
  useEffect(() => {
    const inactivityCheck = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteraction
      const tenMinutes = 10 * 60 * 1000
      
      if (timeSinceLastInteraction >= tenMinutes && !showHiBubble && suggestions.length === 0) {
        setAnimation('wave')
        setShowHiBubble(true)
        
        setTimeout(() => {
          setShowHiBubble(false)
          setAnimation('idle')
          setLastInteraction(Date.now())
        }, 3000)
      }
    }, 30000)
    
    return () => clearInterval(inactivityCheck)
  }, [lastInteraction, showHiBubble, suggestions.length])

  // Random animations when idle (no tips)
  useEffect(() => {
    if (suggestions.length === 0 && animation !== 'wave') {
      const animationInterval = setInterval(() => {
        const animations: Array<'idle' | 'squat' | 'float' | 'sway' | 'bounce'> = [
          'squat', 'float', 'sway', 'bounce', 'idle', 'idle'
        ]
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)]
        setAnimation(randomAnimation)
        
        const duration = randomAnimation === 'float' ? 3000 : 2000
        setTimeout(() => setAnimation('idle'), duration)
      }, Math.random() * 5000 + 4000)
      
      return () => clearInterval(animationInterval)
    } else if (suggestions.length > 0) {
      setAnimation('idle')
    }
  }, [suggestions.length, animation])

  // Reset interaction timer on any user activity
  useEffect(() => {
    const resetTimer = () => setLastInteraction(Date.now())
    
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('click', resetTimer)
    window.addEventListener('scroll', resetTimer)
    
    return () => {
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('scroll', resetTimer)
    }
  }, [])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!buttonRef.current) return
    
    const rect = buttonRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
    setHasDragged(false) // Reset drag flag
    e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setHasDragged(true) // User is dragging
      
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Keep within viewport bounds with padding
      const maxX = window.innerWidth - 90
      const maxY = window.innerHeight - 120
      
      const boundedX = Math.max(10, Math.min(newX, maxX))
      const boundedY = Math.max(10, Math.min(newY, maxY))
      
      setRobotPosition({ x: boundedX, y: boundedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, setRobotPosition])

  if (isOpen) return null

  const hasTips = suggestions.length > 0

  const handleClick = (e: React.MouseEvent) => {
    // Only open if user didn't drag
    if (!hasDragged) {
      setIsOpen(true)
      setLastInteraction(Date.now())
    }
    
    // Reset drag flag after a short delay
    setTimeout(() => setHasDragged(false), 100)
  }

  return (
    <div 
      ref={buttonRef}
      className="fixed z-[9999] flex flex-col items-center gap-2"
      style={{ 
        left: `${robotPosition.x}px`, 
        top: `${robotPosition.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Hi Bubble */}
      {showHiBubble && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl px-5 py-3 border-2 border-white animate-slide-down">
          <p className="text-lg font-bold text-white">
            👋 Hi there!
          </p>
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 border-r-2 border-b-2 border-white transform rotate-45"></div>
        </div>
      )}

      {/* Tip Bubble */}
      {hasTips && !showHiBubble && (
        <div className="bg-white rounded-2xl shadow-xl px-5 py-3 max-w-xs border-2 border-purple-100 animate-slide-down">
          <p className="text-sm font-medium text-gray-800">
            💡 I have <span className="text-purple-600 font-bold">{suggestions.length}</span> tip{suggestions.length > 1 ? 's' : ''} for you!
          </p>
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r-2 border-b-2 border-purple-100 transform rotate-45"></div>
        </div>
      )}

      {/* Cute 3D Robot */}
      <button
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className={`bg-transparent select-none hover:scale-110 transition-transform duration-300 group ${
          animation === 'float' ? 'animate-float' : 
          animation === 'squat' ? 'animate-squat' : 
          animation === 'sway' ? 'animate-sway' : 
          animation === 'bounce' ? 'animate-bounce-robot' : 
          animation === 'wave' ? 'animate-wave' : ''
        } ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}`}
        aria-label="AI Assistant - Drag to move, Click to open"
      >
        <svg
          width="70"
          height="84"
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients for 3D effect */}
            <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E0E7FF" />
              <stop offset="100%" stopColor="#C7D2FE" />
            </linearGradient>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DDD6FE" />
              <stop offset="100%" stopColor="#C4B5FD" />
            </linearGradient>
            <radialGradient id="screenGradient">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Shadow */}
          <ellipse cx="50" cy="115" rx="30" ry="5" fill="#1E293B" opacity="0.2" />

          {/* Legs */}
          <g>
            <rect x="35" y="85" width="10" height="25" rx="5" fill="url(#bodyGradient)" filter="url(#shadow)" />
            <ellipse cx="40" cy="110" rx="8" ry="4" fill="#8B5CF6" />
            
            <rect x="55" y="85" width="10" height="25" rx="5" fill="url(#bodyGradient)" filter="url(#shadow)" />
            <ellipse cx="60" cy="110" rx="8" ry="4" fill="#8B5CF6" />
          </g>

          {/* Body */}
          <rect x="30" y="50" width="40" height="35" rx="8" fill="url(#bodyGradient)" filter="url(#shadow)" />
          
          {/* Body details */}
          <circle cx="50" cy="67" r="6" fill="#8B5CF6" opacity="0.3" />
          <circle cx="50" cy="67" r="3" fill="#A78BFA" />
          <rect x="42" y="75" width="4" height="6" rx="2" fill="#8B5CF6" opacity="0.3" />
          <rect x="54" y="75" width="4" height="6" rx="2" fill="#8B5CF6" opacity="0.3" />

          {/* Arms */}
          <g className="transition-all duration-500">
            {hasTips && !showHiBubble ? (
              <g className="animate-point-smooth">
                <rect x="15" y="52" width="8" height="22" rx="4" fill="url(#bodyGradient)" filter="url(#shadow)" transform="rotate(-45 19 63)" />
                <circle cx="12" cy="48" r="5" fill="#8B5CF6" />
              </g>
            ) : showHiBubble ? (
              <g className="animate-wave-arm">
                <rect x="15" y="52" width="8" height="22" rx="4" fill="url(#bodyGradient)" filter="url(#shadow)" transform="rotate(-45 19 63)" />
                <circle cx="12" cy="48" r="5" fill="#8B5CF6" />
              </g>
            ) : (
              <g className={animation === 'bounce' ? 'animate-arm-swing' : ''}>
                <rect x="18" y="55" width="8" height="22" rx="4" fill="url(#bodyGradient)" filter="url(#shadow)" />
                <circle cx="22" cy="78" r="5" fill="#8B5CF6" />
              </g>
            )}
            
            <g className={animation === 'bounce' ? 'animate-arm-swing-right' : ''}>
              <rect x="74" y="55" width="8" height="22" rx="4" fill="url(#bodyGradient)" filter="url(#shadow)" />
              <circle cx="78" cy="78" r="5" fill="#8B5CF6" />
            </g>
          </g>

          {/* Head */}
          <circle cx="50" cy="30" r="25" fill="url(#headGradient)" filter="url(#shadow)" />
          
          {/* Antennas */}
          <g>
            <line x1="38" y1="8" x2="38" y2="12" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
            <circle cx="38" cy="6" r="3" fill="#A78BFA" className={animation === 'idle' ? 'group-hover:animate-pulse' : animation === 'float' ? 'animate-pulse' : ''} />
            
            <line x1="62" y1="8" x2="62" y2="12" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
            <circle cx="62" cy="6" r="3" fill="#A78BFA" className={animation === 'idle' ? 'group-hover:animate-pulse' : animation === 'float' ? 'animate-pulse' : ''} />
          </g>

          {/* Ear/Speaker details */}
          <circle cx="22" cy="30" r="6" fill="#8B5CF6" opacity="0.3" />
          <circle cx="22" cy="30" r="4" fill="#A78BFA" opacity="0.5" />
          <circle cx="78" cy="30" r="6" fill="#8B5CF6" opacity="0.3" />
          <circle cx="78" cy="30" r="4" fill="#A78BFA" opacity="0.5" />

          {/* Screen/Face */}
          <ellipse cx="50" cy="32" rx="18" ry="16" fill="url(#screenGradient)" />
          
          {/* Eyes */}
          <g>
            <ellipse 
              cx="43" 
              cy="30" 
              rx="4" 
              ry={isBlinking ? "0.5" : "6"} 
              fill="#10B981"
              className="transition-all duration-100"
            />
            <ellipse 
              cx="43" 
              cy={isBlinking ? "30" : "29"} 
              rx="2" 
              ry={isBlinking ? "0.5" : "3"} 
              fill="#6EE7B7" 
              opacity={isBlinking ? "0" : "0.8"}
              className="transition-all duration-100"
            />
            
            <ellipse 
              cx="57" 
              cy="30" 
              rx="4" 
              ry={isBlinking ? "0.5" : "6"} 
              fill="#10B981"
              className="transition-all duration-100"
            />
            <ellipse 
              cx="57" 
              cy={isBlinking ? "30" : "29"} 
              rx="2" 
              ry={isBlinking ? "0.5" : "3"} 
              fill="#6EE7B7" 
              opacity={isBlinking ? "0" : "0.8"}
              className="transition-all duration-100"
            />
          </g>

          {/* Smile */}
          <path 
            d="M 42 38 Q 50 42, 58 38" 
            stroke="#10B981" 
            strokeWidth="2" 
            strokeLinecap="round" 
            fill="none"
            opacity="0.8"
          />
        </svg>
      </button>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes point-smooth {
          0%, 100% {
            transform: rotate(-45deg) translateY(0);
          }
          50% {
            transform: rotate(-45deg) translateY(-3px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes squat {
          0%, 100% {
            transform: scaleY(1) translateY(0);
          }
          50% {
            transform: scaleY(0.88) translateY(6px);
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(-5px) rotate(-3deg);
          }
          75% {
            transform: translateX(5px) rotate(3deg);
          }
        }

        @keyframes bounce-robot {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-8px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(-4px);
          }
        }

        @keyframes arm-swing {
          0%, 100% {
            transform: rotate(0deg);
            transform-origin: 22px 55px;
          }
          50% {
            transform: rotate(-15deg);
            transform-origin: 22px 55px;
          }
        }

        @keyframes arm-swing-right {
          0%, 100% {
            transform: rotate(0deg);
            transform-origin: 78px 55px;
          }
          50% {
            transform: rotate(15deg);
            transform-origin: 78px 55px;
          }
        }

        @keyframes wave-arm {
          0%, 100% {
            transform: rotate(-45deg);
            transform-origin: 19px 63px;
          }
          25% {
            transform: rotate(-35deg);
            transform-origin: 19px 63px;
          }
          50% {
            transform: rotate(-45deg);
            transform-origin: 19px 63px;
          }
          75% {
            transform: rotate(-35deg);
            transform-origin: 19px 63px;
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-point-smooth {
          animation: point-smooth 1.5s ease-in-out infinite;
          transform-origin: 19px 63px;
        }

        .animate-float {
          animation: float 3s ease-in-out;
        }

        .animate-squat {
          animation: squat 2s ease-in-out;
        }

        .animate-sway {
          animation: sway 2s ease-in-out;
        }

        .animate-bounce-robot {
          animation: bounce-robot 2s ease-in-out;
        }

        .animate-arm-swing {
          animation: arm-swing 2s ease-in-out;
        }

        .animate-arm-swing-right {
          animation: arm-swing-right 2s ease-in-out;
        }

        .animate-wave {
          animation: sway 3s ease-in-out;
        }

        .animate-wave-arm {
          animation: wave-arm 3s ease-in-out;
        }
      `}</style>
    </div>
  )
}