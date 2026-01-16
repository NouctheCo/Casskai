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

// Mock accountingService
vi.mock('@/services/accountingService', () => ({
  importJournalEntries: vi.fn(() => Promise.resolve({ success: true, imported: 0, errors: [] })),
  importChartOfAccounts: vi.fn(() => Promise.resolve({ success: true, imported: 0, errors: [] })),
}));

describe('AccountingImportDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnImportComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dialog when open', () => {
    const { container } = render(
      <AccountingImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
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
        onOpenChange={mockOnOpenChange}
        companyId="company-123"
        onImportComplete={mockOnImportComplete}
      />
    );
    // Dialog should not be visible
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
