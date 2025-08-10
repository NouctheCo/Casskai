declare module '@/components/ui/progress' {
  import * as React from 'react'
  export const Progress: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & { value?: number } & React.RefAttributes<HTMLDivElement>>
}
