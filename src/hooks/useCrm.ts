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

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { crmService } from '@/services/crmService';
import { toastCreated, toastSuccess, toastError } from '@/lib/toast-helpers';
import {
  Client,
  Contact,
  Opportunity,
  CommercialAction,
  CrmStats,
  PipelineStats,
  CrmDashboardData,
  ClientFormData,
  ContactFormData,
  OpportunityFormData,
  CommercialActionFormData,
  CrmFilters
} from '@/types/crm.types';

interface UseCrmReturn {
  // Data
  clients: Client[];
  contacts: Contact[];
  opportunities: Opportunity[];
  commercialActions: CommercialAction[];
  stats: CrmStats | null;
  pipelineStats: PipelineStats[];
  dashboardData: CrmDashboardData | null;

  // Loading states
  loading: boolean;
  clientsLoading: boolean;
  contactsLoading: boolean;
  opportunitiesLoading: boolean;
  statsLoading: boolean;

  // Error states
  error: string | null;

  // Actions
  fetchClients: (filters?: CrmFilters) => Promise<void>;
  fetchContacts: (clientId?: string) => Promise<void>;
  fetchOpportunities: (clientId?: string) => Promise<void>;
  fetchCommercialActions: (filters?: { clientId?: string; opportunityId?: string }) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchDashboardData: () => Promise<void>;

  // CRUD operations
  createClient: (clientData: ClientFormData) => Promise<boolean>;
  updateClient: (clientId: string, clientData: Partial<ClientFormData>) => Promise<boolean>;
  deleteClient: (clientId: string) => Promise<boolean>;

  createContact: (contactData: ContactFormData) => Promise<boolean>;
  createOpportunity: (opportunityData: OpportunityFormData) => Promise<boolean>;
  updateOpportunity: (opportunityId: string, opportunityData: Partial<OpportunityFormData>) => Promise<boolean>;
  deleteOpportunity: (opportunityId: string) => Promise<boolean>;
  createCommercialAction: (actionData: CommercialActionFormData) => Promise<boolean>;
  updateCommercialAction: (actionId: string, actionData: Partial<CommercialActionFormData>) => Promise<boolean>;
  deleteCommercialAction: (actionId: string) => Promise<boolean>;

  // Utility
  refreshAll: () => Promise<void>;
}

// Helper to extract error message
const getErrorMessage = (error: string | { message: string; code?: string } | undefined): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  return error.message;
};

