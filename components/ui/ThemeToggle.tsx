"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/Dropdown"
import { Sun, Moon, Monitor } from "lucide-react"

export function SystemThemeToggle() {
  const { theme, setTheme } = useTheme()

  const icon =
    theme === "light" ? (
      <Sun className="h-5 w-5" />
    ) : theme === "dark" ? (
      <Moon className="h-5 w-5" />
    ) : (
      <Monitor className="h-5 w-5" />
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {icon}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="h-4 w-4 mr-2" /> Light
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="h-4 w-4 mr-2" /> Dark
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="h-4 w-4 mr-2" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
