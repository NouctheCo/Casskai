/* eslint-disable max-lines */
import { supabase } from '../lib/supabase';

// Types utilitaires pour éviter les `any`
// —

export type VATEntryItem = {
  accountId: string;
  accountNumber: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  vatRate: number;
};

type RawVATEntry = {
  debit_amount: number | null;
  credit_amount: number | null;
  description: string | null;
  journal_entries: { date: string; reference: string; description?: string | null } | null;
  accounts: { number: string; name: string; type?: string | null } | null;
};

type VATDeclarationEntry = {
  date: string;
  reference: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
  vatRate?: number;
};

type CollectedTotals = { standard: number; reduced: number; superReduced: number; special: number; total: number };
type DeductibleTotals = { goods: number; services: number; immobilizations: number; total: number };

export type VATDeclarationSummary = {
  period: { start: string; end: string };
  regime: string;
  collected: CollectedTotals;
  deductible: DeductibleTotals;
  balance: { tvadue: number; credit: number; toPay: number };
  entries: VATDeclarationEntry[];
};

type JournalPostItem = { accountId: string; debitAmount: number; creditAmount: number; description: string };
export type VATJournalPost = {
  companyId: string;
  journalId: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string;
  status: 'draft' | 'posted' | 'void';
  items: JournalPostItem[];
};

/**
 * Service de calcul TVA multi-taux avec régimes spéciaux
 */
export class VATCalculationService {

  /**
   * Taux de TVA français standards (2024)
   */
  private static readonly FRENCH_VAT_RATES = {
    standard: 0.20,      // Taux normal
    reduced: 0.10,       // Taux réduit
    super_reduced: 0.055, // Taux super réduit
    special: 0.021,      // Taux particulier (médicaments)
    zero: 0.0,          // Exonération
    corsica_standard: 0.20,    // Corse taux normal
    corsica_reduced: 0.10,     // Corse taux réduit
    corsica_super_reduced: 0.021, // Corse taux super réduit
  };

  /**
   * Régimes de TVA
   */
  private static readonly VAT_REGIMES = {
    normal: 'Régime normal',
    simplified: 'Régime simplifié',
    mini: 'Régime micro',
    franchise: 'Franchise en base',
    agriculture: 'Régime agricole',
  };

  /**
   * Comptes de TVA par type
   */
  private static readonly VAT_ACCOUNTS = {
    collected: {
      standard: '445711',    // TVA collectée 20%
      reduced: '445712',     // TVA collectée 10%
      super_reduced: '445713', // TVA collectée 5,5%
      special: '445714',     // TVA collectée 2,1%
    },
    deductible: {
      goods: '445621',       // TVA déductible sur biens
      services: '445626',    // TVA déductible sur services
      immobilizations: '445641', // TVA déductible sur immobilisations
    },
    due: '445511',          // TVA due
    credit: '445512',       // Crédit de TVA
    regularization: '445800' // Régularisation TVA
  };

  /**
   * Calcule la TVA pour un montant donné
   */
  static calculateVAT(params: {
    amountHT: number;
    vatRate: number;
    regime?: string;
    territory?: string;
    activityCode?: string;
    isDeductible?: boolean;
  }): {
    amountHT: number;
    vatAmount: number;
    amountTTC: number;
    effectiveRate: number;
    applicableRegime: string;
    accounts: {
      vatAccount: string;
      vatAccountName: string;
    };
  } {
    const { amountHT, vatRate, regime = 'normal', territory = 'metropole', activityCode, isDeductible = false } = params;

    // Application des régimes spéciaux
    const regimeAdjustment = this.applyRegimeAdjustments(vatRate, regime, amountHT, activityCode);
    const effectiveRate = regimeAdjustment.effectiveRate;
    
    // Calcul territorial (Corse, DOM-TOM)
    const territorialRate = this.applyTerritorialAdjustments(effectiveRate, territory);

    // Calculs
    const vatAmount = Math.round(amountHT * territorialRate * 100) / 100;
    const amountTTC = amountHT + vatAmount;

    // Détermination du compte de TVA
    const accounts = this.getVATAccounts(territorialRate, isDeductible);

    return {
      amountHT,
      vatAmount,
      amountTTC,
      effectiveRate: territorialRate,
      applicableRegime: regimeAdjustment.regime,
      accounts
    };
  }

