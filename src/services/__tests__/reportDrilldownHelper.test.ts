/**
 * Tests unitaires - Report Drilldown Helper
 * P2-3: Rapports interactifs avec drill-down
 */

import { describe, it, expect } from 'vitest';
import {
  buildAccountDrilldown,
  buildCategoryDrilldown,
  buildDocumentDrilldown,
  buildTransactionDrilldown,
  generateAccountDrilldowns,
  generateDrilldownsWithSections,
  isRowClickable,
  getDrilldownForRow,
  buildDrilldownURL
} from '../reportDrilldownHelper';
import type { DrilldownMetadata } from '../ReportExportService';

describe('reportDrilldownHelper', () => {
  const mockContext = {
    companyId: 'company-123',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    standard: 'PCG' as const
  };

  describe('buildAccountDrilldown', () => {
    it('should create drill-down metadata for account', () => {
      const drilldown = buildAccountDrilldown(
        0,
        '411000',
        'Clients',
        mockContext
      );

      expect(drilldown.row_index).toBe(0);
      expect(drilldown.type).toBe('account');
      expect(drilldown.account_number).toBe('411000');
      expect(drilldown.action).toBe('show_entries');
      expect(drilldown.filters).toEqual({
        company_id: 'company-123',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        account_number: '411000'
      });
      expect(drilldown.label).toContain('411000');
      expect(drilldown.label).toContain('Clients');
    });

    it('should handle account without name', () => {
      const drilldown = buildAccountDrilldown(
        1,
        '512000',
        '',
        mockContext
      );

      expect(drilldown.account_number).toBe('512000');
      expect(drilldown.label).toContain('512000');
      expect(drilldown.label).not.toContain('undefined');
    });
  });

  describe('buildCategoryDrilldown', () => {
    it('should create drill-down for category with prefix', () => {
      const drilldown = buildCategoryDrilldown(
        0,
        'Immobilisations corporelles',
        '21',
        mockContext
      );

      expect(drilldown.type).toBe('category');
      expect(drilldown.filters?.account_prefix).toBe('21');
      expect(drilldown.label).toContain('Immobilisations corporelles');
      expect(drilldown.label).toContain('21');
    });
  });

  describe('buildDocumentDrilldown', () => {
    it('should create drill-down for invoice document', () => {
      const drilldown = buildDocumentDrilldown(
        0,
        'invoice',
        'invoice-123',
        'FAC-2024-001'
      );

      expect(drilldown.type).toBe('document');
      expect(drilldown.action).toBe('show_document');
      expect(drilldown.entity_id).toBe('invoice-123');
      expect(drilldown.filters?.document_type).toBe('invoice');
      expect(drilldown.label).toContain('FAC-2024-001');
    });

    it('should create drill-down for payment document', () => {
      const drilldown = buildDocumentDrilldown(
        1,
        'payment',
        'payment-456',
        'PAY-2024-002'
      );

      expect(drilldown.filters?.document_type).toBe('payment');
      expect(drilldown.entity_id).toBe('payment-456');
    });
  });

  describe('buildTransactionDrilldown', () => {
    it('should create drill-down for specific transaction', () => {
      const drilldown = buildTransactionDrilldown(
        0,
        'je-789',
        'OD-2024-003'
      );

      expect(drilldown.type).toBe('transaction');
      expect(drilldown.action).toBe('show_details');
      expect(drilldown.entity_id).toBe('je-789');
      expect(drilldown.label).toContain('OD-2024-003');
    });
  });

  describe('generateAccountDrilldowns', () => {
    it('should generate drill-downs for all account rows', () => {
      const accounts = [
        { compte: '411000', libelle: 'Clients' },
        { compte: '512000', libelle: 'Banque' },
        { compte: '607000', libelle: 'Achats de marchandises' }
      ];

      const drilldowns = generateAccountDrilldowns(accounts, mockContext);

      expect(drilldowns).toHaveLength(3);
      expect(drilldowns[0].account_number).toBe('411000');
      expect(drilldowns[1].account_number).toBe('512000');
      expect(drilldowns[2].account_number).toBe('607000');
    });

    it('should handle accounts with startIndex offset', () => {
      const accounts = [
        { compte: '411000', libelle: 'Clients' },
        { compte: '512000', libelle: 'Banque' }
      ];

      const drilldowns = generateAccountDrilldowns(accounts, mockContext, 5);

      expect(drilldowns).toHaveLength(2);
      expect(drilldowns[0].account_number).toBe('411000');
      expect(drilldowns[0].row_index).toBe(5);
      expect(drilldowns[1].account_number).toBe('512000');
      expect(drilldowns[1].row_index).toBe(6);
    });
  });

  describe('generateDrilldownsWithSections', () => {
    it('should skip header rows automatically', () => {
      const rows = [
        ['', '--- ACTIF IMMOBILISÉ ---', '', '', ''],
        ['211000', 'Terrains', '100 000 €', '0 €', '100 000 €'],
        ['218000', 'Matériel de bureau', '50 000 €', '10 000 €', '40 000 €'],
        ['', 'Sous-total Immobilisations', '150 000 €', '10 000 €', '140 000 €']
      ];

      const drilldowns = generateDrilldownsWithSections(rows, mockContext);

      // Should only have 2 drill-downs (skip header and subtotal)
      expect(drilldowns).toHaveLength(2);
      expect(drilldowns[0].row_index).toBe(1); // 211000
      expect(drilldowns[1].row_index).toBe(2); // 218000
    });

    it('should skip TOTAL rows', () => {
      const rows = [
        ['607000', 'Achats de marchandises', '2 000 €', '1 500 €'],
        ['', 'TOTAL Charges', '10 000 €', '8 000 €']
      ];

      const drilldowns = generateDrilldownsWithSections(rows, mockContext);

      expect(drilldowns).toHaveLength(1);
      expect(drilldowns[0].row_index).toBe(0);
      expect(drilldowns[0].account_number).toBe('607000');
    });

    it('should skip rows with empty account number', () => {
      const rows = [
        ['411000', 'Clients', '10 000 €'],
        ['', 'Section title', ''],
        ['512000', 'Banque', '5 000 €']
      ];

      const drilldowns = generateDrilldownsWithSections(rows, mockContext);

      expect(drilldowns).toHaveLength(2);
      expect(drilldowns[0].account_number).toBe('411000');
      expect(drilldowns[1].account_number).toBe('512000');
    });

    it('should skip rows with dashes in second column', () => {
      const rows = [
        ['', '--- ACTIF ---', '', ''],
        ['211000', 'Terrains', '100 000 €', '100 000 €'],
        ['', '--- PASSIF ---', '', ''],
        ['101000', 'Capital', '50 000 €', '50 000 €']
      ];

      const drilldowns = generateDrilldownsWithSections(rows, mockContext);

      expect(drilldowns).toHaveLength(2);
      expect(drilldowns[0].account_number).toBe('211000');
      expect(drilldowns[1].account_number).toBe('101000');
    });
  });

  describe('isRowClickable', () => {
    it('should return true if drill-down exists for row index', () => {
      const drilldowns: DrilldownMetadata[] = [
        {
          row_index: 0,
          type: 'account',
          account_number: '411000',
          action: 'show_entries'
        }
      ];

      expect(isRowClickable(0, drilldowns)).toBe(true);
    });

    it('should return false if no drill-down for row index', () => {
      const drilldowns: DrilldownMetadata[] = [
        {
          row_index: 0,
          type: 'account',
          account_number: '411000',
          action: 'show_entries'
        }
      ];

      expect(isRowClickable(5, drilldowns)).toBe(false);
    });

    it('should return false if drilldowns is undefined', () => {
      expect(isRowClickable(0, undefined)).toBe(false);
    });

    it('should return false if drilldowns is empty', () => {
      expect(isRowClickable(0, [])).toBe(false);
    });
  });

  describe('getDrilldownForRow', () => {
    it('should return drill-down for matching row index', () => {
      const drilldowns: DrilldownMetadata[] = [
        { row_index: 0, type: 'account', account_number: '411000', action: 'show_entries' },
        { row_index: 1, type: 'account', account_number: '512000', action: 'show_entries' },
        { row_index: 2, type: 'account', account_number: '607000', action: 'show_entries' }
      ];

      const drilldown = getDrilldownForRow(1, drilldowns);

      expect(drilldown).toBeDefined();
      expect(drilldown?.account_number).toBe('512000');
    });

    it('should return undefined if no matching row index', () => {
      const drilldowns: DrilldownMetadata[] = [
        { row_index: 0, type: 'account', account_number: '411000', action: 'show_entries' }
      ];

      const drilldown = getDrilldownForRow(5, drilldowns);

      expect(drilldown).toBeUndefined();
    });

    it('should return undefined if drilldowns array is undefined', () => {
      const drilldown = getDrilldownForRow(0, undefined);

      expect(drilldown).toBeUndefined();
    });
  });

  describe('buildDrilldownURL', () => {
    it('should build URL for account drill-down', () => {
      const drilldown: DrilldownMetadata = {
        row_index: 0,
        type: 'account',
        account_number: '411000',
        action: 'show_entries',
        filters: {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          account_number: '411000'
        }
      };

      const url = buildDrilldownURL(drilldown);

      expect(url).toContain('/accounting/entries');
      expect(url).toContain('account_number=411000');
      expect(url).toContain('start_date=2024-01-01');
      expect(url).toContain('end_date=2024-12-31');
    });

    it('should build URL for invoice document drill-down', () => {
      const drilldown: DrilldownMetadata = {
        row_index: 0,
        type: 'document',
        entity_id: 'invoice-123',
        action: 'show_document',
        filters: {
          document_type: 'invoice'
        }
      };

      const url = buildDrilldownURL(drilldown);

      expect(url).toContain('/invoicing/invoices/');
      expect(url).toContain('invoice-123');
    });

    it('should build URL for payment document drill-down', () => {
      const drilldown: DrilldownMetadata = {
        row_index: 0,
        type: 'document',
        entity_id: 'payment-456',
        action: 'show_document',
        filters: {
          document_type: 'payment'
        }
      };

      const url = buildDrilldownURL(drilldown);

      expect(url).toContain('/invoicing/payments');
      expect(url).toContain('payment-456');
    });

    it('should build URL for transaction drill-down', () => {
      const drilldown: DrilldownMetadata = {
        row_index: 0,
        type: 'transaction',
        entity_id: 'je-789',
        action: 'show_details'
      };

      const url = buildDrilldownURL(drilldown);

      expect(url).toContain('/accounting/entries');
      expect(url).toContain('je-789');
    });

    it('should build URL for category drill-down', () => {
      const drilldown: DrilldownMetadata = {
        row_index: 0,
        type: 'category',
        action: 'show_entries',
        filters: {
          account_prefix: '21',
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      };

      const url = buildDrilldownURL(drilldown);

      expect(url).toContain('/accounting/entries');
      expect(url).toContain('account_prefix=21');
      expect(url).toContain('start_date=2024-01-01');
      expect(url).toContain('end_date=2024-12-31');
    });

    it('should handle drill-down without filters', () => {
      const drilldown: DrilldownMetadata = {
        row_index: 0,
        type: 'account',
        account_number: '411000',
        action: 'show_entries'
      };

      const url = buildDrilldownURL(drilldown);

      expect(url).toContain('/accounting/entries');
    });
  });
});
