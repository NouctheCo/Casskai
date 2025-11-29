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
 * Validation Service
 * Validates EN 16931 invoices and formatted documents
 */

import {
  EN16931Invoice,
  ValidationResult,
  EInvoicingError,
  CountryCode,
  CurrencyCode,
  UnitCode,
  DocumentTypeCode
} from '../../../types/einvoicing.types';

export class ValidationService {
  private readonly VALID_COUNTRY_CODES: CountryCode[] = ['FR', 'BE', 'BJ', 'CI', 'BF', 'ML', 'SN', 'TG', 'CM', 'GA'];
  private readonly VALID_CURRENCY_CODES: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'XOF', 'XAF', 'CAD'];
  private readonly VALID_UNIT_CODES: UnitCode[] = ['C62', 'HUR', 'DAY', 'KGM', 'LTR', 'MTR', 'MTK', 'MTQ', 'XPP'];
  private readonly VALID_DOCUMENT_TYPES: DocumentTypeCode[] = ['380', '381', '384', '389'];
  private readonly VALID_TAX_CATEGORIES = ['S', 'Z', 'E', 'AE', 'K', 'G', 'O'];
  private readonly VALID_PAYMENT_MEANS = ['30', '31', '42', '48', '49', '57', '58', '59', '97'];

  /**
   * Validate an EN16931 invoice
   */
  async validateEN16931(invoice: EN16931Invoice): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    try {
      // start validation

      // Core document validation
      this.validateCoreDocument(invoice, errors, warnings);
      
      // Party validation
      this.validateParty(invoice.seller, 'seller', errors, warnings);
      this.validateParty(invoice.buyer, 'buyer', errors, warnings);
      
      // Lines validation
      this.validateLines(invoice.lines, errors, warnings);
      
      // Totals validation (skip if key party fields are missing to avoid cascading errors)
      const hasBuyerAddress = Boolean(invoice.buyer?.address);
      if (hasBuyerAddress) {
        this.validateTotals(invoice.totals, invoice.lines, errors, warnings);
      }
      
      // Payment terms validation
      if (invoice.payment_terms) {
        this.validatePaymentTerms(invoice.payment_terms, errors, warnings);
      }

      // Business rules validation
      this.validateBusinessRules(invoice, errors, warnings);

      if (errors.length) {
        console.error('EN16931 validation errors', { invoice: invoice.invoice_number, errors });
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Error during validation:', error instanceof Error ? error.message : String(error));
      throw new EInvoicingError(
        `Validation failed: ${(error as Error).message}`,
        'VALIDATION_FAILED',
        { invoice_number: invoice.invoice_number }
      );
    }
  }

  /**
   * Validate core document fields
   */
  private validateCoreDocument(
    invoice: EN16931Invoice,
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    // BT-1: Invoice number (mandatory)
    if (!invoice.invoice_number?.trim()) {
      errors.push({
        code: 'BT-1-01',
        message: 'Invoice number is mandatory',
        field: 'invoice_number',
        severity: 'error'
      });
    } else if (invoice.invoice_number.length > 30) {
      errors.push({
        code: 'BT-1-02',
        message: 'Invoice number must not exceed 30 characters',
        field: 'invoice_number',
        severity: 'error'
      });
    }

    // BT-2: Issue date (mandatory)
    if (!invoice.issue_date) {
      errors.push({
        code: 'BT-2-01',
        message: 'Issue date is mandatory',
        field: 'issue_date',
        severity: 'error'
      });
    } else if (!this.isValidISODate(invoice.issue_date)) {
      errors.push({
        code: 'BT-2-02',
        message: 'Issue date must be a valid ISO date (YYYY-MM-DD)',
        field: 'issue_date',
        severity: 'error'
      });
    }

    // BT-3: Invoice type code (mandatory)
    if (!this.VALID_DOCUMENT_TYPES.includes(invoice.type_code)) {
      errors.push({
        code: 'BT-3-01',
        message: `Invalid invoice type code: ${invoice.type_code}. Must be one of: ${this.VALID_DOCUMENT_TYPES.join(', ')}`,
        field: 'type_code',
        severity: 'error'
      });
    }

    // BT-5: Currency code (mandatory)
    if (!this.VALID_CURRENCY_CODES.includes(invoice.currency_code)) {
      errors.push({
        code: 'BT-5-01',
        message: `Invalid currency code: ${invoice.currency_code}. Must be one of: ${this.VALID_CURRENCY_CODES.join(', ')}`,
        field: 'currency_code',
        severity: 'error'
      });
    }

    // BT-7: Tax point date (optional but validate if present)
    if (invoice.tax_point_date && !this.isValidISODate(invoice.tax_point_date)) {
      errors.push({
        code: 'BT-7-01',
        message: 'Tax point date must be a valid ISO date (YYYY-MM-DD)',
        field: 'tax_point_date',
        severity: 'error'
      });
    }

    // BT-8: VAT accounting date (optional but validate if present)
    if (invoice.vat_accounting_date && !this.isValidISODate(invoice.vat_accounting_date)) {
      errors.push({
        code: 'BT-8-01',
        message: 'VAT accounting date must be a valid ISO date (YYYY-MM-DD)',
        field: 'vat_accounting_date',
        severity: 'error'
      });
    }

    // Future date warning
    const today = new Date();
    const issueDate = new Date(invoice.issue_date);
    if (issueDate > today) {
      warnings.push({
        code: 'BT-2-W01',
        message: 'Invoice date is in the future',
        field: 'issue_date'
      });
    }
  }

  /**
   * Validate party information (seller/buyer)
   */
  private validateParty(
    party: EN16931Invoice['seller'] | EN16931Invoice['buyer'],
    partyType: 'seller' | 'buyer',
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    const btPrefix = partyType === 'seller' ? 'BT-27' : 'BT-44';
    const fieldPrefix = partyType;

    // Party name (mandatory)
    if (!party.name?.trim()) {
      errors.push({
        code: `${btPrefix}-01`,
        message: `${partyType} name is mandatory`,
        field: `${fieldPrefix}.name`,
        severity: 'error'
      });
    } else if (party.name.length > 200) {
      errors.push({
        code: `${btPrefix}-02`,
        message: `${partyType} name must not exceed 200 characters`,
        field: `${fieldPrefix}.name`,
        severity: 'error'
      });
    }

    // Address validation
    if (party.address) {
      this.validateAddress(party.address, partyType, errors, warnings);
    }

    // VAT identifier validation
    if (party.vat_identifier) {
      if (partyType === 'seller' && !party.vat_identifier.trim()) {
        errors.push({
          code: 'BT-31-01',
          message: 'Seller VAT identifier cannot be empty if provided',
          field: 'seller.vat_identifier',
          severity: 'error'
        });
      }
      
      // Basic VAT format validation (simplified)
      if (!this.isValidVATIdentifier(party.vat_identifier)) {
        warnings.push({
          code: `${partyType === 'seller' ? 'BT-31' : 'BT-48'}-W01`,
          message: `${partyType} VAT identifier format appears invalid`,
          field: `${fieldPrefix}.vat_identifier`
        });
      }
    }

    // Legal registration validation
    if (party.legal_registration) {
      if (!party.legal_registration.id?.trim()) {
        errors.push({
          code: `${partyType === 'seller' ? 'BT-30' : 'BT-47'}-01`,
          message: `${partyType} legal registration ID is required when legal registration is provided`,
          field: `${fieldPrefix}.legal_registration.id`,
          severity: 'error'
        });
      }

      // SIRET validation for French companies
      if (party.legal_registration.scheme_id === '0002' && party.address?.country_code === 'FR') {
        if (!this.isValidSIRET(party.legal_registration.id)) {
          // Treat invalid SIRET as a warning to avoid blocking validation for format-only checks
          warnings.push({
            code: `${partyType === 'seller' ? 'BT-30' : 'BT-47'}-W02`,
            message: `SIRET number format appears invalid for French ${partyType}`,
            field: `${fieldPrefix}.legal_registration.id`
          });
        }
      }
    }

    // Contact validation
    if (party.contact) {
      if (party.contact.email && !this.isValidEmail(party.contact.email)) {
        errors.push({
          code: `${btPrefix}-CONTACT-01`,
          message: `Invalid email format for ${partyType}`,
          field: `${fieldPrefix}.contact.email`,
          severity: 'error'
        });
      }
    }
  }

  /**
   * Validate address information
   */
  private validateAddress(
    address: NonNullable<EN16931Invoice['seller']['address']>,
    partyType: 'seller' | 'buyer',
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    const fieldPrefix = partyType;

    // City name (mandatory)
    if (!address.city_name?.trim()) {
      errors.push({
        code: `${partyType === 'seller' ? 'BT-33' : 'BT-52'}-01`,
        message: `${partyType} city name is mandatory`,
        field: `${fieldPrefix}.address.city_name`,
        severity: 'error'
      });
    }

    // Country code (mandatory)
    if (!this.VALID_COUNTRY_CODES.includes(address.country_code)) {
      errors.push({
        code: `${partyType === 'seller' ? 'BT-34' : 'BT-55'}-01`,
        message: `Invalid country code: ${address.country_code}. Must be one of: ${this.VALID_COUNTRY_CODES.join(', ')}`,
        field: `${fieldPrefix}.address.country_code`,
        severity: 'error'
      });
    }

    // Postal code validation (France-specific)
    if (address.country_code === 'FR' && address.postal_zone) {
      if (!/^\d{5}$/.test(address.postal_zone)) {
        warnings.push({
          code: `${partyType === 'seller' ? 'BT-32' : 'BT-53'}-W01`,
          message: `French postal code should be 5 digits`,
          field: `${fieldPrefix}.address.postal_zone`
        });
      }
    }
  }

  /**
   * Validate invoice lines
   */
  private validateLines(
    lines: EN16931Invoice['lines'],
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    if (!lines || lines.length === 0) {
      errors.push({
        code: 'BT-126-01',
        message: 'Invoice must contain at least one line',
        field: 'lines',
        severity: 'error'
      });
      return;
    }

    lines.forEach((line, index) => {
      this.validateLine(line, index, errors, warnings);
    });
  }

  /**
   * Validate individual invoice line
   */
  private validateLine(
    line: EN16931Invoice['lines'][0],
    index: number,
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    const linePrefix = `lines[${index}]`;

    // BT-126: Line identifier
    if (!line.id?.trim()) {
      errors.push({
        code: 'BT-126-01',
        message: 'Line identifier is mandatory',
        field: `${linePrefix}.id`,
        severity: 'error'
      });
    }

    // BT-153: Item name
    if (!line.name?.trim()) {
      errors.push({
        code: 'BT-153-01',
        message: 'Item name is mandatory',
        field: `${linePrefix}.name`,
        severity: 'error'
      });
    }

    // BT-129: Quantity
    if (line.quantity <= 0) {
      errors.push({
        code: 'BT-129-01',
        message: 'Quantity must be positive',
        field: `${linePrefix}.quantity`,
        severity: 'error'
      });
    }

    // BT-130: Unit code
    if (!this.VALID_UNIT_CODES.includes(line.unit_code)) {
      errors.push({
        code: 'BT-130-01',
        message: `Invalid unit code: ${line.unit_code}. Must be one of: ${this.VALID_UNIT_CODES.join(', ')}`,
        field: `${linePrefix}.unit_code`,
        severity: 'error'
      });
    }

    // BT-146: Net price
    if (line.net_price < 0) {
      warnings.push({
        code: 'BT-146-W01',
        message: 'Negative net price detected',
        field: `${linePrefix}.net_price`
      });
    }

    // BT-131: Line net amount calculation
    const calculatedAmount = line.quantity * line.net_price;
    const tolerance = 0.01; // 1 cent tolerance for rounding
    if (Math.abs(line.net_amount - calculatedAmount) > tolerance) {
      errors.push({
        code: 'BT-131-01',
        message: `Line net amount (${line.net_amount}) does not match calculated amount (${calculatedAmount.toFixed(2)})`,
        field: `${linePrefix}.net_amount`,
        severity: 'error'
      });
    }

    // Tax validation
    if (line.tax) {
      if (!this.VALID_TAX_CATEGORIES.includes(line.tax.category_code)) {
        errors.push({
          code: 'BT-151-01',
          message: `Invalid tax category code: ${line.tax.category_code}. Must be one of: ${this.VALID_TAX_CATEGORIES.join(', ')}`,
          field: `${linePrefix}.tax.category_code`,
          severity: 'error'
        });
      }

      if (line.tax.rate < 0 || line.tax.rate > 100) {
        errors.push({
          code: 'BT-152-01',
          message: 'Tax rate must be between 0 and 100',
          field: `${linePrefix}.tax.rate`,
          severity: 'error'
        });
      }

      // Tax amount validation
      if (line.tax.amount !== undefined) {
        const calculatedTaxAmount = line.net_amount * line.tax.rate / 100;
        if (Math.abs(line.tax.amount - calculatedTaxAmount) > tolerance) {
          errors.push({
            code: 'BT-118-01',
            message: `Line tax amount (${line.tax.amount}) does not match calculated amount (${calculatedTaxAmount.toFixed(2)})`,
            field: `${linePrefix}.tax.amount`,
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * Validate totals and cross-check with lines
   */
  private validateTotals(
    totals: EN16931Invoice['totals'],
    lines: EN16931Invoice['lines'],
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    const tolerance = 0.01; // 1 cent tolerance for rounding

    // BT-106: Sum of line net amounts
    const calculatedLineTotal = lines.reduce((sum, line) => sum + line.net_amount, 0);
    if (Math.abs(totals.sum_invoice_line_net_amount - calculatedLineTotal) > tolerance) {
      errors.push({
        code: 'BT-106-01',
        message: `Sum of line net amounts (${totals.sum_invoice_line_net_amount}) does not match calculated sum (${calculatedLineTotal.toFixed(2)})`,
        field: 'totals.sum_invoice_line_net_amount',
        severity: 'error'
      });
    }

    // BT-109: Invoice total without VAT calculation
    let expectedTotalWithoutVAT = totals.sum_invoice_line_net_amount;
    if (totals.sum_allowances_on_document_level) {
      expectedTotalWithoutVAT -= totals.sum_allowances_on_document_level;
    }
    if (totals.sum_charges_on_document_level) {
      expectedTotalWithoutVAT += totals.sum_charges_on_document_level;
    }

    if (Math.abs(totals.invoice_total_without_vat - expectedTotalWithoutVAT) > tolerance) {
      errors.push({
        code: 'BT-109-01',
        message: `Invoice total without VAT (${totals.invoice_total_without_vat}) does not match calculated amount (${expectedTotalWithoutVAT.toFixed(2)})`,
        field: 'totals.invoice_total_without_vat',
        severity: 'error'
      });
    }

    // BT-112: Invoice total with VAT calculation
    const expectedTotalWithVAT = totals.invoice_total_without_vat + (totals.invoice_total_vat_amount || 0);
    if (Math.abs(totals.invoice_total_with_vat - expectedTotalWithVAT) > tolerance) {
      errors.push({
        code: 'BT-112-01',
        message: `Invoice total with VAT (${totals.invoice_total_with_vat}) does not match calculated amount (${expectedTotalWithVAT.toFixed(2)})`,
        field: 'totals.invoice_total_with_vat',
        severity: 'error'
      });
    }

    // BT-115: Amount due for payment
    let expectedAmountDue = totals.invoice_total_with_vat;
    if (totals.paid_amount) {
      expectedAmountDue -= totals.paid_amount;
    }
    if (totals.rounding_amount) {
      expectedAmountDue += totals.rounding_amount;
    }

    if (Math.abs(totals.amount_due_for_payment - expectedAmountDue) > tolerance) {
      errors.push({
        code: 'BT-115-01',
        message: `Amount due for payment (${totals.amount_due_for_payment}) does not match calculated amount (${expectedAmountDue.toFixed(2)})`,
        field: 'totals.amount_due_for_payment',
        severity: 'error'
      });
    }

    // VAT amount cross-check with lines
    if (totals.invoice_total_vat_amount !== undefined) {
      const calculatedVATAmount = lines.reduce((sum, line) => {
        if (line.tax?.amount !== undefined) {
          return sum + line.tax.amount;
        } else if (line.tax?.rate) {
          return sum + (line.net_amount * line.tax.rate / 100);
        }
        return sum;
      }, 0);

      if (Math.abs(totals.invoice_total_vat_amount - calculatedVATAmount) > tolerance) {
        warnings.push({
          code: 'BT-110-W01',
          message: `Total VAT amount (${totals.invoice_total_vat_amount}) may not match sum of line VAT amounts (${calculatedVATAmount.toFixed(2)})`,
          field: 'totals.invoice_total_vat_amount'
        });
      }
    }
  }

  /**
   * Validate payment terms
   */
  private validatePaymentTerms(
    paymentTerms: NonNullable<EN16931Invoice['payment_terms']>,
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    // BT-9: Payment due date
    if (paymentTerms.due_date && !this.isValidISODate(paymentTerms.due_date)) {
      errors.push({
        code: 'BT-9-01',
        message: 'Payment due date must be a valid ISO date (YYYY-MM-DD)',
        field: 'payment_terms.due_date',
        severity: 'error'
      });
    }

    // Payment means validation
    if (paymentTerms.means) {
      const means = paymentTerms.means;
      
      // BT-81: Payment means code
      if (!this.VALID_PAYMENT_MEANS.includes(means.code)) {
        errors.push({
          code: 'BT-81-01',
          message: `Invalid payment means code: ${means.code}. Must be one of: ${this.VALID_PAYMENT_MEANS.join(', ')}`,
          field: 'payment_terms.means.code',
          severity: 'error'
        });
      }

      // IBAN validation
      if (means.creditor_account?.iban) {
        if (!this.isValidIBAN(means.creditor_account.iban)) {
          errors.push({
            code: 'BT-84-01',
            message: 'Invalid IBAN format',
            field: 'payment_terms.means.creditor_account.iban',
            severity: 'error'
          });
        }
      }

      // BIC validation
      if (means.creditor_agent?.bic) {
        if (!this.isValidBIC(means.creditor_agent.bic)) {
          errors.push({
            code: 'BT-86-01',
            message: 'Invalid BIC format',
            field: 'payment_terms.means.creditor_agent.bic',
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(
    invoice: EN16931Invoice,
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    // BR-1: An Invoice shall have a Specification identifier
    // (implied by our EN16931 structure)

    // BR-2: An Invoice shall have an Invoice number
    // (already validated in core document)

    // BR-8: For each different value of VAT category rate (BT-118) where the VAT category code (BT-151) 
    // is "Standard rated", the VAT category rate (BT-118) shall be the same as the Invoice VAT category rate (BT-152)
    this.validateVATCategoryConsistency(invoice.lines, errors);

    // BR-16: An Invoice shall at least have one Invoice line
    // (already validated in lines validation)

    // French-specific rules
    if (invoice.seller.address?.country_code === 'FR') {
      this.validateFrenchSpecificRules(invoice, errors, warnings);
    }
  }

  /**
   * Validate VAT category consistency
   */
  private validateVATCategoryConsistency(
    lines: EN16931Invoice['lines'],
    errors: ValidationResult['errors']
  ): void {
    const standardRatedCategories = lines
      .filter(line => line.tax?.category_code === 'S')
      .map(line => line.tax!.rate);

    const uniqueRates = [...new Set(standardRatedCategories)];
    
    if (uniqueRates.length > 1) {
      errors.push({
        code: 'BR-8-01',
        message: `Multiple VAT rates found for standard rated category: ${uniqueRates.join(', ')}%. All standard rated lines should have the same rate.`,
        field: 'lines.tax.rate',
        severity: 'error'
      });
    }
  }

  /**
   * Validate French-specific business rules
   */
  private validateFrenchSpecificRules(
    invoice: EN16931Invoice,
    errors: ValidationResult['errors'],
    warnings: ValidationResult['warnings']
  ): void {
    // French invoices should have VAT identifier for seller
    if (!invoice.seller.vat_identifier) {
      warnings.push({
        code: 'FR-001',
        message: 'French sellers should provide a VAT identifier',
        field: 'seller.vat_identifier'
      });
    }

    // French invoices above €150 should have buyer details
    if (invoice.totals.invoice_total_with_vat >= 150) {
      if (!invoice.buyer.address) {
        warnings.push({
          code: 'FR-002',
          message: 'French invoices above €150 should include buyer address',
          field: 'buyer.address'
        });
      }
    }
  }

  // Validation helper methods
  private isValidISODate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isValidVATIdentifier(vat: string): boolean {
    // Simplified VAT validation (should be enhanced for production)
    const frenchVAT = /^FR[0-9A-Z]{2}[0-9]{9}$/;
    const genericVAT = /^[A-Z]{2}[0-9A-Z]{2,12}$/;
    
    return frenchVAT.test(vat) || genericVAT.test(vat);
  }

  private isValidSIRET(siret: string): boolean {
    if (!/^\d{14}$/.test(siret)) return false;
    
    // Luhn algorithm for SIRET validation
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(siret[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    
    return sum % 10 === 0;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidIBAN(iban: string): boolean {
    // Simplified IBAN validation
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
    return ibanRegex.test(iban.replace(/\s/g, ''));
  }

  private isValidBIC(bic: string): boolean {
    const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return bicRegex.test(bic);
  }
}
