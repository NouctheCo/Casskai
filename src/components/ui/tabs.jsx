import React from "react";
    import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from '../../lib/utils';

    const Tabs = TabsPrimitive.Root;

    const TabsList = React.forwardRef(({ className, ...props }, ref) => (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "inline-flex h-11 sm:h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto",
          className
        )}
        {...props} />
    ));
    TabsList.displayName = TabsPrimitive.List.displayName;

    const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2.5 sm:px-3 sm:py-1.5 text-base sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 data-[state=active]:text-gray-900 data-[state=active]:dark:text-white data-[state=active]:shadow-sm touch-manipulation",
          className
        )}
        {...props} />
    ));
    TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

    const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
      <TabsPrimitive.Content
        ref={ref}
        className={cn(
          "mt-3 sm:mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props} />
    ));
    TabsContent.displayName = TabsPrimitive.Content.displayName;

    export { Tabs, TabsList, TabsTrigger, TabsContent };