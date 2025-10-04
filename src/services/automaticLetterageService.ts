import { LetterageRule, LetterageCriteria, LetterageMatch } from '../types/accounting-import.types';
import { supabase } from '../lib/supabase';

/**
 * Service de lettrage automatique des comptes
 */
export class AutomaticLetterageService {

  /**
   * Règles de lettrage prédéfinies
   */
  private static readonly DEFAULT_RULES: LetterageRule[] = [
    {
      id: 'clients_exact_amount',
      name: 'Clients - Montant exact',
      accountPattern: '411%',
      criteria: [
        { field: 'amount', exactMatch: true },
        { field: 'date', daysWindow: 60 }
      ],
      tolerance: 0.01,
      autoValidate: true
    },
    {
      id: 'suppliers_exact_amount',
      name: 'Fournisseurs - Montant exact',
      accountPattern: '401%',
      criteria: [
        { field: 'amount', exactMatch: true },
        { field: 'date', daysWindow: 90 }
      ],
      tolerance: 0.01,
      autoValidate: true
    },
    {
      id: 'clients_reference',
      name: 'Clients - Référence facture',
      accountPattern: '411%',
      criteria: [
        { field: 'reference', exactMatch: true },
        { field: 'amount', tolerance: 0.05 }
      ],
      tolerance: 0.01,
      autoValidate: false
    },
    {
      id: 'bank_reconciliation',
      name: 'Rapprochement bancaire',
      accountPattern: '512%',
      criteria: [
        { field: 'amount', exactMatch: true },
        { field: 'date', daysWindow: 5 }
      ],
      tolerance: 0.00,
      autoValidate: true
    }
  ];

