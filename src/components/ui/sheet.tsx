/**
 * CassKai - Sheet Component (stub)
 *
 * Minimal implementation of a Sheet/Drawer component
 * for QuickActionsBar and other side panel UIs.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

interface SheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const Sheet: React.FC<SheetProps> = ({ children }) => <>{children}</>;

export const SheetTrigger: React.FC<SheetTriggerProps> = ({ children }) => <>{children}</>;

export const SheetContent: React.FC<SheetContentProps> = ({ children, className }) => (
  <div className={cn('fixed inset-y-0 right-0 z-50 w-[400px] bg-white dark:bg-gray-900 shadow-xl p-6', className)}>
    {children}
  </div>
);

export const SheetHeader: React.FC<SheetHeaderProps> = ({ children, className }) => (
  <div className={cn('mb-4', className)}>{children}</div>
);

export const SheetTitle: React.FC<SheetTitleProps> = ({ children, className }) => (
  <h3 className={cn('text-lg font-semibold', className)}>{children}</h3>
);
