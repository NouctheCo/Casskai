/**
 * Service d'importation des relevés bancaires
 * Supporte les formats CSV, OFX, QIF
 */

import { supabase } from '@/lib/supabase';

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
  reconciled: boolean;
  imported_from?: 'csv' | 'ofx' | 'qif' | 'api';
  raw_data?: any;
  created_at?: string;
  updated_at?: string;
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
          
          const transaction = this.parseCSVTransaction(values, finalMapping, accountId, companyId);
          if (transaction) {
            transactions.push(transaction);
          }
        } catch (error) {
          errors.push(`Ligne ${i + 2}: ${error.message}`);
        }
      }

      // Sauvegarde en base
      const saveResult = await this.saveTransactions(transactions);
      
      return {
        success: saveResult.success,
        message: saveResult.success 
          ? `${saveResult.imported_count} transactions importées avec succès`
          : 'Erreur lors de la sauvegarde',
        imported_count: saveResult.imported_count,
        skipped_count: saveResult.skipped_count,
        error_count: errors.length,
        transactions: transactions,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Erreur import CSV:', error);
      return {
        success: false,
        message: `Erreur lors de l'import: ${error.message}`,
        imported_count: 0,
        skipped_count: 0,
        error_count: 1,
        transactions: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Importe un fichier OFX (Open Financial Exchange)
   */
  async importOFX(file: File, accountId: string, companyId: string): Promise<ImportResult> {
    try {
      const text = await file.text();
      
      // Parse OFX format
      const transactions = await this.parseOFXTransactions(text, accountId, companyId);
      
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
        error_count: 0,
        transactions: transactions
      };

    } catch (error) {
      console.error('Erreur import OFX:', error);
      return {
        success: false,
        message: `Erreur lors de l'import OFX: ${error.message}`,
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
      const text = await file.text();
      const transactions = await this.parseQIFTransactions(text, accountId, companyId);
      
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
        error_count: 0,
        transactions: transactions
      };

    } catch (error) {
      console.error('Erreur import QIF:', error);
      return {
        success: false,
        message: `Erreur lors de l'import QIF: ${error.message}`,
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
  private async parseOFXTransactions(ofxContent: string, accountId: string, companyId: string): Promise<BankTransaction[]> {
    const transactions: BankTransaction[] = [];
    
    // Simple regex parsing pour OFX (version simplifiée)
    const stmtTrnPattern = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
    const matches = ofxContent.match(stmtTrnPattern);
    
    if (!matches) return transactions;
    
    for (const match of matches) {
      try {
        const trnType = this.extractOFXTag(match, 'TRNTYPE');
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
            currency: 'EUR', // Par défaut, pourrait être extrait du fichier
            description: memo.trim(),
            reference: fitId || undefined,
            reconciled: false,
            imported_from: 'ofx',
            raw_data: { original: match.trim() }
          };
          
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn('Erreur parsing transaction OFX:', error);
      }
    }
    
    return transactions;
  }

  /**
   * Parse les transactions QIF
   */
  private async parseQIFTransactions(qifContent: string, accountId: string, companyId: string): Promise<BankTransaction[]> {
    const transactions: BankTransaction[] = [];
    const lines = qifContent.split('\n');
    
    let currentTransaction: Partial<BankTransaction> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const code = trimmed.charAt(0);
      const value = trimmed.substring(1);
      
      switch (code) {
        case 'D': // Date
          currentTransaction.transaction_date = this.parseQIFDate(value);
          break;
        case 'T': // Amount
        case 'U': // Amount (alternative)
          currentTransaction.amount = parseFloat(value.replace(',', '.'));
          break;
        case 'P': // Payee/Description
        case 'M': // Memo
          currentTransaction.description = (currentTransaction.description || '') + ' ' + value;
          break;
        case 'N': // Number/Reference
          currentTransaction.reference = value;
          break;
        case '^': // End of transaction
          if (currentTransaction.transaction_date && currentTransaction.amount !== undefined) {
            transactions.push({
              bank_account_id: accountId,
              company_id: companyId,
              transaction_date: currentTransaction.transaction_date,
              amount: currentTransaction.amount,
              currency: 'EUR',
              description: (currentTransaction.description || '').trim(),
              reference: currentTransaction.reference,
              reconciled: false,
              imported_from: 'qif',
              raw_data: { original: currentTransaction }
            } as BankTransaction);
          }
          currentTransaction = {};
          break;
      }
    }
    
    return transactions;
  }

  /**
   * Sauvegarde les transactions en base
   */
  private async saveTransactions(transactions: BankTransaction[]): Promise<{success: boolean, imported_count: number, skipped_count: number}> {
    let imported = 0;
    let skipped = 0;
    
    for (const transaction of transactions) {
      try {
        // Vérifier si la transaction existe déjà
        const { data: existing } = await supabase
          .from('bank_transactions')
          .select('id')
          .eq('bank_account_id', transaction.bank_account_id)
          .eq('transaction_date', transaction.transaction_date)
          .eq('amount', transaction.amount)
          .eq('description', transaction.description)
          .single();
          
        if (existing) {
          skipped++;
          continue;
        }
        
        const { error } = await supabase
          .from('bank_transactions')
          .insert(transaction);
          
        if (error) {
          console.error('Erreur sauvegarde transaction:', error);
          continue;
        }
        
        imported++;
        
      } catch (error) {
        console.error('Erreur traitement transaction:', error);
      }
    }
    
    return {
      success: imported > 0,
      imported_count: imported,
      skipped_count: skipped
    };
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

  private parseCSVTransaction(values: string[], mapping: CSVMapping, accountId: string, companyId: string): BankTransaction | null {
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
        amount: amount,
        currency: 'EUR',
        description: description,
        reference: reference,
        reconciled: false,
        imported_from: 'csv'
      };
      
    } catch (error) {
      throw new Error(`Erreur parsing transaction: ${error.message}`);
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
    // QIF date format: MM/DD/YYYY ou DD/MM/YY
    const parts = qifDate.split('/');
    if (parts.length === 3) {
      let [first, second, year] = parts;
      
      // Assume DD/MM format for European banks
      const day = first.padStart(2, '0');
      const month = second.padStart(2, '0');
      
      // Handle 2-digit years
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      
      return `${year}-${month}-${day}`;
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
      
    } catch (error) {
      console.error('Erreur récupération comptes bancaires:', error);
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
      
    } catch (error) {
      console.error('Erreur création compte bancaire:', error);
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