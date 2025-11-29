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

/**
 * Toast Helpers
 * Fonctions utilitaires pour afficher des notifications toast de manière cohérente
 * dans toute l'application
 */

import { toast } from '@/components/ui/use-toast';

/**
 * Options communes pour les toasts
 */
interface ToastOptions {
  title?: string;
  description?: string;
}

/**
 * Messages par défaut en français
 */
const DEFAULT_MESSAGES = {
  success: {
    title: 'Succès',
    description: 'Opération réussie',
  },
  error: {
    title: 'Erreur',
    description: 'Une erreur est survenue',
  },
  warning: {
    title: 'Attention',
    description: 'Veuillez vérifier les informations',
  },
  info: {
    title: 'Information',
    description: '',
  },
  // CRUD Operations
  created: {
    title: 'Créé avec succès',
    description: 'L\'élément a été créé',
  },
  updated: {
    title: 'Modifié avec succès',
    description: 'Les modifications ont été enregistrées',
  },
  deleted: {
    title: 'Supprimé avec succès',
    description: 'L\'élément a été supprimé',
  },
  saved: {
    title: 'Enregistré',
    description: 'Les données ont été sauvegardées',
  },
  // Network
  networkError: {
    title: 'Erreur réseau',
    description: 'Impossible de se connecter au serveur',
  },
  unauthorized: {
    title: 'Non autorisé',
    description: 'Vous n\'avez pas les permissions nécessaires',
  },
  notFound: {
    title: 'Introuvable',
    description: 'L\'élément recherché n\'existe pas',
  },
  // Validation
  validationError: {
    title: 'Erreur de validation',
    description: 'Veuillez vérifier les champs du formulaire',
  },
  requiredFields: {
    title: 'Champs obligatoires',
    description: 'Veuillez remplir tous les champs obligatoires',
  },
} as const;

/**
 * Toast de succès (variante par défaut)
 */
export function toastSuccess(options: ToastOptions | string) {
  const opts = typeof options === 'string' 
    ? { description: options }
    : options;

  return toast({
    title: opts.title || DEFAULT_MESSAGES.success.title,
    description: opts.description || DEFAULT_MESSAGES.success.description,
  });
}

/**
 * Toast d'erreur (variante destructive)
 */
export function toastError(options: ToastOptions | string) {
  const opts = typeof options === 'string' 
    ? { description: options }
    : options;

  return toast({
    variant: 'destructive',
    title: opts.title || DEFAULT_MESSAGES.error.title,
    description: opts.description || DEFAULT_MESSAGES.error.description,
  });
}

/**
 * Toast d'avertissement
 */
export function toastWarning(options: ToastOptions | string) {
  const opts = typeof options === 'string' 
    ? { description: options }
    : options;

  return toast({
    title: opts.title || DEFAULT_MESSAGES.warning.title,
    description: opts.description || DEFAULT_MESSAGES.warning.description,
  });
}

/**
 * Toast d'information
 */
export function toastInfo(options: ToastOptions | string) {
  const opts = typeof options === 'string' 
    ? { description: options }
    : options;

  return toast({
    title: opts.title || DEFAULT_MESSAGES.info.title,
    description: opts.description,
  });
}

/**
 * Toast pour création réussie
 */
export function toastCreated(entityName?: string) {
  return toastSuccess({
    title: DEFAULT_MESSAGES.created.title,
    description: entityName 
      ? `${entityName} a été créé(e) avec succès`
      : DEFAULT_MESSAGES.created.description,
  });
}

/**
 * Toast pour mise à jour réussie
 */
export function toastUpdated(entityName?: string) {
  return toastSuccess({
    title: DEFAULT_MESSAGES.updated.title,
    description: entityName 
      ? `${entityName} a été modifié(e) avec succès`
      : DEFAULT_MESSAGES.updated.description,
  });
}

/**
 * Toast pour suppression réussie
 */
