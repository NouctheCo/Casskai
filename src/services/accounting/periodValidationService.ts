/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface PeriodValidationResult {
  isValid: boolean;
  isClosed: boolean;
  periodName?: string;
  error?: string;
  canProceed: boolean;
}

/**
 * Service de validation de période comptable
 * Vérifie si une date appartient à une période clôturée
 */
class PeriodValidationService {
  private static instance: PeriodValidationService;

  private constructor() {}

  static getInstance(): PeriodValidationService {
    if (!PeriodValidationService.instance) {
      PeriodValidationService.instance = new PeriodValidationService();
    }
    return PeriodValidationService.instance;
  }

  /**
   * Vérifie si une date appartient à une période clôturée
   * @param companyId ID de l'entreprise
   * @param entryDate Date de l'écriture (format Date ou string ISO)
   * @returns Résultat de la validation
   */
  async validateEntryDate(
    companyId: string,
    entryDate: Date | string
  ): Promise<PeriodValidationResult> {
    try {
      const dateStr = entryDate instanceof Date 
        ? entryDate.toISOString().split('T')[0]
        : entryDate.split('T')[0];

      // Vérifier si la date tombe dans une période clôturée
      const { data, error } = await supabase
        .from('accounting_periods')
        .select('id, name, is_closed, start_date, end_date')
        .eq('company_id', companyId)
        .lte('start_date', dateStr)
        .gte('end_date', dateStr)
        .maybeSingle();

      if (error) {
        logger.error('PeriodValidation', 'Error checking period:', error);
        // En cas d'erreur, on autorise (dégradation gracieuse)
        return {
          isValid: true,
          isClosed: false,
          canProceed: true,
        };
      }

      // Aucune période trouvée = pas de contrôle = OK
      if (!data) {
        return {
          isValid: true,
          isClosed: false,
          canProceed: true,
        };
      }

      // Période trouvée et clôturée = BLOQUÉ
      if (data.is_closed) {
        return {
          isValid: false,
          isClosed: true,
          periodName: data.name,
          error: `La période "${data.name}" est clôturée. Vous ne pouvez pas créer ou modifier d'écritures sur cette période.`,
          canProceed: false,
        };
      }

      // Période trouvée et ouverte = OK
      return {
        isValid: true,
        isClosed: false,
        periodName: data.name,
        canProceed: true,
      };
    } catch (err) {
      logger.error('PeriodValidation', 'Unexpected error:', err);
      // En cas d'erreur, on autorise (dégradation gracieuse)
      return {
        isValid: true,
        isClosed: false,
        canProceed: true,
      };
    }
  }

  /**
   * Vérifie si une période peut être modifiée (période ouverte)
   * @param companyId ID de l'entreprise
   * @param periodId ID de la période
   * @returns Résultat de la validation
   */
  async canModifyPeriod(
    companyId: string,
    periodId: string
  ): Promise<PeriodValidationResult> {
    try {
      const { data, error } = await supabase
        .from('accounting_periods')
        .select('name, is_closed')
        .eq('id', periodId)
        .eq('company_id', companyId)
        .single();

      if (error || !data) {
        return {
          isValid: false,
          isClosed: false,
          error: 'Période non trouvée',
          canProceed: false,
        };
      }

      if (data.is_closed) {
        return {
          isValid: false,
          isClosed: true,
          periodName: data.name,
          error: `La période "${data.name}" est clôturée. Réouvrez-la pour effectuer des modifications.`,
          canProceed: false,
        };
      }

      return {
        isValid: true,
        isClosed: false,
        periodName: data.name,
        canProceed: true,
      };
    } catch (err) {
      logger.error('PeriodValidation', 'Error checking period modification:', err);
      return {
        isValid: false,
        isClosed: false,
        error: 'Erreur lors de la vérification de la période',
        canProceed: false,
      };
    }
  }

  /**
   * Récupère toutes les périodes clôturées d'une entreprise
   * Utile pour afficher des avertissements ou bloquer des sélections de dates
   */
  async getClosedPeriods(companyId: string): Promise<Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('accounting_periods')
        .select('id, name, start_date, end_date')
        .eq('company_id', companyId)
        .eq('is_closed', true)
        .order('start_date', { ascending: false });

      if (error) {
        logger.error('PeriodValidation', 'Error fetching closed periods:', error);
        return [];
      }

      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        startDate: p.start_date,
        endDate: p.end_date,
      }));
    } catch (err) {
      logger.error('PeriodValidation', 'Unexpected error fetching closed periods:', err);
      return [];
    }
  }
}

export const periodValidationService = PeriodValidationService.getInstance();
export default PeriodValidationService;
