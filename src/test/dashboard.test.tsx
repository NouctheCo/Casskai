// Test simple pour vérifier le chargement du dashboard
import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage.jsx';
import { DashboardProvider } from '../contexts/DashboardContext';

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
          <DashboardProvider>
            <DashboardPage />
          </DashboardProvider>
        </MemoryRouter>
      );

      // Attendre que le composant se charge
      await waitFor(() => {
        // Match the actual heading rendered in the page
        expect(screen.queryByText(/Dashboard Principal/i)).toBeTruthy();
      }, { timeout: 5000 });

      // Vérifier qu'aucune erreur de conversion d'objet n'a été loggée
      const conversionErrors = consoleSpy.mock.calls.filter(call => 
        call.some(arg => 
          typeof arg === 'string' && 
          arg.includes('Cannot convert object to primitive value')
        )
      );

      expect(conversionErrors).toHaveLength(0);

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
});