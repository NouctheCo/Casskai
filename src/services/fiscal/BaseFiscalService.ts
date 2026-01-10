/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 *
 * Service de base pour la génération de documents fiscaux africains
 * Classe abstraite partagée par SYSCOHADA, IFRS et SCF
 */

import { supabase } from '../../lib/supabase';
import type {
  FiscalStandard,
  FiscalDeclaration,
  AccountBalance,
  CountryConfig,
  ValidationResult
} from '../../types/fiscal.types';

export abstract class BaseFiscalService {
  protected standard: FiscalStandard;
  protected countryConfigs: Map<string, CountryConfig> = new Map();

  constructor(standard: FiscalStandard) {
    this.standard = standard;
  }

  /**
   * Récupère les soldes des comptes pour une période donnée
   */
  protected async getAccountBalances(
    companyId: string,
    accountNumbers: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, AccountBalance>> {
    const balances = new Map<string, AccountBalance>();

    try {
      // Récupérer les écritures comptables pour la période
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          date,
          journal_entry_lines (
            account_number,
            debit,
            credit
          )
        `)
        .eq('company_id', companyId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) throw error;

      // Calculer les soldes par compte
      for (const entry of entries || []) {
        for (const line of entry.journal_entry_lines || []) {
          const accountNumber = line.account_number;

          if (!accountNumbers.includes(accountNumber)) continue;

          if (!balances.has(accountNumber)) {
            balances.set(accountNumber, { debit: 0, credit: 0, balance: 0 });
          }

          const balance = balances.get(accountNumber)!;
          balance.debit += line.debit || 0;
          balance.credit += line.credit || 0;
          balance.balance = balance.debit - balance.credit;
        }
      }

      return balances;
    } catch (error) {
      console.error('[BaseFiscalService] Error getting account balances:', error);
      throw error;
    }
  }

  /**
   * Somme les soldes de tous les comptes commençant par un préfixe
   * Exemple: sumAccountPrefix('411', balances) -> Total des créances clients
   */
  protected sumAccountPrefix(
    prefix: string,
    balances: Map<string, AccountBalance>,
    useDebit: boolean = true
  ): number {
    let sum = 0;

    for (const [accountNumber, balance] of balances.entries()) {
      if (accountNumber.startsWith(prefix)) {
        sum += useDebit ? balance.debit : balance.credit;
      }
    }

    return sum;
  }

  /**
   * Somme les soldes d'une plage de comptes
   * Exemple: sumAccountRange('6', '7', balances) -> Total produits et charges
   */
  protected sumAccountRange(
    startClass: string,
    endClass: string,
    balances: Map<string, AccountBalance>,
    useDebit: boolean = true
  ): number {
    let sum = 0;

    for (const [accountNumber, balance] of balances.entries()) {
      const firstChar = accountNumber.charAt(0);
      if (firstChar >= startClass && firstChar <= endClass) {
        sum += useDebit ? balance.debit : balance.credit;
      }
    }

    return sum;
  }

  /**
   * Somme les soldes d'une liste spécifique de comptes
   */
  protected sumAccounts(
    accountNumbers: string[],
    balances: Map<string, AccountBalance>,
    useDebit: boolean = true
  ): number {
    let sum = 0;

    for (const accountNumber of accountNumbers) {
      const balance = balances.get(accountNumber);
      if (balance) {
        sum += useDebit ? balance.debit : balance.credit;
      }
    }

    return sum;
  }

  /**
   * Récupère les soldes d'une classe comptable entière
   * Exemple: getClassBalance('2', balances) -> Total actifs immobilisés
   */
  protected getClassBalance(
    classNumber: string,
    balances: Map<string, AccountBalance>,
    useDebit: boolean = true
  ): number {
    let sum = 0;

    for (const [accountNumber, balance] of balances.entries()) {
      if (accountNumber.startsWith(classNumber)) {
        sum += useDebit ? balance.debit : balance.credit;
      }
    }

    return sum;
  }

  /**
   * Valide qu'une déclaration respecte l'équation comptable de base
   */
  protected validateBalanceEquation(
    assets: number,
    liabilities: number,
    equity: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const difference = Math.abs(assets - (liabilities + equity));
    const tolerance = 0.01; // Tolérance de 1 centime pour les arrondis

    if (difference > tolerance) {
      errors.push(
        `Équation comptable non respectée: Actifs (${assets}) ≠ Passifs (${liabilities}) + Capitaux propres (${equity}). Différence: ${difference.toFixed(2)}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valide qu'un compte de résultat est équilibré
   */
  protected validateIncomeStatement(
    revenue: number,
    expenses: number,
    netIncome: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const calculatedNetIncome = revenue - expenses;
    const difference = Math.abs(calculatedNetIncome - netIncome);
    const tolerance = 0.01;

    if (difference > tolerance) {
      errors.push(
        `Résultat net incorrect: Calculé (${calculatedNetIncome.toFixed(2)}) ≠ Déclaré (${netIncome.toFixed(2)}). Différence: ${difference.toFixed(2)}`
      );
    }

    if (netIncome < 0) {
      warnings.push('La société affiche une perte pour l\'exercice.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Enregistre une déclaration fiscale dans la base de données
   */
  protected async saveFiscalDeclaration(
    declaration: Omit<FiscalDeclaration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('fiscal_declarations')
        .insert({
          type: declaration.type,
          standard: declaration.standard,
          country: declaration.country,
          period: declaration.period,
          due_date: declaration.dueDate.toISOString(),
          status: declaration.status,
          company_id: declaration.companyId,
          data: declaration.data,
          validation_errors: declaration.validationErrors,
          warnings: declaration.warnings,
          filed_at: declaration.filedAt?.toISOString(),
          filed_by: declaration.filedBy,
          acceptance_date: declaration.acceptanceDate?.toISOString(),
          reference_number: declaration.referenceNumber
        })
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('[BaseFiscalService] Error saving fiscal declaration:', error);
      throw error;
    }
  }

  /**
   * Récupère une déclaration fiscale par ID
   */
  protected async getFiscalDeclaration(id: string): Promise<FiscalDeclaration | null> {
    try {
      const { data, error } = await supabase
        .from('fiscal_declarations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        type: data.type,
        standard: data.standard as FiscalStandard,
        country: data.country,
        period: data.period,
        dueDate: new Date(data.due_date),
        status: data.status,
        companyId: data.company_id,
        data: data.data,
        validationErrors: data.validation_errors || [],
        warnings: data.warnings || [],
        filedAt: data.filed_at ? new Date(data.filed_at) : undefined,
        filedBy: data.filed_by,
        acceptanceDate: data.acceptance_date ? new Date(data.acceptance_date) : undefined,
        referenceNumber: data.reference_number,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('[BaseFiscalService] Error getting fiscal declaration:', error);
      throw error;
    }
  }

  /**
   * Liste toutes les déclarations pour une entreprise
   */
  protected async listFiscalDeclarations(
    companyId: string,
    filters?: {
      type?: string;
      country?: string;
      status?: string;
      year?: number;
    }
  ): Promise<FiscalDeclaration[]> {
    try {
      let query = supabase
        .from('fiscal_declarations')
        .select('*')
        .eq('company_id', companyId)
        .order('due_date', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.country) {
        query = query.eq('country', filters.country);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.year) {
        query = query.like('period', `${filters.year}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(d => ({
        id: d.id,
        type: d.type,
        standard: d.standard as FiscalStandard,
        country: d.country,
        period: d.period,
        dueDate: new Date(d.due_date),
        status: d.status,
        companyId: d.company_id,
        data: d.data,
        validationErrors: d.validation_errors || [],
        warnings: d.warnings || [],
        filedAt: d.filed_at ? new Date(d.filed_at) : undefined,
        filedBy: d.filed_by,
        acceptanceDate: d.acceptance_date ? new Date(d.acceptance_date) : undefined,
        referenceNumber: d.reference_number,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at)
      }));
    } catch (error) {
      console.error('[BaseFiscalService] Error listing fiscal declarations:', error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'une déclaration
   */
  protected async updateDeclarationStatus(
    id: string,
    status: FiscalDeclaration['status'],
    metadata?: {
      filedAt?: Date;
      filedBy?: string;
      acceptanceDate?: Date;
      referenceNumber?: string;
    }
  ): Promise<void> {
    try {
      const updates: any = { status };

      if (metadata?.filedAt) {
        updates.filed_at = metadata.filedAt.toISOString();
      }
      if (metadata?.filedBy) {
        updates.filed_by = metadata.filedBy;
      }
      if (metadata?.acceptanceDate) {
        updates.acceptance_date = metadata.acceptanceDate.toISOString();
      }
      if (metadata?.referenceNumber) {
        updates.reference_number = metadata.referenceNumber;
      }

      const { error } = await supabase
        .from('fiscal_declarations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[BaseFiscalService] Error updating declaration status:', error);
      throw error;
    }
  }

  /**
   * Calcule le total d'une classe en tenant compte du sens du solde
   * Classes d'actif et charges: solde débiteur (debit - credit)
   * Classes de passif et produits: solde créditeur (credit - debit)
   */
  protected getClassBalanceWithDirection(
    classNumber: string,
    balances: Map<string, AccountBalance>,
    isDebitClass: boolean
  ): number {
    let sum = 0;

    for (const [accountNumber, balance] of balances.entries()) {
      if (accountNumber.startsWith(classNumber)) {
        sum += isDebitClass ? balance.balance : -balance.balance;
      }
    }

    return sum;
  }

  /**
   * Formate un montant pour affichage
   */
  protected formatAmount(amount: number, currency: string = 'XOF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Récupère la configuration pays
   */
  protected getCountryConfig(countryCode: string): CountryConfig | undefined {
    return this.countryConfigs.get(countryCode);
  }

  /**
   * Méthodes abstraites à implémenter par les services spécialisés
   */
  abstract generateBalanceSheet(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration>;

  abstract generateIncomeStatement(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration>;

  abstract generateVATDeclaration(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration>;

  abstract generateCorporateTaxDeclaration(
    companyId: string,
    period: string,
    country: string
  ): Promise<FiscalDeclaration>;
}