  /**
   * Application des ajustements selon le régime
   */
  private static applyRegimeAdjustments(
    baseRate: number,
    regime: string,
    amount: number,
    activityCode?: string
  ): { effectiveRate: number; regime: string } {
    switch (regime) {
      case 'franchise':
        return { effectiveRate: 0, regime: 'Franchise en base de TVA' };

      case 'mini':
        {
          // Seuils 2024 pour micro-entreprises
          const microThreshold = activityCode?.startsWith('62') ? 77700 : 188700; // Services vs Ventes
          return { 
            effectiveRate: amount > microThreshold ? baseRate : 0, 
            regime: amount > microThreshold ? 'Régime normal (dépassement seuil micro)' : 'Régime micro-entrepreneur'
          };
        }

      case 'simplified':
        return { effectiveRate: baseRate, regime: 'Régime réel simplifié' };

      case 'agriculture':
        {
          // Régime forfaitaire agricole
          const agricultureRate = this.getAgricultureVATRate(baseRate);
          return { effectiveRate: agricultureRate, regime: 'Régime agricole forfaitaire' };
        }

      case 'normal':
      default:
        return { effectiveRate: baseRate, regime: 'Régime normal' };
    }
  }

  /**
   * Taux TVA spécifiques au secteur agricole
   */
  private static getAgricultureVATRate(baseRate: number): number {
    // Le régime agricole a des taux particuliers
    if (baseRate === this.FRENCH_VAT_RATES.standard) return 0.04; // Forfait 4%
    if (baseRate === this.FRENCH_VAT_RATES.reduced) return 0.025;  // Forfait 2,5%
    return baseRate;
  }

  /**
   * Ajustements territoriaux (Corse, DOM-TOM)
   */
  private static applyTerritorialAdjustments(rate: number, territory: string): number {
    switch (territory.toLowerCase()) {
      case 'corse':
        // Corse : taux réduits spécifiques
        if (rate === this.FRENCH_VAT_RATES.standard) return this.FRENCH_VAT_RATES.corsica_standard;
        if (rate === this.FRENCH_VAT_RATES.reduced) return this.FRENCH_VAT_RATES.corsica_reduced;
        if (rate === this.FRENCH_VAT_RATES.super_reduced) return this.FRENCH_VAT_RATES.corsica_super_reduced;
        return rate;

      case 'guadeloupe':
      case 'martinique':
      case 'guyane':
      case 'reunion':
      case 'mayotte':
        // DOM : taux spécifiques selon le territoire
        return this.getDOMVATRate(rate, territory);

      case 'metropole':
      default:
        return rate;
    }
  }

  /**
   * Taux TVA DOM-TOM
   */
  private static getDOMVATRate(baseRate: number, territory: string): number {
    const domRates: Record<string, Record<number, number>> = {
      'guadeloupe': {
        [this.FRENCH_VAT_RATES.standard]: 0.085,
        [this.FRENCH_VAT_RATES.reduced]: 0.085,
        [this.FRENCH_VAT_RATES.super_reduced]: 0.021,
      },
      'martinique': {
        [this.FRENCH_VAT_RATES.standard]: 0.085,
        [this.FRENCH_VAT_RATES.reduced]: 0.085,
        [this.FRENCH_VAT_RATES.super_reduced]: 0.021,
      },
      'guyane': {
        [this.FRENCH_VAT_RATES.standard]: 0.0, // Exonération
        [this.FRENCH_VAT_RATES.reduced]: 0.0,
        [this.FRENCH_VAT_RATES.super_reduced]: 0.0,
      },
      'reunion': {
        [this.FRENCH_VAT_RATES.standard]: 0.085,
        [this.FRENCH_VAT_RATES.reduced]: 0.021,
        [this.FRENCH_VAT_RATES.super_reduced]: 0.021,
      },
      'mayotte': {
        [this.FRENCH_VAT_RATES.standard]: 0.0, // Progressivement aligné
        [this.FRENCH_VAT_RATES.reduced]: 0.0,
        [this.FRENCH_VAT_RATES.super_reduced]: 0.0,
      }
    };

    return domRates[territory]?.[baseRate] ?? baseRate;
  }

