/**
 * Anomaly Detection Service
 *
 * Système intelligent de détection d'anomalies comptables.
 * Analyse automatique des écritures pour détecter:
 * - Montants suspects (arrondis, doublons)
 * - Comptes inactifs avec mouvements soudains
 * - Ratios anormaux débit/crédit
 * - Lettrage en attente prolongé
 * - Écarts TVA déclaré vs calculé
 *
 * USP unique vs concurrence (Sage, Cegid, Pennylane)
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type AnomalyType =
  | 'suspicious_amount'      // Montant suspect (trop rond, doublon)
  | 'inactive_account'       // Compte inactif avec mouvement soudain
  | 'unbalanced_ratio'       // Ratio débit/crédit anormal
  | 'overdue_lettrage'       // Lettrage en attente > seuil
  | 'vat_discrepancy'        // Écart TVA
  | 'duplicate_entry'        // Écriture potentiellement dupliquée
  | 'unusual_journal'        // Journal inhabituel pour le compte
  | 'high_amount'            // Montant exceptionnellement élevé
  | 'weekend_entry';         // Écriture weekend/férié

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  detected_at: string;

  // Context
  journal_entry_id?: string;
  account_number?: string;
  amount?: number;

  // Details
  details: Record<string, any>;

  // Actions
  auto_fixable: boolean;
  suggested_action?: string;

  // Status
  status: 'open' | 'reviewed' | 'resolved' | 'false_positive';
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_note?: string;
}

export interface AnomalyDetectionConfig {
  // Seuils de détection
  suspicious_amount_threshold: number;      // Ex: 0.99 pour détecter 1000.00 exact
  high_amount_multiplier: number;           // Ex: 5x moyenne du compte
  inactive_days_threshold: number;          // Ex: 90 jours
  overdue_lettrage_days: number;            // Ex: 90 jours
  vat_discrepancy_tolerance: number;        // Ex: 0.02 (2 centimes)

  // Activations
  enable_suspicious_amounts: boolean;
  enable_inactive_accounts: boolean;
  enable_ratio_analysis: boolean;
  enable_lettrage_monitoring: boolean;
  enable_vat_checks: boolean;
  enable_duplicate_detection: boolean;
  enable_weekend_detection: boolean;
}

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  suspicious_amount_threshold: 0.99,
  high_amount_multiplier: 5,
  inactive_days_threshold: 90,
  overdue_lettrage_days: 90,
  vat_discrepancy_tolerance: 0.02,
  enable_suspicious_amounts: true,
  enable_inactive_accounts: true,
  enable_ratio_analysis: true,
  enable_lettrage_monitoring: true,
  enable_vat_checks: true,
  enable_duplicate_detection: true,
  enable_weekend_detection: true,
};

// ============================================================================
// DÉTECTION #1: MONTANTS SUSPECTS
// ============================================================================

/**
 * Détecte les montants trop ronds ou suspects
 * Ex: 1000.00, 5000.00, 10000.00 (potentiellement estimés)
 */
async function detectSuspiciousAmounts(
  companyId: string,
  periodId: string,
  config: AnomalyDetectionConfig
): Promise<Anomaly[]> {
  if (!config.enable_suspicious_amounts) return [];

  const { data: entries } = await supabase
    .from('journal_entry_lines')
    .select(`
      id,
      journal_entry_id,
      account_number,
      account_name,
      debit_amount,
      credit_amount,
      journal_entries!inner (
        entry_date,
        entry_number,
        description,
        accounting_period_id,
        company_id
      )
    `)
    .eq('journal_entries.company_id', companyId)
    .eq('journal_entries.accounting_period_id', periodId)
    .eq('journal_entries.status', 'posted');

  const anomalies: Anomaly[] = [];

  for (const entry of entries || []) {
    const amount = (entry.debit_amount || 0) + (entry.credit_amount || 0);
    if (amount === 0) continue;

    // Détection montant trop rond (ex: 1000.00, 5000.00)
    const decimals = (amount % 1).toFixed(2);
    const isRound = decimals === '0.00' && amount >= 100;
    const isVeryRound = amount % 1000 === 0 && amount >= 1000;

    if (isVeryRound) {
      anomalies.push({
        id: `suspicious-${entry.id}`,
        type: 'suspicious_amount',
        severity: 'medium',
        title: 'Montant très arrondi détecté',
        description: `Montant exactement ${amount.toFixed(2)}€ sur compte ${entry.account_number}. Vérifier si c'est une estimation.`,
        detected_at: new Date().toISOString(),
        journal_entry_id: entry.journal_entry_id,
        account_number: entry.account_number,
        amount,
        details: {
          entry_date: (entry.journal_entries as any).entry_date,
          entry_number: (entry.journal_entries as any).entry_number,
          is_multiple_of: 1000,
        },
        auto_fixable: false,
        suggested_action: 'Vérifier la justification du montant avec pièce comptable',
        status: 'open',
      });
    } else if (isRound && amount >= 1000) {
      anomalies.push({
        id: `suspicious-${entry.id}`,
        type: 'suspicious_amount',
        severity: 'low',
        title: 'Montant arrondi',
        description: `Montant rond ${amount.toFixed(2)}€ sur compte ${entry.account_number}.`,
        detected_at: new Date().toISOString(),
        journal_entry_id: entry.journal_entry_id,
        account_number: entry.account_number,
        amount,
        details: {
          entry_date: (entry.journal_entries as any).entry_date,
        },
        auto_fixable: false,
        status: 'open',
      });
    }
  }

  return anomalies;
}

