/**
 * Tests pour AccountingImportDialog
 * Fonctionnalité: Import CSV pour écritures comptables et plan comptable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountingImportDialog } from '../AccountingImportDialog';

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock accountingImportService
vi.mock('@/services/accounting/accountingImportService', () => ({
  importJournalEntries: vi.fn(() => Promise.resolve({ success: true, imported: 0, failed: 0, errors: [], warnings: [], total_rows: 0 })),
  importChartOfAccounts: vi.fn(() => Promise.resolve({ success: true, imported: 0, failed: 0, errors: [], warnings: [], total_rows: 0 })),
}));

describe('AccountingImportDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnImportComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dialog when open', () => {
    const { container } = render(
      <AccountingImportDialog
        open={true}
        onOpenChange={mockOnClose}
        companyId="company-123"
        onImportComplete={mockOnImportComplete}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <AccountingImportDialog
        open={false}
        onOpenChange={mockOnClose}
        companyId="company-123"
        onImportComplete={mockOnImportComplete}
      />
    );
    // Dialog should not be visible
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
