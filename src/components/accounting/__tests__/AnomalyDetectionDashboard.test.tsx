/**
 * Tests pour AnomalyDetectionDashboard
 * Fonctionnalité: Dashboard de détection et résolution des anomalies comptables
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnomalyDetectionDashboard } from '../AnomalyDetectionDashboard';

// Mock des services
vi.mock('@/services/accounting/anomalyDetectionService', () => ({
  detectAllAnomalies: vi.fn(() => Promise.resolve([])),
  getAnomalyStats: vi.fn(() => Promise.resolve({
    total: 0,
    by_severity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    by_type: {},
    by_status: {
      open: 0,
      resolved: 0,
    },
  })),
  resolveAnomaly: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/hooks/useCompany', () => ({
  useCompany: () => ({ currentCompany: { id: 'company-123', name: 'Test Company' } }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AnomalyDetectionDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dashboard without crashing', () => {
    const { container } = render(<AnomalyDetectionDashboard companyId="company-123" periodId="period-123" />);
    expect(container).toBeTruthy();
  });

  it('should render empty state when no anomalies', async () => {
    render(<AnomalyDetectionDashboard companyId="company-123" periodId="period-123" />);

    // Wait for the component to load and display empty state
    await waitFor(() => {
      const emptyMessages = screen.getAllByText(/Aucune anomalie/i);
      expect(emptyMessages.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
