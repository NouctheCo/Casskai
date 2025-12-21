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
    // TODO: Implement RFA simulation logic
    return { data: [], success: true };
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
  async generateRFAReport(_contractId: string, _periodStart: string, _periodEnd: string): Promise<ContractServiceResponse<RFAReport>> {
    // TODO: Implement RFA report generation
    return { data: undefined, success: false, error: { message: 'Not implemented yet' } };
  },

  // ==================== ALERTES & HISTORIQUE ====================

  /**
   * Récupère les alertes de contrats
   */
  async getContractAlerts(_enterpriseId: string): Promise<ContractServiceResponse<ContractAlert[]>> {
    // TODO: Implement alerts logic
    return { data: [], success: true };
  },

  /**
   * Récupère l'historique d'un contrat
   */
  async getContractHistory(_contractId: string): Promise<ContractServiceResponse<ContractHistory[]>> {
    // TODO: Implement history retrieval from contract_history table
    return { data: [], success: true };
  }
};