  /**
   * Détermine les comptes de TVA appropriés
   */
  private static getVATAccounts(rate: number, isDeductible: boolean): {
    vatAccount: string;
    vatAccountName: string;
  } {
    if (isDeductible) {
      return {
        vatAccount: this.VAT_ACCOUNTS.deductible.goods,
        vatAccountName: 'TVA déductible sur biens et services'
      };
    }

    // TVA collectée selon le taux
    let vatAccount: string;
    let vatAccountName: string;

    if (rate === this.FRENCH_VAT_RATES.standard || rate === this.FRENCH_VAT_RATES.corsica_standard) {
      vatAccount = this.VAT_ACCOUNTS.collected.standard;
      vatAccountName = 'TVA collectée 20%';
    } else if (rate === this.FRENCH_VAT_RATES.reduced || rate === this.FRENCH_VAT_RATES.corsica_reduced) {
      vatAccount = this.VAT_ACCOUNTS.collected.reduced;
      vatAccountName = 'TVA collectée 10%';
    } else if (rate === this.FRENCH_VAT_RATES.super_reduced || rate === this.FRENCH_VAT_RATES.corsica_super_reduced) {
      vatAccount = this.VAT_ACCOUNTS.collected.super_reduced;
      vatAccountName = 'TVA collectée 5,5%';
    } else if (rate === this.FRENCH_VAT_RATES.special) {
      vatAccount = this.VAT_ACCOUNTS.collected.special;
      vatAccountName = 'TVA collectée 2,1%';
    } else {
      vatAccount = this.VAT_ACCOUNTS.collected.standard;
      vatAccountName = `TVA collectée ${(rate * 100).toFixed(1)}%`;
    }

    return { vatAccount, vatAccountName };
  }

  /**
   * Génère les écritures de TVA pour une facture
   */
  static async generateVATEntries(params: {
    companyId: string;
    invoiceLines: Array<{
      amountHT: number;
      vatRate: number;
      productType?: string;
      isDeductible?: boolean;
    }>;
    regime?: string;
    territory?: string;
  }): Promise<Array<{
    accountId: string;
    accountNumber: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
    description: string;
    vatRate: number;
  }>> {
    const { companyId, invoiceLines, regime = 'normal', territory = 'metropole' } = params;
    // Regroupement par taux de TVA
    const vatGroups = new Map<number, { totalHT: number; isDeductible: boolean }>();

    invoiceLines.forEach(line => {
      const key = line.vatRate;
      const existing = vatGroups.get(key) || { totalHT: 0, isDeductible: line.isDeductible || false };
      existing.totalHT += line.amountHT;
      vatGroups.set(key, existing);
    });

    // Génération des écritures par groupe sans `await` dans la boucle
    const entries = await Promise.all(
      Array.from(vatGroups.entries()).map(async ([vatRate, group]) => {
        if (vatRate === 0) return null; // Pas d'écriture pour taux zéro

        const vatCalc = this.calculateVAT({
          amountHT: group.totalHT,
          vatRate,
          regime,
          territory,
          isDeductible: group.isDeductible
        });

        if (vatCalc.vatAmount > 0) {
          // Récupération du compte TVA
          const vatAccount = await this.getOrCreateVATAccount(
            companyId,
            vatCalc.accounts.vatAccount,
            vatCalc.accounts.vatAccountName
          );

          const item: VATEntryItem = {
            accountId: vatAccount.id,
            accountNumber: vatAccount.number,
            accountName: vatAccount.name,
            debitAmount: group.isDeductible ? vatCalc.vatAmount : 0,
            creditAmount: group.isDeductible ? 0 : vatCalc.vatAmount,
            description: `${vatCalc.accounts.vatAccountName} (${(vatCalc.effectiveRate * 100).toFixed(1)}%)`,
            vatRate: vatCalc.effectiveRate
          };
          return item;
        }
        return null;
      })
    );

    return entries.filter((e): e is VATEntryItem => e !== null);
  }

