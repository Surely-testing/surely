// ============================================
// FILE: providers/GlobalThemeProvider.tsx
// ============================================
"use client"

import { ThemeProvider } from "next-themes"

export function GlobalThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={true}
      storageKey="surely-theme"
      enableColorScheme={true}
    >
      {children}
    </ThemeProvider>
  )
}