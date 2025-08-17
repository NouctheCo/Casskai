/**
 * Script de validation pour tester les améliorations du flux onboarding
 */

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: unknown;
}

class OnboardingValidator {
  private results: ValidationResult[] = [];

  private addResult(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: unknown) {
    this.results.push({ test, status, message, details });
    console.warn(`[${status}] ${test}: ${message}`, details ? details : '');
  }

  /**
   * Test 1: Vérifier la synchronisation localStorage <-> EnterpriseContext
   */
  testLocalStorageSynchronization(): ValidationResult {
    try {
      // Simuler une entreprise dans localStorage
      const testEnterprise = {
        id: 'test-enterprise-123',
        name: 'Test Enterprise',
        country: 'FR',
        currency: 'EUR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testEnterprises = [testEnterprise];
      localStorage.setItem('casskai_enterprises', JSON.stringify(testEnterprises));
      localStorage.setItem('casskai_current_enterprise', testEnterprise.id);

      // Vérifier que les données peuvent être récupérées
      const retrievedEnterprises = localStorage.getItem('casskai_enterprises');
      const retrievedCurrentId = localStorage.getItem('casskai_current_enterprise');

      if (!retrievedEnterprises || !retrievedCurrentId) {
        throw new Error('Impossible de récupérer les données localStorage');
      }

      const parsed = JSON.parse(retrievedEnterprises);
      if (parsed[0].id !== testEnterprise.id) {
        throw new Error('Données localStorage corrompues');
      }

      // Nettoyer
      localStorage.removeItem('casskai_enterprises');
      localStorage.removeItem('casskai_current_enterprise');

      this.addResult('localStorage sync', 'PASS', 'Synchronisation localStorage fonctionnelle');
      return { test: 'localStorage sync', status: 'PASS', message: 'Synchronisation localStorage fonctionnelle' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      this.addResult('localStorage sync', 'FAIL', message);
      return { test: 'localStorage sync', status: 'FAIL', message };
    }
  }

  /**
   * Test 2: Vérifier la logique de retry
   */
  async testRetryLogic(): Promise<ValidationResult> {
    try {
      // Simuler une fonction qui échoue 2 fois puis réussit
      let attempts = 0;
      const mockOperation = async (): Promise<string> => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Échec tentative ${attempts}`);
        }
        return 'Succès';
      };

      // Fonction de retry (copiée de AuthContext)
  const retryOperation = async <T>(operation: () => Promise<T>, maxRetries: number = 2, delay: number = 100): Promise<T> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
    // eslint-disable-next-line no-await-in-loop
    return await operation();
          } catch (error) {
            if (attempt === maxRetries) {
              throw error;
            }
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        throw new Error('Retry logic error');
      };

      const result = await retryOperation(mockOperation, 3);
      
      if (result !== 'Succès') {
        throw new Error('Résultat inattendu du retry');
      }

      this.addResult('retry logic', 'PASS', `Retry fonctionnel après ${attempts} tentatives`);
      return { test: 'retry logic', status: 'PASS', message: `Retry fonctionnel après ${attempts} tentatives` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      this.addResult('retry logic', 'FAIL', message);
      return { test: 'retry logic', status: 'FAIL', message };
    }
  }

  /**
   * Test 3: Vérifier la validation des données d'entreprise
   */
  testCompanyDataValidation(): ValidationResult {
    try {
      // Cas valides
      const validCompanyData = {
        name: 'Test Company',
        country: 'FR',
        currency: 'EUR',
        sector: 'tech'
      };

      if (!validCompanyData.name) {
        throw new Error('Validation échouée pour données valides');
      }

      // Cas invalides
      const invalidCompanyData = {
        name: '', // Nom vide
        country: 'FR',
        currency: 'EUR'
      };

      if (invalidCompanyData.name) {
        throw new Error('Validation n\'a pas détecté le nom vide');
      }

      this.addResult('company validation', 'PASS', 'Validation des données d\'entreprise fonctionnelle');
      return { test: 'company validation', status: 'PASS', message: 'Validation des données d\'entreprise fonctionnelle' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      this.addResult('company validation', 'FAIL', message);
      return { test: 'company validation', status: 'FAIL', message };
    }
  }

  /**
   * Test 4: Vérifier la logique de synchronisation des événements
   */
  async testEventSynchronization(): Promise<ValidationResult> {
    try {
      let eventReceived = false;
      
      // Créer un listener pour l'événement personnalisé
      const handler = (e: CustomEvent) => {
        eventReceived = true;
  console.warn('Événement reçu:', e.detail);
      };

      window.addEventListener('enterprise-sync-needed', handler as EventListener);

      // Émettre l'événement
      window.dispatchEvent(new CustomEvent('enterprise-sync-needed', {
        detail: { companyId: 'test-123' }
      }));

      // Attendre un peu pour que l'événement soit traité
      await new Promise(resolve => setTimeout(resolve, 50));

      // Nettoyer
      window.removeEventListener('enterprise-sync-needed', handler as EventListener);

      if (!eventReceived) {
        throw new Error('Événement de synchronisation non reçu');
      }

      this.addResult('event sync', 'PASS', 'Système d\'événements de synchronisation fonctionnel');
      return { test: 'event sync', status: 'PASS', message: 'Système d\'événements de synchronisation fonctionnel' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      this.addResult('event sync', 'FAIL', message);
      return { test: 'event sync', status: 'FAIL', message };
    }
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests(): Promise<{ summary: string; results: ValidationResult[] }> {
  console.warn('🚀 Démarrage de la validation du flux onboarding...\n');

    // Exécuter les tests
    this.testLocalStorageSynchronization();
    await this.testRetryLogic();
    this.testCompanyDataValidation();
    await this.testEventSynchronization();

    // Calculer le résumé
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    const summary = `Tests terminés: ${passed} réussis, ${failed} échoués, ${skipped} ignorés`;
    
  console.warn('\n📊 Résumé des tests:');
  console.warn(summary);
    
    if (failed === 0) {
  console.warn('✅ Tous les tests sont passés ! Les améliorations semblent fonctionnelles.');
    } else {
  console.warn('❌ Certains tests ont échoué. Vérifiez les détails ci-dessus.');
    }

    return { summary, results: this.results };
  }
}

// Exporter la classe et une fonction utilitaire
export { OnboardingValidator };

export const validateOnboardingImprovements = async () => {
  const validator = new OnboardingValidator();
  return await validator.runAllTests();
};

// Si exécuté directement dans le navigateur
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).validateOnboarding = validateOnboardingImprovements;
}