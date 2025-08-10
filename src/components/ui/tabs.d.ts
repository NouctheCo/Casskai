declare module '@/components/ui/tabs' {
  import * as React from 'react'
  export const Tabs: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const TabsList: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { value?: string }
  export const TabsTrigger: React.ForwardRefExoticComponent<TabsTriggerProps & React.RefAttributes<HTMLButtonElement>>
  export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> { value?: string }
  export const TabsContent: React.ForwardRefExoticComponent<TabsContentProps & React.RefAttributes<HTMLDivElement>>
}
