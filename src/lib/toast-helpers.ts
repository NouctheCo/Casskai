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
 * Toast Helpers - Powered by Sonner
 * Fonctions utilitaires pour afficher des notifications toast de manière cohérente
 * dans toute l'application
 */

import { toast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
}

const DEFAULT_MESSAGES = {
  success: { title: 'Succès', description: 'Opération réussie' },
  error: { title: 'Erreur', description: 'Une erreur est survenue' },
  warning: { title: 'Attention', description: 'Veuillez vérifier les informations' },
  info: { title: 'Information', description: '' },
  created: { title: 'Créé avec succès', description: "L'élément a été créé" },
  updated: { title: 'Modifié avec succès', description: 'Les modifications ont été enregistrées' },
  deleted: { title: 'Supprimé avec succès', description: "L'élément a été supprimé" },
  saved: { title: 'Enregistré', description: 'Les données ont été sauvegardées' },
  networkError: { title: 'Erreur réseau', description: 'Impossible de se connecter au serveur' },
  unauthorized: { title: 'Non autorisé', description: "Vous n'avez pas les permissions nécessaires" },
  notFound: { title: 'Introuvable', description: "L'élément recherché n'existe pas" },
  validationError: { title: 'Erreur de validation', description: 'Veuillez vérifier les champs du formulaire' },
  requiredFields: { title: 'Champs obligatoires', description: 'Veuillez remplir tous les champs obligatoires' },
} as const;

export function toastSuccess(options: ToastOptions | string) {
  const opts = typeof options === 'string' ? { description: options } : options;
  return toast.success(opts.title || DEFAULT_MESSAGES.success.title, {
    description: opts.description || DEFAULT_MESSAGES.success.description,
  });
}

export function toastError(options: ToastOptions | string) {
  const opts = typeof options === 'string' ? { description: options } : options;
  return toast.error(opts.title || DEFAULT_MESSAGES.error.title, {
    description: opts.description || DEFAULT_MESSAGES.error.description,
  });
}

export function toastWarning(options: ToastOptions | string) {
  const opts = typeof options === 'string' ? { description: options } : options;
  return toast.warning(opts.title || DEFAULT_MESSAGES.warning.title, {
    description: opts.description || DEFAULT_MESSAGES.warning.description,
  });
}

export function toastInfo(options: ToastOptions | string) {
  const opts = typeof options === 'string' ? { description: options } : options;
  return toast.info(opts.title || DEFAULT_MESSAGES.info.title, {
    description: opts.description,
  });
}

export function toastCreated(entityName?: string) {
  return toastSuccess({
    title: DEFAULT_MESSAGES.created.title,
    description: entityName
      ? `${entityName} a été créé(e) avec succès`
      : DEFAULT_MESSAGES.created.description,
  });
}

export function toastUpdated(entityName?: string) {
  return toastSuccess({
    title: DEFAULT_MESSAGES.updated.title,
    description: entityName
      ? `${entityName} a été modifié(e) avec succès`
      : DEFAULT_MESSAGES.updated.description,
  });
}

export function toastDeleted(entityName?: string) {
  return toastSuccess({
    title: DEFAULT_MESSAGES.deleted.title,
    description: entityName
      ? `${entityName} a été supprimé(e) avec succès`
      : DEFAULT_MESSAGES.deleted.description,
  });
}

export function toastSaved(entityName?: string) {
  return toastSuccess({
    title: DEFAULT_MESSAGES.saved.title,
    description: entityName
      ? `${entityName} a été enregistré(e) avec succès`
      : DEFAULT_MESSAGES.saved.description,
  });
}

export function toastNetworkError() {
  return toastError({
    title: DEFAULT_MESSAGES.networkError.title,
    description: DEFAULT_MESSAGES.networkError.description,
  });
}

export function toastUnauthorized() {
  return toastError({
    title: DEFAULT_MESSAGES.unauthorized.title,
    description: DEFAULT_MESSAGES.unauthorized.description,
  });
}

export function toastNotFound(entityName?: string) {
  return toastError({
    title: DEFAULT_MESSAGES.notFound.title,
    description: entityName
      ? `${entityName} introuvable`
      : DEFAULT_MESSAGES.notFound.description,
  });
}

export function toastValidationError(details?: string) {
  return toastError({
    title: DEFAULT_MESSAGES.validationError.title,
    description: details || DEFAULT_MESSAGES.validationError.description,
  });
}

export function toastRequiredFields() {
  return toastError({
    title: DEFAULT_MESSAGES.requiredFields.title,
    description: DEFAULT_MESSAGES.requiredFields.description,
  });
}

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

export async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
): Promise<T> {
  toast.promise(promise, {
    loading: messages.loading,
    success: (data: T) =>
      typeof messages.success === 'function' ? messages.success(data) : messages.success,
    error: (err: unknown) =>
      typeof messages.error === 'function' ? messages.error(err) : messages.error,
  });
  return promise;
}

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
