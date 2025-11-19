"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"

export function SystemThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return fixed-size skeleton during SSR/initial render
  if (!mounted) {
    return (
      <button 
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        disabled
      >
        <div className="h-5 w-5" />
      </button>
    )
  }

  // Cycle through themes on click: light -> dark -> system -> light
  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  // Use resolvedTheme for icon display (shows actual theme, not "system")
  const displayIcon = resolvedTheme === "dark" 
    ? <Moon className="h-5 w-5" />
    : <Sun className="h-5 w-5" />

  // Show monitor icon when system theme is selected
  const icon = theme === "system" 
    ? <Monitor className="h-5 w-5" />
    : displayIcon

  const label = theme === "light" 
    ? "Light mode" 
    : theme === "dark" 
    ? "Dark mode" 
    : "System theme"

  return (
    <button
      onClick={cycleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
      aria-label={`${label}. Click to switch theme.`}
      title={label}
    >
      {icon}
    </button>
  )
}