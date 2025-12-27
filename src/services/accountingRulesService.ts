/**
 * CassKai - Service de Règles Comptables Professionnelles Multi-Pays
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service expert implémentant les règles comptables selon différents référentiels :
 * - PCG (Plan Comptable Général - France)
 * - SYSCOHADA (Système Comptable OHADA - Afrique francophone)
 * - IAS/IFRS (International Accounting Standards - International)
 * - Principes universels de la comptabilité en partie double
 *
 * Les principes fondamentaux (partie double, équilibre, nature des comptes)
 * sont UNIVERSELS et s'appliquent à tous les référentiels.
 */

import { supabase } from '@/lib/supabase';

/**
 * Référentiels comptables supportés
 */
export enum AccountingStandard {
  PCG = 'pcg',                    // Plan Comptable Général (France)
  SYSCOHADA = 'syscohada',        // SYSCOHADA (Afrique francophone)
  IFRS = 'ifrs',                  // IAS/IFRS (International)
  US_GAAP = 'us_gaap',           // US GAAP (USA)
  CUSTOM = 'custom',              // Plan comptable personnalisé
}

/**
 * Types de journaux selon les normes comptables
 */
export enum JournalType {
  SALE = 'sale',           // VE - Ventes (débiteur: 411, créditeur: 707)
  PURCHASE = 'purchase',   // AC - Achats (débiteur: 607, créditeur: 401)
  BANK = 'bank',           // BQ - Banque (flux trésorerie)
  CASH = 'cash',           // CA - Caisse (flux trésorerie)
  MISCELLANEOUS = 'miscellaneous', // OD - Opérations Diverses
}

/**
 * Classes de comptes selon le Plan Comptable Général (PCG)
 * et SYSCOHADA
 */
export enum AccountClass {
  ASSETS_NON_CURRENT = 1,          // Classe 1: Comptes de capitaux (PASSIF)
  ASSETS_NON_CURRENT_FIXED = 2,    // Classe 2: Comptes d'immobilisations (ACTIF)
  INVENTORIES = 3,                 // Classe 3: Comptes de stocks (ACTIF)
  THIRD_PARTIES = 4,               // Classe 4: Comptes de tiers (ACTIF/PASSIF)
  FINANCIAL = 5,                   // Classe 5: Comptes financiers (ACTIF)
  EXPENSES = 6,                    // Classe 6: Comptes de charges (DÉBIT)
  INCOME = 7,                      // Classe 7: Comptes de produits (CRÉDIT)
  SPECIAL = 8,                     // Classe 8: Comptes spéciaux
}

/**
 * Nature comptable d'un compte (selon sa classe)
 */
export enum AccountNature {
  DEBIT = 'debit',     // Comptes à nature débitrice (1, 2, 3, 5, 6)
  CREDIT = 'credit',   // Comptes à nature créditrice (4 passif, 7)
  MIXED = 'mixed',     // Comptes mixtes (4 - clients/fournisseurs)
}

/**
 * Règles de débit/crédit selon la classe de compte
 *
 * ⚠️ PRINCIPES COMPTABLES UNIVERSELS (VALABLES DANS TOUS LES PAYS) :
 * ================================================================
 * Ces règles s'appliquent PARTOUT dans le monde, car elles découlent de
 * l'équation fondamentale : ACTIF = PASSIF + CAPITAUX PROPRES
 *
 * 1. PRINCIPE DE LA PARTIE DOUBLE (universel) :
 *    - Chaque écriture a TOUJOURS un débit = crédit
 *    - Aucune exception possible
 *
 * 2. NATURE DES COMPTES (universel) :
 *    - ACTIF (ce qu'on possède) → Augmente au DÉBIT, diminue au CRÉDIT
 *      Exemples : Immobilisations, Stocks, Banque, Clients
 *
 *    - PASSIF (ce qu'on doit) → Augmente au CRÉDIT, diminue au DÉBIT
 *      Exemples : Capital, Emprunts, Fournisseurs, Dettes sociales
 *
 *    - CHARGES (dépenses) → Toujours au DÉBIT
 *      Exemples : Achats, Salaires, Loyers, Électricité
 *
 *    - PRODUITS (revenus) → Toujours au CRÉDIT
 *      Exemples : Ventes, Prestations de services, Intérêts
 *
 * 3. SPÉCIFICITÉS PAR RÉFÉRENTIEL :
 *    - PCG (France) : Classes 1-8, numéros comme 411, 401, 607, 707
 *    - SYSCOHADA (Afrique) : Classes 1-9, similaire au PCG français
 *    - IFRS (International) : Plus flexible, moins de numérotation stricte
 *    - US GAAP (USA) : Utilise des libellés anglais mais mêmes principes
 *
 * Les numéros de comptes changent, mais les RÈGLES restent identiques !
 */
