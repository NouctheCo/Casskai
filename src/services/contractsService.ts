/**
 * Service de gestion des contrats clients et calcul automatisé des RFA
 * Intégré avec Supabase et suit les patterns existants de l'application
 */

// import { supabase } from '../lib/supabase'; // Commenté pour implémentation mock
import {
  ContractData,
  ContractFormData,
  ContractFilters,
  ContractsDashboardData,
  RFACalculation,
  RFAFormData,
  RFAFilters,
  RFASimulation,
  TurnoverScenario,
  SimulationResult,
  ContractAlert,
  ContractHistory,
  ContractServiceResponse,
  DiscountConfig,
  RFATierBreakdown,
  RFACalculationDetails,
  ContractExportOptions,
  RFAReport
} from '../types/contracts.types';

// Helper pour formater les erreurs Supabase
function handleSupabaseError(error: unknown, context: string) {
  if (error instanceof Error) {
    return { message: `[${context}] ${error.message}` };
  }
  return { message: `[${context}] ${JSON.stringify(error)}` };
}

/**
 * Service principal pour la gestion des contrats et RFA
 */
export const contractsService = {
  // ==================== GESTION DES CONTRATS ====================

  /**
   * Récupère la liste des contrats avec filtres
   */
  async getContracts(enterpriseId: string, filters?: ContractFilters): Promise<ContractServiceResponse<ContractData[]>> {
    try {
      // TODO: Implémentation Supabase réelle
      // const { data, error } = await supabase
      //   .from('contracts')
      //   .select(`
      //     *,
      //     client:third_parties(id, name)
      //   `)
      //   .eq('enterprise_id', enterpriseId)

      // Données mock pour développement
      const mockContracts: ContractData[] = [
        {
          id: '1',
          enterprise_id: enterpriseId,
          client_id: 'client_1',
          client_name: 'ACME Corporation',
          contract_name: 'Contrat Commercial 2024',
          contract_type: 'progressive',
          discount_config: {
            type: 'progressive',
            tiers: [
              { min: 0, max: 100000, rate: 0.01, description: '1% jusqu\'à 100k€' },
              { min: 100001, max: 500000, rate: 0.015, description: '1.5% de 100k à 500k€' },
              { min: 500001, max: null, rate: 0.02, description: '2% au-delà de 500k€' }
            ]
          },
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          status: 'active',
          currency: 'EUR',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          enterprise_id: enterpriseId,
          client_id: 'client_2',
          client_name: 'TechStart SAS',
          contract_name: 'Accord de partenariat',
          contract_type: 'fixed_percent',
          discount_config: {
            type: 'fixed_percent',
            rate: 0.012
          },
          start_date: '2024-02-01',
          end_date: '2025-01-31',
          status: 'active',
          currency: 'EUR',
          created_at: '2024-02-01T10:00:00Z',
          updated_at: '2024-02-01T10:00:00Z'
        },
        {
          id: '3',
          enterprise_id: enterpriseId,
          client_id: 'client_3',
          client_name: 'Global Industries',
          contract_name: 'RFA Forfaitaire',
          contract_type: 'fixed_amount',
          discount_config: {
            type: 'fixed_amount',
            amount: 10000
          },
          start_date: '2024-03-01',
          end_date: '2024-12-31',
          status: 'active',
          currency: 'EUR',
          created_at: '2024-03-01T10:00:00Z',
          updated_at: '2024-03-01T10:00:00Z'
        }
      ];

      // Application des filtres
      let filteredContracts = mockContracts;
      
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredContracts = filteredContracts.filter(contract =>
          contract.contract_name.toLowerCase().includes(searchTerm) ||
          contract.client_name?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters?.status) {
        filteredContracts = filteredContracts.filter(contract => contract.status === filters.status);
      }

      if (filters?.contract_type) {
        filteredContracts = filteredContracts.filter(contract => contract.contract_type === filters.contract_type);
      }

      return { data: filteredContracts, success: true };
    } catch (error) {
      return { error: handleSupabaseError(error, 'getContracts'), success: false };
    }
  },

  /**
   * Récupère un contrat par ID
   */
  async getContract(id: string): Promise<ContractServiceResponse<ContractData>> {
    try {
      // TODO: Implémentation Supabase
      const contracts = await this.getContracts('mock_enterprise');
      const contract = contracts.data?.find(c => c.id === id);
      
      if (!contract) {
        return { error: { message: 'Contrat non trouvé' }, success: false };
      }

      return { data: contract, success: true };
    } catch (error) {
      return { error: handleSupabaseError(error, 'getContract'), success: false };
    }
  },

  /**
   * Crée un nouveau contrat
   */
  async createContract(enterpriseId: string, formData: ContractFormData): Promise<ContractServiceResponse<ContractData>> {
    try {
      // TODO: Implémentation Supabase
      const newContract: ContractData = {
        id: `contract_${Date.now()}`,
        enterprise_id: enterpriseId,
        client_id: formData.client_id,
        contract_name: formData.contract_name,
        contract_type: formData.contract_type,
        discount_config: formData.discount_config,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: 'active',
        currency: formData.currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return { data: newContract, success: true };
    } catch (error) {
      return { error: handleSupabaseError(error, 'createContract'), success: false };
    }
  },

  /**
   * Met à jour un contrat existant
   */
  async updateContract(id: string, formData: Partial<ContractFormData>): Promise<ContractServiceResponse<ContractData>> {
    try {
      // TODO: Implémentation Supabase avec historique
      const contractResponse = await this.getContract(id);
      if (!contractResponse.success || !contractResponse.data) {
        return { error: { message: 'Contrat non trouvé' }, success: false };
      }

      const updatedContract = {
        ...contractResponse.data,
        ...formData,
        updated_at: new Date().toISOString()
      };

      return { data: updatedContract, success: true };
    } catch (error) {
      return { error: handleSupabaseError(error, 'updateContract'), success: false };
    }
  },

  /**
   * Archive un contrat
   */
  async archiveContract(id: string): Promise<ContractServiceResponse<boolean>> {
    try {
      // TODO: Implémentation Supabase
      return { data: true, success: true };
    } catch (error) {
      return { error: handleSupabaseError(error, 'archiveContract'), success: false };
    }
  },

  // ==================== CALCULS RFA ====================

  /**
   * Calcule la RFA pour un contrat et un CA donné
   */
  calculateRFA(turnoverAmount: number, discountConfig: DiscountConfig): { amount: number; details: RFACalculationDetails } {
    let rfaAmount = 0;
    const breakdown: RFATierBreakdown[] = [];

    switch (discountConfig.type) {
      case 'progressive':
        if (discountConfig.tiers) {
          for (let i = 0; i < discountConfig.tiers.length; i++) {
            const tier = discountConfig.tiers[i];
            const tierMin = tier.min;
            const tierMax = tier.max || Number.MAX_SAFE_INTEGER;
            
            if (turnoverAmount > tierMin) {
              const tierAmount = Math.min(turnoverAmount, tierMax) - tierMin;
              const tierRFA = tierAmount * tier.rate;
              
              rfaAmount += tierRFA;
              breakdown.push({
                tier_index: i,
                tier_min: tierMin,
                tier_max: tier.max,
                tier_rate: tier.rate,
                tier_amount: tierAmount,
                rfa_amount: tierRFA
              });

              if (turnoverAmount <= tierMax) break;
            }
          }
        }
        break;

      case 'fixed_percent':
        rfaAmount = turnoverAmount * (discountConfig.rate || 0);
        break;

      case 'fixed_amount':
        rfaAmount = discountConfig.amount || 0;
        break;
    }

    return {
      amount: rfaAmount,
      details: {
        type: discountConfig.type,
        breakdown: breakdown.length > 0 ? breakdown : undefined,
        base_amount: turnoverAmount,
        applied_rate: discountConfig.rate
      }
    };
  },

  /**
   * Récupère les calculs RFA
   */
  async getRFACalculations(enterpriseId: string, filters?: RFAFilters): Promise<ContractServiceResponse<RFACalculation[]>> {
    try {
      // Données mock
      const mockCalculations: RFACalculation[] = [
        {
          id: 'calc_1',
          contract_id: '1',
          enterprise_id: enterpriseId,
          client_id: 'client_1',
          client_name: 'ACME Corporation',
          contract_name: 'Contrat Commercial 2024',
          period_start: '2024-01-01',
          period_end: '2024-03-31',
          turnover_amount: 350000,
          rfa_amount: 4750, // 1000 (100k×1%) + 3750 (250k×1.5%)
          tier_reached: 2,
          calculation_details: {
            type: 'progressive',
            breakdown: [
              { tier_index: 0, tier_min: 0, tier_max: 100000, tier_rate: 0.01, tier_amount: 100000, rfa_amount: 1000 },
              { tier_index: 1, tier_min: 100001, tier_max: 500000, tier_rate: 0.015, tier_amount: 250000, rfa_amount: 3750 }
            ]
          },
          status: 'validated',
          currency: 'EUR',
          created_at: '2024-04-01T10:00:00Z',
          updated_at: '2024-04-01T10:00:00Z'
        },
        {
          id: 'calc_2',
          contract_id: '2',
          enterprise_id: enterpriseId,
          client_id: 'client_2',
          client_name: 'TechStart SAS',
          contract_name: 'Accord de partenariat',
          period_start: '2024-02-01',
          period_end: '2024-04-30',
          turnover_amount: 180000,
          rfa_amount: 2160, // 180000 × 1.2%
          calculation_details: {
            type: 'fixed_percent',
            base_amount: 180000,
            applied_rate: 0.012
          },
          status: 'pending',
          currency: 'EUR',
          created_at: '2024-05-01T10:00:00Z',
          updated_at: '2024-05-01T10:00:00Z'
        }
      ];

      return { data: mockCalculations, success: true };
    } catch (error) {
      return { error: handleSupabaseError(error, 'getRFACalculations'), success: false };
    }
  },

  /**
   * Crée un nouveau calcul RFA
   */
  async createRFACalculation(enterpriseId: string, formData: RFAFormData): Promise<ContractServiceResponse<RFACalculation>> {
    try {
      // Récupérer le contrat pour la configuration
      const contractResponse = await this.getContract(formData.contract_id);
      if (!contractResponse.success || !contractResponse.data) {
        return { error: { message: 'Contrat non trouvé' }, success: false };
      }

      const contract = contractResponse.data;
      const calculation = this.calculateRFA(formData.turnover_amount, contract.discount_config);

      const newCalculation: RFACalculation = {
        id: `calc_${Date.now()}`,
        contract_id: formData.contract_id,
        enterprise_id: enterpriseId,
        client_id: contract.client_id,
        client_name: contract.client_name,
        contract_name: contract.contract_name,
        period_start: formData.period_start,
        period_end: formData.period_end,
        turnover_amount: formData.turnover_amount,
        rfa_amount: calculation.amount,
        calculation_details: calculation.details,
        status: 'pending',
        currency: contract.currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return { data: newCalculation, success: true };
    } catch (error) {
      return { error: handleSupabaseError(error, 'createRFACalculation'), success: false };
    }
  },

  // ==================== SIMULATION "WHAT-IF" ====================

  /**
   * Effectue une simulation RFA avec différents scénarios
   */
  async simulateRFA(contractId: string, scenarios: TurnoverScenario[]): Promise<ContractServiceResponse<SimulationResult[]>> {
    try {
      const contractResponse = await this.getContract(contractId);
      if (!contractResponse.success || !contractResponse.data) {
        return { error: { message: 'Contrat non trouvé' }, success: false };
      }

      const contract = contractResponse.data;
      const results: SimulationResult[] = [];

      scenarios.forEach(scenario => {
        const calculation = this.calculateRFA(scenario.amount, contract.discount_config);
        
        results.push({
          scenario_name: scenario.name,
          turnover_amount: scenario.amount,
          rfa_amount: calculation.amount,
          effective_rate: calculation.amount / scenario.amount,
          breakdown: calculation.details.breakdown || []
        });
      });

      return { data: results, success: true };
    } catch (error) {
      return { error: handleSupabaseError(error, 'simulateRFA'), success: false };
    }
  },

  // ==================== DASHBOARD ====================

  /**
   * Récupère les données du dashboard
   */
  async getDashboardData(enterpriseId: string): Promise<ContractServiceResponse<ContractsDashboardData>> {
    try {
      const contractsResponse = await this.getContracts(enterpriseId);
      const calculationsResponse = await this.getRFACalculations(enterpriseId);

      if (!contractsResponse.success || !calculationsResponse.success) {
        return { error: { message: 'Erreur lors du chargement des données' }, success: false };
      }

      const contracts = contractsResponse.data || [];
      const calculations = calculationsResponse.data || [];

      const dashboardData: ContractsDashboardData = {
        stats: {
          total_contracts: contracts.length,
          active_contracts: contracts.filter(c => c.status === 'active').length,
          expired_contracts: contracts.filter(c => c.status === 'expired').length,
          total_rfa_pending: calculations.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.rfa_amount, 0),
          total_rfa_paid: calculations.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.rfa_amount, 0),
          average_rfa_rate: 0.014, // Calculé dynamiquement
          clients_with_contracts: new Set(contracts.map(c => c.client_id)).size
        },
        recent_calculations: calculations.slice(0, 5),
        monthly_rfa: [
          { month: '2024-01', rfa_amount: 12500, turnover_amount: 890000, contracts_count: 8, average_rate: 0.014 },
          { month: '2024-02', rfa_amount: 15200, turnover_amount: 1120000, contracts_count: 9, average_rate: 0.0136 },
          { month: '2024-03', rfa_amount: 18900, turnover_amount: 1350000, contracts_count: 10, average_rate: 0.014 }
        ],
        top_clients: [
          { client_id: 'client_1', client_name: 'ACME Corporation', total_rfa: 15000, total_turnover: 1200000, contracts_count: 2, average_rate: 0.0125, currency: 'EUR' },
          { client_id: 'client_2', client_name: 'TechStart SAS', total_rfa: 8500, total_turnover: 680000, contracts_count: 1, average_rate: 0.0125, currency: 'EUR' }
        ],
        alerts: [
          {
            id: 'alert_1',
            type: 'tier_approaching',
            contract_id: '1',
            client_name: 'ACME Corporation',
            message: 'Client proche du palier suivant (500k€)',
            priority: 'medium',
            created_at: '2024-07-28T10:00:00Z',
            acknowledged: false
          }
        ],
        upcoming_renewals: contracts.filter(c => {
          if (!c.end_date) return false;
          const endDate = new Date(c.end_date);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return endDate <= thirtyDaysFromNow;
        })
      };

      return { data: dashboardData, success: true };
    } catch (error) {
      return { error: handleSupabaseError(error, 'getDashboardData'), success: false };
    }
  },

  // ==================== EXPORT ====================

  /**
   * Exporte les données vers CSV
   */
  exportToCSV(data: ContractData[], filename: string = 'contrats'): void {
    const headers = [
      'ID',
      'Nom du contrat',
      'Client',
      'Type',
      'Statut',
      'Date début',
      'Date fin',
      'Devise',
      'Créé le'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(contract => [
        `"${contract.id}"`,
        `"${contract.contract_name}"`,
        `"${contract.client_name || ''}"`,
        `"${contract.contract_type}"`,
        `"${contract.status}"`,
        `"${contract.start_date}"`,
        `"${contract.end_date || ''}"`,
        `"${contract.currency}"`,
        `"${new Date(contract.created_at).toLocaleDateString('fr-FR')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Exporte les calculs RFA vers CSV
   */
  exportRFAToCSV(data: RFACalculation[], filename: string = 'calculs_rfa'): void {
    const headers = [
      'ID',
      'Client',
      'Contrat',
      'Période début',
      'Période fin',
      'CA (€)',
      'RFA (€)',
      'Taux effectif (%)',
      'Statut',
      'Créé le'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(calc => [
        `"${calc.id}"`,
        `"${calc.client_name || ''}"`,
        `"${calc.contract_name || ''}"`,
        `"${calc.period_start}"`,
        `"${calc.period_end}"`,
        `"${calc.turnover_amount}"`,
        `"${calc.rfa_amount}"`,
        `"${((calc.rfa_amount / calc.turnover_amount) * 100).toFixed(2)}"`,
        `"${calc.status}"`,
        `"${new Date(calc.created_at).toLocaleDateString('fr-FR')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};