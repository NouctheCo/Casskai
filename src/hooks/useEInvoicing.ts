/**
 * E-invoicing Hook
 * Custom React hook for e-invoicing functionality
 */

import { useState, useEffect, useCallback } from 'react';
// (types import normalisé vers '@/types')
import { 
  SubmissionOptions, 
  SubmissionResult,
  EInvoiceFormat,
  EInvoiceChannel,
  EInvDocument
} from '@/types/einvoicing.types';

interface EInvoicingCapabilities {
  enabled: boolean;
  formats: EInvoiceFormat[];
  channels: EInvoiceChannel[];
  features: string[];
}

interface EInvoicingStatistics {
  total_documents: number;
  by_status: Record<string, number>;
  by_format: Record<string, number>;
  by_channel: Record<string, number>;
  success_rate: number;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
}

interface UseEInvoicingReturn {
  // State
  isEnabled: boolean;
  capabilities: EInvoicingCapabilities | null;
  statistics: EInvoicingStatistics | null;
  documents: EInvDocument[];
  isLoading: boolean;
  error: string | null;

  // Actions
  enableFeature: () => Promise<void>;
  disableFeature: () => Promise<void>;
  submitInvoice: (invoiceId: string, options?: SubmissionOptions) => Promise<SubmissionResult>;
  getDocumentStatus: (documentId: string) => Promise<EInvDocument | null>;
  refreshData: () => Promise<void>;
}

const API_BASE_URL = '/api/v1';

export const useEInvoicing = (companyId: string): UseEInvoicingReturn => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [capabilities, setCapabilities] = useState<EInvoicingCapabilities | null>(null);
  const [statistics, setStatistics] = useState<EInvoicingStatistics | null>(null);
  const [documents, setDocuments] = useState<EInvDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (endpoint: string, options?: RequestInit) => {
    const token = localStorage.getItem('access_token') || '';
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API call failed');
    }

    return data.data;
  }, []);

  const loadCapabilities = useCallback(async () => {
    try {
      const data = await apiCall(`/companies/${companyId}/einvoicing/capabilities`);
      setCapabilities(data);
      setIsEnabled(data.enabled);
    } catch (err) {
      console.error('Error loading capabilities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load capabilities');
      setIsEnabled(false);
      setCapabilities(null);
    }
  }, [companyId, apiCall]);

  const loadStatistics = useCallback(async () => {
    if (!isEnabled) return;
    
    try {
      const data = await apiCall(`/companies/${companyId}/einvoicing/statistics`);
      setStatistics(data);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  }, [companyId, isEnabled, apiCall]);

  const loadDocuments = useCallback(async () => {
    if (!isEnabled) return;
    
    try {
      const data = await apiCall(`/companies/${companyId}/einvoicing/documents?limit=20`);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  }, [companyId, isEnabled, apiCall]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await loadCapabilities();
      await Promise.all([
        loadStatistics(),
        loadDocuments()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, [loadCapabilities, loadStatistics, loadDocuments]);

  const enableFeature = useCallback(async () => {
    try {
      setIsLoading(true);
      await apiCall(`/companies/${companyId}/einvoicing/enable`, {
        method: 'POST'
      });
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable feature');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [companyId, apiCall, refreshData]);

  const disableFeature = useCallback(async () => {
    try {
      setIsLoading(true);
      await apiCall(`/companies/${companyId}/einvoicing/disable`, {
        method: 'POST'
      });
      setIsEnabled(false);
      setCapabilities(null);
      setStatistics(null);
      setDocuments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable feature');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [companyId, apiCall]);

  const submitInvoice = useCallback(async (
    invoiceId: string,
    options: SubmissionOptions = {}
  ): Promise<SubmissionResult> => {
    try {
      setIsLoading(true);
      const result = await apiCall(`/companies/${companyId}/einvoicing/submit`, {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: invoiceId,
          ...options
        })
      });

      // Refresh documents after submission
      await loadDocuments();
      await loadStatistics();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit invoice';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, apiCall, loadDocuments, loadStatistics]);

  const getDocumentStatus = useCallback(async (
    documentId: string
  ): Promise<EInvDocument | null> => {
    try {
      const document = await apiCall(`/companies/${companyId}/einvoicing/documents/${documentId}`);
      
      // Update the document in the local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? document : doc
      ));
      
      return document;
    } catch (err) {
      console.error('Error getting document status:', err);
      return null;
    }
  }, [companyId, apiCall]);

  // Load initial data
  useEffect(() => {
    if (companyId) {
      refreshData();
    }
  }, [companyId, refreshData]);

  // Polling for document status updates
  useEffect(() => {
    if (!isEnabled || documents.length === 0) return;

    const interval = setInterval(async () => {
      // Only poll documents that are in progress
      const pendingDocuments = documents.filter(doc => 
        ['DRAFT', 'SUBMITTED'].includes(doc.lifecycle_status)
      );

      if (pendingDocuments.length > 0) {
        try {
          await Promise.all(
            pendingDocuments.map(doc => getDocumentStatus(doc.id))
          );
        } catch (err) {
          console.error('Error polling document status:', err);
        }
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [isEnabled, documents, getDocumentStatus]);

  return {
    isEnabled,
    capabilities,
    statistics,
    documents,
    isLoading,
    error,
    enableFeature,
    disableFeature,
    submitInvoice,
    getDocumentStatus,
    refreshData
  };
};