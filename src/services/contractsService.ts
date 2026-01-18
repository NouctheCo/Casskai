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

import {
  ContractData,
  ContractFormData,
  ContractFilters,
  ContractsDashboardData,
  RFACalculation,
  RFAFormData,
  RFAFilters,
  TurnoverScenario,
  SimulationResult,
  ContractAlert,
  ContractHistory,
  ContractServiceResponse,
  RFAReport
} from '../types/contracts.types';
import * as ContractImpl from './contractsServiceImplementations';
import { supabase } from '@/lib/supabase';

/**
 * Service principal pour la gestion des contrats et RFA
 */
export const contractsService = {
  // ==================== GESTION DES CONTRATS ====================

  /**
   * Récupère la liste des contrats avec filtres
   */
  async getContracts(enterpriseId: string, filters?: ContractFilters): Promise<ContractServiceResponse<ContractData[]>> {
    return ContractImpl.getContracts(enterpriseId, filters);
  },

  /**
   * Récupère un contrat par son ID
   */
  async getContract(id: string): Promise<ContractServiceResponse<ContractData>> {
    return ContractImpl.getContract(id);
  },

  /**
   * Crée un nouveau contrat
   */
  async createContract(enterpriseId: string, contractData: ContractFormData): Promise<ContractServiceResponse<ContractData>> {
    return ContractImpl.createContract(enterpriseId, contractData);
  },

  /**
   * Met à jour un contrat
   */
  async updateContract(id: string, contractData: Partial<ContractFormData>): Promise<ContractServiceResponse<ContractData>> {
    return ContractImpl.updateContract(id, contractData);
  },

  /**
   * Supprime un contrat
   */
  async deleteContract(id: string): Promise<ContractServiceResponse<boolean>> {
    return ContractImpl.deleteContract(id);
  },

  /**
   * Archive un contrat (met le statut à 'cancelled')
   */
  async archiveContract(id: string): Promise<ContractServiceResponse<boolean>> {
    return ContractImpl.archiveContract(id);
  },

  // ==================== GESTION DES RFA ====================

  /**
   * Récupère les calculs de RFA
   */
  async getRFACalculations(enterpriseId: string, filters?: RFAFilters): Promise<ContractServiceResponse<RFACalculation[]>> {
    return ContractImpl.getRFACalculations(enterpriseId, filters);
  },

  /**
   * Crée un nouveau calcul de RFA
   */
  async createRFACalculation(enterpriseId: string, rfaData: RFAFormData): Promise<ContractServiceResponse<RFACalculation>> {
    return ContractImpl.createRFACalculation(enterpriseId, rfaData);
  },

  /**
   * Calcule une simulation de RFA
   */
  async simulateRFA(_contractId: string, _scenarios: TurnoverScenario[]): Promise<ContractServiceResponse<SimulationResult[]>> {
    return ContractImpl.simulateRFA(_contractId, _scenarios);
  },

  // ==================== DASHBOARD & EXPORTS ====================

  /**
   * Récupère les données du tableau de bord
   */
  async getDashboardData(enterpriseId: string): Promise<ContractServiceResponse<ContractsDashboardData>> {
    return ContractImpl.getDashboardData(enterpriseId);
  },

  /**
   * Exporte les contrats au format CSV
   */
  async exportContractsToCSV(enterpriseId: string, filters?: ContractFilters): Promise<ContractServiceResponse<string>> {
    return ContractImpl.exportContractsToCSV(enterpriseId, filters);
  },

  /**
   * Calcul automatique du mois en cours pour tous les contrats actifs
   */
  async autoCalculateCurrentMonthRFA(enterpriseId: string): Promise<ContractServiceResponse<{ processed: number; updated: number }>> {
    return ContractImpl.autoCalculateCurrentMonthRFA(enterpriseId);
  },

  /**
   * Exporte les contrats au format CSV (version simplifiée)
   */
  exportToCSV(contracts: ContractData[], filename: string): void {
    const csvContent = this.convertContractsToCSV(contracts);
    this.downloadCSV(csvContent, filename);
  },

  /**
   * Exporte les calculs RFA au format CSV
   */
  exportRFAToCSV(rfaCalculations: RFACalculation[], filename: string): void {
    const csvContent = this.convertRFAToCSV(rfaCalculations);
    this.downloadCSV(csvContent, filename);
  },

  /**
   * Convertit les contrats en CSV
   */
  convertContractsToCSV(contracts: ContractData[]): string {
    const headers = ['ID', 'Nom', 'Client', 'Type', 'Statut', 'Date début', 'Date fin', 'Devise'];
    const rows = contracts.map(c => [
      c.id,
      c.contract_name,
      c.client_name,
      c.contract_type,
      c.status,
      c.start_date,
      c.end_date || '',
      c.currency
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  /**
   * Convertit les calculs RFA en CSV
   */
  convertRFAToCSV(rfaCalculations: RFACalculation[]): string {
    const headers = ['ID', 'Contrat', 'Client', 'Période début', 'Période fin', 'CA', 'RFA', 'Statut', 'Devise'];
    const rows = rfaCalculations.map(r => [
      r.id,
      r.contract_name,
      r.client_name,
      r.period_start,
      r.period_end,
      r.turnover_amount,
      r.rfa_amount,
      r.status,
      r.currency
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  /**
   * Télécharge un fichier CSV
   */
  downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Génère un rapport détaillé de RFA
   */
  async generateRFAReport(contractId: string, periodStart: string, periodEnd: string): Promise<ContractServiceResponse<RFAReport>> {
    try {
      // Récupérer le contrat
      const contractResult = await this.getContract(contractId);
      if (!contractResult.success || !contractResult.data) {
        return { data: undefined, success: false, error: { message: 'Contract not found' } };
      }
      const contract = contractResult.data;

      // Récupérer les calculs RFA pour la période
      const rfaResult = await this.getRFACalculations(contract.enterprise_id, {
        contract_id: contractId,
        period_start: periodStart,
        period_end: periodEnd
      });

      const calculations = rfaResult.data || [];

      // Calculer les totaux
      const totalTurnover = calculations.reduce((sum, c) => sum + c.turnover_amount, 0);
      const totalRFA = calculations.reduce((sum, c) => sum + c.rfa_amount, 0);
      const averageRate = totalTurnover > 0 ? (totalRFA / totalTurnover) * 100 : 0;

      // Construire les détails
      const details = calculations.map(calc => ({
        client_name: calc.client_name || contract.client_name || 'N/A',
        contract_name: calc.contract_name || contract.contract_name,
        turnover_amount: calc.turnover_amount,
        rfa_amount: calc.rfa_amount,
        effective_rate: calc.turnover_amount > 0 ? (calc.rfa_amount / calc.turnover_amount) * 100 : 0,
        status: calc.status
      }));

      const report: RFAReport = {
        title: `Rapport RFA - ${contract.contract_name}`,
        period: {
          start: periodStart,
          end: periodEnd
        },
        summary: {
          total_contracts: 1,
          total_turnover: totalTurnover,
          total_rfa: totalRFA,
          average_rate: averageRate,
          currency: contract.currency
        },
        details,
        generated_at: new Date().toISOString()
      };

      return { data: report, success: true };
    } catch (error) {
      const err = error as Error;
      return { data: undefined, success: false, error: { message: err.message } };
    }
  },

  /**
   * Envoi d'un état de contrat par email (interne ou client)
   */
  async sendContractSummaryEmail(enterpriseId: string, contractId: string, recipientEmail: string): Promise<ContractServiceResponse<boolean>> {
    return ContractImpl.sendContractSummaryEmail(enterpriseId, contractId, recipientEmail);
  },

  // ==================== ALERTES & HISTORIQUE ====================

  /**
   * Récupère les alertes de contrats
   * Génère des alertes basées sur:
   * - Contrats arrivant à expiration (30 jours)
   * - Seuils de CA proches des paliers supérieurs
   * - RFA en attente de validation
   */
  async getContractAlerts(enterpriseId: string): Promise<ContractServiceResponse<ContractAlert[]>> {
    try {
      const alerts: ContractAlert[] = [];
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Récupérer les contrats actifs
      const contractsResult = await this.getContracts(enterpriseId, { status: 'active' });
      const contracts = contractsResult.data || [];

      // Alertes pour contrats arrivant à expiration
      for (const contract of contracts) {
        if (contract.end_date) {
          const endDate = new Date(contract.end_date);
          if (endDate <= thirtyDaysFromNow && endDate > now) {
            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            alerts.push({
              id: `expiry-${contract.id}`,
              type: 'contract_expiring',
              contract_id: contract.id,
              client_name: contract.client_name || 'N/A',
              message: `Le contrat "${contract.contract_name}" expire dans ${daysRemaining} jours`,
              priority: daysRemaining <= 7 ? 'high' : daysRemaining <= 14 ? 'medium' : 'low',
              created_at: now.toISOString(),
              acknowledged: false
            });
          }
        }
      }

      // Récupérer les RFA en attente
      const rfaResult = await this.getRFACalculations(enterpriseId, { status: 'pending' });
      const pendingRFAs = rfaResult.data || [];

      for (const rfa of pendingRFAs) {
        if (rfa.rfa_amount > 1000) { // Seuil significatif
          alerts.push({
            id: `rfa-pending-${rfa.id}`,
            type: 'rfa_threshold',
            contract_id: rfa.contract_id,
            client_name: rfa.client_name || 'N/A',
            message: `RFA de ${rfa.rfa_amount.toFixed(2)} ${rfa.currency} en attente de validation pour "${rfa.contract_name}"`,
            priority: rfa.rfa_amount > 5000 ? 'high' : 'medium',
            created_at: now.toISOString(),
            acknowledged: false
          });
        }
      }

      // Trier par priorité (high > medium > low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return { data: alerts, success: true };
    } catch (error) {
      const err = error as Error;
      return { data: [], success: false, error: { message: err.message } };
    }
  },

  /**
   * Récupère l'historique d'un contrat depuis la table contract_history
   */
  async getContractHistory(contractId: string): Promise<ContractServiceResponse<ContractHistory[]>> {
    try {
      // Essayer de récupérer depuis la table contract_history
      const { data, error } = await supabase
        .from('contract_history')
        .select(`
          id,
          contract_id,
          action_type,
          changes,
          user_id,
          created_at
        `)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la table n'existe pas, retourner un tableau vide sans erreur
        if (error.code === '42P01') {
          return { data: [], success: true };
        }
        throw error;
      }

      // Transformer les données
      const history: ContractHistory[] = (data || []).map(item => ({
        id: item.id,
        contract_id: item.contract_id,
        action_type: item.action_type as ContractHistory['action_type'],
        changes: item.changes || {},
        user_id: item.user_id,
        user_name: undefined, // Pourrait être enrichi avec une jointure sur users
        created_at: item.created_at
      }));

      return { data: history, success: true };
    } catch (error) {
      const err = error as Error;
      return { data: [], success: false, error: { message: err.message } };
    }
  }
};
