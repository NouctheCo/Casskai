import React from 'react';
import { cn } from '../../lib/utils';

    const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('rounded-xl border bg-gradient-to-br from-white to-gray-50/90 dark:from-gray-800 dark:to-gray-900/90 border-gray-200/60 dark:border-gray-700/60 text-card-foreground shadow-md hover:shadow-xl transition-all duration-300 backdrop-blur-sm hover:border-blue-300/50 dark:hover:border-blue-600/50 hover:scale-[1.005]', className)}
        {...props}
      />
    ));
    Card.displayName = 'Card';

    const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-2 sm:space-y-1.5 p-4 sm:p-6', className)}
        {...props}
      />
    ));
    CardHeader.displayName = 'CardHeader';

    const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
      <h3
        ref={ref}
        className={cn('text-xl sm:text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white', className)}
        {...props}
      />
    ));
    CardTitle.displayName = 'CardTitle';

    const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
      <p
        ref={ref}
        className={cn('text-base sm:text-sm text-muted-foreground dark:text-gray-400', className)}
        {...props}
      />
    ));
    CardDescription.displayName = 'CardDescription';

    const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
      <div ref={ref} className={cn('p-4 pt-0 sm:p-6', className)} {...props} />
    ));
    CardContent.displayName = 'CardContent';

    const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('flex items-center p-4 pt-0 sm:p-6', className)}
        {...props}
      />
    ));
    CardFooter.displayName = 'CardFooter';

    export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
