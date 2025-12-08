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
 * Invoice to EN 16931 Mapper
 * Maps CassKai invoice structure to EN 16931 standard format
 */

import {
  EN16931Invoice,
  EN16931Party,
  EN16931Line,
  EN16931Totals,
  EN16931PaymentTerms,
  CountryCode,
  CurrencyCode,
  UnitCode,
  DocumentTypeCode,
  EInvoicingError
} from '@/types/einvoicing.types';

interface CassKaiInvoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  currency: string;
  total_amount: number;
  total_tax: number;
  total_without_tax: number;
  notes?: string;
  third_parties: {
    name: string;
    siret?: string;
    vat_number?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  companies: {
    name: string;
    siret?: string;
    vat_number?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  invoice_lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    tax_rate: number;
    tax_amount: number;
  }>;
}

// Constant lookups for mapping and validation
const VALID_CURRENCIES: ReadonlyArray<CurrencyCode> = [
  'EUR', 'USD', 'GBP', 'XOF', 'XAF', 'CAD'
] as const;

const VALID_COUNTRY_CODES: ReadonlyArray<CountryCode> = [
  'FR', 'BE', 'BJ', 'CI', 'BF', 'ML', 'SN', 'TG', 'CM', 'GA'
] as const;

const COUNTRY_MAP: Record<string, CountryCode> = {
  'FRANCE': 'FR',
  'BELGIUM': 'BE',
  'BENIN': 'BJ',
  "COTE D'IVOIRE": 'CI',
  'IVORY COAST': 'CI',
  'BURKINA FASO': 'BF',
  'MALI': 'ML',
  'SENEGAL': 'SN',
  'TOGO': 'TG',
  'CAMEROON': 'CM',
  'GABON': 'GA'
};

export class InvoiceToEN16931Mapper {
  /**
   * Map CassKai invoice to EN 16931 format
   */
  async mapInvoiceToEN16931(invoice: CassKaiInvoice): Promise<EN16931Invoice> {
    try {
      // Préparer en parallèle les sections indépendantes
      const [seller, buyer, lines, totals, payment_terms, references] = await Promise.all([
        this.mapSellerParty(invoice.companies),
        this.mapBuyerParty(invoice.third_parties),
        this.mapInvoiceLines(invoice.invoice_lines),
        this.calculateTotals(invoice),
        this.mapPaymentTerms(invoice),
        this.mapReferences(invoice),
      ]);

      // Assembler le document EN16931
      const en16931Invoice: EN16931Invoice = {
        invoice_number: invoice.invoice_number,
        issue_date: this.formatDate(invoice.issue_date),
        type_code: this.determineDocumentType(invoice),
        currency_code: this.mapCurrencyCode(invoice.currency),
        seller,
        buyer,
        lines,
        totals,
        payment_terms,
        references,
        notes: invoice.notes ? [invoice.notes] : undefined,
      };

      // Validate the mapped invoice
      await this.validateMappedInvoice(en16931Invoice);

      return en16931Invoice;

    } catch (error) {
      console.error('Error mapping invoice to EN16931:', error);
      
      if (error instanceof EInvoicingError) {
        throw error;
      }
      
      throw new EInvoicingError(
        `Failed to map invoice to EN16931: ${(error as Error).message}`,
        'MAPPING_ERROR',
        { invoice_number: invoice.invoice_number }
      );
    }
  }

  /**
   * Map seller party (company)
   */
  private async mapSellerParty(company: CassKaiInvoice['companies']): Promise<EN16931Party> {
    const seller: EN16931Party = {
      name: company.name
    };

    // Add address if available
    if (company.address || company.city) {
      seller.address = {
        street_name: company.address,
        city_name: company.city || 'Unknown',
        postal_zone: company.postal_code,
        country_code: this.mapCountryCode(company.country || 'FR')
      };
    }

    // Add VAT identifier
    if (company.vat_number) {
      seller.vat_identifier = this.normalizeVATNumber(company.vat_number);
    }

    // Add legal registration (SIRET for French companies)
    if (company.siret) {
      seller.legal_registration = {
        id: company.siret,
        scheme_id: '0002' // SIRET scheme
      };
    }

    // Add contact information
    if (company.email || company.phone) {
      seller.contact = {
        email: company.email,
        telephone: company.phone
      };
    }

    return seller;
  }

