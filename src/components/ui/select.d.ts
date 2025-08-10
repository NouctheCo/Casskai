declare module '@/components/ui/select' {
  import * as React from 'react'
  export const Select: React.ComponentType<any>
  export const SelectTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>
  export const SelectContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const SelectItem: React.ForwardRefExoticComponent<React.LiHTMLAttributes<HTMLLIElement> & { value: string } & React.RefAttributes<HTMLLIElement>>
  export const SelectValue: React.ComponentType<any>
}
