/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service Helper pour Drill-downs dans Rapports Interactifs
 *
 * Génère les métadonnées permettant de naviguer d'une ligne de rapport
 * vers les écritures comptables sources, documents, ou détails analytiques.
 *
 * @priority P2-3 - Interactive Reports Drill-down
 */

import type { DrilldownMetadata } from './ReportExportService';

// ============================================================================
// TYPES
// ============================================================================

export interface DrilldownContext {
  companyId: string;
  startDate?: string;
  endDate?: string;
  fiscalYear?: number;
  standard?: string;
}

// ============================================================================
// BUILDERS: MÉTADONNÉES DRILL-DOWN
// ============================================================================

/**
 * Génère métadonnées drill-down pour une ligne de compte (Balance Sheet, P&L, Trial Balance)
 *
 * Permet de cliquer sur une ligne de compte pour afficher toutes les écritures comptables
 * qui ont alimenté ce compte sur la période.
 *
 * @param rowIndex Index de la ligne dans le tableau
 * @param accountNumber Numéro de compte comptable (ex: "401000", "6011")
 * @param accountName Libellé du compte
 * @param context Contexte (dates, company_id, etc.)
 * @returns Métadonnées drill-down
 *
 * @example
 * const drilldown = buildAccountDrilldown(0, "401000", "Fournisseurs", {
 *   companyId: "company-123",
 *   startDate: "2024-01-01",
 *   endDate: "2024-12-31"
 * });
 * // Au clic frontend: navigate to /accounting/entries?account=401000&start=2024-01-01&end=2024-12-31
 */
export function buildAccountDrilldown(
  rowIndex: number,
  accountNumber: string,
  accountName: string,
  context: DrilldownContext
): DrilldownMetadata {
  return {
    row_index: rowIndex,
    type: 'account',
    account_number: accountNumber,
    filters: {
      company_id: context.companyId,
      account_number: accountNumber,
      start_date: context.startDate,
      end_date: context.endDate
    },
    action: 'show_entries',
    label: `Afficher les écritures du compte ${accountNumber} - ${accountName}`
  };
}

/**
 * Génère métadonnées drill-down pour une catégorie de comptes
 *
 * Exemple: Ligne "ACTIF IMMOBILISÉ" → Afficher tous les comptes 2x
 *
 * @param rowIndex Index de la ligne
 * @param category Catégorie (ex: "ACTIF IMMOBILISE", "CAPITAUX PROPRES")
 * @param accountPrefix Préfixe comptes (ex: "2" pour classe 2)
 * @param context Contexte
 * @returns Métadonnées drill-down
 */
export function buildCategoryDrilldown(
  rowIndex: number,
  category: string,
  accountPrefix: string,
  context: DrilldownContext
): DrilldownMetadata {
  return {
    row_index: rowIndex,
    type: 'category',
    filters: {
      company_id: context.companyId,
      account_prefix: accountPrefix,
      start_date: context.startDate,
      end_date: context.endDate
    },
    action: 'show_entries',
    label: `Afficher les comptes ${category} (${accountPrefix}x)`
  };
}

/**
 * Génère métadonnées drill-down pour un document (facture, paiement)
 *
 * @param rowIndex Index de la ligne
 * @param documentType Type de document ('invoice', 'payment', 'purchase_order')
 * @param documentId ID du document
 * @param documentRef Référence du document (ex: "FAC-2024-001")
 * @returns Métadonnées drill-down
 *
 * @example
 * // Rapport Créances: cliquer sur facture → Ouvrir détail facture
 * const drilldown = buildDocumentDrilldown(2, 'invoice', 'inv-123', 'FAC-2024-001');
 * // Au clic frontend: navigate to /invoicing/invoices/inv-123
 */
export function buildDocumentDrilldown(
  rowIndex: number,
  documentType: 'invoice' | 'payment' | 'purchase_order' | 'contract',
  documentId: string,
  documentRef?: string
): DrilldownMetadata {
  return {
    row_index: rowIndex,
    type: 'document',
    entity_id: documentId,
    filters: {
      document_type: documentType,
      document_id: documentId,
      document_ref: documentRef
    },
    action: 'show_document',
    label: documentRef
      ? `Afficher ${documentType} ${documentRef}`
      : `Afficher ${documentType}`
  };
}

/**
 * Génère métadonnées drill-down pour une transaction spécifique
 *
 * @param rowIndex Index de la ligne
 * @param transactionId ID de la transaction/écriture
 * @param transactionRef Référence de l'écriture (ex: "JE-2024-001")
 * @param context Contexte
 * @returns Métadonnées drill-down
 */
export function buildTransactionDrilldown(
  rowIndex: number,
  transactionId: string,
  transactionRef?: string,
  context?: DrilldownContext
): DrilldownMetadata {
  return {
    row_index: rowIndex,
    type: 'transaction',
    entity_id: transactionId,
    filters: {
      transaction_id: transactionId,
      company_id: context?.companyId
    },
    action: 'show_details',
    label: transactionRef
      ? `Afficher écriture ${transactionRef}`
      : `Afficher écriture détaillée`
  };
}

// ============================================================================
// BATCH GENERATORS: GÉNÉRATION AUTOMATIQUE DRILL-DOWNS
// ============================================================================

/**
 * Génère drill-downs pour un tableau de comptes (Balance Sheet, Trial Balance)
 *
 * @param accounts Liste des comptes [{compte, libelle}, ...]
 * @param context Contexte drill-down
 * @param startIndex Index de départ dans le tableau (pour skip des lignes d'en-tête)
 * @returns Array de métadonnées drill-down
 *
 * @example
 * const accounts = [
 *   { compte: "401000", libelle: "Fournisseurs" },
 *   { compte: "411000", libelle: "Clients" }
 * ];
 * const drilldowns = generateAccountDrilldowns(accounts, context, 0);
 * // => [
 * //   { row_index: 0, type: 'account', account_number: "401000", ... },
 * //   { row_index: 1, type: 'account', account_number: "411000", ... }
 * // ]
 */