export const ACCOUNT_RULES = {
  [AccountClass.ASSETS_NON_CURRENT]: {
    nature: AccountNature.CREDIT,
    description: 'Capitaux propres et dettes long terme',
    preferredSide: 'credit',
    examples: ['101 - Capital', '106 - Réserves', '164 - Emprunts'],
  },
  [AccountClass.ASSETS_NON_CURRENT_FIXED]: {
    nature: AccountNature.DEBIT,
    description: 'Immobilisations',
    preferredSide: 'debit',
    examples: ['211 - Terrains', '218 - Matériel', '281 - Amortissements'],
  },
  [AccountClass.INVENTORIES]: {
    nature: AccountNature.DEBIT,
    description: 'Stocks et en-cours',
    preferredSide: 'debit',
    examples: ['31 - Matières premières', '37 - Marchandises'],
  },
  [AccountClass.THIRD_PARTIES]: {
    nature: AccountNature.MIXED,
    description: 'Comptes de tiers (clients, fournisseurs, etc.)',
    preferredSide: 'mixed', // Dépend du sous-compte
    examples: ['411 - Clients (DÉBIT)', '401 - Fournisseurs (CRÉDIT)', '43 - Sécurité sociale', '44 - État'],
  },
  [AccountClass.FINANCIAL]: {
    nature: AccountNature.DEBIT,
    description: 'Comptes financiers',
    preferredSide: 'debit',
    examples: ['512 - Banque', '53 - Caisse'],
  },
  [AccountClass.EXPENSES]: {
    nature: AccountNature.DEBIT,
    description: 'Comptes de charges',
    preferredSide: 'debit',
    examples: ['607 - Achats', '615 - Entretien', '641 - Salaires'],
  },
  [AccountClass.INCOME]: {
    nature: AccountNature.CREDIT,
    description: 'Comptes de produits',
    preferredSide: 'credit',
    examples: ['707 - Ventes', '758 - Produits divers'],
  },
  [AccountClass.SPECIAL]: {
    nature: AccountNature.MIXED,
    description: 'Comptes spéciaux',
    preferredSide: 'mixed',
    examples: ['89 - Bilan'],
  },
};

/**
 * Schémas d'écriture type selon le journal
 */
export const JOURNAL_ENTRY_TEMPLATES = {
  [JournalType.SALE]: {
    description: 'Vente de biens ou services',
    lines: [
      { account: '411', side: 'debit', label: 'Client' },
      { account: '707', side: 'credit', label: 'Ventes de marchandises' },
      { account: '44571', side: 'credit', label: 'TVA collectée' },
    ],
  },
  [JournalType.PURCHASE]: {
    description: 'Achat de biens ou services',
    lines: [
      { account: '607', side: 'debit', label: 'Achats de marchandises' },
      { account: '44566', side: 'debit', label: 'TVA déductible' },
      { account: '401', side: 'credit', label: 'Fournisseurs' },
    ],
  },
  [JournalType.BANK]: {
    description: 'Mouvement bancaire',
    lines: [
      { account: '512', side: 'debit', label: 'Banque (encaissement)' },
      { account: '411', side: 'credit', label: 'Clients (règlement)' },
    ],
  },
  [JournalType.CASH]: {
    description: 'Mouvement de caisse',
    lines: [
      { account: '53', side: 'debit', label: 'Caisse (encaissement)' },
      { account: '707', side: 'credit', label: 'Ventes' },
    ],
  },
  [JournalType.MISCELLANEOUS]: {
    description: 'Opération diverse',
    lines: [],
  },
};

/**
 * Service de règles comptables
 */
export class AccountingRulesService {
  /**
   * Prefixes for accounts that are commonly flexible (both sides used)
   * Includes bank, cash, key auxiliaries and state accounts.
   */
  private static readonly FLEXIBLE_ACCOUNT_PREFIXES = [
    '512', // Banque
    '53',  // Caisse
    '411', // Clients (auxiliaires)
    '401', // Fournisseurs (auxiliaires)
    '467', // Autres comptes débiteurs ou créditeurs
    '44',  // État, TVA et assimilés (généralement mixtes)
  ];

