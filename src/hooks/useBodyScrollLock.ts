/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { useEffect } from 'react';

/**
 * Hook to lock/unlock body scroll when a modal is open
 * Prevents background scrolling while modal is active
 *
 * @param isOpen - Whether the modal is currently open
 *
 * @example
 * ```tsx
 * function MyModal({ isOpen }) {
 *   useBodyScrollLock(isOpen);
 *
 *   if (!isOpen) return null;
 *   return <div>Modal content</div>;
 * }
 * ```
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    // Store original styles to restore later
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';

    // Add padding to prevent layout shift when scrollbar disappears
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup: restore original styles
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);
}