  /**
   * Récupère ou crée un compte de TVA
   */
  private static async getOrCreateVATAccount(
    companyId: string,
    accountNumber: string,
    accountName: string
  ): Promise<{ id: string; number: string; name: string }> {
    // Recherche du compte existant
    const account = await supabase
      .from('accounts')
      .select('id, number, name')
      .eq('company_id', companyId)
      .eq('number', accountNumber)
      .single();

    if (account.data) {
      return account.data;
    }

    // Création du compte s'il n'existe pas
    const newAccount = await supabase
      .from('accounts')
      .insert({
        company_id: companyId,
        number: accountNumber,
        name: accountName,
        type: accountNumber.startsWith('4456') ? 'LIABILITY' : 'ASSET',
        class: '4',
        is_active: true
      })
      .select('id, number, name')
      .single();

    if (newAccount.error) {
      throw new Error(`Impossible de créer le compte TVA ${accountNumber}: ${newAccount.error.message}`);
    }

    return newAccount.data;
  }

  /**
   * Calcul de la déclaration TVA périodique
   */
  static async calculateVATDeclaration(params: {
    companyId: string;
    startDate: string;
    endDate: string;
    regime?: string;
  }): Promise<VATDeclarationSummary> {
    const { companyId, startDate, endDate, regime = 'normal' } = params;
    const data = await this.fetchPeriodVATEntries(companyId, startDate, endDate);
    const { collected, deductible, entries } = this.classifyVATEntries(data);

    const tvadue = collected.total;
    const credit = deductible.total;
    const toPay = Math.max(0, tvadue - credit);
    const toRecover = Math.max(0, credit - tvadue);

    return {
      period: { start: startDate, end: endDate },
      regime,
      collected,
      deductible,
      balance: {
        tvadue,
        credit,
        toPay: toPay > 0 ? toPay : -toRecover
      },
      entries
    };
  }

  // Récupération des écritures TVA pour la période
  private static async fetchPeriodVATEntries(companyId: string, startDate: string, endDate: string): Promise<RawVATEntry[]> {
    const vatEntries = await supabase
      .from('journal_entry_items')
      .select(`
        debit_amount,
        credit_amount,
        description,
        journal_entries (date, reference, description),
        accounts (number, name, type)
      `)
      .eq('journal_entries.company_id', companyId)
      .gte('journal_entries.date', startDate)
      .lte('journal_entries.date', endDate)
      .like('accounts.number', '445%')
      .order('journal_entries.date');

    if (!vatEntries.data) {
      throw new Error('Erreur lors de la récupération des écritures TVA');
    }
    const raw = vatEntries.data as unknown as Array<{
      debit_amount: number | null;
      credit_amount: number | null;
      description: string | null;
      journal_entries: unknown;
      accounts: unknown;
    }>;
    const normalized: RawVATEntry[] = raw.map((e) => {
      const je = this.asSingle<{ date: string; reference: string; description?: string | null }>(e.journal_entries);
      const acc = this.asSingle<{ number: string; name: string; type?: string | null }>(e.accounts);
      return {
        debit_amount: e.debit_amount ?? 0,
        credit_amount: e.credit_amount ?? 0,
        description: e.description ?? null,
        journal_entries: je ?? null,
        accounts: acc ?? null,
      };
    });
    return normalized;
  }

