/**
 * Service de Gouvernance des Données Enterprise
 * Gestion des doublons, intégrité des données, et qualité des informations
 * Niveau SAP/Oracle pour CassKai
 */

import { supabase } from '@/lib/supabase';

interface CompanyDuplicate {
  id: string;
  primary_company_id: string;
  duplicate_company_id: string;
  similarity_score: number;
  similarity_factors: Record<string, any>;
  detection_method: 'exact_match' | 'phonetic' | 'fuzzy' | 'manual' | 'ai_analysis';
  status: 'pending' | 'confirmed_duplicate' | 'false_positive' | 'merged' | 'ignored';
  detected_at: string;
  primary_company: {
    name: string;
    siret?: string;
    data_quality_score: number;
  };
  duplicate_company: {
    name: string;
    siret?: string;
    data_quality_score: number;
  };
}

interface CompanySearchResult {
  id: string;
  name: string;
  legal_name?: string;
  siret?: string;
  similarity_score: number;
  data_quality_score: number;
  status: string;
}

interface DataQualityMetric {
  metric_name: string;
  metric_value: number;
  percentage: number;
  details: Record<string, any>;
}

interface CompanyMergeRequest {
  master_company_id: string;
  duplicate_company_id: string;
  merge_strategy?: Record<string, any>;
}

interface CompanyMergeResult {
  success: boolean;
  master_company_id?: string;
  merged_company_id?: string;
  migrated_users?: number;
  message: string;
  error?: string;
}

export class DataGovernanceService {
  private static instance: DataGovernanceService;

  static getInstance(): DataGovernanceService {
    if (!DataGovernanceService.instance) {
      DataGovernanceService.instance = new DataGovernanceService();
    }
    return DataGovernanceService.instance;
  }

