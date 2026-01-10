/**
 * Tests pour SecurityLogsDashboard
 * Fonctionnalité: Dashboard de visualisation et filtrage des logs de sécurité
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SecurityLogsDashboard } from '../SecurityLogsDashboard';

// Mock du service de logs de sécurité
vi.mock('@/services/securityLogService', () => ({
  searchSecurityLogs: vi.fn(() => Promise.resolve([])),
  getSecurityStats: vi.fn(() => Promise.resolve({
    totalLogs: 0,
    criticalCount: 0,
    errorCount: 0,
    uniqueUsers: 0,
  })),
}));

// Mock useToast
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('SecurityLogsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dashboard without crashing', () => {
    const { container } = render(<SecurityLogsDashboard companyId="company-123" />);
    expect(container).toBeTruthy();
  });

  it('should display the title', async () => {
    render(<SecurityLogsDashboard companyId="company-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Security Logs/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no logs', async () => {
    render(<SecurityLogsDashboard companyId="company-123" />);

    await waitFor(() => {
      expect(screen.getByText(/No logs found/i)).toBeInTheDocument();
    });
  });

  it('should render statistics cards', async () => {
    render(<SecurityLogsDashboard companyId="company-123" />);

    await waitFor(() => {
      // Check that stat cards are rendered (they show "0" for empty state)
      expect(screen.getByText(/Total Events/i)).toBeInTheDocument();
      expect(screen.getByText(/Critical/i)).toBeInTheDocument();
      expect(screen.getByText(/Errors/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Users/i)).toBeInTheDocument();
    });
  });

  it('should have filters', async () => {
    render(<SecurityLogsDashboard companyId="company-123" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Severity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });
  });

  it('should have search input', async () => {
    render(<SecurityLogsDashboard companyId="company-123" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search logs/i)).toBeInTheDocument();
    });
  });

  it('should have export button', async () => {
    render(<SecurityLogsDashboard companyId="company-123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    });
  });
});