  /**
   * Permet de surcharger la liste des préfixes « flexibles »
   * (optionnel, pour adapter aux pratiques d'une société ou d'un référentiel)
   */
  static setFlexibleAccountPrefixes(prefixes: string[]) {
    if (Array.isArray(prefixes) && prefixes.every(p => typeof p === 'string')) {
      // Créer une copie pour éviter les mutations extérieures
      (this as any).FLEXIBLE_ACCOUNT_PREFIXES = [...prefixes];
    }
  }

  /**
   * Retourne la liste courante des préfixes « flexibles »
   */
  static getFlexibleAccountPrefixes(): string[] {
    return [...(this as any).FLEXIBLE_ACCOUNT_PREFIXES];
  }
  /**
   * Récupère la classe d'un compte depuis son numéro
   */
  static getAccountClass(accountNumber: string): AccountClass | null {
    if (!accountNumber || accountNumber.length === 0) return null;

    const firstDigit = parseInt(accountNumber[0]);
    if (isNaN(firstDigit) || firstDigit < 1 || firstDigit > 8) return null;

    return firstDigit as AccountClass;
  }

  /**
   * Détermine la nature comptable d'un compte
   */
  static getAccountNature(accountNumber: string): AccountNature {
    const accountClass = this.getAccountClass(accountNumber);
    if (!accountClass) return AccountNature.MIXED;

    // Classe 4: traitement spécial (clients vs fournisseurs)
    if (accountClass === AccountClass.THIRD_PARTIES) {
      if (accountNumber.startsWith('411')) return AccountNature.DEBIT;  // Clients (actif)
      if (accountNumber.startsWith('401')) return AccountNature.CREDIT; // Fournisseurs (passif)
      if (accountNumber.startsWith('43')) return AccountNature.CREDIT;  // Sécurité sociale
      if (accountNumber.startsWith('44')) return AccountNature.MIXED;   // État, TVA
      return AccountNature.MIXED;
    }

    return ACCOUNT_RULES[accountClass]?.nature || AccountNature.MIXED;
  }

