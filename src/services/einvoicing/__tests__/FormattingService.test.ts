// @ts-nocheck
/** @vitest-environment node */

/**
 * FormattingService Unit Tests
 * Test suite for document formatting to various e-invoicing formats
 */

import { FormattingService } from '../core/FormattingService';
import { EN16931Invoice } from '../../../types/einvoicing.types';

describe('FormattingService', () => {
  let formattingService: FormattingService;

  beforeEach(() => {
    formattingService = new FormattingService();
  });

  const createTestInvoice = (): EN16931Invoice => ({
    invoice_number: 'TEST-2024-001',
    issue_date: '2024-01-15',
    type_code: '380',
    currency_code: 'EUR',
    seller: {
      name: 'Test Company SARL',
      address: {
        street_name: '123 Rue de Test',
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
        street_name: '456 Avenue Client',
        city_name: 'Lyon',
        postal_zone: '69000',
        country_code: 'FR'
      },
      vat_identifier: 'FR98765432109'
    },
    lines: [
      {
        id: '1',
        name: 'Service de développement',
        description: 'Développement application web',
        quantity: 10,
        unit_code: 'HUR',
        net_price: 100.00,
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

  describe('formatDocument', () => {
    it('should format invoice as Factur-X', async () => {
      const invoice = createTestInvoice();
      
      const result = await formattingService.formatDocument(invoice, 'FACTURX');

      expect(result).toBeDefined();
      expect(result.format).toBe('FACTURX');
      expect(result.xml_content).toContain('CrossIndustryInvoice');
      expect(result.xml_content).toContain('TEST-2024-001');
      expect(result.pdf_content).toBeDefined();
      expect(result.sha256_xml).toBeDefined();
      expect(result.sha256_pdf).toBeDefined();
      expect(result.metadata?.format_version).toBe('1.0.7');
    });

    it('should format invoice as UBL', async () => {
      const invoice = createTestInvoice();
      
      const result = await formattingService.formatDocument(invoice, 'UBL');

      expect(result).toBeDefined();
      expect(result.format).toBe('UBL');
      expect(result.xml_content).toContain('<Invoice');
      expect(result.xml_content).toContain('urn:oasis:names:specification:ubl:schema:xsd:Invoice-2');
      expect(result.xml_content).toContain('TEST-2024-001');
      expect(result.pdf_content).toBeUndefined(); // UBL doesn't include PDF
      expect(result.sha256_xml).toBeDefined();
      expect(result.metadata?.format_version).toBe('2.1');
    });

    it('should format invoice as CII', async () => {
      const invoice = createTestInvoice();
      
      const result = await formattingService.formatDocument(invoice, 'CII');

      expect(result).toBeDefined();
      expect(result.format).toBe('CII');
      expect(result.xml_content).toContain('CrossIndustryInvoice');
      expect(result.xml_content).toContain('urn:un:unece:uncefact:data:standard:CrossIndustryInvoice');
      expect(result.xml_content).toContain('TEST-2024-001');
      expect(result.pdf_content).toBeUndefined(); // CII doesn't include PDF
      expect(result.sha256_xml).toBeDefined();
      expect(result.metadata?.format_version).toBe('D16B');
    });

    it('should reject unsupported format', async () => {
      const invoice = createTestInvoice();
      
      await expect(
        formattingService.formatDocument(invoice, 'UNSUPPORTED' as any)
      ).rejects.toThrow('Unsupported format: UNSUPPORTED');
    });

    it('should generate correct hashes', async () => {
      const invoice = createTestInvoice();
      
      const result = await formattingService.formatDocument(invoice, 'UBL');

      expect(result.sha256_xml).toMatch(/^[a-f0-9]{64}$/);
      expect(result.sha256_xml).toBe(
        require('crypto').createHash('sha256').update(result.xml_content, 'utf8').digest('hex')
      );
    });

    it('should include metadata', async () => {
      const invoice = createTestInvoice();
      
      const result = await formattingService.formatDocument(invoice, 'FACTURX');

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.invoice_number).toBe('TEST-2024-001');
      expect(result.metadata!.generated_at).toBeDefined();
      expect(result.metadata!.format_version).toBe('1.0.7');
    });
  });

  describe('UBL formatting', () => {
    it('should include all required UBL elements', async () => {
      const invoice = createTestInvoice();
      
      const result = await formattingService.formatDocument(invoice, 'UBL');
      const xml = result.xml_content;

      // Check required elements
      expect(xml).toContain('<cbc:ID>TEST-2024-001</cbc:ID>');
      expect(xml).toContain('<cbc:IssueDate>2024-01-15</cbc:IssueDate>');
      expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
      expect(xml).toContain('<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>');
      
      // Check parties
      expect(xml).toContain('<cac:AccountingSupplierParty>');
      expect(xml).toContain('<cac:AccountingCustomerParty>');
      expect(xml).toContain('Test Company SARL');
      expect(xml).toContain('Client Test SAS');
      
      // Check lines
      expect(xml).toContain('<cac:InvoiceLine>');
      expect(xml).toContain('Service de développement');
      expect(xml).toContain('<cbc:InvoicedQuantity unitCode="HUR">10</cbc:InvoicedQuantity>');
      
      // Check totals
      expect(xml).toContain('<cac:LegalMonetaryTotal>');
      expect(xml).toContain('<cbc:TaxInclusiveAmount currencyID="EUR">1200.00</cbc:TaxInclusiveAmount>');
    });

    it('should handle VAT information correctly', async () => {
      const invoice = createTestInvoice();
      
      const result = await formattingService.formatDocument(invoice, 'UBL');
      const xml = result.xml_content;

      expect(xml).toContain('<cac:TaxTotal>');
      expect(xml).toContain('<cbc:TaxAmount currencyID="EUR">200.00</cbc:TaxAmount>');
      expect(xml).toContain('<cac:TaxSubtotal>');
      expect(xml).toContain('<cbc:Percent>20.00</cbc:Percent>');
    });

    it('should handle optional fields properly', async () => {
      const invoice = createTestInvoice();
      invoice.references = {
        buyer_reference: 'PO-2024-001',
        project_reference: 'PROJECT-123'
      };
      invoice.notes = ['Test note', 'Additional information'];
      
      const result = await formattingService.formatDocument(invoice, 'UBL');
      const xml = result.xml_content;

      expect(xml).toContain('<cbc:BuyerReference>PO-2024-001</cbc:BuyerReference>');
      expect(xml).toContain('<cbc:Note>Test note</cbc:Note>');
      expect(xml).toContain('<cbc:Note>Additional information</cbc:Note>');
    });
  });

  describe('CII formatting', () => {
    it('should include all required CII elements', async () => {
      const invoice = createTestInvoice();
      
      const result = await formattingService.formatDocument(invoice, 'CII');
      const xml = result.xml_content;

      // Check document structure
      expect(xml).toContain('<rsm:CrossIndustryInvoice');
      expect(xml).toContain('<rsm:ExchangedDocumentContext>');
      expect(xml).toContain('<rsm:ExchangedDocument>');
      expect(xml).toContain('<rsm:SupplyChainTradeTransaction>');
      
      // Check document info
      expect(xml).toContain('<ram:ID>TEST-2024-001</ram:ID>');
      expect(xml).toContain('<ram:TypeCode>380</ram:TypeCode>');
      expect(xml).toContain('<udt:DateTimeString format="102">20240115</udt:DateTimeString>');
      
      // Check parties
      expect(xml).toContain('<ram:SellerTradeParty>');
      expect(xml).toContain('<ram:BuyerTradeParty>');
      expect(xml).toContain('Test Company SARL');
      expect(xml).toContain('Client Test SAS');
    });

    it('should format dates correctly in CII', async () => {
      const invoice = createTestInvoice();
      invoice.tax_point_date = '2024-01-20';
      
      const result = await formattingService.formatDocument(invoice, 'CII');
      const xml = result.xml_content;

      expect(xml).toContain('<udt:DateTimeString format="102">20240115</udt:DateTimeString>'); // Issue date
      expect(xml).toContain('<udt:DateTimeString format="102">20240120</udt:DateTimeString>'); // Tax point date
    });

    it('should handle trade settlement correctly', async () => {
      const invoice = createTestInvoice();
      
      const result = await formattingService.formatDocument(invoice, 'CII');
      const xml = result.xml_content;

      expect(xml).toContain('<ram:ApplicableHeaderTradeSettlement>');
      expect(xml).toContain('<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>');
      expect(xml).toContain('<ram:SpecifiedTradeSettlementHeaderMonetarySummation>');
      expect(xml).toContain('<ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid invoice data gracefully', async () => {
      const invalidInvoice = {} as EN16931Invoice;
      
      await expect(
        formattingService.formatDocument(invalidInvoice, 'UBL')
      ).rejects.toThrow('Failed to format document as UBL');
    });

    it('should provide context in error messages', async () => {
      const invoice = createTestInvoice();
      invoice.invoice_number = undefined as any;
      
      try {
        await formattingService.formatDocument(invoice, 'FACTURX');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Failed to format document as FACTURX');
        expect(error.context).toBeDefined();
        expect(error.context.format).toBe('FACTURX');
      }
    });
  });

  describe('XML escaping', () => {
    it('should properly escape XML special characters', async () => {
      const invoice = createTestInvoice();
      invoice.seller.name = 'Company <Test> & "Associates"';
      invoice.lines[0].description = 'Service with special chars: <>&"\'';
      
      const result = await formattingService.formatDocument(invoice, 'UBL');
      const xml = result.xml_content;

      expect(xml).toContain('Company &lt;Test&gt; &amp; &quot;Associates&quot;');
      expect(xml).toContain('Service with special chars: &lt;&gt;&amp;&quot;&apos;');
      expect(xml).not.toContain('Company <Test> & "Associates"');
    });
  });
});
