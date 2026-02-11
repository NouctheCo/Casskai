/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * FormFieldWithFeedback - Enhanced form field with visual feedback
 *
 * Features:
 * - ✓ Green checkmark when valid
 * - ✗ Red X when invalid
 * - Shake animation on error
 * - Real-time validation feedback
 * - Compatible with react-hook-form
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormFieldWithFeedbackProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Validation state
   */
  isValid?: boolean;

  /**
   * Error state
   */
  isInvalid?: boolean;

  /**
   * Show feedback icons (default: true)
   */
  showFeedback?: boolean;

  /**
   * Enable shake animation on error (default: true)
   */
  shakeOnError?: boolean;

  /**
   * Custom wrapper className
   */
  wrapperClassName?: string;
}

export const FormFieldWithFeedback = React.forwardRef<HTMLInputElement, FormFieldWithFeedbackProps>(
  (
    {
      isValid = false,
      isInvalid = false,
      showFeedback = true,
      shakeOnError = true,
      wrapperClassName,
      className,
      ...props
    },
    ref
  ) => {
    const [shouldShake, setShouldShake] = useState(false);

    // Trigger shake animation when error appears
    useEffect(() => {
      if (isInvalid && shakeOnError) {
        setShouldShake(true);
        const timer = setTimeout(() => setShouldShake(false), 500);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [isInvalid, shakeOnError]);

    return (
      <div className={cn('relative', wrapperClassName)}>
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Valid state
            isValid && 'border-green-500 focus-visible:ring-green-500',
            // Invalid state
            isInvalid && 'border-red-500 focus-visible:ring-red-500',
            // Shake animation
            shouldShake && 'animate-shake',
            className
          )}
          {...props}
        />

        {/* Feedback icons */}
        {showFeedback && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isValid && !isInvalid && (
              <CheckCircle2
                className="h-5 w-5 text-green-600 dark:text-green-500 animate-scale-in"
                strokeWidth={2}
              />
            )}
            {isInvalid && (
              <XCircle
                className="h-5 w-5 text-red-600 dark:text-red-500 animate-scale-in"
                strokeWidth={2}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

FormFieldWithFeedback.displayName = 'FormFieldWithFeedback';

/**
 * TextareaWithFeedback - Enhanced textarea with visual feedback
 */
export interface TextareaWithFeedbackProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isValid?: boolean;
  isInvalid?: boolean;
  showFeedback?: boolean;
  shakeOnError?: boolean;
  wrapperClassName?: string;
}

export const TextareaWithFeedback = React.forwardRef<HTMLTextAreaElement, TextareaWithFeedbackProps>(
  (
    {
      isValid = false,
      isInvalid = false,
      showFeedback = true,
      shakeOnError = true,
      wrapperClassName,
      className,
      ...props
    },
    ref
  ) => {
    const [shouldShake, setShouldShake] = useState(false);

    useEffect(() => {
      if (isInvalid && shakeOnError) {
        setShouldShake(true);
        const timer = setTimeout(() => setShouldShake(false), 500);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [isInvalid, shakeOnError]);

    return (
      <div className={cn('relative', wrapperClassName)}>
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isValid && 'border-green-500 focus-visible:ring-green-500',
            isInvalid && 'border-red-500 focus-visible:ring-red-500',
            shouldShake && 'animate-shake',
            className
          )}
          {...props}
        />

        {showFeedback && (
          <div className="absolute right-3 top-3 pointer-events-none">
            {isValid && !isInvalid && (
              <CheckCircle2
                className="h-5 w-5 text-green-600 dark:text-green-500 animate-scale-in"
                strokeWidth={2}
              />
            )}
            {isInvalid && (
              <XCircle
                className="h-5 w-5 text-red-600 dark:text-red-500 animate-scale-in"
                strokeWidth={2}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

TextareaWithFeedback.displayName = 'TextareaWithFeedback';
