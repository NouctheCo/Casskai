/**
 * Gestionnaire de cache pour CassKai
 * Gère la synchronisation entre localStorage et Supabase
 */

export class CacheManager {
  private static readonly ENTERPRISES_KEY = 'casskai_enterprises';
  private static readonly CURRENT_ENTERPRISE_KEY = 'casskai_current_enterprise';
  private static readonly AUTH_TOKEN_KEY = 'supabase.auth.token';
  private static readonly ONBOARDING_STATE_KEY = 'casskai_onboarding_state';

  /**
   * Nettoie complètement le cache localStorage
   */
  static clearAll(): void {
    console.log('🧹 Nettoyage complet du cache localStorage...');

    const keysToRemove = [
      this.ENTERPRISES_KEY,
      this.CURRENT_ENTERPRISE_KEY,
      this.AUTH_TOKEN_KEY,
      this.ONBOARDING_STATE_KEY
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`   ✅ ${key} supprimé`);
    });

    // Aussi nettoyer toutes les clés Supabase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('casskai_')) {
        localStorage.removeItem(key);
        console.log(`   ✅ ${key} supprimé`);
      }
    });

    console.log('✅ Cache localStorage nettoyé');
  }

  /**
   * Nettoie seulement le cache des entreprises
   */
  static clearEnterprises(): void {
    console.log('🏢 Nettoyage du cache des entreprises...');

    localStorage.removeItem(this.ENTERPRISES_KEY);
    localStorage.removeItem(this.CURRENT_ENTERPRISE_KEY);

    console.log('✅ Cache des entreprises nettoyé');
  }

  /**
   * Force le rechargement de la page après nettoyage
   */
  static clearAndReload(): void {
    this.clearAll();

    console.log('🔄 Rechargement de la page...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  /**
   * Vérifie s'il y a des données en cache qui pourraient être obsolètes
   */
  static hasObsoleteCache(): boolean {
    const enterprises = localStorage.getItem(this.ENTERPRISES_KEY);
    const currentEnterprise = localStorage.getItem(this.CURRENT_ENTERPRISE_KEY);

    return !!(enterprises || currentEnterprise);
  }

  /**
   * Obtient un rapport de l'état du cache
   */
  static getCacheReport(): {
    hasEnterprises: boolean;
    hasCurrentEnterprise: boolean;
    enterprisesCount: number;
    lastModified: string | null;
  } {
    const enterprisesRaw = localStorage.getItem(this.ENTERPRISES_KEY);
    const currentEnterprise = localStorage.getItem(this.CURRENT_ENTERPRISE_KEY);

    let enterprisesCount = 0;
    if (enterprisesRaw) {
      try {
        const enterprises = JSON.parse(enterprisesRaw);
        enterprisesCount = Array.isArray(enterprises) ? enterprises.length : 0;
      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn('Erreur parsing enterprises cache:', errorMsg);
      }
    }

    return {
      hasEnterprises: !!enterprisesRaw,
      hasCurrentEnterprise: !!currentEnterprise,
      enterprisesCount,
      lastModified: null // Pourrait être ajouté plus tard
    };
  }

  /**
   * Valide la cohérence du cache
   */
  static validateCache(): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    const enterprisesRaw = localStorage.getItem(this.ENTERPRISES_KEY);
    const currentEnterpriseId = localStorage.getItem(this.CURRENT_ENTERPRISE_KEY);

    if (enterprisesRaw) {
      try {
        const enterprises = JSON.parse(enterprisesRaw);

        if (!Array.isArray(enterprises)) {
          issues.push('Format du cache enterprises invalide');
        }

        if (currentEnterpriseId) {
          const currentExists = enterprises.some((e: any) => e.id === currentEnterpriseId);
          if (!currentExists) {
            issues.push('Entreprise courante introuvable dans la liste');
          }
        }

      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        issues.push(`Cache enterprises corrompu (JSON invalide): ${errorMsg}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Déclenche un événement de rafraîchissement pour forcer la synchronisation
   */
  static triggerEnterpriseRefresh(): void {
    console.log('🔄 Déclenchement d\'un rafraîchissement du contexte Enterprise...');

    // Déclencher l'événement que l'EnterpriseContext écoute
    const event = new CustomEvent('enterpriseContextRefresh');
    window.dispatchEvent(event);
  }

  /**
   * Nettoyage intelligent : nettoie et force la synchronisation
   */
  static smartClean(): void {
    console.log('🧠 Nettoyage intelligent du cache...');

    const report = this.getCacheReport();
    const validation = this.validateCache();

    console.log('📊 Rapport du cache:', report);
    console.log('✅ Validation:', validation);

    if (!validation.isValid || report.hasEnterprises) {
      console.log('🧹 Nettoyage nécessaire...');
      this.clearEnterprises();
      this.triggerEnterpriseRefresh();
    } else {
      console.log('✅ Cache propre, aucun nettoyage nécessaire');
    }
  }
}