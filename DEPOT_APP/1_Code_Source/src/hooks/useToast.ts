/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { toast } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const useToast = () => {
  const showToast = (message: string, type: ToastType = 'info', duration: number = 4000) => {
    const options = {
      duration,
      style: {
        background: type === 'success' ? '#10B981' :
                   type === 'error' ? '#EF4444' :
                   type === 'warning' ? '#F59E0B' : '#3B82F6',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
      icon: type === 'success' ? '✅' :
            type === 'error' ? '❌' :
            type === 'warning' ? '⚠️' : 'ℹ️',
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast(message, { ...options, icon: '⚠️' });
        break;
      default:
        toast(message, options);
    }
  };

  const showLoadingToast = (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#6B7280',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '8px',
        padding: '12px 16px',
      },
    });
  };

  const dismissToast = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  return {
    showToast,
    showLoadingToast,
    dismissToast,
  };
};
