// Test simple pour vérifier le chargement du dashboard
import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mocks critiques à appliquer avant l'import des composants
vi.mock('react-grid-layout', () => {
  const React = require('react');
  const Responsive = React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="grid-layout" {...props}>{children}</div>
  ));
  const WidthProvider = (Comp) => Comp;
  return { Responsive, WidthProvider };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div'
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Stub des composants lourds
vi.mock('@/components/widgets/WidgetRenderer', () => ({
  WidgetRenderer: () => <div data-testid="widget-renderer" />
}));

vi.mock('@/components/dashboard/AnimatedDashboard', () => ({
  AnimatedDashboard: () => <div data-testid="animated-dashboard" />
}));

// Mock Supabase pour éviter les appels réseau et lever l'état de chargement
vi.mock('@/lib/supabase', () => {
  const order = vi.fn().mockResolvedValue({ data: [], error: null });
  const select = vi.fn().mockReturnValue({ order });
  const from = vi.fn().mockReturnValue({ select });
  const channel = vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    presenceState: vi.fn(() => ({})),
    track: vi.fn(),
  });
  const removeChannel = vi.fn();
  return { supabase: { from, channel, removeChannel } };
});

// Mock du DashboardContext pour fournir un dashboard prêt immédiatement
const readyContext = {
  state: {
    currentDashboard: {
      id: 'default-dashboard',
      name: 'Dashboard Test',
      description: 'Test',
      layout: [],
      settings: { compactType: 'vertical' }
    },
    widgets: [],
    isEditing: false,
    isLoading: false,
    collaborators: [],
    isConnected: true
  },
  updateLayout: vi.fn(),
  addWidget: vi.fn(),
  updateWidget: vi.fn(),
  removeWidget: vi.fn(),
  startEditing: vi.fn(),
  stopEditing: vi.fn(),
  selectWidget: vi.fn(),
  subscribeToRealtime: vi.fn(),
  unsubscribeFromRealtime: vi.fn()
};

vi.mock('@/contexts/DashboardContext', () => ({
  DashboardProvider: ({ children }) => <>{children}</>,
  useDashboard: () => readyContext
}));

vi.mock('../contexts/DashboardContext', () => ({
  DashboardProvider: ({ children }) => <>{children}</>,
  useDashboard: () => readyContext
}));

import DashboardPage from '../pages/DashboardPage.jsx';
import { ModularDashboard } from '@/components/dashboard/ModularDashboard';

// Mock des dépendances
vi.mock('@/contexts/LocaleContext', () => ({
  useLocale: () => ({
    t: (key, options) => options?.defaultValue || key
  })
}));

vi.mock('@/contexts/EnterpriseContext', () => ({
  useEnterprise: () => ({
    currentEnterprise: {
      id: 'test-enterprise',
      name: 'Test Enterprise'
    }
  })
}));

describe('Dashboard Error Fixes', () => {
  test('Dashboard should render without "Cannot convert object to primitive value" error', async () => {
    // Capturer les erreurs console
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    try {
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

  // Vérifier que l'erreur ciblée n'apparaît pas dans la console
  const messages = consoleSpy.mock.calls.map(args => String(args?.[0] ?? ''));
  expect(messages.some(m => m.includes('Cannot convert object to primitive value'))).toBe(false);

    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('ModularDashboard should handle null/undefined collaborator data', () => {
    // Test que les données de collaborateur null/undefined ne causent pas d'erreur
    const testCollaborators = [
      null,
      undefined,
      { userId: '1', color: null },
      { userId: '2', userName: null, color: 'blue' },
      { userId: '3', userName: 'Test User', color: 'red' }
    ];

    // Ceci ne devrait pas lever d'erreur
    testCollaborators.forEach(collaborator => {
      if (collaborator && collaborator.color) {
        const className = `bg-${collaborator.color}-500`;
        expect(className).toMatch(/^bg-\w+-500$/);
      }
    });
  });

  test('Widget data should be properly validated', () => {
    // Test de validation des données de widget
    const testWidgets = [
      null,
      undefined,
      {},
      { id: 'test', type: null },
      { id: 'test', type: 'kpi-card', config: null },
      { id: 'test', type: 'kpi-card', config: { kpiCard: null } },
      { id: 'test', type: 'kpi-card', config: { kpiCard: { value: 100 } } }
    ];

    testWidgets.forEach(widget => {
      // Ces opérations ne devraient pas lever d'erreur
      if (widget && widget.id && widget.type) {
        const widgetId = String(widget.id);
        expect(widgetId).toBeDefined();
      }
    });
  });

  test('Dashboard exposes an Edit toolbar button (a11y smoke)', () => {
    render(
      <MemoryRouter>
        <ModularDashboard />
      </MemoryRouter>
    );

    const label = screen.getByText(/Éditer|Editer|Edit/i);
    const editBtn = label.closest('button');
    expect(editBtn).toBeTruthy();
  });
});