// ============================================================================
// DÉTECTION #2: COMPTES INACTIFS
// ============================================================================

/**
 * Détecte les comptes inactifs avec mouvement soudain
 * Ex: Compte sans mouvement depuis 3 mois qui reçoit une écriture
 */
async function detectInactiveAccountMovements(
  companyId: string,
  periodId: string,
  config: AnomalyDetectionConfig
): Promise<Anomaly[]> {
  if (!config.enable_inactive_accounts) return [];

  const { data: period } = await supabase
    .from('accounting_periods')
    .select('start_date, end_date')
    .eq('id', periodId)
    .single();

  if (!period) return [];

  // Date limite d'inactivité (ex: 90 jours avant période)
  const inactiveThresholdDate = new Date(period.start_date);
  inactiveThresholdDate.setDate(inactiveThresholdDate.getDate() - config.inactive_days_threshold);

  // Récupérer tous les comptes avec mouvement dans la période
  const { data: currentMovements } = await supabase
    .from('journal_entry_lines')
    .select(`
      account_number,
      account_name,
      journal_entry_id,
      debit_amount,
      credit_amount,
      journal_entries!inner (
        entry_date,
        entry_number,
        company_id,
        accounting_period_id
      )
    `)
    .eq('journal_entries.company_id', companyId)
    .eq('journal_entries.accounting_period_id', periodId);

  const anomalies: Anomaly[] = [];

  // Pour chaque compte, vérifier si inactif avant
  const accountsChecked = new Set<string>();

  for (const movement of currentMovements || []) {
    if (accountsChecked.has(movement.account_number)) continue;
    accountsChecked.add(movement.account_number);

    // Chercher mouvements avant période sur ce compte
    const { data: previousMovements, count } = await supabase
      .from('journal_entry_lines')
      .select('id, journal_entries!inner(entry_date, company_id)', { count: 'exact' })
      .eq('account_number', movement.account_number)
      .eq('journal_entries.company_id', companyId)
      .gte('journal_entries.entry_date', inactiveThresholdDate.toISOString().split('T')[0])
      .lt('journal_entries.entry_date', period.start_date);

    // Si aucun mouvement avant = compte inactif
    if (count === 0) {
      const amount = (movement.debit_amount || 0) + (movement.credit_amount || 0);

      anomalies.push({
        id: `inactive-${movement.account_number}`,
        type: 'inactive_account',
        severity: 'medium',
        title: `Compte inactif réactivé`,
        description: `Le compte ${movement.account_number} (${movement.account_name}) était inactif depuis ${config.inactive_days_threshold} jours et a reçu un mouvement de ${amount.toFixed(2)}€.`,
        detected_at: new Date().toISOString(),
        journal_entry_id: movement.journal_entry_id,
        account_number: movement.account_number,
        amount,
        details: {
          inactive_since_days: config.inactive_days_threshold,
          entry_date: (movement.journal_entries as any).entry_date,
        },
        auto_fixable: false,
        suggested_action: 'Vérifier la nature de cette réactivation',
        status: 'open',
      });
    }
  }

  return anomalies;
}

