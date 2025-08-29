import * as React from 'react';
import { cn } from '../../lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-md text-base sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation',
	{
		variants: {
			variant: {
				default: 'bg-blue-600 text-white hover:bg-blue-600/90 active:bg-blue-700',
				destructive:
		  'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive',
				outline:
		  'border border-input bg-white dark:bg-gray-900 hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
				secondary:
		  'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
				ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
				link: 'text-primary underline-offset-4 hover:underline active:text-primary/80',
			},
			size: {
				default: 'h-11 px-4 py-2 sm:h-10',
				sm: 'h-11 px-4 py-2 sm:h-9 sm:px-3',
				lg: 'h-12 px-6 py-3 sm:h-11 sm:px-8 sm:py-2',
				icon: 'h-11 w-11 sm:h-10 sm:w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>
  (({ className, variant, size, asChild = false, children, ...props }, ref: React.Ref<HTMLButtonElement>) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			>
				{children}
			</Comp>
		);
	}
);
Button.displayName = 'Button';

export { Button, buttonVariants };