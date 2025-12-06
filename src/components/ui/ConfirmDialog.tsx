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
  AlertDialogTrigger,
} from './alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  showWarningIcon?: boolean;
}

export function ConfirmDialog({
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  onConfirm,
  onCancel,
  children,
  disabled = false,
  showWarningIcon = false,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild disabled={disabled}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {showWarningIcon && variant === 'destructive' && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}



/**
 * ConfirmDeleteDialog
 * Variante pré-configurée pour les suppressions
 */
export interface ConfirmDeleteDialogProps {
  children: React.ReactNode;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

export function ConfirmDeleteDialog({
  children,
  itemName = 'cet élément',
  onConfirm,
  onCancel,
  disabled = false,
}: ConfirmDeleteDialogProps) {
  return (
    <ConfirmDialog
      title="Confirmer la suppression"
      description={`Êtes-vous sûr de vouloir supprimer ${itemName} ? Cette action est irréversible.`}
      confirmText="Supprimer"
      cancelText="Annuler"
      onConfirm={onConfirm}
      onCancel={onCancel}
      variant="destructive"
      disabled={disabled}
      showWarningIcon={true}
    >
      {children}
    </ConfirmDialog>
  );
}

/**
 * ConfirmActionDialog
 * Variante pré-configurée pour actions importantes (non-destructives)
 */
export interface ConfirmActionDialogProps {
  children: React.ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

export function ConfirmActionDialog({
  children,
  title,
  description,
  confirmText = 'Confirmer',
  onConfirm,
  onCancel,
  disabled = false,
}: ConfirmActionDialogProps) {
  return (
    <ConfirmDialog
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText="Annuler"
      onConfirm={onConfirm}
      onCancel={onCancel}
      variant="default"
      disabled={disabled}
      showWarningIcon={false}
    >
      {children}
    </ConfirmDialog>
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



  const ConfirmDialogComponent: React.ComponentType<Omit<ConfirmDialogProps, 'children'>> = (_props) => {

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
