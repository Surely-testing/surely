// ============================================
// components/ui/Table.tsx
// Updated with flexible column widths that adapt to content
// Mobile: full scroll | Desktop: sticky checkbox & first column
// ============================================
import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// Main Table wrapper with horizontal scroll
const Table = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative border border-border rounded-lg bg-card overflow-x-auto", className)}
    {...props}
  >
    <div className="min-w-max">
      {props.children}
    </div>
  </div>
))
Table.displayName = "Table"

// Table Header - flex-based for responsive sticky columns
const TableHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    columns?: React.ReactNode[]
  }
>(({ className, columns = [], ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex bg-muted border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide",
      className
    )}
    {...props}
  >
    {/* Checkbox column - sticky on md+ */}
    <div className="w-12 px-4 py-2 border-r border-border flex items-center justify-center md:sticky md:left-0 bg-muted md:z-10 flex-shrink-0">
      {/* Empty for checkbox */}
    </div>
    
    {/* Render column headers */}
    {columns.map((col, idx) => (
      <React.Fragment key={idx}>{col}</React.Fragment>
    ))}
  </div>
))
TableHeader.displayName = "TableHeader"

// Table Header Cell - flexible width
const TableHeaderCell = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sticky?: boolean // First column after checkbox
    minWidth?: string // Optional minimum width
  }
>(({ className, sticky = false, minWidth, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-4 py-2 border-r border-border last:border-r-0 flex-1 whitespace-nowrap",
      minWidth,
      sticky && "md:sticky md:left-12 bg-muted md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex-shrink-0",
      className
    )}
    {...props}
  />
))
TableHeaderCell.displayName = "TableHeaderCell"

// Table Row - flex-based for responsive sticky columns
const TableRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    selected?: boolean
    selectable?: boolean
  }
>(({ className, selected, selectable, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center border-b border-border last:border-b-0 transition-colors",
      selected && "bg-primary/5",
      !selected && "hover:bg-muted/50",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
TableRow.displayName = "TableRow"

// Table Cell - flexible width
const TableCell = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sticky?: boolean // First column after checkbox
    selected?: boolean
    minWidth?: string // Optional minimum width
  }
>(({ className, sticky = false, selected = false, minWidth, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-4 py-3 border-r border-border last:border-r-0 flex-1 text-sm text-foreground whitespace-nowrap",
      minWidth,
      sticky && `md:sticky md:left-12 md:z-10 md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex-shrink-0 ${selected ? 'bg-primary/5' : 'bg-card'}`,
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

// Checkbox - always sticky on md+
const TableCheckbox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    selected?: boolean
  }
>(({ className, checked, onCheckedChange, selected = false, ...props }, ref) => (
  <div
    className={cn(
      "w-12 px-4 py-3 border-r border-border flex items-center justify-center md:sticky md:left-0 md:z-10 flex-shrink-0",
      selected ? 'bg-primary/5' : 'bg-card',
      className
    )}
    {...props}
  >
    <div
      ref={ref}
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onCheckedChange?.(!checked)
      }}
      className={cn(
        "w-4 h-4 rounded border-2 border-border cursor-pointer transition-all flex items-center justify-center",
        checked 
          ? "bg-primary border-primary" 
          : "hover:border-primary/50"
      )}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  </div>
))
TableCheckbox.displayName = "TableCheckbox"

// Rest of the components remain the same
const TableBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "yellow" | "green" | "pink" | "gray" | "orange" | "red"
  }
>(({ className, variant = "default", children, ...props }, ref) => {
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    yellow: "bg-yellow-400 text-yellow-900",
    green: "bg-green-500 text-white",
    pink: "bg-pink-500 text-white",
    gray: "bg-gray-400 text-gray-900",
    orange: "bg-orange-500 text-white",
    red: "bg-red-500 text-white"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
TableBadge.displayName = "TableBadge"

const TableAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src?: string
    alt?: string
    fallback?: string
  }
>(({ className, src, alt, fallback, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 overflow-hidden",
      className
    )}
    {...props}
  >
    {src ? (
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    ) : (
      fallback
    )}
  </div>
))
TableAvatar.displayName = "TableAvatar"

const TableEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon?: React.ReactNode
    title: string
    description?: string
  }
>(({ className, icon, title, description, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-card rounded-lg border border-border p-12 text-center",
      className
    )}
    {...props}
  >
    {icon && (
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    {description && <p className="text-sm text-muted-foreground">{description}</p>}
  </div>
))
TableEmpty.displayName = "TableEmpty"

export {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableCheckbox,
  TableBadge,
  TableAvatar,
  TableEmpty,
}