/**
 * Tests pour WorkflowActions
 * Fonctionnalité: Actions de workflow de validation multi-niveaux pour les écritures comptables
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WorkflowActions } from '../WorkflowActions';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve({ data: { success: true }, error: null })),
  },
}));

// Mock useToast
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('WorkflowActions', () => {
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with draft status', () => {
    const { container } = render(
      <WorkflowActions
        entryId="entry-123"
        companyId="company-123"
        currentStatus="draft"
        onStatusChange={mockOnStatusChange}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render with review status', () => {
    const { container } = render(
      <WorkflowActions
        entryId="entry-123"
        companyId="company-123"
        currentStatus="review"
        onStatusChange={mockOnStatusChange}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render with validated status', () => {
    const { container } = render(
      <WorkflowActions
        entryId="entry-123"
        companyId="company-123"
        currentStatus="validated"
        onStatusChange={mockOnStatusChange}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render with posted status', () => {
    const { container } = render(
      <WorkflowActions
        entryId="entry-123"
        companyId="company-123"
        currentStatus="posted"
        onStatusChange={mockOnStatusChange}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render in compact mode', () => {
    const { container } = render(
      <WorkflowActions
        entryId="entry-123"
        companyId="company-123"
        currentStatus="draft"
        compact={true}
        onStatusChange={mockOnStatusChange}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render when locked', () => {
    const { container } = render(
      <WorkflowActions
        entryId="entry-123"
        companyId="company-123"
        currentStatus="draft"
        isLocked={true}
        onStatusChange={mockOnStatusChange}
      />
    );
    expect(container).toBeTruthy();
  });
});
