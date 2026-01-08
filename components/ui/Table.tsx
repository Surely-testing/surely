import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown"

// Simple cn utility for className merging
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

const Table = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full overflow-x-auto", className)}
    {...props}
  />
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    columns?: number
  }
>(({ className, columns = 4, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid gap-4 items-center bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border min-w-max",
      className
    )}
    style={{ gridTemplateColumns: `32px 200px repeat(${columns - 1}, minmax(150px, 1fr))` }}
    {...props}
  >
    {children}
  </div>
))
TableHeader.displayName = "TableHeader"

const TableGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string
    count?: string
    expanded?: boolean
    onToggle?: () => void
    accentColor?: string
  }
>(({ className, title, count, expanded = true, onToggle, accentColor = "bg-primary", children, ...props }, ref) => (
  <div ref={ref} className={cn("mb-6", className)} {...props}>
    <div 
      className="flex items-center gap-3 mb-3 cursor-pointer group"
      onClick={onToggle}
    >
      <button className="text-muted-foreground hover:text-foreground transition-colors">
        <svg 
          className={cn("w-4 h-4 transition-transform", expanded ? "rotate-0" : "-rotate-90")}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={cn("w-1 h-6 rounded-full", accentColor)} />
      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      {count && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </div>
    {expanded && (
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {children}
      </div>
    )}
    {!expanded && (
      <div className="flex gap-1 ml-10">
        {/* Placeholder for collapsed view indicators */}
      </div>
    )}
  </div>
))
TableGroup.displayName = "TableGroup"

const TableRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    selected?: boolean
    selectable?: boolean
    columns?: number
  }
>(({ className, selected, selectable, columns = 4, children, ...props }, ref) => {
  const [isHovering, setIsHovering] = React.useState(false)

  return (
    <div
      ref={ref}
      className={cn(
        "grid gap-4 items-center px-4 py-3 border-b border-border last:border-b-0 transition-colors min-w-max",
        selected && "bg-primary/5",
        isHovering && !selected && "bg-muted/50",
        className
      )}
      style={{ gridTemplateColumns: `32px 200px repeat(${columns - 1}, minmax(150px, 1fr))` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      data-state={selected ? "selected" : undefined}
      {...props}
    >
      {children}
    </div>
  )
})
TableRow.displayName = "TableRow"

const TableCell = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-w-0 text-sm text-foreground border-r border-border last:border-r-0 pr-4", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableHeaderCell = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-w-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-r border-border last:border-r-0 pr-4", className)}
    {...props}
  />
))
TableHeaderCell.displayName = "TableHeaderCell"

const TableCheckbox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
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
        : "hover:border-primary/50",
      className
    )}
    {...props}
  >
    {checked && (
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
))
TableCheckbox.displayName = "TableCheckbox"

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

// Reusable Actions Dropdown Component
const TableActionsDropdown = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        Archive
      </DropdownMenuItem>
      <DropdownMenuItem className="text-red-600 focus:text-red-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

