// Types pour les composants UI

import React from 'react';

// Types génériques pour les composants UI
export interface BaseUIProps {
  className?: string;
  children?: React.ReactNode;
}

// Types pour Dialog
export interface DialogProps extends BaseUIProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
}

export interface DialogContentProps extends BaseUIProps {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  onInteractOutside?: (event: Event) => void;
}

// Types pour Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

// Types pour Textarea
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

// Types pour les formulaires
export interface FormFieldProps extends BaseUIProps {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
}

// Types pour les données du tableau
export interface DataTableProps<T = any> extends BaseUIProps {
  data: T[];
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
  }>;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
    onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  };
  selection?: {
    selectedRows: string[];
    onSelectionChange: (selectedRows: string[]) => void;
  };
}

// Types pour les confirmations
export interface ConfirmationDialogProps extends DialogProps {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
}

// Types pour les toasts/notifications
export interface ToastProps extends BaseUIProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Types pour les menus de contexte
export interface ContextMenuProps extends BaseUIProps {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    separator?: boolean;
  }>;
}

// Types pour la pagination
export interface PaginationProps extends BaseUIProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisible?: number;
}

// Types pour le breadcrumb
export interface BreadcrumbProps extends BaseUIProps {
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    current?: boolean;
  }>;
  separator?: React.ReactNode;
}
