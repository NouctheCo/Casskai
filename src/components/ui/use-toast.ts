/**
 * Legacy useToast / toast API — thin wrapper over Sonner.
 *
 * ~49 files still import from this module.  Rather than rewriting them all
 * at once, we translate the old Radix-style API into Sonner calls.
 *
 * The old API shape:
 *   const { toast } = useToast()
 *   toast({ title, description, variant })
 *
 * Sonner equivalent:
 *   toast.success(title, { description })
 *   toast.error(title, { description })
 */

import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive' | null | undefined;
  action?: React.ReactNode;
}

function toast(props: ToastProps) {
  const title = typeof props.title === 'string' ? props.title : undefined;
  const description = typeof props.description === 'string' ? props.description : undefined;

  if (props.variant === 'destructive') {
    sonnerToast.error(title || 'Erreur', { description });
  } else {
    sonnerToast.success(title || '', { description });
  }

  return {
    id: String(Date.now()),
    dismiss: () => sonnerToast.dismiss(),
    update: () => {},
  };
}

export function useToast() {
  return {
    toast,
    toasts: [] as never[],
    dismiss: () => sonnerToast.dismiss(),
  };
}

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

export { toast, ToastProvider };
