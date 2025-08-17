declare module '@/components/ui/checkbox' {
  import * as React from 'react'
  export const Checkbox: React.ForwardRefExoticComponent<
    React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>
  >
}