  /**
   * Map buyer party (third party)
   */
  private async mapBuyerParty(thirdParty: CassKaiInvoice['third_parties']): Promise<EN16931Party> {
    const buyer: EN16931Party = {
      name: thirdParty.name
    };

    // Add address if available
    if (thirdParty.address || thirdParty.city) {
      buyer.address = {
        street_name: thirdParty.address,
        city_name: thirdParty.city || 'Unknown',
        postal_zone: thirdParty.postal_code,
        country_code: this.mapCountryCode(thirdParty.country || 'FR')
      };
    }

    // Add VAT identifier
    if (thirdParty.vat_number) {
      buyer.vat_identifier = this.normalizeVATNumber(thirdParty.vat_number);
    }

    // Add legal registration (SIRET for French companies)
    if (thirdParty.siret) {
      buyer.legal_registration = {
        id: thirdParty.siret,
        scheme_id: '0002' // SIRET scheme
      };
    }

    // Add contact information
    if (thirdParty.email || thirdParty.phone) {
      buyer.contact = {
        email: thirdParty.email,
        telephone: thirdParty.phone
      };
    }

    return buyer;
  }

  /**
   * Map invoice lines
   */
  private async mapInvoiceLines(lines: CassKaiInvoice['invoice_lines']): Promise<EN16931Line[]> {
    return lines.map((line, index) => {
      const en16931Line: EN16931Line = {
        id: line.id || (index + 1).toString(),
        name: line.description || 'Product/Service',
        description: line.description,
        quantity: line.quantity || 1,
        unit_code: 'C62' as UnitCode, // Default to "piece"
        net_price: line.unit_price || 0,
        net_amount: line.total_price || 0
      };

      // Add tax information if available
      if (line.tax_rate !== undefined && line.tax_rate >= 0) {
        en16931Line.tax = {
          category_code: this.determineTaxCategory(line.tax_rate),
          rate: line.tax_rate,
          amount: line.tax_amount || (line.total_price * line.tax_rate / 100)
        };
      }

      return en16931Line;
    });
  }

  /**
   * Calculate totals from invoice data
   */
  private async calculateTotals(invoice: CassKaiInvoice): Promise<EN16931Totals> {
    const lineTotal = invoice.invoice_lines.reduce((sum, line) => sum + (line.total_price || 0), 0);
    
    const totals: EN16931Totals = {
      sum_invoice_line_net_amount: lineTotal,
      invoice_total_without_vat: invoice.total_without_tax || lineTotal,
      invoice_total_vat_amount: invoice.total_tax || 0,
      invoice_total_with_vat: invoice.total_amount || (lineTotal + (invoice.total_tax || 0)),
      amount_due_for_payment: invoice.total_amount || (lineTotal + (invoice.total_tax || 0))
    };

    // Validate totals consistency
    const calculatedTotal = totals.invoice_total_without_vat + (totals.invoice_total_vat_amount || 0);
    if (Math.abs(totals.invoice_total_with_vat - calculatedTotal) > 0.01) {
      console.warn(`Total mismatch in invoice ${invoice.invoice_number}: expected ${calculatedTotal}, got ${totals.invoice_total_with_vat}`);
    }

    return totals;
  }

  /**
   * Map payment terms
   */
  private async mapPaymentTerms(invoice: CassKaiInvoice): Promise<EN16931PaymentTerms | undefined> {
    if (!invoice.due_date) {
      return undefined;
    }

    const paymentTerms: EN16931PaymentTerms = {
      due_date: this.formatDate(invoice.due_date),
      description: `Payment due by ${this.formatDate(invoice.due_date)}`
    };

    // Add default payment means (bank transfer)
    paymentTerms.means = {
      code: '30' // Credit transfer
    };

    return paymentTerms;
  }

  /**
   * Map references
   */
  private async mapReferences(_invoice: CassKaiInvoice): Promise<EN16931Invoice['references'] | undefined> {
    // For now, return undefined as CassKai doesn't have structured reference fields
    // This can be enhanced when reference fields are added to the invoice structure
    return undefined;
  }

