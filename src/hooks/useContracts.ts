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
 * Hook métier pour la gestion des contrats et RFA
 * Suit les patterns existants de l'application CassKai
 */

import { useState, useEffect, useCallback } from 'react';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { useToast } from '../components/ui/use-toast';
import { contractsService } from '../services/contractsService';
import {
  ContractData,
  ContractFormData,
  ContractFilters,
  ContractsDashboardData,
  RFACalculation,
  RFAFormData,
  RFAFilters,
  SimulationResult,
  TurnoverScenario
} from '../types/contracts.types';

interface UseContractsReturn {
  // États
  contracts: ContractData[];
  dashboardData: ContractsDashboardData | null;
  rfaCalculations: RFACalculation[];
  simulationResults: SimulationResult[];
  loading: boolean;
  error: string | null;
  
  // Filtres
  filters: ContractFilters;
  rfaFilters: RFAFilters;
  setFilters: (filters: ContractFilters) => void;
  setRFAFilters: (filters: RFAFilters) => void;
  
  // Actions contrats
  loadContracts: () => Promise<void>;
  createContract: (formData: ContractFormData) => Promise<boolean>;
  updateContract: (id: string, formData: Partial<ContractFormData>) => Promise<boolean>;
  archiveContract: (id: string) => Promise<boolean>;
  
  // Actions RFA
  loadRFACalculations: () => Promise<void>;
  createRFACalculation: (formData: RFAFormData) => Promise<boolean>;
  simulateRFA: (contractId: string, scenarios: TurnoverScenario[]) => Promise<void>;
  
  // Dashboard
  loadDashboardData: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  
  // Export
  exportContracts: () => void;
  exportRFACalculations: () => void;
  
  // Utilitaires
  getContractById: (id: string) => ContractData | undefined;
  getRFAForContract: (contractId: string) => RFACalculation[];
}

/**
 * Hook principal pour la gestion des contrats
 */
