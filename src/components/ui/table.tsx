import React from "react"
import { cn } from "../../lib/utils"
import { cva, type VariantProps } from "class-variance-authority"; // Import VariantProps

const Table = React.forwardRef<
  HTMLTableElement, // Ref type
  React.HTMLAttributes<HTMLTableElement> // Props type
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props} />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement, // Ref type
  React.HTMLAttributes<HTMLTableSectionElement> // Props type
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement, // Ref type
  React.HTMLAttributes<HTMLTableSectionElement> // Props type
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props} />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement, // Ref type
  React.HTMLAttributes<HTMLTableSectionElement> // Props type
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("bg-blue-600 font-medium text-white", className)}
    {...props} />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement, // Ref type
  React.HTMLAttributes<HTMLTableRowElement> // Props type
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props} />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableHeaderCellElement, // Ref type
  React.ThHTMLAttributes<HTMLTableHeaderCellElement> // Props type
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props} />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableDataCellElement, // Ref type
  React.TdHTMLAttributes<HTMLTableDataCellElement> // Props type
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props} />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement, // Ref type
  React.HTMLAttributes<HTMLTableCaptionElement> // Props type
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props} />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
