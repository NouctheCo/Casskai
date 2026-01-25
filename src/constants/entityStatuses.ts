/**
 * CassKai - Constantes des statuts des entités
 * Centralisation des statuts pour assurer la cohérence avec les contraintes SQL
 */

// ============================================================================
// ÉCRITURES COMPTABLES (journal_entries)
// ============================================================================

export const JOURNAL_ENTRY_STATUSES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  VALIDATED: 'validated',
  POSTED: 'posted',
  CANCELLED: 'cancelled',
  IMPORTED: 'imported',
} as const;

export type JournalEntryStatus = typeof JOURNAL_ENTRY_STATUSES[keyof typeof JOURNAL_ENTRY_STATUSES];

/** Statuts valides pour les requêtes (hors cancelled) */
export const JOURNAL_ENTRY_ACTIVE_STATUSES: JournalEntryStatus[] = [
  JOURNAL_ENTRY_STATUSES.DRAFT,
  JOURNAL_ENTRY_STATUSES.REVIEW,
  JOURNAL_ENTRY_STATUSES.VALIDATED,
  JOURNAL_ENTRY_STATUSES.POSTED,
  JOURNAL_ENTRY_STATUSES.IMPORTED,
];

/** Statuts pour les écritures finalisées */
export const JOURNAL_ENTRY_FINAL_STATUSES: JournalEntryStatus[] = [
  JOURNAL_ENTRY_STATUSES.VALIDATED,
  JOURNAL_ENTRY_STATUSES.POSTED,
  JOURNAL_ENTRY_STATUSES.IMPORTED,
];

// ============================================================================
// FACTURES (invoices)
// ============================================================================

export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type InvoiceStatus = typeof INVOICE_STATUSES[keyof typeof INVOICE_STATUSES];

/** Statuts de factures actives (non annulées) */
export const INVOICE_ACTIVE_STATUSES: InvoiceStatus[] = [
  INVOICE_STATUSES.DRAFT,
  INVOICE_STATUSES.SENT,
  INVOICE_STATUSES.VIEWED,
  INVOICE_STATUSES.PAID,
  INVOICE_STATUSES.PARTIAL,
  INVOICE_STATUSES.OVERDUE,
];

/** Statuts de factures en attente de paiement */
export const INVOICE_UNPAID_STATUSES: InvoiceStatus[] = [
  INVOICE_STATUSES.SENT,
  INVOICE_STATUSES.VIEWED,
  INVOICE_STATUSES.PARTIAL,
  INVOICE_STATUSES.OVERDUE,
];

/** Statuts de factures payées (totalement ou partiellement) */
export const INVOICE_PAYMENT_STATUSES: InvoiceStatus[] = [
  INVOICE_STATUSES.PAID,
  INVOICE_STATUSES.PARTIAL,
];

// ============================================================================
// ACHATS (purchases)
// ============================================================================

export const PURCHASE_PAYMENT_STATUSES = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
} as const;

export type PurchasePaymentStatus = typeof PURCHASE_PAYMENT_STATUSES[keyof typeof PURCHASE_PAYMENT_STATUSES];

/** Statuts d'achats en attente */
export const PURCHASE_UNPAID_STATUSES: PurchasePaymentStatus[] = [
  PURCHASE_PAYMENT_STATUSES.PENDING,
  PURCHASE_PAYMENT_STATUSES.OVERDUE,
];

// ============================================================================
// TRANSACTIONS BANCAIRES (bank_transactions)
// ============================================================================

export const BANK_TRANSACTION_STATUSES = {
  PENDING: 'pending',
  RECONCILED: 'reconciled',
  IGNORED: 'ignored',
} as const;

export type BankTransactionStatus = typeof BANK_TRANSACTION_STATUSES[keyof typeof BANK_TRANSACTION_STATUSES];

/** Statuts de transactions non rapprochées */
export const BANK_TRANSACTION_UNRECONCILED_STATUSES: BankTransactionStatus[] = [
  BANK_TRANSACTION_STATUSES.PENDING,
];

// ============================================================================
// IMMOBILISATIONS (assets)
// ============================================================================

export const ASSET_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DISPOSED: 'disposed',
  FULLY_DEPRECIATED: 'fully_depreciated',
} as const;

export type AssetStatus = typeof ASSET_STATUSES[keyof typeof ASSET_STATUSES];

/** Statuts d'immobilisations actives */
export const ASSET_ACTIVE_STATUSES: AssetStatus[] = [
  ASSET_STATUSES.ACTIVE,
];

// ============================================================================
// ABONNEMENTS (subscriptions)
// ============================================================================

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
} as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[keyof typeof SUBSCRIPTION_STATUSES];

/** Statuts d'abonnements valides */
export const SUBSCRIPTION_VALID_STATUSES: SubscriptionStatus[] = [
  SUBSCRIPTION_STATUSES.ACTIVE,
  SUBSCRIPTION_STATUSES.TRIALING,
];

// ============================================================================
// ANOMALIES DÉTECTÉES (detected_anomalies)
// ============================================================================

export const ANOMALY_STATUSES = {
  OPEN: 'open',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  FALSE_POSITIVE: 'false_positive',
} as const;

export type AnomalyStatus = typeof ANOMALY_STATUSES[keyof typeof ANOMALY_STATUSES];

export const ANOMALY_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type AnomalySeverity = typeof ANOMALY_SEVERITIES[keyof typeof ANOMALY_SEVERITIES];

// ============================================================================
// FILE D'AUTOMATISATION (automation_queue)
// ============================================================================

export const AUTOMATION_QUEUE_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type AutomationQueueStatus = typeof AUTOMATION_QUEUE_STATUSES[keyof typeof AUTOMATION_QUEUE_STATUSES];

// ============================================================================
// TYPES DE TRIGGERS D'AUTOMATISATION
// ============================================================================

export const AUTOMATION_TRIGGER_TYPES = {
  INVOICE_TO_JOURNAL: 'invoice_to_journal',
  PURCHASE_TO_JOURNAL: 'purchase_to_journal',
  PAYMENT_ALLOCATION_TO_JOURNAL: 'payment_allocation_to_journal',
  BANK_TRANSACTION_TO_JOURNAL: 'bank_transaction_to_journal',
} as const;

export type AutomationTriggerType = typeof AUTOMATION_TRIGGER_TYPES[keyof typeof AUTOMATION_TRIGGER_TYPES];

// ============================================================================
// EXPORTS GROUPÉS
// ============================================================================

export const EntityStatuses = {
  journalEntry: JOURNAL_ENTRY_STATUSES,
  invoice: INVOICE_STATUSES,
  purchase: PURCHASE_PAYMENT_STATUSES,
  bankTransaction: BANK_TRANSACTION_STATUSES,
  asset: ASSET_STATUSES,
  subscription: SUBSCRIPTION_STATUSES,
  anomaly: ANOMALY_STATUSES,
  automationQueue: AUTOMATION_QUEUE_STATUSES,
};

export default EntityStatuses;
