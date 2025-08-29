/**
 * ValidationService Unit Tests
 * Test suite for EN 16931 invoice validation
 */

import { ValidationService } from '../core/ValidationService';
import { EN16931Invoice } from '../../../types/einvoicing.types';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateEN16931', () => {
    const createValidInvoice = (): EN16931Invoice => ({
      invoice_number: 'INV-2024-001',
      issue_date: '2024-01-15',
      type_code: '380',
      currency_code: 'EUR',
      seller: {
        name: 'Entreprise Test SARL',
        address: {
          street_name: '123 Rue de la Paix',
          city_name: 'Paris',
          postal_zone: '75001',
          country_code: 'FR'
        },
        vat_identifier: 'FR12345678901',
        legal_registration: {
          id: '12345678901234',
          scheme_id: '0002'
        }
      },
      buyer: {
        name: 'Client Test SAS',
        address: {
          street_name: '456 Avenue des Champs',
          city_name: 'Lyon',
          postal_zone: '69000',
          country_code: 'FR'
        },
        vat_identifier: 'FR98765432109'
      },
      lines: [
        {
          id: '1',
          name: 'Service de test',
          description: 'Service de développement logiciel',
          quantity: 1,
          unit_code: 'C62',
          net_price: 1000.00,
          net_amount: 1000.00,
          tax: {
            category_code: 'S',
            rate: 20.00,
            amount: 200.00
          }
        }
      ],
      totals: {
        sum_invoice_line_net_amount: 1000.00,
        invoice_total_without_vat: 1000.00,
        invoice_total_vat_amount: 200.00,
        invoice_total_with_vat: 1200.00,
        amount_due_for_payment: 1200.00
      }
    });

    it('should validate a correct EN16931 invoice', async () => {
      const invoice = createValidInvoice();
      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invoice without invoice number', async () => {
      const invoice = createValidInvoice();
      invoice.invoice_number = '';

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'BT-1-01',
          message: 'Invoice number is mandatory'
        })
      );
    });

    it('should reject invoice with invalid issue date', async () => {
      const invoice = createValidInvoice();
      invoice.issue_date = 'invalid-date';

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'BT-2-02',
          message: 'Issue date must be a valid ISO date (YYYY-MM-DD)'
        })
      );
    });

    it('should reject invoice with invalid currency code', async () => {
      const invoice = createValidInvoice();
      invoice.currency_code = 'INVALID' as any;

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'BT-5-01',
          message: expect.stringContaining('Invalid currency code')
        })
      );
    });

    it('should reject invoice without seller name', async () => {
      const invoice = createValidInvoice();
      invoice.seller.name = '';

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'BT-27-01',
          message: 'seller name is mandatory'
        })
      );
    });

    it('should validate French SIRET correctly', async () => {
      const invoice = createValidInvoice();
      invoice.seller.legal_registration = {
        id: '12345678901234', // Valid format but fake SIRET
        scheme_id: '0002'
      };

      const result = await validationService.validateEN16931(invoice);
      
      // Should pass basic validation (actual SIRET validation might fail)
      expect(result.valid).toBe(true);
    });

    it('should reject invoice with inconsistent line amounts', async () => {
      const invoice = createValidInvoice();
      invoice.lines[0].net_amount = 500.00; // Should be 1000.00 (quantity * net_price)

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'BT-131-01',
          message: expect.stringContaining('Line net amount')
        })
      );
    });

    it('should reject invoice with incorrect totals calculation', async () => {
      const invoice = createValidInvoice();
      invoice.totals.invoice_total_with_vat = 1000.00; // Should be 1200.00

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'BT-112-01',
          message: expect.stringContaining('Invoice total with VAT')
        })
      );
    });

    it('should warn about future invoice date', async () => {
      const invoice = createValidInvoice();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      invoice.issue_date = futureDate.toISOString().split('T')[0];

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'BT-2-W01',
          message: 'Invoice date is in the future'
        })
      );
    });

    it('should validate French-specific business rules', async () => {
      const invoice = createValidInvoice();
      // French seller without VAT identifier
      delete invoice.seller.vat_identifier;

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'FR-001',
          message: 'French sellers should provide a VAT identifier'
        })
      );
    });

    it('should validate high-value invoice buyer requirements', async () => {
      const invoice = createValidInvoice();
      // High value invoice (>150 EUR) without buyer address
      invoice.totals.invoice_total_with_vat = 200.00;
      delete invoice.buyer.address;

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'FR-002',
          message: 'French invoices above €150 should include buyer address'
        })
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle invoice with no lines', async () => {
      const invoice: EN16931Invoice = {
        invoice_number: 'INV-001',
        issue_date: '2024-01-15',
        type_code: '380',
        currency_code: 'EUR',
        seller: { name: 'Test Seller' },
        buyer: { name: 'Test Buyer' },
        lines: [],
        totals: {
          sum_invoice_line_net_amount: 0,
          invoice_total_without_vat: 0,
          invoice_total_with_vat: 0,
          amount_due_for_payment: 0
        }
      };

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'BT-126-01',
          message: 'Invoice must contain at least one line'
        })
      );
    });

    it('should handle very long invoice number', async () => {
      const invoice: EN16931Invoice = {
        invoice_number: 'A'.repeat(50), // Too long (max 30 chars)
        issue_date: '2024-01-15',
        type_code: '380',
        currency_code: 'EUR',
        seller: { name: 'Test Seller' },
        buyer: { name: 'Test Buyer' },
        lines: [{
          id: '1',
          name: 'Test',
          quantity: 1,
          unit_code: 'C62',
          net_price: 100,
          net_amount: 100
        }],
        totals: {
          sum_invoice_line_net_amount: 100,
          invoice_total_without_vat: 100,
          invoice_total_with_vat: 100,
          amount_due_for_payment: 100
        }
      };

      const result = await validationService.validateEN16931(invoice);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'BT-1-02',
          message: 'Invoice number must not exceed 30 characters'
        })
      );
    });
  });
});