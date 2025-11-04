import { useState, useCallback, useEffect } from 'react';
import { multiCountryTaxService, CountryTaxConfig, TaxDeclaration, ComplianceValidation } from '@/services/fiscal/MultiCountryTaxService';
import { taxIntegrationService } from '@/services/fiscal/TaxIntegrationService';
import { useAuth } from '@/contexts/AuthContext';

export interface TaxComplianceState {
  declarations: TaxDeclaration[];
  complianceScore: {
    score: number;
    maxScore: number;
    percentage: number;
  } | null;
  loading: boolean;
  error: string | null;
  countryConfig: CountryTaxConfig | null;
}

export interface TaxIntegrationStatus {
  accounting: boolean;
  invoicing: boolean;
  banking: boolean;
  hr: boolean;
}

export const useTaxCompliance = (companyId: string, countryCode?: string) => {
  const { user } = useAuth();

  const [state, setState] = useState<TaxComplianceState>({
    declarations: [],
    complianceScore: null,
    loading: false,
    error: null,
    countryConfig: null
  });

  const [integrationStatus, setIntegrationStatus] = useState<TaxIntegrationStatus>({
    accounting: false,
    invoicing: false,
    banking: false,
    hr: false
  });

  // Initialiser la configuration du pays
  useEffect(() => {
    if (countryCode) {
      const config = multiCountryTaxService.getCountryConfig(countryCode);
      setState(prev => ({ ...prev, countryConfig: config }));
    }
  }, [countryCode]);

  // Générer une déclaration fiscale
  const generateDeclaration = useCallback(async (declarationType: string, period: string) => {
    if (!companyId || !user || !countryCode) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const declaration = await multiCountryTaxService.generateDeclaration(
        companyId,
        countryCode,
        declarationType,
        period
      );

      setState(prev => ({
        ...prev,
        declarations: [...prev.declarations.filter(d => d.id !== declaration.id), declaration],
        loading: false
      }));

      return declaration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId, user, countryCode]);

  // Calculer la TVA
  const calculateVAT = useCallback(async (period: string) => {
    if (!companyId || !countryCode) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const vatData = await multiCountryTaxService.calculateVAT(companyId, countryCode, period);
      setState(prev => ({ ...prev, loading: false }));
      return vatData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId, countryCode]);

  // Calculer l'impôt sur les sociétés
  const calculateCorporateTax = useCallback(async (period: string) => {
    if (!companyId || !countryCode) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const corporateTax = await multiCountryTaxService.calculateCorporateTax(
        companyId,
        countryCode,
        period
      );
      setState(prev => ({ ...prev, loading: false }));
      return corporateTax;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId, countryCode]);

  // Exporter les données fiscales
  const exportTaxData = useCallback(async (period: string, format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    if (!companyId || !countryCode) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const exportData = await multiCountryTaxService.exportTaxData(
        companyId,
        countryCode,
        period,
        format
      );
      setState(prev => ({ ...prev, loading: false }));
      return exportData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId, countryCode]);

  // Valider la conformité
  const validateCompliance = useCallback(async (period: string) => {
    if (!companyId || !countryCode) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const validation = await multiCountryTaxService.validateCompliance(
        companyId,
        countryCode,
        period
      );

      const score = validation.score;
      const maxScore = validation.maxScore;

      setState(prev => ({
        ...prev,
        complianceScore: {
          score,
          maxScore,
          percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
        },
        loading: false
      }));

      return validation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId, countryCode]);

  // Synchroniser avec les autres modules
  const syncWithModules = useCallback(async (period: string) => {
    if (!companyId) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const syncResults = await Promise.allSettled([
        taxIntegrationService.syncWithAccounting(companyId, period),
        taxIntegrationService.syncWithInvoicing(companyId),
        taxIntegrationService.syncWithBanking(companyId),
        taxIntegrationService.syncWithHR(companyId, period)
      ]);

      setIntegrationStatus({
        accounting: syncResults[0].status === 'fulfilled' && (syncResults[0].value as any).success,
        invoicing: syncResults[1].status === 'fulfilled' && (syncResults[1].value as any).success,
        banking: syncResults[2].status === 'fulfilled' && (syncResults[2].value as any).success,
        hr: syncResults[3].status === 'fulfilled' && (syncResults[3].value as any).success
      });

      setState(prev => ({ ...prev, loading: false }));
      return syncResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId]);

  // Configuration automatique des obligations
  const autoConfigureObligations = useCallback(async () => {
    if (!companyId || !countryCode) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await multiCountryTaxService.autoConfigureObligations(companyId, countryCode);
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId, countryCode]);

  // Générer un rapport intégré
  const generateIntegratedReport = useCallback(async (period: string) => {
    if (!companyId) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const report = await taxIntegrationService.generateIntegratedTaxReport(companyId, period);
      setState(prev => ({ ...prev, loading: false }));
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Charger la conformité au montage
  useEffect(() => {
    if (companyId && countryCode) {
      const currentYear = new Date().getFullYear().toString();
      validateCompliance(currentYear);
      syncWithModules(currentYear);
    }
  }, [companyId, countryCode, validateCompliance, syncWithModules]);

  // Obtenir les déclarations disponibles pour le pays
  const getAvailableDeclarations = useCallback(() => {
    if (!state.countryConfig) return [];
    return state.countryConfig.declarations;
  }, [state.countryConfig]);

  return {
    // État
    ...state,
    integrationStatus,

    // Actions principales
    generateDeclaration,
    calculateVAT,
    calculateCorporateTax,
    exportTaxData,
    validateCompliance,
    syncWithModules,
    autoConfigureObligations,
    generateIntegratedReport,
    clearError,

    // Utilitaires
    getAvailableDeclarations,
    isReady: !state.loading && !state.error && !!state.countryConfig,
    hasError: !!state.error,
    isCompliant: state.complianceScore ? state.complianceScore.percentage >= 90 : false,

    // Informations sur le pays
    countryName: state.countryConfig?.countryName || '',
    currency: state.countryConfig?.currency || '',
    accountingStandard: state.countryConfig?.accountingStandard || '',
    vatRates: state.countryConfig?.vatRates || null,
    corporateTaxRate: state.countryConfig?.corporateTaxRate || 0
  };
};