export function useCrm(): UseCrmReturn {
  const { currentCompany } = useAuth();

  // States
  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [commercialActions, setCommercialActions] = useState<CommercialAction[]>([]);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats[]>([]);
  const [dashboardData, setDashboardData] = useState<CrmDashboardData | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch functions
  const fetchClients = useCallback(async (filters?: CrmFilters) => {
    if (!currentCompany?.id) return;

    setClientsLoading(true);
    setError(null);

    try {
      const response = await crmService.getClients(currentCompany.id, filters);

      if (response.success && response.data) {
        setClients(response.data);
      } else {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : response.error?.message || 'Failed to fetch clients';
        setError(errorMsg);
      }
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Unknown error');
    } finally {
      setClientsLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchContacts = useCallback(async (clientId?: string) => {
    if (!currentCompany?.id) return;

    setContactsLoading(true);
    setError(null);

    try {
      console.log('[useCrm] fetchContacts - companyId:', currentCompany.id, 'clientId:', clientId);
      const response = await crmService.getContacts(currentCompany.id, clientId);
      console.log('[useCrm] fetchContacts response:', response);

      if (response.success && response.data) {
        console.log('[useCrm] Setting contacts:', response.data.length, 'items');
        setContacts(response.data);
      } else {
        const errorMsg = getErrorMessage(response.error) || 'Failed to fetch contacts';
        console.error('[useCrm] fetchContacts error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('[useCrm] fetchContacts exception:', err);
      setError(err instanceof Error ? (err as Error).message : 'Unknown error');
    } finally {
      setContactsLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchOpportunities = useCallback(async (clientId?: string) => {
    if (!currentCompany?.id) return;

    setOpportunitiesLoading(true);
    setError(null);

    try {
      const filters: CrmFilters = clientId ? { search: clientId } : {};
      const response = await crmService.getOpportunities(currentCompany.id, filters);

      if (response.success && response.data) {
        setOpportunities(response.data);
      } else {
        setError(getErrorMessage(response.error) || 'Failed to fetch opportunities');
      }
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Unknown error');
    } finally {
      setOpportunitiesLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchCommercialActions = useCallback(async (filters?: { clientId?: string; opportunityId?: string }) => {
    if (!currentCompany?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Convert filters to CrmFilters format
      const crmFilters: CrmFilters = filters?.clientId ? { search: filters.clientId } : {};
      const response = await crmService.getCommercialActions(currentCompany.id, crmFilters);

      if (response.success && response.data) {
        setCommercialActions(response.data);
      } else {
        setError(getErrorMessage(response.error) || 'Failed to fetch commercial actions');
      }
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchStats = useCallback(async () => {
    if (!currentCompany?.id) return;

    setStatsLoading(true);
    setError(null);

    try {
      const [statsResponse, pipelineResponse] = await Promise.all([
        crmService.getCrmStats(currentCompany.id),
        crmService.getPipelineStats(currentCompany.id)
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (pipelineResponse.success && pipelineResponse.data) {
        setPipelineStats(pipelineResponse.data);
      }

      if (!statsResponse.success || !pipelineResponse.success) {
        const errorMsg = getErrorMessage(statsResponse.error) || getErrorMessage(pipelineResponse.error) || 'Failed to fetch stats';
        setError(errorMsg);
      }
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Unknown error');
    } finally {
      setStatsLoading(false);
    }
  }, [currentCompany?.id]);

  const fetchDashboardData = useCallback(async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await crmService.getDashboardData(currentCompany.id);

      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError(getErrorMessage(response.error) || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  // CRUD operations
  const createClient = useCallback(async (clientData: ClientFormData): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await crmService.createClient(currentCompany.id, clientData);

      if (response.success) {
        // Refresh clients list
        await fetchClients();
        return true;
      } else {
        setError(getErrorMessage(response.error) || 'Failed to create client');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Unknown error');
      return false;
    }
  }, [currentCompany?.id, fetchClients]);

  const updateClient = useCallback(async (clientId: string, clientData: Partial<ClientFormData>): Promise<boolean> => {
    try {
      const response = await crmService.updateClient(clientId, clientData as ClientFormData);

      if (response.success) {
        // Refresh clients list
        await fetchClients();
        return true;
      } else {
        setError(getErrorMessage(response.error) || 'Failed to update client');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Unknown error');
      return false;
    }
  }, [fetchClients]);

  const deleteClient = useCallback(async (clientId: string): Promise<boolean> => {
    try {
      const response = await crmService.deleteClient(clientId);

      if (response.success) {
        // Refresh clients list
        await fetchClients();
        return true;
      } else {
        setError(getErrorMessage(response.error) || 'Failed to delete client');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? (err as Error).message : 'Unknown error');
      return false;
    }
  }, [fetchClients]);

  const createContact = useCallback(async (contactData: ContactFormData): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      const response = await crmService.createContact(currentCompany.id, contactData);

      if (response.success) {
        // Refresh contacts list
        await fetchContacts();
        toastCreated('Contact'); // Toast notification
        return true;
      } else {
        const errorMsg = getErrorMessage(response.error) || 'Failed to create contact';
        setError(errorMsg);
        toastError(errorMsg); // Toast notification
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? (err as Error).message : 'Unknown error';
      setError(errorMsg);
      toastError(errorMsg); // Toast notification
      return false;
    }
  }, [currentCompany?.id, fetchContacts]);

  const createOpportunity = useCallback(async (opportunityData: OpportunityFormData): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      console.log('[useCrm] Creating opportunity:', opportunityData);
      const response = await crmService.createOpportunity(currentCompany.id, opportunityData);
      console.log('[useCrm] Opportunity creation response:', response);

      if (response.success) {
        toastSuccess('Opportunité créée avec succès');
        // Refresh opportunities list
        console.log('[useCrm] Fetching opportunities after creation...');
        await fetchOpportunities();
        console.log('[useCrm] Opportunities refreshed');
        return true;
      } else {
        const errorMsg = getErrorMessage(response.error) || 'Failed to create opportunity';
        setError(errorMsg);
        toastError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('[useCrm] Exception creating opportunity:', err);
      const errorMsg = err instanceof Error ? (err as Error).message : 'Unknown error';
      setError(errorMsg);
      toastError(errorMsg);
      return false;
    }
  }, [currentCompany?.id, fetchOpportunities]);

  const updateOpportunity = useCallback(async (opportunityId: string, opportunityData: Partial<OpportunityFormData>): Promise<boolean> => {
    try {
      console.log('[useCrm] Updating opportunity:', opportunityId, opportunityData);
      const response = await crmService.updateOpportunity(opportunityId, opportunityData);
      console.log('[useCrm] Opportunity update response:', response);

      if (response.success) {
        toastSuccess('Opportunité mise à jour avec succès');
        // Refresh opportunities list
        console.log('[useCrm] Fetching opportunities after update...');
        await fetchOpportunities();
        console.log('[useCrm] Opportunities refreshed');
        return true;
      } else {
        const errorMsg = getErrorMessage(response.error) || 'Failed to update opportunity';
        setError(errorMsg);
        toastError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('[useCrm] Exception updating opportunity:', err);
      const errorMsg = err instanceof Error ? (err as Error).message : 'Unknown error';
      setError(errorMsg);
      toastError(errorMsg);
      return false;
    }
  }, [fetchOpportunities]);

  const deleteOpportunity = useCallback(async (opportunityId: string): Promise<boolean> => {
    try {
      console.log('[useCrm] Deleting opportunity:', opportunityId);
      const response = await crmService.deleteOpportunity(opportunityId);
      console.log('[useCrm] Opportunity delete response:', response);

      if (response.success) {
        toastSuccess('Opportunité supprimée avec succès');
        // Refresh opportunities list
        console.log('[useCrm] Fetching opportunities after delete...');
        await fetchOpportunities();
        console.log('[useCrm] Opportunities refreshed');
        return true;
      } else {
        const errorMsg = getErrorMessage(response.error) || 'Failed to delete opportunity';
        setError(errorMsg);
        toastError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('[useCrm] Exception deleting opportunity:', err);
      const errorMsg = err instanceof Error ? (err as Error).message : 'Unknown error';
      setError(errorMsg);
      toastError(errorMsg);
      return false;
    }
  }, [fetchOpportunities]);

  const createCommercialAction = useCallback(async (actionData: CommercialActionFormData): Promise<boolean> => {
    if (!currentCompany?.id) return false;

    try {
      console.log('[useCrm] Creating commercial action:', actionData);
      const response = await crmService.createCommercialAction(currentCompany.id, actionData);
      console.log('[useCrm] Action creation response:', response);

      if (response.success) {
        toastSuccess('Action commerciale créée avec succès');
        // Refresh commercial actions list
        console.log('[useCrm] Fetching actions after creation...');
        await fetchCommercialActions();
        console.log('[useCrm] Actions refreshed');
        return true;
      } else {
        const errorMsg = getErrorMessage(response.error) || 'Failed to create commercial action';
        setError(errorMsg);
        toastError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('[useCrm] Exception creating action:', err);
      const errorMsg = err instanceof Error ? (err as Error).message : 'Unknown error';
      setError(errorMsg);
      toastError(errorMsg);
      return false;
    }
  }, [currentCompany?.id, fetchCommercialActions]);

  const updateCommercialAction = useCallback(async (actionId: string, actionData: Partial<CommercialActionFormData>): Promise<boolean> => {
    try {
      const response = await crmService.updateCommercialAction(actionId, actionData);

      if (response.success) {
        toastSuccess('Action commerciale mise à jour');
        await fetchCommercialActions();
        return true;
      } else {
        const errorMsg = getErrorMessage(response.error) || 'Failed to update commercial action';
        setError(errorMsg);
        toastError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? (err as Error).message : 'Unknown error';
      setError(errorMsg);
      toastError(errorMsg);
      return false;
    }
  }, [fetchCommercialActions]);

  const deleteCommercialAction = useCallback(async (actionId: string): Promise<boolean> => {
    try {
      const response = await crmService.deleteCommercialAction(actionId);

      if (response.success) {
        toastSuccess('Action commerciale supprimée');
        await fetchCommercialActions();
        return true;
      } else {
        const errorMsg = getErrorMessage(response.error) || 'Failed to delete commercial action';
        setError(errorMsg);
        toastError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? (err as Error).message : 'Unknown error';
      setError(errorMsg);
      toastError(errorMsg);
      return false;
    }
  }, [fetchCommercialActions]);

  // Utility function to refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchClients(),
      fetchContacts(),
      fetchOpportunities(),
      fetchStats()
    ]);
  }, [fetchClients, fetchContacts, fetchOpportunities, fetchStats]);

  // Initial data load
  useEffect(() => {
    if (currentCompany?.id) {
      fetchDashboardData();
      refreshAll();
    }
  }, [currentCompany?.id, fetchDashboardData, refreshAll]);

  return {
    // Data
    clients,
    contacts,
    opportunities,
    commercialActions,
    stats,
    pipelineStats,
    dashboardData,

    // Loading states
    loading,
    clientsLoading,
    contactsLoading,
    opportunitiesLoading,
    statsLoading,

    // Error
    error,

    // Actions
    fetchClients,
    fetchContacts,
    fetchOpportunities,
    fetchCommercialActions,
    fetchStats,
    fetchDashboardData,

    // CRUD
    createClient,
    updateClient,
    deleteClient,
    createContact,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    createCommercialAction,
    updateCommercialAction,
    deleteCommercialAction,

    // Utility
    refreshAll
  };
}
