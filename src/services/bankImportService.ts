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
/**
 * Service d'importation des relevés bancaires
 * Supporte les formats CSV, OFX, QIF
 */
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
export interface BankTransaction {
  id?: string;
  bank_account_id: string;
  company_id: string;
  transaction_date: string;
  value_date?: string;
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  category?: string;
  is_reconciled: boolean;
  import_source?: 'csv' | 'ofx' | 'qif' | 'api';
  created_at?: string;
  updated_at?: string;
  status?: 'pending' | 'reconciled' | 'ignored';
  // AI suggestions
  ai_suggested_account?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
}
export interface BankAccount {
  id?: string;
  company_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  iban?: string;
  bic?: string;
  currency: string;
  balance: number;
  account_type: 'checking' | 'savings' | 'business' | 'other';
  status: 'active' | 'closed' | 'suspended';
  last_import?: string;
  created_at?: string;
  updated_at?: string;
}
export interface ImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  transactions: BankTransaction[];
  errors?: string[];
}
class BankImportService {
  /**
   * Importe un fichier CSV de relevé bancaire
   */
  async importCSV(file: File, accountId: string, companyId: string, mapping?: CSVMapping): Promise<ImportResult> {
    try {
      const companyCurrency = await this.getCompanyCurrency(companyId);
      const text = await file.text();
      const lines = text.split('\n');
      if (lines.length < 2) {
        return {
          success: false,
          message: 'Fichier CSV vide ou invalide',
          imported_count: 0,
          skipped_count: 0,
           error_count: 1,
          transactions: [],
          errors: ['Fichier CSV vide ou invalide']
        };
      }
      const headers = this.parseCSVLine(lines[0]);
      const dataLines = lines.slice(1).filter(line => line.trim());
      // Auto-détection du mapping si non fourni
      const finalMapping = mapping || this.detectCSVMapping(headers);
      const transactions: BankTransaction[] = [];
      const errors: string[] = [];
      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = this.parseCSVLine(dataLines[i]);
          if (values.length < headers.length / 2) continue; // Skip incomplete lines
          const transaction = this.parseCSVTransaction(values, finalMapping, accountId, companyId, companyCurrency);
          if (transaction) {
            transactions.push(transaction);
          }
        } catch (error: unknown) {
          errors.push(`Ligne ${i + 2}: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
        }
      }
      // Sauvegarde en base
      const saveResult = await this.saveTransactions(transactions);
      
      // Catégorisation IA automatique (async, ne bloque pas l'import)
      if (saveResult.success && saveResult.imported_count > 0) {
        this.categorizeWithAI(transactions, companyId).catch(err => {
          logger.error('BankImport', 'AI categorization failed (non-blocking):', err);
        });
      }

      const combinedErrors = [...errors, ...saveResult.errors];
      return {
        success: saveResult.success,
        message: saveResult.success 
          ? `${saveResult.imported_count} transactions importées avec succès`
          : 'Erreur lors de la sauvegarde',
        imported_count: saveResult.imported_count,
        skipped_count: saveResult.skipped_count,
        error_count: combinedErrors.length,
        transactions,
        errors: combinedErrors.length > 0 ? combinedErrors : undefined
      };
    } catch (error: unknown) {
      logger.error('BankImport', 'Erreur import CSV:', error);
      return {
        success: false,
        message: `Erreur lors de l'import: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`,
        imported_count: 0,
        skipped_count: 0,
        error_count: 1,
        transactions: [],
        errors: [(error instanceof Error ? error.message : 'Une erreur est survenue')]
      };
    }
  }
  /**
   * Importe un fichier OFX (Open Financial Exchange)
   */
  async importOFX(file: File, accountId: string, companyId: string): Promise<ImportResult> {
    try {
      const companyCurrency = await this.getCompanyCurrency(companyId);
      const text = await file.text();
      // Parse OFX format
      const transactions = await this.parseOFXTransactions(text, accountId, companyId, companyCurrency);
      if (transactions.length === 0) {
        return {
          success: false,
          message: 'Aucune transaction trouvée dans le fichier OFX',
          imported_count: 0,
          skipped_count: 0,
           error_count: 1,
          transactions: []
        };
      }
      const saveResult = await this.saveTransactions(transactions);
      return {
        success: saveResult.success,
        message: `${saveResult.imported_count} transactions OFX importées`,
        imported_count: saveResult.imported_count,
        skipped_count: saveResult.skipped_count,
        error_count: saveResult.errors.length,
        transactions,
        errors: saveResult.errors.length > 0 ? saveResult.errors : undefined
      };
    } catch (error: unknown) {
      logger.error('BankImport', 'Erreur import OFX:', error);
      return {
        success: false,
        message: `Erreur lors de l'import OFX: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`,
        imported_count: 0,
        skipped_count: 0,
        error_count: 1,
        transactions: []
      };
    }
  }
  /**
   * Importe un fichier QIF (Quicken Interchange Format)
   */
  async importQIF(file: File, accountId: string, companyId: string): Promise<ImportResult> {
    try {
      const companyCurrency = await this.getCompanyCurrency(companyId);
      const text = await file.text();
      const transactions = await this.parseQIFTransactions(text, accountId, companyId, companyCurrency);
      if (transactions.length === 0) {
        return {
          success: false,
          message: 'Aucune transaction trouvée dans le fichier QIF',
          imported_count: 0,
          skipped_count: 0,
          error_count: 1,
          transactions: []
        };
      }
      const saveResult = await this.saveTransactions(transactions);
      return {
        success: saveResult.success,
        message: `${saveResult.imported_count} transactions QIF importées`,
        imported_count: saveResult.imported_count,
        skipped_count: saveResult.skipped_count,
        error_count: saveResult.errors.length,
        transactions,
        errors: saveResult.errors.length > 0 ? saveResult.errors : undefined
      };
    } catch (error: unknown) {
      logger.error('BankImport', 'Erreur import QIF:', error);
      return {
        success: false,
        message: `Erreur lors de l'import QIF: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`,
        imported_count: 0,
        skipped_count: 0,
        error_count: 1,
        transactions: []
      };
    }
  }
  /**
   * Parse les transactions OFX
   */
  private async parseOFXTransactions(ofxContent: string, accountId: string, companyId: string, companyCurrency: string): Promise<BankTransaction[]> {
    const transactions: BankTransaction[] = [];
    // Simple regex parsing pour OFX (version simplifiée)
    const stmtTrnPattern = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
    const matches = ofxContent.match(stmtTrnPattern);
    if (!matches) return transactions;
    for (const match of matches) {
      try {
        const _trnType = this.extractOFXTag(match, 'TRNTYPE');
        const dtPosted = this.extractOFXTag(match, 'DTPOSTED');
        const trnAmt = this.extractOFXTag(match, 'TRNAMT');
        const fitId = this.extractOFXTag(match, 'FITID');
        const memo = this.extractOFXTag(match, 'MEMO') || this.extractOFXTag(match, 'NAME') || '';
        if (dtPosted && trnAmt) {
          const transaction: BankTransaction = {
            bank_account_id: accountId,
            company_id: companyId,
            transaction_date: this.parseOFXDate(dtPosted),
            amount: parseFloat(trnAmt),
            currency: companyCurrency,
            description: memo.trim(),
            reference: fitId || undefined,
            is_reconciled: false,
            import_source: 'ofx',
            status: 'pending'
          };
          transactions.push(transaction);
        }
      } catch (error: unknown) {
        logger.warn('BankImport', 'Erreur parsing transaction OFX:', error);
      }
    }
    return transactions;
  }
  private async parseQIFTransactions(qifContent: string, accountId: string, companyId: string, companyCurrency: string): Promise<BankTransaction[]> {
    const transactions: BankTransaction[] = [];
    // Normaliser les fins de lignes (gérer CRLF Windows et CR Mac)
    const content = qifContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = content.split('\n');
    let currentTransaction: Partial<BankTransaction> = {};
    let seenTypeHeader = false;
    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      // Sauter l'entête tant que !Type: n'est pas rencontré
      if (trimmed.startsWith('!')) {
        if (trimmed.startsWith('!Type:')) {
          seenTypeHeader = true;
        }
        continue;
      }
      if (!seenTypeHeader) {
        // Ignorer tout avant l'entête QIF
        continue;
      }
      const code = trimmed.charAt(0);
      const value = trimmed.substring(1).trim();
      switch (code) {
        case 'D': // Date
          try {
            currentTransaction.transaction_date = this.parseQIFDate(value);
          } catch (error) {
            logger.warn('BankImport', `Erreur parsing date QIF: ${value}`, error);
          }
          break;
        case 'T': // Amount
        case 'U': // Amount (alternative)
          try {
            const isParenNegative = /^\(.*\)$/.test(value);
            const numeric = value.replace(/\(|\)/g, '').replace(/[^\d.,-]/g, '').replace(',', '.');
            const amount = parseFloat(numeric);
            if (!isNaN(amount)) {
              currentTransaction.amount = isParenNegative ? -Math.abs(amount) : amount;
            }
          } catch (error) {
            logger.warn('BankImport', `Erreur parsing montant QIF: ${value}`, error);
          }
          break;
        case 'P': // Payee/Description
          currentTransaction.description = value || currentTransaction.description;
          break;
        case 'L': // Category (souvent le payee dans certains QIF)
          if (!currentTransaction.description) {
            currentTransaction.description = value;
          }
          break;
        case 'M': // Memo
          currentTransaction.description = currentTransaction.description 
            ? `${currentTransaction.description} - ${value}` 
            : value;
          break;
        case 'N': // Number/Reference
          currentTransaction.reference = value;
          break;
        case 'C': // Cleared status (ignoré)
          break;
        case '^': // Fin de transaction
          if (currentTransaction.transaction_date && currentTransaction.amount !== undefined) {
            transactions.push({
              bank_account_id: accountId,
              company_id: companyId,
              transaction_date: currentTransaction.transaction_date,
              amount: currentTransaction.amount!,
              currency: companyCurrency,
              description: (currentTransaction.description || 'Transaction sans description').trim(),
              reference: currentTransaction.reference,
              is_reconciled: false,
              import_source: 'qif',
              status: 'pending'
            } as BankTransaction);
          } else {
            logger.warn('BankImport', 'Transaction QIF incomplète (date ou montant manquant)', currentTransaction);
          }
          currentTransaction = {};
          break;
      }
    }
    // Flush potentiel si le fichier ne termine pas par '^'
    if (currentTransaction.transaction_date && currentTransaction.amount !== undefined) {
      transactions.push({
        bank_account_id: accountId,
        company_id: companyId,
        transaction_date: currentTransaction.transaction_date,
        amount: currentTransaction.amount!,
        currency: companyCurrency,
        description: (currentTransaction.description || 'Transaction sans description').trim(),
        reference: currentTransaction.reference,
        is_reconciled: false,
        import_source: 'qif',
        status: 'pending'
      } as BankTransaction);
    }
    return transactions;
  }
  /**
   * Sauvegarde les transactions en base
   */
  private async saveTransactions(transactions: BankTransaction[]): Promise<{success: boolean, imported_count: number, skipped_count: number, errors: string[]}> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    for (const transaction of transactions) {
      try {
        // Vérifier si la transaction existe déjà
        const { data: existing, error: checkError } = await supabase
          .from('bank_transactions')
          .select('id', { count: 'exact' })
          .eq('bank_account_id', transaction.bank_account_id)
          .eq('transaction_date', transaction.transaction_date)
          .eq('amount', transaction.amount)
          .eq('description', transaction.description);
        if (checkError) {
          logger.warn('BankImport', 'Erreur vérification doublons:', checkError);
          // Continuer même si la vérification échoue
        } else if (existing && existing.length > 0) {
          skipped++;
          continue;
        }
        const { error } = await supabase
          .from('bank_transactions')
          .insert([{
            bank_account_id: transaction.bank_account_id,
            company_id: transaction.company_id,
            transaction_date: transaction.transaction_date,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.description,
            ...(transaction.value_date ? { value_date: transaction.value_date } : {}),
            ...(transaction.reference ? { reference: transaction.reference } : {}),
            ...(transaction.category ? { category: transaction.category } : {}),
            is_reconciled: transaction.is_reconciled || false,
            import_source: transaction.import_source || 'csv',
            status: transaction.status || 'pending'
          }]);
        if (error) {
          logger.warn('BankImport', 'Erreur sauvegarde via client, tentative REST fallback:', error);
          try {
            const resp = await fetch(`${SUPABASE_URL}/rest/v1/bank_transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Prefer: 'return=representation'
              },
              body: JSON.stringify([{ 
                bank_account_id: transaction.bank_account_id,
                company_id: transaction.company_id,
                transaction_date: transaction.transaction_date,
                amount: transaction.amount,
                currency: transaction.currency,
                description: transaction.description,
                ...(transaction.value_date ? { value_date: transaction.value_date } : {}),
                ...(transaction.reference ? { reference: transaction.reference } : {}),
                ...(transaction.category ? { category: transaction.category } : {}),
                is_reconciled: transaction.is_reconciled || false,
                import_source: transaction.import_source || 'csv',
                status: transaction.status || 'pending'
              }])
            });
            if (!resp.ok) {
              const text = await resp.text();
              logger.error('BankImport', 'REST fallback insert failed', resp.status, text);
              errors.push(`REST insert failed: ${resp.status}`);
              continue;
            }
          } catch (fallbackErr) {
            logger.error('BankImport', 'Exception during REST fallback insert:', fallbackErr);
            errors.push('Exception during REST fallback');
            continue;
          }
        }
        imported++;
      } catch (error: unknown) {
        logger.error('BankImport', 'Erreur traitement transaction:', error);
      }
      }
    return {
      success: imported > 0,
      imported_count: imported,
      skipped_count: skipped,
      errors
    };
  }

  /**
   * Catégorise automatiquement les transactions avec l'IA
   * Appelle la Edge Function ai-bank-categorization
   */
  async categorizeWithAI(
    transactions: BankTransaction[],
    companyId: string
  ): Promise<BankTransaction[]> {
    try {
      if (transactions.length === 0) return transactions;

      logger.info('BankImport', `Categorizing ${transactions.length} transactions with AI...`);

      const { data, error } = await supabase.functions.invoke('ai-bank-categorization', {
        body: {
          transactions: transactions.map(t => ({
            description: t.description,
            amount: t.amount,
            date: t.transaction_date,
            reference: t.reference
          })),
          company_id: companyId
        }
      });

      if (error) {
        logger.error('BankImport', 'AI categorization failed:', error);
        return transactions; // Return original transactions without AI
      }

      if (!data || !data.categories) {
        logger.warn('BankImport', 'No categories returned from AI');
        return transactions;
      }

      // Merge AI suggestions with original transactions
      const categorized = transactions.map((t, index) => {
        const aiSuggestion = data.categories[index];
        if (!aiSuggestion) return t;

        return {
          ...t,
          category: aiSuggestion.category,
          ai_suggested_account: aiSuggestion.account_number,
          ai_confidence: aiSuggestion.confidence,
          ai_reasoning: aiSuggestion.reasoning
        };
      });

      logger.info('BankImport', `AI categorization complete. Avg confidence: ${
        data.categories.reduce((s: number, c: any) => s + c.confidence, 0) / data.categories.length
      }%`);

      return categorized;
    } catch (error) {
      logger.error('BankImport', 'AI categorization error:', error);
      return transactions; // Fallback to original transactions
    }
  }

  /**
   * Utilitaires de parsing
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
  private detectCSVMapping(headers: string[]): CSVMapping {
    const mapping: CSVMapping = {
      date: -1,
      amount: -1,
      description: -1,
      reference: -1
    };
    headers.forEach((header, index) => {
      const lower = header.toLowerCase();
      if (lower.includes('date') || lower.includes('jour')) {
        mapping.date = index;
      } else if (lower.includes('montant') || lower.includes('amount') || lower.includes('crédit') || lower.includes('débit')) {
        mapping.amount = index;
      } else if (lower.includes('libellé') || lower.includes('description') || lower.includes('memo')) {
        mapping.description = index;
      } else if (lower.includes('référence') || lower.includes('ref') || lower.includes('numéro')) {
        mapping.reference = index;
      }
    });
    return mapping;
  }
  private parseCSVTransaction(values: string[], mapping: CSVMapping, accountId: string, companyId: string, companyCurrency: string): BankTransaction | null {
    try {
      const dateStr = values[mapping.date]?.trim();
      const amountStr = values[mapping.amount]?.trim();
      const description = values[mapping.description]?.trim() || 'Transaction importée';
      const reference = mapping.reference >= 0 ? values[mapping.reference]?.trim() : undefined;
      if (!dateStr || !amountStr) return null;
      // Parse date (formats français courants)
      const date = this.parseDate(dateStr);
      if (!date) return null;
      // Parse amount
      const amount = parseFloat(amountStr.replace(',', '.').replace(/[^\d.-]/g, ''));
      if (isNaN(amount)) return null;
      return {
        bank_account_id: accountId,
        company_id: companyId,
        transaction_date: date,
        amount,
        currency: companyCurrency,
        description,
        reference,
        is_reconciled: false,
        import_source: 'csv',
        status: 'pending'
      };
    } catch (error: unknown) {
      throw new Error(`Erreur parsing transaction: ${(error instanceof Error ? error.message : 'Une erreur est survenue')}`);
    }
  }

  private async getCompanyCurrency(companyId: string): Promise<string> {
    try {
      const { data } = await supabase
        .from('companies')
        .select('currency')
        .eq('id', companyId)
        .single();
      return (data && (data as any).currency) ? (data as any).currency : getCurrentCompanyCurrency();
    } catch (_err) {
      return getCurrentCompanyCurrency();
    }
  }
  private parseDate(dateStr: string): string | null {
    // Formats supportés: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD  
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    ];
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        let year, month, day;
        if (format === formats[1]) { // YYYY-MM-DD
          year = match[1];
          month = match[2].padStart(2, '0');
          day = match[3].padStart(2, '0');
        } else { // DD/MM/YYYY or DD-MM-YYYY
          day = match[1].padStart(2, '0');
          month = match[2].padStart(2, '0');
          year = match[3];
        }
        return `${year}-${month}-${day}`;
      }
    }
    return null;
  }
  private parseOFXDate(ofxDate: string): string {
    // OFX date format: YYYYMMDD ou YYYYMMDDHHMMSS
    const dateOnly = ofxDate.substring(0, 8);
    const year = dateOnly.substring(0, 4);
    const month = dateOnly.substring(4, 6);
    const day = dateOnly.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  private parseQIFDate(qifDate: string): string {
    // QIF date formats:
    // - MM/DD/YYYY (US format)
    // - DD/MM/YYYY (EU format)
    // - DD/MM/YY (2-digit year)
    // - YYYYMMDD
    const trimmed = qifDate.trim();
    // Format YYYYMMDD
    if (/^\d{8}$/.test(trimmed)) {
      const year = trimmed.substring(0, 4);
      const month = trimmed.substring(4, 6);
      const day = trimmed.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    // Format avec slashes: MM/DD/YYYY ou DD/MM/YYYY ou DD/MM/YY
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const first = parseInt(parts[0], 10);
      const second = parseInt(parts[1], 10);
      const yearPart = parts[2];
      // Déterminer format: si le premier nombre > 12, c'est obligatoirement DD
      // Sinon, on assume DD/MM (format EU par défaut)
      let day: number;
      let month: number;
      if (first > 12) {
        // C'est DD/MM
        day = first;
        month = second;
      } else if (second > 12) {
        // C'est MM/DD
        month = first;
        day = second;
      } else {
        // Ambiguë, on assume DD/MM (format EU, plus courant en Europe)
        day = first;
        month = second;
      }
      // Handle 2-digit years
      let year = yearPart;
      if (yearPart.length === 2) {
        const yearNum = parseInt(yearPart, 10);
        year = yearNum > 50 ? `19${yearPart}` : `20${yearPart}`;
      }
      const monthStr = month.toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      return `${year}-${monthStr}-${dayStr}`;
    }
    throw new Error(`Format de date QIF invalide: ${qifDate}`);
  }
  private extractOFXTag(content: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}>(.*?)(?=<|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }
  /**
   * Récupère les comptes bancaires
   */
  async getBankAccounts(companyId: string): Promise<BankAccount[]> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('account_name');
      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      logger.error('BankImport', 'Erreur récupération comptes bancaires:', error);
      return [];
    }
  }
  /**
   * Crée un nouveau compte bancaire
   */
  async createBankAccount(account: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>): Promise<BankAccount | null> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error: unknown) {
      logger.error('BankImport', 'Erreur création compte bancaire:', error);
      return null;
    }
  }
}
export interface CSVMapping {
  date: number;
  amount: number;
  description: number;
  reference: number;
}
export const bankImportService = new BankImportService();
export default bankImportService;