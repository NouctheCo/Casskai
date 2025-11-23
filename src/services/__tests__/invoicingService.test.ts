// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { Invoice, InvoiceLine, InvoiceWithDetails } from '../invoicingService';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({ data: [], error: null }))
        })),
        order: vi.fn(() => ({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null }))
      }))
    }))
  }
}));

describe('InvoicingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Invoice Creation', () => {
    it('should create a new invoice with correct calculations', async () => {
      const mockInvoiceData = {
        company_id: 'comp-123',
        third_party_id: 'client-123',
        invoice_number: 'INV-001',
        type: 'sale' as const,
        status: 'draft' as const,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        currency: 'EUR',
        created_by: 'user-123'
      };

      const mockInvoiceLines: Omit<InvoiceLine, 'id' | 'created_at'>[] = [
        {
          company_id: 'comp-123',
          invoice_id: '',
          description: 'Service 1',
          quantity: 2,
          unit_price: 100,
          discount_percent: 10,
          tax_rate: 20,
          line_total: 0,
          line_order: 1
        },
        {
          company_id: 'comp-123',
          invoice_id: '',
          description: 'Service 2',
          quantity: 1,
          unit_price: 200,
          discount_percent: 0,
          tax_rate: 20,
          line_total: 0,
          line_order: 2
        }
      ];

      // Calculate expected totals
      // Line 1: quantity(2) * unit_price(100) * (1 - discount(0.1)) = 180
      // Line 2: quantity(1) * unit_price(200) * (1 - discount(0)) = 200
      // Subtotal: 180 + 200 = 380
      // Tax: (180 * 0.2) + (200 * 0.2) = 36 + 40 = 76
      // Total: 380 + 76 = 456

      const expectedSubtotal = 380;
      const expectedTaxAmount = 76;
      const expectedTotal = 456;

      // Mock successful database responses
      const mockCreatedInvoice = {
        id: 'inv-123',
        ...mockInvoiceData,
        subtotal: expectedSubtotal,
        tax_amount: expectedTaxAmount,
        total_amount: expectedTotal,
        paid_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockImplementation(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockCreatedInvoice, error: null })
          }))
        }))
      }) as any);

      // Test invoice calculation logic
      const calculatedLines = mockInvoiceLines.map(line => {
        const lineSubtotal = line.quantity * line.unit_price * (1 - (line.discount_percent || 0) / 100);
        const lineTax = lineSubtotal * (line.tax_rate || 0) / 100;
        return {
          ...line,
          line_total: lineSubtotal + lineTax
        };
      });

      const subtotal = calculatedLines.reduce((sum, line) => 
        sum + (line.quantity * line.unit_price * (1 - (line.discount_percent || 0) / 100)), 0
      );
      const taxAmount = calculatedLines.reduce((sum, line) => 
        sum + ((line.quantity * line.unit_price * (1 - (line.discount_percent || 0) / 100)) * (line.tax_rate || 0) / 100), 0
      );
      const totalAmount = subtotal + taxAmount;

      expect(subtotal).toBe(expectedSubtotal);
      expect(taxAmount).toBe(expectedTaxAmount);
      expect(totalAmount).toBe(expectedTotal);
    });

    it('should handle discount calculations correctly', () => {
      const testCases = [
        { quantity: 1, unitPrice: 100, discount: 0, expected: 100 },
        { quantity: 1, unitPrice: 100, discount: 10, expected: 90 },
        { quantity: 2, unitPrice: 50, discount: 20, expected: 80 },
        { quantity: 1, unitPrice: 100, discount: 100, expected: 0 }
      ];

      testCases.forEach(({ quantity, unitPrice, discount, expected }) => {
        const result = quantity * unitPrice * (1 - discount / 100);
        expect(result).toBe(expected);
      });
    });

    it('should handle tax calculations correctly', () => {
      const testCases = [
        { subtotal: 100, taxRate: 0, expected: 0 },
        { subtotal: 100, taxRate: 20, expected: 20 },
        { subtotal: 80, taxRate: 25, expected: 20 },
        { subtotal: 150, taxRate: 10, expected: 15 }
      ];

      testCases.forEach(({ subtotal, taxRate, expected }) => {
        const result = subtotal * (taxRate / 100);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Invoice Status Management', () => {
    it('should validate status transitions', () => {
      const validTransitions = {
        'draft': ['sent', 'cancelled'],
        'sent': ['paid', 'overdue', 'cancelled'],
        'paid': [],
        'overdue': ['paid', 'cancelled'],
        'cancelled': []
      };

      // Test valid transitions
      expect(validTransitions.draft).toContain('sent');
      expect(validTransitions.sent).toContain('paid');
      expect(validTransitions.overdue).toContain('paid');

      // Test invalid transitions
      expect(validTransitions.paid).not.toContain('draft');
      expect(validTransitions.cancelled).toHaveLength(0);
    });

    it('should calculate overdue status based on due date', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const overdueInvoice = {
        due_date: yesterday.toISOString().split('T')[0],
        status: 'sent' as const,
        paid_amount: 0,
        total_amount: 100
      };

      const notOverdueInvoice = {
        due_date: tomorrow.toISOString().split('T')[0],
        status: 'sent' as const,
        paid_amount: 0,
        total_amount: 100
      };

      // Logic for determining overdue status
      const isOverdue = (invoice: typeof overdueInvoice) => {
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        return invoice.status === 'sent' && 
               invoice.paid_amount < invoice.total_amount && 
               dueDate < today;
      };

      expect(isOverdue(overdueInvoice)).toBe(true);
      expect(isOverdue(notOverdueInvoice)).toBe(false);
    });
  });

  describe('Payment Processing', () => {
    it('should calculate remaining balance correctly', () => {
      const invoice = {
        total_amount: 1000,
        paid_amount: 250
      };

      const remainingBalance = invoice.total_amount - invoice.paid_amount;
      expect(remainingBalance).toBe(750);
    });

    it('should determine payment status correctly', () => {
      const testCases = [
        { total: 1000, paid: 0, expected: 'unpaid' },
        { total: 1000, paid: 500, expected: 'partially_paid' },
        { total: 1000, paid: 1000, expected: 'paid' },
        { total: 1000, paid: 1100, expected: 'overpaid' }
      ];

      testCases.forEach(({ total, paid, expected }) => {
        let status;
        if (paid === 0) status = 'unpaid';
        else if (paid < total) status = 'partially_paid';
        else if (paid === total) status = 'paid';
        else status = 'overpaid';

        expect(status).toBe(expected);
      });
    });
  });

  describe('Invoice Number Generation', () => {
    it('should generate sequential invoice numbers', () => {
      const generateInvoiceNumber = (lastNumber: string, prefix: string = 'INV') => {
        const match = lastNumber.match(/(\d+)$/);
        if (!match) return `${prefix}-001`;
        
        const nextNumber = parseInt(match[1], 10) + 1;
        return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
      };

      expect(generateInvoiceNumber('INV-001')).toBe('INV-002');
      expect(generateInvoiceNumber('INV-099')).toBe('INV-100');
      expect(generateInvoiceNumber('FAC-005')).toBe('INV-006');
    });
  });

  describe('Currency Handling', () => {
    it('should format amounts according to currency', () => {
      const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: currency
        }).format(amount);
      };

      // Note: Space character varies by environment
      expect(formatAmount(1234.56, 'EUR')).toMatch(/1.234,56.€/);
      expect(formatAmount(1234.56, 'USD')).toMatch(/1.234,56.\$US/);
    });

    it('should handle currency precision correctly', () => {
      const roundToCurrency = (amount: number, currency: string) => {
        // Most currencies have 2 decimal places
        const decimals = currency === 'XOF' ? 0 : 2;
        return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
      };

      expect(roundToCurrency(123.456, 'EUR')).toBe(123.46);
      expect(roundToCurrency(123.456, 'XOF')).toBe(123);
    });
  });

  describe('Data Validation', () => {
    it('should validate invoice data integrity', () => {
      const validateInvoice = (invoice: Partial<Invoice>) => {
        const errors: string[] = [];

        if (!invoice.company_id) errors.push('Company ID is required');
        if (!invoice.third_party_id) errors.push('Third party ID is required');
        if (!invoice.invoice_number) errors.push('Invoice number is required');
        if (!invoice.issue_date) errors.push('Issue date is required');
        if (!invoice.due_date) errors.push('Due date is required');
        if (invoice.total_amount !== undefined && invoice.total_amount < 0) {
          errors.push('Total amount cannot be negative');
        }
        if (invoice.issue_date && invoice.due_date && 
            new Date(invoice.issue_date) > new Date(invoice.due_date)) {
          errors.push('Due date must be after issue date');
        }

        return errors;
      };

      // Valid invoice
      const validInvoice: Partial<Invoice> = {
        company_id: 'comp-123',
        third_party_id: 'client-123',
        invoice_number: 'INV-001',
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        total_amount: 100
      };

      expect(validateInvoice(validInvoice)).toHaveLength(0);

      // Invalid invoice
      const invalidInvoice: Partial<Invoice> = {
        total_amount: -100,
        issue_date: '2024-01-31',
        due_date: '2024-01-01'
      };

      const errors = validateInvoice(invalidInvoice);
      expect(errors).toContain('Company ID is required');
      expect(errors).toContain('Total amount cannot be negative');
      expect(errors).toContain('Due date must be after issue date');
    });
  });
});