export function toastDeleted(entityName?: string) {
  return toastSuccess({
    title: DEFAULT_MESSAGES.deleted.title,
    description: entityName 
      ? `${entityName} a été supprimé(e) avec succès`
      : DEFAULT_MESSAGES.deleted.description,
  });
}

/**
 * Toast pour sauvegarde réussie
 */
export function toastSaved(entityName?: string) {
  return toastSuccess({
    title: DEFAULT_MESSAGES.saved.title,
    description: entityName 
      ? `${entityName} a été enregistré(e) avec succès`
      : DEFAULT_MESSAGES.saved.description,
  });
}

/**
 * Toast pour erreur réseau
 */
export function toastNetworkError() {
  return toastError({
    title: DEFAULT_MESSAGES.networkError.title,
    description: DEFAULT_MESSAGES.networkError.description,
  });
}

/**
 * Toast pour erreur non autorisée
 */
export function toastUnauthorized() {
  return toastError({
    title: DEFAULT_MESSAGES.unauthorized.title,
    description: DEFAULT_MESSAGES.unauthorized.description,
  });
}

/**
 * Toast pour élément non trouvé
 */
export function toastNotFound(entityName?: string) {
  return toastError({
    title: DEFAULT_MESSAGES.notFound.title,
    description: entityName 
      ? `${entityName} introuvable`
      : DEFAULT_MESSAGES.notFound.description,
  });
}

/**
 * Toast pour erreur de validation
 */
export function toastValidationError(details?: string) {
  return toastError({
    title: DEFAULT_MESSAGES.validationError.title,
    description: details || DEFAULT_MESSAGES.validationError.description,
  });
}

/**
 * Toast pour champs obligatoires manquants
 */
export function toastRequiredFields() {
  return toastError({
    title: DEFAULT_MESSAGES.requiredFields.title,
    description: DEFAULT_MESSAGES.requiredFields.description,
  });
}

/**
 * Toast basé sur le résultat d'une opération Supabase
 * @param result - Résultat de l'opération { success: boolean; error?: Error }
 * @param successMessage - Message à afficher en cas de succès
 * @param errorMessage - Message à afficher en cas d'erreur (optionnel, utilise result.error.message par défaut)
 */
export function toastFromResult(
  result: { success: boolean; error?: Error | null },
  successMessage: string,
  errorMessage?: string
) {
  if (result.success) {
    return toastSuccess(successMessage);
  } else {
    return toastError({
      description: errorMessage || result.error?.message || 'Une erreur est survenue',
    });
  }
}

/**
 * Toast avec promesse (loading -> success/error)
 * Affiche un toast de chargement, puis met à jour avec le résultat
 * 
 * @example
 * await toastPromise(
 *   saveData(),
 *   {
 *     loading: 'Enregistrement en cours...',
 *     success: 'Données enregistrées !',
 *     error: 'Erreur lors de l\'enregistrement'
 *   }
 * );
 */
export async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
): Promise<T> {
  const loadingToast = toastInfo(messages.loading);

  try {
    const result = await promise;
    
    // Dismiss loading toast
    loadingToast.dismiss();
    
    // Show success
    const successMessage = typeof messages.success === 'function'
      ? messages.success(result)
      : messages.success;
    toastSuccess(successMessage);
    
    return result;
  } catch (error) {
    // Dismiss loading toast
    loadingToast.dismiss();
    
    // Show error
    const errorMessage = typeof messages.error === 'function'
      ? messages.error(error)
      : messages.error;
    toastError(errorMessage);
    
    throw error;
  }
}

/**
 * Export par défaut de toutes les fonctions
 */
export default {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  created: toastCreated,
  updated: toastUpdated,
  deleted: toastDeleted,
  saved: toastSaved,
  networkError: toastNetworkError,
  unauthorized: toastUnauthorized,
  notFound: toastNotFound,
  validationError: toastValidationError,
  requiredFields: toastRequiredFields,
  fromResult: toastFromResult,
  promise: toastPromise,
};