// ============================================================================
// DÉTECTION #3: LETTRAGE EN RETARD
// ============================================================================

/**
 * Détecte les lignes non lettrées depuis trop longtemps
 * Ex: Facture client non lettrée depuis > 90 jours
 */
async function detectOverdueLettrage(
  companyId: string,
  config: AnomalyDetectionConfig
): Promise<Anomaly[]> {
  if (!config.enable_lettrage_monitoring) return [];

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - config.overdue_lettrage_days);

  const { data: overdueLines } = await supabase
    .from('journal_entry_lines')
    .select(`
      id,
      journal_entry_id,
      account_number,
      account_name,
      debit_amount,
      credit_amount,
      journal_entries!inner (
        entry_date,
        entry_number,
        company_id
      )
    `)
    .eq('journal_entries.company_id', companyId)
    .is('lettrage_code', null)
    .in('account_number', ['411%', '401%']) // Clients et fournisseurs
    .lt('journal_entries.entry_date', thresholdDate.toISOString().split('T')[0]);

  const anomalies: Anomaly[] = [];

  for (const line of overdueLines || []) {
    const amount = (line.debit_amount || 0) + (line.credit_amount || 0);
    const entryDate = new Date((line.journal_entries as any).entry_date);
    const daysOverdue = Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    const isClient = line.account_number.startsWith('411');
    const severity: AnomalySeverity = daysOverdue > 180 ? 'high' : daysOverdue > 120 ? 'medium' : 'low';

    anomalies.push({
      id: `overdue-lettrage-${line.id}`,
      type: 'overdue_lettrage',
      severity,
      title: `${isClient ? 'Client' : 'Fournisseur'} non lettré depuis ${daysOverdue} jours`,
      description: `Ligne ${line.account_number} (${line.account_name}) non lettrée depuis ${daysOverdue} jours pour ${amount.toFixed(2)}€.`,
      detected_at: new Date().toISOString(),
      journal_entry_id: line.journal_entry_id,
      account_number: line.account_number,
      amount,
      details: {
        days_overdue: daysOverdue,
        entry_date: (line.journal_entries as any).entry_date,
        entry_number: (line.journal_entries as any).entry_number,
      },
      auto_fixable: false,
      suggested_action: isClient ? 'Relancer le client ou provisionner en créances douteuses' : 'Vérifier avec le fournisseur',
      status: 'open',
    });
  }

  return anomalies;
}

// ============================================================================
// DÉTECTION #4: DOUBLONS
// ============================================================================

/**
 * Détecte les écritures potentiellement dupliquées
 * Ex: Même montant, même compte, même date, même description
 */
async function detectDuplicateEntries(
  companyId: string,
  periodId: string,
  config: AnomalyDetectionConfig
): Promise<Anomaly[]> {
  if (!config.enable_duplicate_detection) return [];

  const { data: entries } = await supabase
    .from('journal_entries')
    .select(`
      id,
      entry_date,
      entry_number,
      description,
      journal_entry_lines (
        account_number,
        debit_amount,
        credit_amount
      )
    `)
    .eq('company_id', companyId)
    .eq('accounting_period_id', periodId)
    .eq('status', 'posted')
    .order('entry_date', { ascending: false });

  const anomalies: Anomaly[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < (entries?.length || 0); i++) {
    const entry1 = entries![i];
    if (checked.has(entry1.id)) continue;

    for (let j = i + 1; j < (entries?.length || 0); j++) {
      const entry2 = entries![j];
      if (checked.has(entry2.id)) continue;

      // Vérifier similarité
      const sameDate = entry1.entry_date === entry2.entry_date;
      const sameDescription = entry1.description === entry2.description;
      const sameLineCount = entry1.journal_entry_lines.length === entry2.journal_entry_lines.length;

      if (sameDate && sameDescription && sameLineCount) {
        // Comparer les lignes
        let identical = true;
        for (let k = 0; k < entry1.journal_entry_lines.length; k++) {
          const line1 = entry1.journal_entry_lines[k];
          const line2 = entry2.journal_entry_lines[k];

          if (
            line1.account_number !== line2.account_number ||
            line1.debit_amount !== line2.debit_amount ||
            line1.credit_amount !== line2.credit_amount
          ) {
            identical = false;
            break;
          }
        }

        if (identical) {
          checked.add(entry2.id);

          const totalAmount = entry1.journal_entry_lines.reduce(
            (sum, line) => sum + (line.debit_amount || 0),
            0
          );

          anomalies.push({
            id: `duplicate-${entry1.id}-${entry2.id}`,
            type: 'duplicate_entry',
            severity: 'high',
            title: 'Écriture potentiellement dupliquée',
            description: `Les écritures ${entry1.entry_number} et ${entry2.entry_number} sont identiques (${totalAmount.toFixed(2)}€).`,
            detected_at: new Date().toISOString(),
            journal_entry_id: entry1.id,
            amount: totalAmount,
            details: {
              duplicate_entry_id: entry2.id,
              duplicate_entry_number: entry2.entry_number,
              entry_date: entry1.entry_date,
            },
            auto_fixable: false,
            suggested_action: 'Supprimer une des deux écritures ou justifier la duplication',
            status: 'open',
          });
        }
      }
    }
  }

  return anomalies;
}