  // Normalise un champ potentiellement tableau -> premier élément
  private static asSingle<T>(value: unknown): T | null {
    if (Array.isArray(value)) {
      return (value[0] as T) ?? null;
    }
    return (value as T) ?? null;
  }

  // Classe et synthétise les écritures TVA
  private static classifyVATEntries(data: RawVATEntry[]): { collected: CollectedTotals; deductible: DeductibleTotals; entries: VATDeclarationEntry[] } {
    const collected: CollectedTotals = { standard: 0, reduced: 0, superReduced: 0, special: 0, total: 0 };
    const deductible: DeductibleTotals = { goods: 0, services: 0, immobilizations: 0, total: 0 };
    const entries: VATDeclarationEntry[] = [];

    data.forEach((entry) => {
      const accountNumber = entry.accounts?.number ?? '';
      const debit = entry.debit_amount || 0;
      const credit = entry.credit_amount || 0;

      if (entry.journal_entries && entry.accounts) {
        entries.push({
          date: entry.journal_entries.date,
          reference: entry.journal_entries.reference,
          accountNumber,
          accountName: entry.accounts.name,
          debit,
          credit,
          vatRate: this.extractVATRateFromDescription(entry.description || '')
        });
      }

      // Classification TVA
      this.updateCollectedTotals(collected, accountNumber, credit);
      this.updateDeductibleTotals(deductible, accountNumber, debit);
    });

    return { collected, deductible, entries };
  }

  private static updateCollectedTotals(collected: CollectedTotals, accountNumber: string, credit: number): void {
    if (!accountNumber.startsWith('44571')) return;
    if (accountNumber === '445711') collected.standard += credit;
    else if (accountNumber === '445712') collected.reduced += credit;
    else if (accountNumber === '445713') collected.superReduced += credit;
    else if (accountNumber === '445714') collected.special += credit;
    collected.total += credit;
  }

  private static updateDeductibleTotals(deductible: DeductibleTotals, accountNumber: string, debit: number): void {
    if (!accountNumber.startsWith('44562')) return;
    if (accountNumber === '445621') deductible.goods += debit;
    else if (accountNumber === '445626') deductible.services += debit;
    else if (accountNumber === '445641') deductible.immobilizations += debit;
    deductible.total += debit;
  }

  /**
   * Extraction du taux de TVA depuis la description
   */
  private static extractVATRateFromDescription(description: string): number | undefined {
  const match = description.match(/(\d+(?:[.,]\d+)?)%/);
    if (match) {
      return parseFloat(match[1].replace(',', '.')) / 100;
    }
    return undefined;
  }