  // Helper methods

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
      }
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      console.warn(`Error formatting date ${dateString}:`, error);
      return new Date().toISOString().split('T')[0]; // Fallback to today
    }
  }

  private determineDocumentType(invoice: CassKaiInvoice): DocumentTypeCode {
    // For now, default to standard commercial invoice
    // This can be enhanced based on invoice type indicators
    if (invoice.total_amount < 0) {
      return '381'; // Credit note
    }
    return '380'; // Commercial invoice
  }

  private mapCurrencyCode(currency: string): CurrencyCode {
    const normalizedCurrency = currency?.toUpperCase() || 'EUR';
    if (VALID_CURRENCIES.includes(normalizedCurrency as CurrencyCode)) {
      return normalizedCurrency as CurrencyCode;
    }
    console.warn(`Unknown currency code: ${currency}, defaulting to EUR`);
    return 'EUR';
  }

  private mapCountryCode(country?: string): CountryCode {
    if (!country) return 'FR';
    
    const normalizedCountry = country.toUpperCase();
    // Déjà un code à 2 lettres
    if (VALID_COUNTRY_CODES.includes(normalizedCountry as CountryCode)) {
      return normalizedCountry as CountryCode;
    }

    // Try to map from country name
    if (COUNTRY_MAP[normalizedCountry]) {
      return COUNTRY_MAP[normalizedCountry];
    }

    console.warn(`Unknown country: ${country}, defaulting to FR`);
    return 'FR';
  }

  private normalizeVATNumber(vatNumber: string): string {
    // Remove spaces and convert to uppercase
    let normalized = vatNumber.replace(/\s/g, '').toUpperCase();
    
    // Add FR prefix for French VAT numbers if missing
    if (/^\d{11}$/.test(normalized)) {
      // French VAT number without country code
      const checkDigits = this.calculateFrenchVATCheckDigits(normalized);
      normalized = `FR${checkDigits}${normalized}`;
    } else if (/^FR\d{13}$/.test(normalized)) {
      // French VAT number with country code but wrong format
      const siren = normalized.substring(4);
      const checkDigits = this.calculateFrenchVATCheckDigits(siren);
      normalized = `FR${checkDigits}${siren}`;
    }
    
    return normalized;
  }

  private calculateFrenchVATCheckDigits(siren: string): string {
    // Simplified French VAT check digit calculation
    // In production, this should use the official algorithm
    const num = parseInt(siren.substring(0, 9));
    const checkDigits = ((12 + 3 * (num % 97)) % 97).toString().padStart(2, '0');
    return checkDigits;
  }

  private determineTaxCategory(taxRate: number): 'S' | 'Z' | 'E' | 'AE' | 'K' | 'G' | 'O' {
    if (taxRate === 0) {
      return 'Z'; // Zero rated
    } else if (taxRate > 0 && taxRate <= 30) {
      return 'S'; // Standard rated
    } else {
      return 'O'; // Not subject to VAT
    }
  }

  private async validateMappedInvoice(invoice: EN16931Invoice): Promise<void> {
    const errors: string[] = [];

    // Basic validation
    if (!invoice.invoice_number) {
      errors.push('Invoice number is required');
    }

    if (!invoice.issue_date) {
      errors.push('Issue date is required');
    }

    if (!invoice.seller.name) {
      errors.push('Seller name is required');
    }

    if (!invoice.buyer.name) {
      errors.push('Buyer name is required');
    }

    if (!invoice.lines || invoice.lines.length === 0) {
      errors.push('At least one invoice line is required');
    }

    // Line validation
    invoice.lines?.forEach((line, index) => {
      if (!line.name) {
        errors.push(`Line ${index + 1}: Item name is required`);
      }
      if (line.quantity <= 0) {
        errors.push(`Line ${index + 1}: Quantity must be positive`);
      }
      if (line.net_price < 0) {
        errors.push(`Line ${index + 1}: Net price cannot be negative`);
      }
    });

    // Total validation
    if (invoice.totals.invoice_total_with_vat <= 0) {
      errors.push('Invoice total must be positive');
    }

    if (errors.length > 0) {
      throw new EInvoicingError(
        `Invalid mapped invoice: ${errors.join(', ')}`,
        'VALIDATION_ERROR',
        { errors, invoice_number: invoice.invoice_number }
      );
    }
  }
}