export const useContracts = (): UseContractsReturn => {
  const { currentEnterpriseId } = useEnterprise();
  const { toast } = useToast();

  // États principaux
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [dashboardData, setDashboardData] = useState<ContractsDashboardData | null>(null);
  const [rfaCalculations, setRFACalculations] = useState<RFACalculation[]>([]);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [filters, setFilters] = useState<ContractFilters>({});
  const [rfaFilters, setRFAFilters] = useState<RFAFilters>({});

  // Chargement des contrats
  const loadContracts = useCallback(async () => {
    if (!currentEnterpriseId) return;

    setLoading(true);

    try {
      const response = await contractsService.getContracts(currentEnterpriseId, filters);

      if (response.success && response.data) {
        setContracts(response.data);
      } else {
        // Dont show error - just log and show empty state
        setContracts([]);
        console.warn('Contracts data unavailable');
      }
    } catch (err) {
      // Dont show error - just log and show empty state
      console.warn('Error loading contracts:', err);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [currentEnterpriseId, filters]);

  // Création d'un contrat
  const createContract = useCallback(async (formData: ContractFormData): Promise<boolean> => {
    if (!currentEnterpriseId) return false;

    setLoading(true);
    try {
      const response = await contractsService.createContract(currentEnterpriseId, formData);
      
      if (response.success) {
        toast({
          title: "Succès",
          description: "Contrat créé avec succès",
          variant: "default"
        });
        await loadContracts(); // Recharger la liste
        await loadDashboardData(); // Mettre à jour le dashboard
        return true;
      } else {
        toast({
          title: "Erreur",
          description: response.error?.message || "Impossible de créer le contrat",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentEnterpriseId, toast, loadContracts]);

  // Mise à jour d'un contrat
  const updateContract = useCallback(async (id: string, formData: Partial<ContractFormData>): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await contractsService.updateContract(id, formData);
      
      if (response.success) {
        toast({
          title: "Succès",
          description: "Contrat mis à jour avec succès",
          variant: "default"
        });
        await loadContracts();
        await loadDashboardData();
        return true;
      } else {
        toast({
          title: "Erreur",
          description: response.error?.message || "Impossible de mettre à jour le contrat",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, loadContracts]);

  // Archivage d'un contrat
  const archiveContract = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await contractsService.archiveContract(id);
      
      if (response.success) {
        toast({
          title: "Succès",
          description: "Contrat archivé avec succès",
          variant: "default"
        });
        await loadContracts();
        await loadDashboardData();
        return true;
      } else {
        toast({
          title: "Erreur",
          description: response.error?.message || "Impossible d'archiver le contrat",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, loadContracts]);

  // Chargement des calculs RFA
  const loadRFACalculations = useCallback(async () => {
    if (!currentEnterpriseId) return;

    setLoading(true);

    try {
      const response = await contractsService.getRFACalculations(currentEnterpriseId, rfaFilters);
      
      if (response.success && response.data) {
        setRFACalculations(response.data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les calculs RFA",
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentEnterpriseId, rfaFilters, toast]);

  // Création d'un calcul RFA
  const createRFACalculation = useCallback(async (formData: RFAFormData): Promise<boolean> => {
    if (!currentEnterpriseId) return false;

    setLoading(true);
    try {
      const response = await contractsService.createRFACalculation(currentEnterpriseId, formData);
      
      if (response.success) {
        toast({
          title: "Succès",
          description: "Calcul RFA créé avec succès",
          variant: "default"
        });
        await loadRFACalculations();
        await loadDashboardData();
        return true;
      } else {
        toast({
          title: "Erreur",
          description: response.error?.message || "Impossible de créer le calcul RFA",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentEnterpriseId, toast, loadRFACalculations]);

  // Simulation RFA
  const simulateRFA = useCallback(async (contractId: string, scenarios: TurnoverScenario[]) => {
    setLoading(true);
    try {
      const response = await contractsService.simulateRFA(contractId, scenarios);
      
      if (response.success && response.data) {
        setSimulationResults(response.data);
        toast({
          title: "Simulation terminée",
          description: `${scenarios.length} scénarios calculés`,
          variant: "default"
        });
      } else {
        toast({
          title: "Erreur de simulation",
          description: response.error?.message || "Impossible d'effectuer la simulation",
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Chargement des données dashboard
  const loadDashboardData = useCallback(async () => {
    if (!currentEnterpriseId) return;

    setLoading(true);
    try {
      const response = await contractsService.getDashboardData(currentEnterpriseId);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? (err as Error).message : 'Erreur inconnue';
    } finally {
      setLoading(false);
    }
  }, [currentEnterpriseId]);

  // Actualisation complète du dashboard
  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      loadContracts(),
      loadRFACalculations(),
      loadDashboardData()
    ]);
  }, [loadContracts, loadRFACalculations, loadDashboardData]);

  // Export des contrats
  const exportContracts = useCallback(() => {
    contractsService.exportToCSV(contracts, 'contrats');
    toast({
      title: "Export réussi",
      description: "Les contrats ont été exportés en CSV",
      variant: "default"
    });
  }, [contracts, toast]);

  // Export des calculs RFA
  const exportRFACalculations = useCallback(() => {
    contractsService.exportRFAToCSV(rfaCalculations, 'calculs_rfa');
    toast({
      title: "Export réussi",
      description: "Les calculs RFA ont été exportés en CSV",
      variant: "default"
    });
  }, [rfaCalculations, toast]);

  // Utilitaires
  const getContractById = useCallback((id: string): ContractData | undefined => {
    return contracts.find(contract => contract.id === id);
  }, [contracts]);

  const getRFAForContract = useCallback((contractId: string): RFACalculation[] => {
    return rfaCalculations.filter(calc => calc.contract_id === contractId);
  }, [rfaCalculations]);

  // Chargement initial
  useEffect(() => {
    if (currentEnterpriseId) {
      refreshDashboard();
    }
  }, [currentEnterpriseId, refreshDashboard]);

  // Rechargement lors des changements de filtres
  useEffect(() => {
    if (currentEnterpriseId) {
      loadContracts();
    }
  }, [filters, loadContracts]);

  useEffect(() => {
    if (currentEnterpriseId) {
      loadRFACalculations();
    }
  }, [rfaFilters, loadRFACalculations]);

  return {
    // États
    contracts,
    dashboardData,
    rfaCalculations,
    simulationResults,
    loading,
    error,
    
    // Filtres
    filters,
    rfaFilters,
    setFilters,
    setRFAFilters,
    
    // Actions contrats
    loadContracts,
    createContract,
    updateContract,
    archiveContract,
    
    // Actions RFA
    loadRFACalculations,
    createRFACalculation,
    simulateRFA,
    
    // Dashboard
    loadDashboardData,
    refreshDashboard,
    
    // Export
    exportContracts,
    exportRFACalculations,
    
    // Utilitaires
    getContractById,
    getRFAForContract
  };
};

/**
 * Hook simplifié pour les simulations RFA
 */
export const useRFASimulation = (contractId?: string) => {
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runSimulation = useCallback(async (scenarios: TurnoverScenario[]) => {
    if (!contractId) return;

    setLoading(true);
    try {
      const response = await contractsService.simulateRFA(contractId, scenarios);
      
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        toast({
          title: "Erreur de simulation",
          description: response.error?.message || "Impossible d'effectuer la simulation",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la simulation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [contractId, toast]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    loading,
    runSimulation,
    clearResults
  };
};
