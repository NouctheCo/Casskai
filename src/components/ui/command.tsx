/**
 * Command component for search and filtering UI
 * Based on cmdk by pacocoursey
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { shouldFilter?: boolean }
>(({ className, shouldFilter: _shouldFilter, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      className
    )}
    {...props}
  />
));
Command.displayName = 'Command';

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { onValueChange?: (value: string) => void }
>(({ className, onValueChange, onChange, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    onChange={(e) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    }}
    {...props}
  />
));
CommandInput.displayName = 'CommandInput';

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <div
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
));
CommandEmpty.displayName = 'CommandEmpty';

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { heading?: string }
>(({ className, heading, ...props }, ref) => (
  <div ref={ref} className={cn('overflow-hidden p-1', className)}>
    {heading && (
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
        {heading}
      </div>
    )}
    <div {...props} />
  </div>
));
CommandGroup.displayName = 'CommandGroup';

const CommandItem = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
    value?: string;
    onSelect?: (value: string) => void;
    disabled?: boolean;
  }
>(({ className, value, onSelect, disabled: _disabled, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    onClick={() => value && onSelect?.(value)}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
};