// Demo Component
export default function TableDemo() {
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set())
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set(["group1", "group2"]))

  const toggleRow = (id: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Issue Tracker</h1>
        
        <Table>
          <TableGroup
            title="Bug/Defects - 02/28/2025"
            count="5 Issues"
            expanded={expandedGroups.has("group1")}
            onToggle={() => toggleGroup("group1")}
            accentColor="bg-pink-500"
          >
            <TableHeader columns={13}>
              <div className="w-4 h-4 border-r border-border pr-4" />
              <TableHeaderCell>Issue Title</TableHeaderCell>
              <TableHeaderCell>Issue ID</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>SubItems</TableHeaderCell>
              <TableHeaderCell>Assign To</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Epic</TableHeaderCell>
              <TableHeaderCell>Test Case</TableHeaderCell>
              <TableHeaderCell>Test Status</TableHeaderCell>
              <TableHeaderCell>Due Date</TableHeaderCell>
              <TableHeaderCell>Automated?</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableHeader>

            <TableRow selected={selectedRows.has(1)} columns={13}>
              <div className="border-r border-border pr-4">
                <TableCheckbox checked={selectedRows.has(1)} onCheckedChange={() => toggleRow(1)} />
              </div>
              <TableCell className="truncate">Unable to add item to cart from the product page</TableCell>
              <TableCell>8001</TableCell>
              <TableCell>Bug</TableCell>
              <TableCell><TableBadge variant="yellow">Working on it</TableBadge></TableCell>
              <TableCell><TableAvatar fallback="JD" /></TableCell>
              <TableCell><TableBadge variant="yellow">In Progress</TableBadge></TableCell>
              <TableCell><TableBadge variant="pink">Major</TableBadge></TableCell>
              <TableCell className="text-xs">Add to Cart</TableCell>
              <TableCell className="text-xs">Test Case</TableCell>
              <TableCell><TableBadge variant="green">Pass</TableBadge></TableCell>
              <TableCell className="text-xs">2/28/2025</TableCell>
              <TableCell className="text-xs">Yes</TableCell>
              <TableCell><TableActionsDropdown /></TableCell>
            </TableRow>

            <TableRow selected={selectedRows.has(2)} columns={13}>
              <div className="border-r border-border pr-4">
                <TableCheckbox checked={selectedRows.has(2)} onCheckedChange={() => toggleRow(2)} />
              </div>
              <TableCell className="truncate">Payment gateway timeout error</TableCell>
              <TableCell>8002</TableCell>
              <TableCell>Bug</TableCell>
              <TableCell><TableBadge variant="gray">In Review</TableBadge></TableCell>
              <TableCell><TableAvatar fallback="AB" /></TableCell>
              <TableCell><TableBadge variant="orange">Not Started</TableBadge></TableCell>
              <TableCell><TableBadge variant="pink">Major</TableBadge></TableCell>
              <TableCell className="text-xs">Checkout</TableCell>
              <TableCell className="text-xs">Test Case</TableCell>
              <TableCell><TableBadge variant="red">Fail</TableBadge></TableCell>
              <TableCell className="text-xs">2/28/2025</TableCell>
              <TableCell className="text-xs">No</TableCell>
              <TableCell><TableActionsDropdown /></TableCell>
            </TableRow>

            <TableRow selected={selectedRows.has(3)} columns={13}>
              <div className="border-r border-border pr-4">
                <TableCheckbox checked={selectedRows.has(3)} onCheckedChange={() => toggleRow(3)} />
              </div>
              <TableCell className="truncate">Search results not displaying correctly</TableCell>
              <TableCell>8003</TableCell>
              <TableCell>Bug</TableCell>
              <TableCell><TableBadge variant="green">Completed</TableBadge></TableCell>
              <TableCell>
                <div className="flex -space-x-2">
                  <TableAvatar fallback="A" />
                  <TableAvatar fallback="B" />
                </div>
              </TableCell>
              <TableCell><TableBadge variant="green">Done</TableBadge></TableCell>
              <TableCell><TableBadge variant="orange">Medium</TableBadge></TableCell>
              <TableCell className="text-xs">Search</TableCell>
              <TableCell className="text-xs">Test Case</TableCell>
              <TableCell><TableBadge variant="green">Pass</TableBadge></TableCell>
              <TableCell className="text-xs">2/26/2025</TableCell>
              <TableCell className="text-xs">Yes</TableCell>
              <TableCell><TableActionsDropdown /></TableCell>
            </TableRow>
          </TableGroup>

          <TableGroup
            title="Bug/Defects - 01/15/2025"
            count="2 Issues"
            expanded={expandedGroups.has("group2")}
            onToggle={() => toggleGroup("group2")}
            accentColor="bg-blue-500"
          >
            <TableHeader columns={13}>
              <div className="w-4 h-4 border-r border-border pr-4" />
              <TableHeaderCell>Issue Title</TableHeaderCell>
              <TableHeaderCell>Issue ID</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>SubItems</TableHeaderCell>
              <TableHeaderCell>Assign To</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Priority</TableHeaderCell>
              <TableHeaderCell>Epic</TableHeaderCell>
              <TableHeaderCell>Test Case</TableHeaderCell>
              <TableHeaderCell>Test Status</TableHeaderCell>
              <TableHeaderCell>Due Date</TableHeaderCell>
              <TableHeaderCell>Automated?</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableHeader>

            <TableRow selected={selectedRows.has(4)} columns={13}>
              <div className="border-r border-border pr-4">
                <TableCheckbox checked={selectedRows.has(4)} onCheckedChange={() => toggleRow(4)} />
              </div>
              <TableCell className="truncate">Login button not responsive on mobile</TableCell>
              <TableCell>7501</TableCell>
              <TableCell>Bug</TableCell>
              <TableCell><TableBadge variant="green">Completed</TableBadge></TableCell>
              <TableCell>
                <div className="flex -space-x-2">
                  <TableAvatar fallback="X" />
                  <TableAvatar fallback="Y" />
                </div>
              </TableCell>
              <TableCell><TableBadge variant="green">Done</TableBadge></TableCell>
              <TableCell><TableBadge variant="red">Critical</TableBadge></TableCell>
              <TableCell className="text-xs">Authentication</TableCell>
              <TableCell className="text-xs">Test Case</TableCell>
              <TableCell><TableBadge variant="green">Pass</TableBadge></TableCell>
              <TableCell className="text-xs">1/20/2025</TableCell>
              <TableCell className="text-xs">Yes</TableCell>
              <TableCell><TableActionsDropdown /></TableCell>
            </TableRow>

            <TableRow selected={selectedRows.has(5)} columns={13}>
              <div className="border-r border-border pr-4">
                <TableCheckbox checked={selectedRows.has(5)} onCheckedChange={() => toggleRow(5)} />
              </div>
              <TableCell className="truncate">Image upload failing for large files</TableCell>
              <TableCell>7502</TableCell>
              <TableCell>Bug</TableCell>
              <TableCell><TableBadge variant="green">Completed</TableBadge></TableCell>
              <TableCell><TableAvatar fallback="Z" /></TableCell>
              <TableCell><TableBadge variant="green">Done</TableBadge></TableCell>
              <TableCell><TableBadge variant="yellow">Low</TableBadge></TableCell>
              <TableCell className="text-xs">Media Upload</TableCell>
              <TableCell className="text-xs">Test Case</TableCell>
              <TableCell><TableBadge variant="green">Pass</TableBadge></TableCell>
              <TableCell className="text-xs">1/18/2025</TableCell>
              <TableCell className="text-xs">No</TableCell>
              <TableCell><TableActionsDropdown /></TableCell>
            </TableRow>
          </TableGroup>
        </Table>
      </div>
    </div>
  )
}

export {
  Table,
  TableHeader,
  TableHeaderCell,
  TableGroup,
  TableRow,
  TableCell,
  TableCheckbox,
  TableBadge,
  TableAvatar,
  TableEmpty,
  TableActionsDropdown,
}