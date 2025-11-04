import React from 'react';
import { cva } from "class-variance-authority";
import { cn } from '../../lib/utils';

const AlertContext = React.createContext(undefined);

const useAlertContext = () => {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error("useAlertContext must be used within an Alert");
  }
  return context;
};

const alertVariants = cva(
  "relative w-full rounded-lg border p-5 sm:p-4 [&>svg~*]:pl-8 sm:[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 sm:[&>svg]:left-4 sm:[&>svg]:top-4 [&>svg]:text-gray-900 [&>svg]:dark:text-white [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-4 sm:[&>svg]:h-4",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-900 text-gray-900 dark:text-white",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning:
          "border-yellow-300/50 text-yellow-800 dark:border-yellow-700 [&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-950",
        success:
          "border-green-300/50 text-green-800 dark:border-green-700 [&>svg]:text-green-600 bg-green-50 dark:bg-green-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);


const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" | "warning" | "success" }>(({ className, variant, ...props }, ref) => (
   <AlertContext.Provider value={{ variant }}>
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props} />
  </AlertContext.Provider>
));
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight text-base sm:text-sm", className)}
    {...props} />
));
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-base sm:text-sm [&_p]:leading-relaxed", className)}
    {...props} />
));
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription };
