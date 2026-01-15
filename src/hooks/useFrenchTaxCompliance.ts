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

import { useState, useCallback, useEffect } from 'react';
import { frenchTaxComplianceService, FrenchTaxDeclaration } from '@/services/fiscal/FrenchTaxComplianceService';
import { taxIntegrationService } from '@/services/fiscal/TaxIntegrationService';
import {
  blobToObjectUrl,
  downloadObjectUrl,
  exportFrenchTaxDeclarationToEdiDraft,
  exportFrenchTaxDeclarationToPdf
} from '@/services/fiscal/franceTaxExportService';
import {
  exportFrenchDeclarationToRegulatoryPdf,
  exportFrenchDeclarationToRegulatoryXmlDraft,
  isSupportedForRegulatoryExport,
} from '@/services/fiscal/franceRegulatoryExportService';
import { useAuth } from '@/contexts/AuthContext';

export interface TaxComplianceState {
  declarations: FrenchTaxDeclaration[];
  complianceScore: {
    score: number;
    maxScore: number;
    percentage: number;
  } | null;
  loading: boolean;
  error: string | null;
}

export interface TaxIntegrationStatus {
  accounting: boolean;
  invoicing: boolean;
  banking: boolean;
  hr: boolean;
}

export const useFrenchTaxCompliance = (companyId: string) => {
  const { user } = useAuth();

  const [state, setState] = useState<TaxComplianceState>({
    declarations: [],
    complianceScore: null,
    loading: false,
    error: null
  });

  const [integrationStatus, setIntegrationStatus] = useState<TaxIntegrationStatus>({
    accounting: false,
    invoicing: false,
    banking: false,
    hr: false
  });

  // Générer une déclaration CA3
  const generateCA3 = useCallback(async (period: string) => {
    if (!companyId || !user) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const declaration = await frenchTaxComplianceService.generateCA3Declaration(companyId, period);

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
  }, [companyId, user]);

  // Générer la liasse fiscale complète
  const generateLiasseFiscale = useCallback(async (exercice: string) => {
    if (!companyId || !user) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const liasseDeclarations = await frenchTaxComplianceService.generateLiasseFiscale(companyId, exercice);

      setState(prev => ({
        ...prev,
        declarations: [
          ...prev.declarations.filter(d => !liasseDeclarations.some(ld => ld.id === d.id)),
          ...liasseDeclarations
        ],
        loading: false
      }));

      return liasseDeclarations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId, user]);

  // Générer la déclaration CVAE
  const generateCVAE = useCallback(async (exercice: string) => {
    if (!companyId || !user) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const declaration = await frenchTaxComplianceService.generateCVAEDeclaration(companyId, exercice);

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
  }, [companyId, user]);

  // Générer le FEC
  const generateFEC = useCallback(async (exercice: string) => {
    if (!companyId || !user) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const fec = await frenchTaxComplianceService.generateFEC(companyId, exercice);
      setState(prev => ({ ...prev, loading: false }));
      return fec;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId, user]);

  // Valider la conformité
  const validateCompliance = useCallback(async (period: string) => {
    if (!companyId) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const validation = await frenchTaxComplianceService.validateAccountingTaxConsistency(companyId, period);

      const score = validation.checks.filter(c => c.status === 'ok').length;
      const maxScore = validation.checks.length;

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
  }, [companyId]);

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

      // Mettre à jour le statut d'intégration
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
    if (!companyId) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await taxIntegrationService.autoConfigureTaxObligations(companyId);
      setState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [companyId]);

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

  const downloadDeclarationPdf = useCallback(async (declarationId: string) => {
    const declaration = state.declarations.find(d => d.id === declarationId);
    if (!declaration) return;

    const safePeriod = declaration.period.replace(/[^a-zA-Z0-9._-]/g, '-');
    const safeType = declaration.type.replace(/[^a-zA-Z0-9._-]/g, '-');

    const blob = await exportFrenchTaxDeclarationToPdf(declaration);
    const url = blobToObjectUrl(blob);
    try {
      downloadObjectUrl(url, `${safeType}_${safePeriod}_${companyId}.pdf`);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [companyId, state.declarations]);

  const downloadDeclarationEdiDraft = useCallback((declarationId: string) => {
    const declaration = state.declarations.find(d => d.id === declarationId);
    if (!declaration) return;

    const safePeriod = declaration.period.replace(/[^a-zA-Z0-9._-]/g, '-');
    const safeType = declaration.type.replace(/[^a-zA-Z0-9._-]/g, '-');

    const blob = exportFrenchTaxDeclarationToEdiDraft(declaration);
    const url = blobToObjectUrl(blob);
    try {
      downloadObjectUrl(url, `${safeType}_${safePeriod}_${companyId}.json`);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [companyId, state.declarations]);

  const downloadDeclarationRegulatoryPdf = useCallback(async (declarationId: string) => {
    const declaration = state.declarations.find(d => d.id === declarationId);
    if (!declaration) return;
    if (!isSupportedForRegulatoryExport(declaration.type)) {
      throw new Error(`Export réglementaire non supporté pour ${declaration.type}`);
    }

    const { fiscalPeriod } = ((): { fiscalYear: number; fiscalPeriod: string } => {
      if (/^\d{4}$/.test(declaration.period)) return { fiscalYear: Number(declaration.period), fiscalPeriod: 'ANNUAL' };
      const m = declaration.period.match(/^(\d{4})-(\d{2})$/);
      if (m) return { fiscalYear: Number(m[1]), fiscalPeriod: `M${m[2]}` };
      return { fiscalYear: new Date().getFullYear(), fiscalPeriod: 'ANNUAL' };
    })();

    const safePeriod = declaration.period.replace(/[^a-zA-Z0-9._-]/g, '-');
    const safeType = declaration.type.replace(/[^a-zA-Z0-9._-]/g, '-');

    const blob = await exportFrenchDeclarationToRegulatoryPdf(companyId, declaration);
    const url = blobToObjectUrl(blob);
    try {
      downloadObjectUrl(url, `${safeType}_${safePeriod}_${fiscalPeriod}_${companyId}_regulatory.pdf`);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [companyId, state.declarations]);

  const downloadDeclarationRegulatoryXmlDraft = useCallback(async (declarationId: string) => {
    const declaration = state.declarations.find(d => d.id === declarationId);
    if (!declaration) return;
    if (!isSupportedForRegulatoryExport(declaration.type)) {
      throw new Error(`Export réglementaire non supporté pour ${declaration.type}`);
    }

    const safePeriod = declaration.period.replace(/[^a-zA-Z0-9._-]/g, '-');
    const safeType = declaration.type.replace(/[^a-zA-Z0-9._-]/g, '-');

    const { blob, filename } = await exportFrenchDeclarationToRegulatoryXmlDraft(companyId, declaration);
    const url = blobToObjectUrl(blob);
    try {
      // Keep the service filename but make it predictable for the user too.
      downloadObjectUrl(url, filename || `${safeType}_${safePeriod}_${companyId}.xml`);
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [companyId, state.declarations]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Charger la conformité au montage
  useEffect(() => {
    if (companyId) {
      const currentYear = new Date().getFullYear().toString();
      validateCompliance(currentYear);
      syncWithModules(currentYear);
    }
  }, [companyId, validateCompliance, syncWithModules]);

  return {
    // État
    ...state,
    integrationStatus,

    // Actions
    generateCA3,
    generateLiasseFiscale,
    generateCVAE,
    generateFEC,
    validateCompliance,
    syncWithModules,
    autoConfigureObligations,
    generateIntegratedReport,
    downloadDeclarationPdf,
    downloadDeclarationEdiDraft,
    downloadDeclarationRegulatoryPdf,
    downloadDeclarationRegulatoryXmlDraft,
    clearError,

    // Utilitaires
    isReady: !state.loading && !state.error,
    hasError: !!state.error,
    isCompliant: state.complianceScore ? state.complianceScore.percentage >= 90 : false
  };
};