  /**
   * Recherche intelligente d'entreprises avec détection de doublons
   */
  async searchCompaniesIntelligent(
    searchTerm: string,
    limit: number = 10
  ): Promise<CompanySearchResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_companies_intelligent', {
          p_search_term: searchTerm,
          p_limit: limit
        });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur recherche intelligente:', error);
      throw error;
    }
  }

  /**
   * Récupère les doublons détectés pour une entreprise
   */
  async getDetectedDuplicates(companyId?: string): Promise<CompanyDuplicate[]> {
    try {
      let query = supabase
        .from('company_duplicates')
        .select(`
          *,
          primary_company:companies!primary_company_id(name, siret, data_quality_score),
          duplicate_company:companies!duplicate_company_id(name, siret, data_quality_score)
        `)
        .in('status', ['pending', 'confirmed_duplicate'])
        .order('similarity_score', { ascending: false });

      if (companyId) {
        query = query.or(`primary_company_id.eq.${companyId},duplicate_company_id.eq.${companyId}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Erreur récupération doublons:', error);
      throw error;
    }
  }

  /**
   * Marque une entreprise comme doublon d'une autre
   */
  async markAsDuplicate(
    duplicateCompanyId: string,
    masterCompanyId: string,
    reason: string = 'Manual detection'
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('mark_company_as_duplicate', {
          p_duplicate_company_id: duplicateCompanyId,
          p_master_company_id: masterCompanyId,
          p_reason: reason
        });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('❌ Erreur marquage doublon:', error);
      return {
        success: false,
        message: 'Failed to mark company as duplicate',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fusionne deux entreprises
   */
  async mergeCompanies({
    master_company_id,
    duplicate_company_id,
    merge_strategy = {}
  }: CompanyMergeRequest): Promise<CompanyMergeResult> {
    try {
      const { data, error } = await supabase
        .rpc('merge_companies', {
          p_master_company_id: master_company_id,
          p_duplicate_company_id: duplicate_company_id,
          p_merge_strategy: merge_strategy
        });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('❌ Erreur fusion entreprises:', error);
      return {
        success: false,
        message: 'Failed to merge companies',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Marque un doublon comme faux positif
   */
  async markAsFalsePositive(duplicateId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('company_duplicates')
        .update({
          status: 'false_positive',
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString(),
          resolution_action: 'Marked as false positive'
        })
        .eq('id', duplicateId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur marquage faux positif:', error);
      return { success: false };
    }
  }

  /**
   * Analyse la qualité des données
   */
  async analyzeDataQuality(): Promise<DataQualityMetric[]> {
    try {
      const { data, error } = await supabase.rpc('analyze_data_quality');
      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur analyse qualité:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de gouvernance
   */
  async getGovernanceStats(): Promise<{
    totalCompanies: number;
    duplicatesDetected: number;
    mergesCompleted: number;
    averageQualityScore: number;
    pendingActions: number;
  }> {
    try {
      const [companiesResult, duplicatesResult, mergesResult] = await Promise.all([
        supabase
          .from('companies')
          .select('data_quality_score, status', { count: 'exact' })
          .neq('status', 'merged'),

        supabase
          .from('company_duplicates')
          .select('status', { count: 'exact' }),

        supabase
          .from('company_merges')
          .select('status', { count: 'exact' })
          .eq('status', 'executed')
      ]);

      const companies = companiesResult.data || [];
      const duplicates = duplicatesResult.data || [];
      const merges = mergesResult.data || [];

      const averageQualityScore = companies.length > 0
        ? companies.reduce((sum, c) => sum + (c.data_quality_score || 0), 0) / companies.length
        : 0;

      const pendingDuplicates = duplicates.filter(d => d.status === 'pending').length;

      return {
        totalCompanies: companies.length,
        duplicatesDetected: duplicates.length,
        mergesCompleted: merges.length,
        averageQualityScore: Math.round(averageQualityScore),
        pendingActions: pendingDuplicates
      };

    } catch (error) {
      console.error('❌ Erreur statistiques gouvernance:', error);
      throw error;
    }
  }

  /**
   * Valide les données d'une entreprise avant création/modification
   */
  async validateCompanyData(companyData: {
    name: string;
    siret?: string;
    postal_code?: string;
    city?: string;
  }): Promise<{
    isValid: boolean;
    warnings: string[];
    duplicates: CompanySearchResult[];
    qualityScore: number;
  }> {
    const warnings: string[] = [];
    let qualityScore = 0;

    // Validation du nom
    if (!companyData.name || companyData.name.trim().length < 2) {
      warnings.push('Le nom de l\'entreprise est requis et doit contenir au moins 2 caractères');
    } else {
      qualityScore += 30;
    }

    // Validation SIRET
    if (companyData.siret) {
      const siretClean = companyData.siret.replace(/[^0-9]/g, '');
      if (siretClean.length !== 14) {
        warnings.push('Le SIRET doit contenir exactement 14 chiffres');
      } else {
        qualityScore += 25;
      }
    }

    // Points bonus pour adresse
    if (companyData.postal_code) qualityScore += 15;
    if (companyData.city) qualityScore += 15;

    // Score de base
    qualityScore += 15;

    // Rechercher des doublons potentiels
    const duplicates = await this.searchCompaniesIntelligent(companyData.name, 5);
    const highSimilarity = duplicates.filter(d => d.similarity_score > 80);

    if (highSimilarity.length > 0) {
      warnings.push(`${highSimilarity.length} entreprise(s) similaire(s) détectée(s)`);
    }

    return {
      isValid: warnings.length === 0 || warnings.every(w => w.includes('similaire')),
      warnings,
      duplicates: highSimilarity,
      qualityScore: Math.min(100, qualityScore)
    };
  }

  /**
   * Récupère l'historique des audits pour une entreprise
   */
  async getCompanyAuditTrail(companyId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('data_governance_audit')
        .select('*')
        .eq('entity_type', 'company')
        .eq('entity_id', companyId)
        .order('performed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('❌ Erreur audit trail:', error);
      throw error;
    }
  }

  /**
   * Nettoie les entreprises inactives et doublons anciens
   */
  async cleanupInactiveData(daysOld: number = 90): Promise<{
    cleanedDuplicates: number;
    archivedCompanies: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Nettoyer les doublons résolus anciens
      const { count: cleanedDuplicates } = await supabase
        .from('company_duplicates')
        .delete({ count: 'exact' })
        .in('status', ['false_positive', 'merged'])
        .lt('resolved_at', cutoffDate.toISOString());

      // Archiver les entreprises inactives anciennes
      const { count: archivedCompanies } = await supabase
        .from('companies')
        .update({ status: 'inactive' }, { count: 'exact' })
        .eq('status', 'active')
        .lt('updated_at', cutoffDate.toISOString())
        .is('last_validation_date', null);

      return {
        cleanedDuplicates: cleanedDuplicates || 0,
        archivedCompanies: archivedCompanies || 0
      };

    } catch (error) {
      console.error('❌ Erreur nettoyage données:', error);
      throw error;
    }
  }

  /**
   * Synchronise et recalcule les scores de qualité
   */
  async recalculateQualityScores(): Promise<{ updated: number }> {
    try {
      // Utiliser la fonction trigger pour recalculer
      const { data, error } = await supabase
        .from('companies')
        .update({
          last_validation_date: new Date().toISOString(),
          validation_source: 'manual_recalculation'
        })
        .neq('status', 'merged');

      if (error) throw error;

      let updatedCount = 0;
  const arrayData = Array.isArray(data) ? (data as unknown[]) : null;

      if (arrayData) {
        updatedCount = arrayData.length;
      } else if (data) {
        updatedCount = 1;
      }

      return { updated: updatedCount };

    } catch (error) {
      console.error('❌ Erreur recalcul scores:', error);
      throw error;
    }
  }
}

// Export de l'instance singleton
export const dataGovernanceService = DataGovernanceService.getInstance();

// Types exportés pour l'interface
export type {
  CompanyDuplicate,
  CompanySearchResult,
  DataQualityMetric,
  CompanyMergeRequest,
  CompanyMergeResult
};
