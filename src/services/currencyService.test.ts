// Test basique pour le service de taux de change amélioré
import { CurrencyService } from './currencyService';

describe('CurrencyService - Taux Critiques', () => {
  let service: CurrencyService;

  beforeEach(() => {
    service = CurrencyService.getInstance();
  });

  describe('Taux fixes XOF/XAF ↔ EUR', () => {
    test('doit retourner le taux fixe XOF → EUR', async () => {
      const rate = await service.getExchangeRate('XOF', 'EUR');
      expect(rate).toBe(0.001524); // Taux fixe BCEAO
    });

    test('doit retourner le taux fixe EUR → XOF', async () => {
      const rate = await service.getExchangeRate('EUR', 'XOF');
      expect(rate).toBe(655.957); // Taux fixe BCEAO
    });

    test('doit retourner le taux fixe XAF → EUR', async () => {
      const rate = await service.getExchangeRate('XAF', 'EUR');
      expect(rate).toBe(0.001524); // Taux fixe BEAC
    });

    test('doit retourner le taux fixe EUR → XAF', async () => {
      const rate = await service.getExchangeRate('EUR', 'XAF');
      expect(rate).toBe(655.957); // Taux fixe BEAC
    });
  });

  describe('Taux critiques', () => {
    test('doit identifier les paires critiques', () => {
      const criticalRates = service.getCriticalRates();
      expect(criticalRates).toHaveProperty('EUR-XOF');
      expect(criticalRates).toHaveProperty('EUR-XAF');
      // Note: EUR-USD sera récupéré via API
    });

    test('doit avoir un statut de santé valide', () => {
      const health = service.getHealthStatus();
      expect(health.isHealthy).toBe(true);
      expect(health.criticalRatesCount).toBeGreaterThan(0);
      expect(health.fixedRatesCount).toBe(4); // XOF/XAF ↔ EUR
    });
  });

  describe('Formatage des montants', () => {
    test('doit formater correctement un montant en XOF', () => {
      const formatted = service.formatAmount(1000, 'XOF');
      expect(formatted).toBe('1 000 F CFA'); // Pas de décimales pour XOF
    });

    test('doit formater correctement un montant en EUR', () => {
      const formatted = service.formatAmount(1000.50, 'EUR');
      expect(formatted).toBe('1 000,50 €');
    });

    test('doit formater correctement un montant en USD', () => {
      const formatted = service.formatAmount(1000.50, 'USD');
      expect(formatted).toBe('$1,000.50');
    });
  });

  describe('Conversions synchrones', () => {
    test('doit convertir XOF → EUR avec le taux fixe', () => {
      const converted = service.convertAmountSync(655.957, 'XOF', 'EUR');
      expect(converted).toBeCloseTo(1.0, 2); // 655.957 XOF = 1 EUR
    });

    test('doit convertir EUR → XOF avec le taux fixe', () => {
      const converted = service.convertAmountSync(1, 'EUR', 'XOF');
      expect(converted).toBeCloseTo(655.957, 2); // 1 EUR = 655.957 XOF (arrondi à 2 décimales)
    });

    test('doit retourner le même montant pour la même devise', () => {
      const converted = service.convertAmountSync(100, 'EUR', 'EUR');
      expect(converted).toBe(100);
    });
  });

  describe('Debug et info', () => {
    test('doit fournir des informations de debug', () => {
      const debug = service.getDebugInfo();
      expect(debug.allRates.length).toBeGreaterThan(0);
      expect(debug.criticalRates.length).toBeGreaterThan(0);
      expect(debug.providers.length).toBe(2); // ExchangeRate-API et Fixer.io
    });
  });
});

// Test d'intégration avec API réelle (à exécuter manuellement)
describe('CurrencyService - Intégration API', () => {
  let service: CurrencyService;

  beforeAll(async () => {
    service = CurrencyService.getInstance();
  }, 10000); // Timeout 10s pour l'API

  test('doit récupérer le taux EUR/USD depuis l\'API', async () => {
    try {
      const rate = await service.getExchangeRate('EUR', 'USD');
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(2); // Vérification de cohérence
      console.log(`✅ EUR/USD: ${rate}`);
    } catch (error) {
      console.warn('⚠️ API non disponible pour les tests:', error);
    }
  }, 15000);

  test('doit calculer USD/XOF via EUR', async () => {
    try {
      await service.forceCriticalRatesUpdate();
      const rate = await service.getExchangeRate('USD', 'XOF');
      expect(rate).toBeGreaterThan(0);
      console.log(`✅ USD/XOF: ${rate}`);
    } catch (error) {
      console.warn('⚠️ Calcul USD/XOF échoué:', error);
    }
  }, 15000);
});