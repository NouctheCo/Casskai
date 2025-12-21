/**
 * Hook React pour gérer la suppression d'entreprise
 */

import * as React from 'react';
import { companyDeletionService, CompanyDeletionRequest } from '@/services/companyDeletionService';

export interface UseCompanyDeletionResult {
  requestDeletion: (
    companyId: string,
    reason?: string
  ) => Promise<{ success: boolean; deletion_request?: CompanyDeletionRequest; error?: string }>;
  approveDeletion: (
    deletionRequestId: string,
    reason?: string
  ) => Promise<{ success: boolean; error?: string }>;
  rejectDeletion: (
    deletionRequestId: string,
    reason?: string
  ) => Promise<{ success: boolean; error?: string }>;
  cancelDeletion: (
    deletionRequestId: string,
    reason?: string
  ) => Promise<{ success: boolean; error?: string }>;
  getPendingApprovalsForUser: () => Promise<CompanyDeletionRequest[]>;
  getDeletionStatus: (companyId: string) => Promise<CompanyDeletionRequest | null>;
  loading: boolean;
  error: string | null;
}

export function useCompanyDeletion(): UseCompanyDeletionResult {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const requestDeletion = React.useCallback(
    async (companyId: string, reason?: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await companyDeletionService.requestCompanyDeletion(
          companyId,
          reason,
          true
        );
        if (!result.success) {
          setError(result.error || 'Erreur inconnue');
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const approveDeletion = React.useCallback(
    async (deletionRequestId: string, reason?: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await companyDeletionService.approveCompanyDeletion(
          deletionRequestId,
          reason
        );
        if (!result.success) {
          setError(result.error || 'Erreur inconnue');
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const rejectDeletion = React.useCallback(
    async (deletionRequestId: string, reason?: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await companyDeletionService.rejectCompanyDeletion(
          deletionRequestId,
          reason
        );
        if (!result.success) {
          setError(result.error || 'Erreur inconnue');
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cancelDeletion = React.useCallback(
    async (deletionRequestId: string, reason?: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await companyDeletionService.cancelCompanyDeletion(
          deletionRequestId,
          reason
        );
        if (!result.success) {
          setError(result.error || 'Erreur inconnue');
        }
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPendingApprovalsForUser = React.useCallback(async () => {
    try {
      return await companyDeletionService.getPendingApprovalsForUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return [];
    }
  }, []);

  const getDeletionStatus = React.useCallback(async (companyId: string) => {
    try {
      return await companyDeletionService.getCompanyDeletionStatus(companyId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return null;
    }
  }, []);

  return {
    requestDeletion,
    approveDeletion,
    rejectDeletion,
    cancelDeletion,
    getPendingApprovalsForUser,
    getDeletionStatus,
    loading,
    error
  };
}