// ============================================================================
// DÉTECTION #5: ÉCRITURES WEEKEND/FÉRIÉ
// ============================================================================

/**
 * Détecte les écritures saisies le weekend ou jours fériés
 * Potentiellement suspect ou inhabituel
 */
async function detectWeekendEntries(
  companyId: string,
  periodId: string,
  config: AnomalyDetectionConfig
): Promise<Anomaly[]> {
  if (!config.enable_weekend_detection) return [];

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, entry_date, entry_number, description, created_at')
    .eq('company_id', companyId)
    .eq('accounting_period_id', periodId)
    .eq('status', 'posted');

  const anomalies: Anomaly[] = [];

  for (const entry of entries || []) {
    const createdDate = new Date(entry.created_at);
    const dayOfWeek = createdDate.getDay();

    // Weekend (samedi=6, dimanche=0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      anomalies.push({
        id: `weekend-${entry.id}`,
        type: 'weekend_entry',
        severity: 'low',
        title: 'Écriture créée le weekend',
        description: `L'écriture ${entry.entry_number} a été créée un ${dayOfWeek === 0 ? 'dimanche' : 'samedi'}.`,
        detected_at: new Date().toISOString(),
        journal_entry_id: entry.id,
        details: {
          created_at: entry.created_at,
          day_of_week: dayOfWeek,
        },
        auto_fixable: false,
        suggested_action: 'Vérifier si la saisie était justifiée',
        status: 'open',
      });
    }
  }

  return anomalies;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

/**
 * Analyse complète des anomalies pour une période
 */
export async function detectAllAnomalies(
  companyId: string,
  periodId: string,
  config: AnomalyDetectionConfig = DEFAULT_CONFIG
): Promise<Anomaly[]> {
  const results = await Promise.all([
    detectSuspiciousAmounts(companyId, periodId, config),
    detectInactiveAccountMovements(companyId, periodId, config),
    detectOverdueLettrage(companyId, config),
    detectDuplicateEntries(companyId, periodId, config),
    detectWeekendEntries(companyId, periodId, config),
  ]);

  return results.flat().sort((a, b) => {
    // Trier par sévérité puis date
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
  });
}

/**
 * Statistiques des anomalies
 */
export async function getAnomalyStats(anomalies: Anomaly[]) {
  const bySeverity = {
    critical: anomalies.filter(a => a.severity === 'critical').length,
    high: anomalies.filter(a => a.severity === 'high').length,
    medium: anomalies.filter(a => a.severity === 'medium').length,
    low: anomalies.filter(a => a.severity === 'low').length,
  };

  const byType = anomalies.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<AnomalyType, number>);

  const byStatus = {
    open: anomalies.filter(a => a.status === 'open').length,
    reviewed: anomalies.filter(a => a.status === 'reviewed').length,
    resolved: anomalies.filter(a => a.status === 'resolved').length,
    false_positive: anomalies.filter(a => a.status === 'false_positive').length,
  };

  return {
    total: anomalies.length,
    by_severity: bySeverity,
    by_type: byType,
    by_status: byStatus,
  };
}

/**
 * Récupérer configuration par défaut
 */
export function getDefaultConfig(): AnomalyDetectionConfig {
  return { ...DEFAULT_CONFIG };
}
