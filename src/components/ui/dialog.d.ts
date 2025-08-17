declare module '@/components/ui/dialog' {
  import * as React from 'react'
  export const Dialog: React.FC<any>
  export const DialogPortal: React.FC<any>
  export const DialogOverlay: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const DialogTrigger: React.FC<any>
  export const DialogClose: React.FC<any>
  export const DialogContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const DialogHeader: React.FC<{ className?: string } & Record<string, any>>
  export const DialogFooter: React.FC<{ className?: string } & Record<string, any>>
  export const DialogTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>
  export const DialogDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>
}