  /**
   * Lance le lettrage automatique pour une entreprise
   */
  static async performAutoLetterage(
    companyId: string,
    accountPattern?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalProcessed: number;
    matched: number;
    lettered: number;
    results: Array<{
      ruleId: string;
      ruleName: string;
      matches: LetterageMatch[];
      autoValidated: number;
    }>;
  }> {
    const rules = await this.getLetterageRules(companyId);
    const filteredRules = accountPattern 
      ? rules.filter(rule => this.matchesPattern(rule.accountPattern, accountPattern))
      : rules;

    let totalProcessed = 0;
    let totalMatched = 0;
    let totalLettered = 0;
    const results: any[] = [];

    for (const rule of filteredRules) {
      console.log(`Processing rule: ${rule.name}`);
      
      const ruleResult = await this.processLetterageRule(
        companyId, 
        rule, 
        dateFrom, 
        dateTo
      );

      totalProcessed += ruleResult.processed;
      totalMatched += ruleResult.matches.length;
      totalLettered += ruleResult.autoValidated;

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matches: ruleResult.matches,
        autoValidated: ruleResult.autoValidated
      });
    }

    return {
      totalProcessed,
      matched: totalMatched,
      lettered: totalLettered,
      results
    };
  }

  /**
   * Traite une règle de lettrage spécifique
   */
  private static async processLetterageRule(
    companyId: string,
    rule: LetterageRule,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    processed: number;
    matches: LetterageMatch[];
    autoValidated: number;
  }> {
    // Récupération des écritures non lettrées pour ce pattern de compte
    const unlettered = await this.getUnletteredEntries(
      companyId, 
      rule.accountPattern, 
      dateFrom, 
      dateTo
    );

    if (unlettered.length === 0) {
      return { processed: 0, matches: [], autoValidated: 0 };
    }

    // Groupement par compte pour optimiser le traitement
    const entriesByAccount = this.groupEntriesByAccount(unlettered);
    const matches: LetterageMatch[] = [];
    let autoValidated = 0;

    for (const [accountId, entries] of entriesByAccount) {
      const accountMatches = await this.findMatchesForAccount(
        accountId, 
        entries, 
        rule
      );

      matches.push(...accountMatches);

      // Auto-validation si configurée
      if (rule.autoValidate) {
        for (const match of accountMatches) {
          if (match.confidence >= 0.9 && match.difference <= rule.tolerance) {
            await this.applyLetterage(match);
            autoValidated++;
          }
        }
      }
    }

    return {
      processed: unlettered.length,
      matches,
      autoValidated
    };
  }

  /**
   * Récupère les écritures non lettrées
   */
  private static async getUnletteredEntries(
    companyId: string,
    accountPattern: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Array<{
    id: string;
    accountId: string;
    accountNumber: string;
    date: string;
    reference: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    thirdParty?: string;
    entryId: string;
  }>> {
    let query = supabase
      .from('journal_entry_items')
      .select(`
        id,
        account_id,
        debit_amount,
        credit_amount,
        description,
        auxiliary_account,
        letterage,
        accounts!inner (id, number, name),
        journal_entries!inner (id, date, reference, description)
      `)
      .eq('journal_entries.company_id', companyId)
      .is('letterage', null) // Non lettrées
      .like('accounts.number', accountPattern.replace('%', '*'));

    if (dateFrom) query = query.gte('journal_entries.date', dateFrom);
    if (dateTo) query = query.lte('journal_entries.date', dateTo);

    const result = await query.order('journal_entries.date');

    if (!result.data) return [];

    return result.data.map(item => ({
      id: item.id,
      accountId: item.account_id,
      accountNumber: item.accounts.number,
      date: item.journal_entries.date,
      reference: item.journal_entries.reference || '',
      description: item.description || item.journal_entries.description || '',
      debitAmount: item.debit_amount || 0,
      creditAmount: item.credit_amount || 0,
      thirdParty: item.auxiliary_account,
      entryId: item.journal_entries.id
    }));
  }

  /**
   * Groupe les écritures par compte
   */
  private static groupEntriesByAccount(entries: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    entries.forEach(entry => {
      const accountId = entry.accountId;
      if (!groups.has(accountId)) {
        groups.set(accountId, []);
      }
      groups.get(accountId)!.push(entry);
    });

    return groups;
  }

  /**
   * Trouve les correspondances pour un compte donné
   */
  private static async findMatchesForAccount(
    accountId: string,
    entries: any[],
    rule: LetterageRule
  ): Promise<LetterageMatch[]> {
    const matches: LetterageMatch[] = [];

    // Séparation débit/crédit
    const debits = entries.filter(e => e.debitAmount > 0);
    const credits = entries.filter(e => e.creditAmount > 0);

    // Recherche de correspondances 1:1 (exact)
    const exactMatches = this.findExactMatches(debits, credits, rule);
    matches.push(...exactMatches);

    // Recherche de correspondances multiples (1:n, n:1, n:n)
    if (rule.criteria.some(c => !c.exactMatch)) {
      const multipleMatches = await this.findMultipleMatches(debits, credits, rule);
      matches.push(...multipleMatches);
    }

    return matches;
  }

  /**
   * Recherche de correspondances exactes 1:1
   */
  private static findExactMatches(
    debits: any[],
    credits: any[],
    rule: LetterageRule
  ): LetterageMatch[] {
    const matches: LetterageMatch[] = [];
    const usedCredits = new Set<string>();

    debits.forEach(debit => {
      credits.forEach(credit => {
        if (usedCredits.has(credit.id)) return;

        const match = this.evaluateMatch([debit], [credit], rule);
        if (match && match.confidence >= 0.8 && match.difference <= rule.tolerance) {
          matches.push(match);
          usedCredits.add(credit.id);
        }
      });
    });

    return matches;
  }

  /**
   * Recherche de correspondances multiples
   */
  private static async findMultipleMatches(
    debits: any[],
    credits: any[],
    rule: LetterageRule
  ): Promise<LetterageMatch[]> {
    const matches: LetterageMatch[] = [];

    // Correspondance n:1 (plusieurs débits pour un crédit)
    credits.forEach(credit => {
      const combinations = this.findDebitCombinations(debits, credit.creditAmount, rule.tolerance);
      combinations.forEach(combination => {
        const match = this.evaluateMatch(combination, [credit], rule);
        if (match && match.confidence >= 0.7) {
          matches.push(match);
        }
      });
    });

    // Correspondance 1:n (un débit pour plusieurs crédits)
    debits.forEach(debit => {
      const combinations = this.findCreditCombinations(credits, debit.debitAmount, rule.tolerance);
      combinations.forEach(combination => {
        const match = this.evaluateMatch([debit], combination, rule);
        if (match && match.confidence >= 0.7) {
          matches.push(match);
        }
      });
    });

    return matches;
  }

  /**
   * Trouve les combinaisons de débits qui correspondent à un montant
   */
  private static findDebitCombinations(
    debits: any[],
    targetAmount: number,
    tolerance: number
  ): any[][] {
    const combinations: any[][] = [];
    const maxItems = Math.min(debits.length, 5); // Limite pour éviter l'explosion combinatoire

    for (let size = 2; size <= maxItems; size++) {
      const combos = this.generateCombinations(debits, size);
      
      combos.forEach(combo => {
        const total = combo.reduce((sum, item) => sum + item.debitAmount, 0);
        if (Math.abs(total - targetAmount) <= tolerance) {
          combinations.push(combo);
        }
      });
    }

    return combinations;
  }

  /**
   * Trouve les combinaisons de crédits qui correspondent à un montant
   */
  private static findCreditCombinations(
    credits: any[],
    targetAmount: number,
    tolerance: number
  ): any[][] {
    const combinations: any[][] = [];
    const maxItems = Math.min(credits.length, 5);

    for (let size = 2; size <= maxItems; size++) {
      const combos = this.generateCombinations(credits, size);
      
      combos.forEach(combo => {
        const total = combo.reduce((sum, item) => sum + item.creditAmount, 0);
        if (Math.abs(total - targetAmount) <= tolerance) {
          combinations.push(combo);
        }
      });
    }

    return combinations;
  }

  /**
   * Génère les combinaisons d'éléments
   */
  private static generateCombinations<T>(arr: T[], size: number): T[][] {
    if (size > arr.length) return [];
    if (size === 1) return arr.map(item => [item]);

    const combinations: T[][] = [];
    
    for (let i = 0; i <= arr.length - size; i++) {
      const rest = this.generateCombinations(arr.slice(i + 1), size - 1);
      rest.forEach(combo => {
        combinations.push([arr[i], ...combo]);
      });
    }

    return combinations;
  }

  /**
   * Évalue une correspondance potentielle
   */
  private static evaluateMatch(
    debits: any[],
    credits: any[],
    rule: LetterageRule
  ): LetterageMatch | null {
    const totalDebit = debits.reduce((sum, item) => sum + item.debitAmount, 0);
    const totalCredit = credits.reduce((sum, item) => sum + item.creditAmount, 0);
    const difference = Math.abs(totalDebit - totalCredit);

    if (difference > rule.tolerance * 2) return null; // Écart trop important

    let confidence = 0;
    const maxPoints = rule.criteria.length;
    let points = 0;

    // Évaluation selon les critères
    rule.criteria.forEach(criterion => {
      switch (criterion.field) {
        case 'amount':
          if (criterion.exactMatch && difference <= rule.tolerance) {
            points += 1;
          } else if (criterion.tolerance && difference <= criterion.tolerance * Math.max(totalDebit, totalCredit)) {
            points += 0.8;
          }
          break;

        case 'date':
          const avgDateDiff = this.calculateAverageDateDifference(debits, credits);
          if (criterion.daysWindow && avgDateDiff <= criterion.daysWindow) {
            points += 1 - (avgDateDiff / criterion.daysWindow) * 0.5;
          }
          break;

        case 'reference':
          if (this.hasMatchingReference(debits, credits, criterion.exactMatch || false)) {
            points += 1;
          }
          break;

        case 'thirdParty':
          if (this.hasMatchingThirdParty(debits, credits)) {
            points += 1;
          }
          break;
      }
    });

    confidence = points / maxPoints;

    // Bonus pour correspondance exacte
    if (difference === 0) confidence += 0.1;

    // Malus pour correspondances multiples
    if (debits.length > 1 || credits.length > 1) confidence -= 0.1;

    return {
      debitEntries: debits.map(d => d.id),
      creditEntries: credits.map(c => c.id),
      difference,
      confidence: Math.min(1, Math.max(0, confidence)),
      letterCode: this.generateLetterCode()
    };
  }

  /**
   * Calcule la différence moyenne de dates
   */
  private static calculateAverageDateDifference(debits: any[], credits: any[]): number {
    if (debits.length === 0 || credits.length === 0) return Infinity;

    let totalDiff = 0;
    let count = 0;

    debits.forEach(debit => {
      credits.forEach(credit => {
        const debitDate = new Date(debit.date);
        const creditDate = new Date(credit.date);
        const diff = Math.abs(debitDate.getTime() - creditDate.getTime()) / (1000 * 60 * 60 * 24);
        totalDiff += diff;
        count++;
      });
    });

    return count > 0 ? totalDiff / count : Infinity;
  }

  /**
   * Vérifie s'il y a une référence commune
   */
  private static hasMatchingReference(debits: any[], credits: any[], exactMatch: boolean): boolean {
    for (const debit of debits) {
      for (const credit of credits) {
        if (exactMatch) {
          if (debit.reference && credit.reference && debit.reference === credit.reference) {
            return true;
          }
        } else {
          if (this.referencesMatch(debit.reference, credit.reference)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Vérifie si les références correspondent (recherche floue)
   */
  private static referencesMatch(ref1: string, ref2: string): boolean {
    if (!ref1 || !ref2) return false;
    
    const clean1 = ref1.replace(/[^\w]/g, '').toLowerCase();
    const clean2 = ref2.replace(/[^\w]/g, '').toLowerCase();
    
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    
    // Recherche de numéros communs
    const numbers1 = clean1.match(/\d{3,}/g) || [];
    const numbers2 = clean2.match(/\d{3,}/g) || [];
    
    return numbers1.some(n1 => numbers2.some(n2 => n1 === n2));
  }

  /**
   * Vérifie s'il y a un tiers commun
   */
  private static hasMatchingThirdParty(debits: any[], credits: any[]): boolean {
    for (const debit of debits) {
      for (const credit of credits) {
        if (debit.thirdParty && credit.thirdParty && debit.thirdParty === credit.thirdParty) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Génère un code de lettrage unique
   */
  private static generateLetterCode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${code}${numbers}`;
  }

  /**
   * Applique le lettrage à un match
   */
  private static async applyLetterage(match: LetterageMatch): Promise<void> {
    const allEntries = [...match.debitEntries, ...match.creditEntries];
    
    await supabase
      .from('journal_entry_items')
      .update({ letterage: match.letterCode })
      .in('id', allEntries);
  }

  /**
   * Récupère les règles de lettrage (par défaut + personnalisées)
   */
  private static async getLetterageRules(companyId: string): Promise<LetterageRule[]> {
    const customRules = await supabase
      .from('letterage_rules')
      .select('*')
      .eq('company_id', companyId);

    const rules = [...this.DEFAULT_RULES];
    
    if (customRules.data) {
      rules.push(...customRules.data.map(this.mapSupabaseToRule));
    }

    return rules;
  }

  /**
   * Mapping des données Supabase vers LetterageRule
   */
  private static mapSupabaseToRule(data: any): LetterageRule {
    return {
      id: data.id,
      name: data.name,
      accountPattern: data.account_pattern,
      criteria: data.criteria || [],
      tolerance: data.tolerance || 0.01,
      autoValidate: data.auto_validate || false
    };
  }

  /**
   * Vérifie si un pattern correspond
   */
  private static matchesPattern(pattern: string, account: string): boolean {
    const regex = new RegExp(`^${  pattern.replace('%', '.*')  }$`);
    return regex.test(account);
  }

  /**
   * Dé-lettrage manuel
   */
  static async unletter(companyId: string, letterCode: string): Promise<{
    success: boolean;
    unletteredCount: number;
  }> {
    const result = await supabase
      .from('journal_entry_items')
      .update({ letterage: null })
      .eq('letterage', letterCode)
      .eq('journal_entries.company_id', companyId)
      .select('id');

    return {
      success: !result.error,
      unletteredCount: result.data?.length || 0
    };
  }

  /**
   * Rapport de lettrage
   */
  static async getLetterageReport(
    companyId: string,
    accountPattern?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    summary: {
      totalEntries: number;
      letteredEntries: number;
      unletteredEntries: number;
      letterageRate: number;
    };
    byAccount: Array<{
      accountNumber: string;
      accountName: string;
      totalEntries: number;
      lettered: number;
      unlettered: number;
      rate: number;
    }>;
    recentLettering: Array<{
      letterCode: string;
      date: string;
      entriesCount: number;
      totalAmount: number;
    }>;
  }> {
    // Statistiques globales
    let query = supabase
      .from('journal_entry_items')
      .select(`
        id,
        letterage,
        debit_amount,
        credit_amount,
        accounts!inner (number, name),
        journal_entries!inner (date, company_id)
      `)
      .eq('journal_entries.company_id', companyId);

    if (accountPattern) {
      query = query.like('accounts.number', accountPattern.replace('%', '*'));
    }
    if (dateFrom) query = query.gte('journal_entries.date', dateFrom);
    if (dateTo) query = query.lte('journal_entries.date', dateTo);

    const result = await query;
    
    if (!result.data) {
      throw new Error('Erreur lors de la récupération des données');
    }

    const totalEntries = result.data.length;
    const letteredEntries = result.data.filter(item => item.letterage).length;
    const unletteredEntries = totalEntries - letteredEntries;
    const letterageRate = totalEntries > 0 ? (letteredEntries / totalEntries) * 100 : 0;

    // Statistiques par compte
    const accountStats = new Map<string, any>();
    
    result.data.forEach(item => {
      const key = `${item.accounts.number}|${item.accounts.name}`;
      if (!accountStats.has(key)) {
        accountStats.set(key, {
          accountNumber: item.accounts.number,
          accountName: item.accounts.name,
          totalEntries: 0,
          lettered: 0
        });
      }
      
      const stats = accountStats.get(key)!;
      stats.totalEntries++;
      if (item.letterage) stats.lettered++;
    });

    const byAccount = Array.from(accountStats.values()).map(stats => ({
      ...stats,
      unlettered: stats.totalEntries - stats.lettered,
      rate: stats.totalEntries > 0 ? (stats.lettered / stats.totalEntries) * 100 : 0
    }));

    // Lettrages récents
    const recentQuery = await supabase
      .from('journal_entry_items')
      .select(`
        letterage,
        debit_amount,
        credit_amount,
        journal_entries!inner (date, company_id)
      `)
      .eq('journal_entries.company_id', companyId)
      .not('letterage', 'is', null)
      .gte('journal_entries.date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('journal_entries.date', { ascending: false });

    const recentLettering: any[] = [];
    if (recentQuery.data) {
      const letterGroups = new Map<string, any>();
      
      recentQuery.data.forEach(item => {
        const key = item.letterage!;
        if (!letterGroups.has(key)) {
          letterGroups.set(key, {
            letterCode: key,
            date: item.journal_entries.date,
            entriesCount: 0,
            totalAmount: 0
          });
        }
        
        const group = letterGroups.get(key)!;
        group.entriesCount++;
        group.totalAmount += (item.debit_amount || 0) + (item.credit_amount || 0);
      });
      
      recentLettering.push(...Array.from(letterGroups.values()).slice(0, 10));
    }

    return {
      summary: {
        totalEntries,
        letteredEntries,
        unletteredEntries,
        letterageRate: Math.round(letterageRate * 100) / 100
      },
      byAccount,
      recentLettering
    };
  }
}