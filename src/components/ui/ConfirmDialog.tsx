import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
}

export function ConfirmDialog({
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  onConfirm,
  children
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UseConfirmDialogReturn {
  ConfirmDialog: React.ComponentType<Omit<ConfirmDialogProps, 'children'>>;
  confirm: (props: Omit<ConfirmDialogProps, 'children' | 'onConfirm'>) => Promise<boolean>;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [dialogProps, setDialogProps] = useState<ConfirmDialogProps | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (props: Omit<ConfirmDialogProps, 'children' | 'onConfirm'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
      setDialogProps({
        ...props,
        onConfirm: () => {
          resolve(true);
          setDialogProps(null);
        },
        children: null
      });
    });
  };

  const ConfirmDialogComponent: React.ComponentType<Omit<ConfirmDialogProps, 'children'>> = (props) => {
    if (!dialogProps) return null;
    
    return (
      <AlertDialog open={true} onOpenChange={(open) => {
        if (!open && resolvePromise) {
          resolvePromise(false);
          setDialogProps(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogProps.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogProps.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (resolvePromise) {
                resolvePromise(false);
                setDialogProps(null);
              }
            }}>
              {dialogProps.cancelText || 'Annuler'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={dialogProps.onConfirm}
              className={dialogProps.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {dialogProps.confirmText || 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return {
    ConfirmDialog: ConfirmDialogComponent,
    confirm
  };
}