  /**
   * Génère l'écriture de déclaration TVA
   */
  static async generateVATDeclarationEntry(
    companyId: string,
    journalId: string,
    declaration: VATDeclarationSummary,
    paymentDate?: string
  ): Promise<VATJournalPost> {
    const entries: JournalPostItem[] = [];

    if (declaration.balance.toPay > 0) {
      // TVA à payer
      const tvaPayableAccount = await this.getOrCreateVATAccount(
        companyId, 
        this.VAT_ACCOUNTS.due, 
        'TVA due'
      );

      entries.push({
        accountId: tvaPayableAccount.id,
        debitAmount: declaration.balance.toPay,
        creditAmount: 0,
        description: `TVA due période ${declaration.period.start} au ${declaration.period.end}`
      });

      // Contrepartie selon le mode de paiement
      if (paymentDate) {
        const bankAccount = await supabase
          .from('accounts')
          .select('id')
          .eq('company_id', companyId)
          .eq('type', 'ASSET')
          .like('number', '512%') // Compte de banque
          .limit(1)
          .single();

        if (bankAccount.data) {
          entries.push({
            accountId: bankAccount.data.id,
            debitAmount: 0,
            creditAmount: declaration.balance.toPay,
            description: 'Paiement TVA'
          });
        }
      }
    } else if (declaration.balance.toPay < 0) {
      // Crédit de TVA
      const tvaCreditAccount = await this.getOrCreateVATAccount(
        companyId,
        this.VAT_ACCOUNTS.credit,
        'Crédit de TVA'
      );

      entries.push({
        accountId: tvaCreditAccount.id,
        debitAmount: Math.abs(declaration.balance.toPay),
        creditAmount: 0,
        description: `Crédit TVA période ${declaration.period.start} au ${declaration.period.end}`
      });
    }

    return {
      companyId,
      journalId,
      entryNumber: await this.generateVATEntryNumber(companyId, declaration.period.start),
      date: new Date().toISOString(),
      description: `Déclaration TVA ${declaration.period.start} - ${declaration.period.end}`,
      reference: `TVA-${declaration.period.start.slice(0, 7)}`,
      status: 'draft',
      items: entries
    };
  }

  /**
   * Génère un numéro d'écriture pour la TVA
   */
  private static async generateVATEntryNumber(companyId: string, periodStart: string): Promise<string> {
    const period = periodStart.slice(0, 7); // YYYY-MM
    
    const lastEntry = await supabase
      .from('journal_entries')
      .select('entry_number')
      .eq('company_id', companyId)
      .like('reference', `TVA-${period}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let sequence = 1;
    if (lastEntry.data?.entry_number) {
      const match = lastEntry.data.entry_number.match(/TVA-\d{4}-\d{2}-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    return `TVA-${period}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Validation du régime TVA d'une entreprise
   */
  static async validateCompanyVATRegime(companyId: string): Promise<{
    currentRegime: string;
    suggestedRegime: string;
    reasons: string[];
    thresholds: Record<string, number>;
  }> {
    // Récupération des données de l'entreprise
    const company = await supabase
      .from('companies')
      .select('vat_regime, activity_code, created_at')
      .eq('id', companyId)
      .single();

    if (!company.data) {
      throw new Error('Entreprise non trouvée');
    }

    // Calcul du CA annuel
    const yearStart = new Date();
    yearStart.setMonth(0, 1); // 1er janvier
    
    const revenue = await supabase
      .from('journal_entry_items')
      .select('credit_amount, accounts!inner(number)')
      .eq('journal_entries.company_id', companyId)
      .gte('journal_entries.date', yearStart.toISOString())
      .like('accounts.number', '7%') // Comptes de vente
      .single();

    const annualRevenue = revenue.data?.credit_amount || 0;

    // Seuils 2024
    const thresholds = {
      microServices: 77700,
      microGoods: 188700,
      simplifiedVAT: 818000,
    };

    const currentRegime = company.data.vat_regime || 'normal';
    const reasons: string[] = [];
    let suggestedRegime = currentRegime;

    // Logique de suggestion
    if (annualRevenue <= thresholds.microServices) {
      suggestedRegime = 'franchise';
      reasons.push(`CA ${annualRevenue}€ < seuil franchise ${thresholds.microServices}€`);
    } else if (annualRevenue <= thresholds.microGoods) {
      suggestedRegime = 'mini';
      reasons.push(`CA ${annualRevenue}€ éligible régime micro`);
    } else if (annualRevenue <= thresholds.simplifiedVAT) {
      suggestedRegime = 'simplified';
      reasons.push(`CA ${annualRevenue}€ éligible régime simplifié`);
    } else {
      suggestedRegime = 'normal';
      reasons.push(`CA ${annualRevenue}€ > seuil régime simplifié`);
    }

    return {
      currentRegime,
      suggestedRegime,
      reasons,
      thresholds
    };
  }
}
