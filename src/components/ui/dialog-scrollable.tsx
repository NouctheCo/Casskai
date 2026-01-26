/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { DialogContent } from './dialog';

/**
 * Scrollable Dialog Content with sticky header and footer
 *
 * This component provides a dialog layout where:
 * - Header (optional) stays visible at top
 * - Body content scrolls when overflowing
 * - Footer (optional) stays visible at bottom
 *
 * @example
 * const MyDialog = () => (
 *   <Dialog open={isOpen}>
 *     <DialogScrollableContent>
 *       <DialogScrollableHeader>
 *         <DialogTitle>Title</DialogTitle>
 *       </DialogScrollableHeader>
 *       <DialogScrollableBody>
 *         Long content here
 *       </DialogScrollableBody>
 *       <DialogScrollableFooter>
 *         Buttons here
 *       </DialogScrollableFooter>
 *     </DialogScrollableContent>
 *   </Dialog>
 * )
 */

export const DialogScrollableContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent> & {
    /** Maximum height of dialog (default: calc(100vh-4rem)) */
    maxHeight?: string;
  }
>(({ className, children, maxHeight = 'calc(100vh-4rem)', ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn(
      'flex flex-col p-0 gap-0 overflow-hidden max-h-[calc(100vh-4rem)]',
      className
    )}
    style={{ maxHeight }}
    {...props}
  >
    {children}
  </DialogContent>
));
DialogScrollableContent.displayName = 'DialogScrollableContent';

/**
 * Header section - stays visible at top
 */
export const DialogScrollableHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'shrink-0 px-6 py-4 border-b',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DialogScrollableHeader.displayName = 'DialogScrollableHeader';

/**
 * Body section - scrollable content area
 */
export const DialogScrollableBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex-1 min-h-0 overflow-y-auto px-6 py-4',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DialogScrollableBody.displayName = 'DialogScrollableBody';

/**
 * Footer section - stays visible at bottom
 */
export const DialogScrollableFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'shrink-0 px-6 py-4 border-t',
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DialogScrollableFooter.displayName = 'DialogScrollableFooter';
