import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from '../../lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-auto min-h-[2.75rem] sm:min-h-[2.5rem] items-center rounded-lg bg-muted p-1 text-muted-foreground",
      // Responsivité et scroll horizontal
      "w-full flex-wrap sm:flex-nowrap gap-1",
      "overflow-x-auto overflow-y-hidden",
      // Scrollbar stylée
      "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent",
      // Webkit scrollbar
      "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:dark:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md",
      // Padding et taille responsive
      "px-3 py-2 sm:px-3 sm:py-1.5",
      "text-sm font-medium",
      // États
      "ring-offset-background transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // État actif
      "data-[state=active]:bg-white data-[state=active]:dark:bg-gray-800",
      "data-[state=active]:text-gray-900 data-[state=active]:dark:text-white",
      "data-[state=active]:shadow-sm",
      // Touch
      "touch-manipulation select-none",
      // Flex shrink pour responsivité
      "flex-shrink-0",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 sm:mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      // Empêcher le débordement
      "w-full max-w-full overflow-x-auto",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