export function generateAccountDrilldowns(
  accounts: Array<{ compte: string; libelle: string }>,
  context: DrilldownContext,
  startIndex: number = 0
): DrilldownMetadata[] {
  return accounts.map((acc, index) =>
    buildAccountDrilldown(
      startIndex + index,
      acc.compte,
      acc.libelle,
      context
    )
  );
}

/**
 * Génère drill-downs pour un tableau avec sections (ex: Bilan avec sous-totaux)
 *
 * Skip automatiquement les lignes de titres/sous-totaux (identifiées par compte vide ou '---')
 *
 * @param rows Lignes du tableau [[compte, libelle, ...], ...]
 * @param context Contexte drill-down
 * @returns Array de métadonnées drill-down
 *
 * @example
 * const rows = [
 *   ['', '--- ACTIF IMMOBILISE ---', '', '', ''],  // Skip (ligne titre)
 *   ['211000', 'Terrains', '100000', '0', '100000'],  // Drill-down
 *   ['215000', 'Installations', '50000', '10000', '40000'],  // Drill-down
 *   ['', 'Sous-total Actif Immobilisé', '150000', '10000', '140000']  // Skip (sous-total)
 * ];
 * const drilldowns = generateDrilldownsWithSections(rows, context);
 * // => [
 * //   { row_index: 1, type: 'account', account_number: "211000", ... },
 * //   { row_index: 2, type: 'account', account_number: "215000", ... }
 * // ]
 */
export function generateDrilldownsWithSections(
  rows: any[][],
  context: DrilldownContext
): DrilldownMetadata[] {
  const drilldowns: DrilldownMetadata[] = [];

  rows.forEach((row, index) => {
    const accountNumber = row[0]?.toString().trim();
    const accountName = row[1]?.toString().trim();

    // Skip lignes vides, titres de section, sous-totaux
    if (
      !accountNumber ||
      accountNumber === '' ||
      accountName?.startsWith('---') ||
      accountName?.includes('Sous-total') ||
      accountName?.includes('TOTAL')
    ) {
      return; // Skip cette ligne
    }

    // Générer drill-down pour cette ligne de compte
    drilldowns.push(
      buildAccountDrilldown(index, accountNumber, accountName, context)
    );
  });

  return drilldowns;
}

/**
 * Génère drill-downs pour un rapport de créances/dettes avec documents
 *
 * @param invoices Liste des factures [{id, reference, ...}, ...]
 * @param startIndex Index de départ
 * @returns Array de métadonnées drill-down
 */
export function generateInvoiceDrilldowns(
  invoices: Array<{ id: string; reference: string }>,
  startIndex: number = 0
): DrilldownMetadata[] {
  return invoices.map((invoice, index) =>
    buildDocumentDrilldown(
      startIndex + index,
      'invoice',
      invoice.id,
      invoice.reference
    )
  );
}

// ============================================================================
// HELPERS: FILTRAGE ET VALIDATION
// ============================================================================

/**
 * Vérifie si une ligne de tableau est cliquable (a un drill-down associé)
 *
 * @param rowIndex Index de la ligne
 * @param drilldowns Liste des drill-downs du tableau
 * @returns true si la ligne est cliquable
 */
export function isRowClickable(
  rowIndex: number,
  drilldowns?: DrilldownMetadata[]
): boolean {
  if (!drilldowns || drilldowns.length === 0) return false;
  return drilldowns.some(d => d.row_index === rowIndex);
}

/**
 * Récupère le drill-down associé à une ligne
 *
 * @param rowIndex Index de la ligne
 * @param drilldowns Liste des drill-downs du tableau
 * @returns Métadonnées drill-down ou undefined
 */
export function getDrilldownForRow(
  rowIndex: number,
  drilldowns?: DrilldownMetadata[]
): DrilldownMetadata | undefined {
  if (!drilldowns) return undefined;
  return drilldowns.find(d => d.row_index === rowIndex);
}

/**
 * Génère l'URL de navigation pour un drill-down
 *
 * @param drilldown Métadonnées drill-down
 * @returns URL de navigation (ex: "/accounting/entries?account=401000&start=2024-01-01")
 */
export function buildDrilldownURL(drilldown: DrilldownMetadata): string {
  switch (drilldown.action) {
    case 'show_entries':
      // Navigation vers liste des écritures comptables filtrées
      const params = new URLSearchParams();
      if (drilldown.filters) {
        Object.entries(drilldown.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      return `/accounting/entries?${params.toString()}`;

    case 'show_document':
      // Navigation vers détail du document
      if (drilldown.filters?.document_type === 'invoice') {
        return `/invoicing/invoices/${drilldown.entity_id}`;
      } else if (drilldown.filters?.document_type === 'payment') {
        return `/invoicing/payments/${drilldown.entity_id}`;
      } else if (drilldown.filters?.document_type === 'purchase_order') {
        return `/purchases/orders/${drilldown.entity_id}`;
      }
      return `/accounting/documents/${drilldown.entity_id}`;

    case 'show_details':
      // Navigation vers détail de la transaction
      return `/accounting/entries/${drilldown.entity_id}`;

    default:
      return '/accounting/entries';
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const reportDrilldownHelper = {
  buildAccountDrilldown,
  buildCategoryDrilldown,
  buildDocumentDrilldown,
  buildTransactionDrilldown,
  generateAccountDrilldowns,
  generateDrilldownsWithSections,
  generateInvoiceDrilldowns,
  isRowClickable,
  getDrilldownForRow,
  buildDrilldownURL
};
