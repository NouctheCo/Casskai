// Dev-only API shims: intercept certain backend API calls during local development
// This file is imported early from src/main.tsx when running in `import.meta.env.DEV`.
import { logger } from '@/lib/logger';
if (import.meta.env.DEV) {
  try {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
        const pathname = url.startsWith('/') ? url : new URL(url, window.location.origin).pathname;
        // Intercept backend AI route used by frontend during dev
        if (pathname === '/api/openai/chat' && (!init || (init && init.method && init.method.toUpperCase() === 'POST'))) {
          // Minimal mock response matching backend `{ content: JSON.stringify(...) }` shape
          const mockAnalysis = {
            executive_summary: 'Analyse synthétique (mode développement). Données insuffisantes pour un diagnostic complet.',
            key_insights: ['Données mock — vérifiez l\'intégration en local'],
            strategic_recommendations: ['Vérifier la source des KPIs et relancer l\'analyse en production'],
            risk_factors: ['Aucun risque réel (réponse factice)'],
            opportunities: ['Utiliser la version complète en prod pour recommandations réelles'],
            action_items: [
              { priority: 'low', action: 'Confirmer la disponibilité de l\'API OpenAI en production', expected_impact: 'Permettre analyses complètes' }
            ]
          };
          const payload = { content: JSON.stringify(mockAnalysis) };
          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (_err) {
        // ignore and fallback to original fetch
      }
      return originalFetch(input, init);
    };
    logger.info('devApiShims', 'Dev API shim active: /api/openai/chat is mocked in dev');
  } catch (err) {
    logger.warn('devApiShims', 'Failed to install dev API shims:', err);
  }
}