  /**
   * Valide si un montant est du bon côté pour un compte donné
   */
  static validateAccountSide(
    accountNumber: string,
    debitAmount: number,
    creditAmount: number
  ): { valid: boolean; warning?: string; suggestion?: string; info?: string } {
    // Comptes pour lesquels débit et crédit sont régulièrement utilisés sans avertissement
    const isFlexibleAccount = this.FLEXIBLE_ACCOUNT_PREFIXES.some(prefix => accountNumber.startsWith(prefix));

    const nature = this.getAccountNature(accountNumber);
    const accountClass = this.getAccountClass(accountNumber);

    // Les deux côtés remplis = erreur
    if (debitAmount > 0 && creditAmount > 0) {
      return {
        valid: false,
        warning: 'Un compte ne peut pas avoir simultanément un débit ET un crédit',
        suggestion: 'Choisissez soit débit, soit crédit',
      };
    }

    // Aucun montant = valide mais incomplet
    if (debitAmount === 0 && creditAmount === 0) {
      return {
        valid: true,
        warning: 'Aucun montant saisi',
      };
    }

    // Comptes flexibles: accepter sans avertissement côté débit/crédit
    if (isFlexibleAccount) {
      return { valid: true };
    }

    // Comptes mixtes : tout est permis
    if (nature === AccountNature.MIXED) {
      return { valid: true };
    }

    // Comptes à nature débitrice (2, 3, 5, 6)
    if (nature === AccountNature.DEBIT) {
      if (creditAmount > 0) {
        const rule = accountClass ? ACCOUNT_RULES[accountClass] : null;
        return {
          valid: true,
          info: `Info: Ce compte est généralement débité (${rule?.description}).`,
          suggestion: `Ce type de compte (classe ${accountClass}) est habituellement débité. Vérifiez votre saisie.`,
        };
      }
    }

    // Comptes à nature créditrice (1, 7)
    if (nature === AccountNature.CREDIT) {
      if (debitAmount > 0) {
        const rule = accountClass ? ACCOUNT_RULES[accountClass] : null;
        return {
          valid: true,
          info: `Info: Ce compte est généralement crédité (${rule?.description}).`,
          suggestion: `Ce type de compte (classe ${accountClass}) est habituellement crédité. Vérifiez votre saisie.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Génère un numéro d'écriture automatique selon le journal
   * Format: [CODE_JOURNAL]-[ANNÉE]-[NUMÉRO_SÉQUENTIEL]
   * Exemple: VE-2025-00123
   */
  static async generateEntryNumber(
    companyId: string,
    journalId: string,
    entryDate: string
  ): Promise<string> {
    try {
      // Récupérer le code du journal
      const { data: journal, error: journalError } = await supabase
        .from('journals')
        .select('code')
        .eq('id', journalId)
        .single();

      if (journalError || !journal) {
        console.warn('Journal not found, using default code');
        const year = new Date(entryDate).getFullYear();
        return `OD-${year}-${Date.now().toString().slice(-6)}`;
      }

      const journalCode = journal.code;
      const year = new Date(entryDate).getFullYear();

      // Récupérer le dernier numéro pour ce journal cette année
      const { data: lastEntry, error: entryError } = await supabase
        .from('journal_entries')
        .select('entry_number')
        .eq('company_id', companyId)
        .eq('journal_id', journalId)
        .gte('entry_date', `${year}-01-01`)
        .lte('entry_date', `${year}-12-31`)
        .order('entry_number', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;

      if (!entryError && lastEntry && lastEntry.entry_number) {
        // Extraire le numéro séquentiel du dernier numéro
        const match = lastEntry.entry_number.match(/-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Format: VE-2025-00001
      return `${journalCode}-${year}-${nextNumber.toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating entry number:', error);
      const year = new Date(entryDate).getFullYear();
      return `OD-${year}-${Date.now().toString().slice(-6)}`;
    }
  }

  /**
   * Détermine automatiquement le journal approprié selon les comptes utilisés
   */
  static suggestJournal(accountNumbers: string[]): JournalType {
    const hasClient = accountNumbers.some(acc => acc.startsWith('411'));
    const hasSupplier = accountNumbers.some(acc => acc.startsWith('401'));
    const hasBank = accountNumbers.some(acc => acc.startsWith('512'));
    const hasCash = accountNumbers.some(acc => acc.startsWith('53'));
    const hasSale = accountNumbers.some(acc => acc.startsWith('707'));
    const hasPurchase = accountNumbers.some(acc => acc.startsWith('607'));

    // Règles de détermination automatique
    if (hasSale && hasClient) return JournalType.SALE;
    if (hasPurchase && hasSupplier) return JournalType.PURCHASE;
    if (hasBank) return JournalType.BANK;
    if (hasCash) return JournalType.CASH;

    return JournalType.MISCELLANEOUS;
  }

  /**
   * Récupère le template d'écriture pour un type de journal
   */
  static getJournalTemplate(journalType: JournalType) {
    return JOURNAL_ENTRY_TEMPLATES[journalType];
  }

  /**
   * Valide une écriture complète selon les règles comptables
   */
  static validateJournalEntry(entry: {
    lines: Array<{
      accountNumber: string;
      debitAmount: number;
      creditAmount: number;
    }>;
  }): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Vérifier l'équilibre débit/crédit
    let totalDebit = 0;
    let totalCredit = 0;

    entry.lines.forEach(line => {
      totalDebit += line.debitAmount;
      totalCredit += line.creditAmount;
    });

    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) {
      errors.push(
        `L'écriture n'est pas équilibrée: Débit ${totalDebit.toFixed(2)}€ ≠ Crédit ${totalCredit.toFixed(2)}€ (différence: ${difference.toFixed(2)}€)`
      );
    }

    // 2. Minimum 2 lignes requises
    if (entry.lines.length < 2) {
      errors.push('Une écriture comptable doit comporter au moins 2 lignes');
    }

    // 3. Valider chaque ligne
    entry.lines.forEach((line, index) => {
      const validation = this.validateAccountSide(
        line.accountNumber,
        line.debitAmount,
        line.creditAmount
      );

      if (!validation.valid) {
        errors.push(`Ligne ${index + 1} (${line.accountNumber}): ${validation.warning}`);
      } else if (validation.warning) {
        warnings.push(`Ligne ${index + 1} (${line.accountNumber}): ${validation.warning}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Récupère les informations d'un compte
   */
  static async getAccountInfo(companyId: string, accountId: string) {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', accountId)
        .single();

      if (error) throw error;

      return {
        ...data,
        nature: this.getAccountNature(data.account_number || ''),
        class: this.getAccountClass(data.account_number || ''),
      };
    } catch (error) {
      console.error('Error fetching account info:', error);
      return null;
    }
  }
}

export default AccountingRulesService;
