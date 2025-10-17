import { STORAGE_KEYS, removeAllUserScopedEntriesForKey } from "@/utils/userStorage";
import { logger } from '@/utils/logger';

/**
 * Gestionnaire de cache pour CassKai
 * Gère la synchronisation entre localStorage et Supabase
 */
export class CacheManager {
  private static readonly ENTERPRISES_KEY = STORAGE_KEYS.ENTERPRISES;
  private static readonly CURRENT_ENTERPRISE_KEY = STORAGE_KEYS.CURRENT_ENTERPRISE;
  private static readonly AUTH_TOKEN_KEY = "supabase.auth.token";
  private static readonly ONBOARDING_STATE_KEY = "casskai_onboarding_state";

  private static getScopedKeys(baseKey: string): string[] {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }

    const keys: string[] = [];
    const prefix = `${baseKey}::`;

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && (key === baseKey || key.startsWith(prefix))) {
        keys.push(key);
      }
    }

    return keys;
  }

  static clearAll(): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    logger.info("?? Nettoyage complet du cache localStorage...");

    const scopedKeys = [
      STORAGE_KEYS.ENTERPRISES,
      STORAGE_KEYS.CURRENT_ENTERPRISE,
      STORAGE_KEYS.CURRENT_COMPANY_ID,
    ];

    scopedKeys.forEach(removeAllUserScopedEntriesForKey);

    const keysToRemove = [
      this.ENTERPRISES_KEY,
      this.CURRENT_ENTERPRISE_KEY,
      this.AUTH_TOKEN_KEY,
      this.ONBOARDING_STATE_KEY,
    ];

    keysToRemove.forEach(key => {
      window.localStorage.removeItem(key);
      logger.info(`   ? ${key} supprime`)
    });

    Object.keys(window.localStorage).forEach(key => {
      if (key.startsWith("supabase.") || key.startsWith("casskai_")) {
        window.localStorage.removeItem(key);
        logger.info(`   ? ${key} supprime`)
      }
    });

    logger.info("? Cache localStorage nettoye")
  }

  static clearEnterprises(): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    logger.info("?? Nettoyage du cache des entreprises...");

    removeAllUserScopedEntriesForKey(STORAGE_KEYS.ENTERPRISES);
    removeAllUserScopedEntriesForKey(STORAGE_KEYS.CURRENT_ENTERPRISE);

    window.localStorage.removeItem(this.ENTERPRISES_KEY);
    window.localStorage.removeItem(this.CURRENT_ENTERPRISE_KEY);

    logger.info("? Cache des entreprises nettoye")
  }

  static clearAndReload(): void {
    if (typeof window === "undefined") {
      return;
    }

    this.clearAll();

    logger.info("?? Rechargement de la page...");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  static hasObsoleteCache(): boolean {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    return (
      this.getScopedKeys(this.ENTERPRISES_KEY).length > 0 ||
      this.getScopedKeys(this.CURRENT_ENTERPRISE_KEY).length > 0
    );
  }

  static getCacheReport(): {
    hasEnterprises: boolean;
    hasCurrentEnterprise: boolean;
    enterprisesCount: number;
    lastModified: string | null;
  } {
    if (typeof window === "undefined" || !window.localStorage) {
      return {
        hasEnterprises: false,
        hasCurrentEnterprise: false,
        enterprisesCount: 0,
        lastModified: null,
      };
    }

    const enterpriseKeys = this.getScopedKeys(this.ENTERPRISES_KEY);
    const currentKeys = this.getScopedKeys(this.CURRENT_ENTERPRISE_KEY);

    let enterprisesCount = 0;
    enterpriseKeys.forEach(key => {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return;
      }

      try {
        const enterprises = JSON.parse(raw);
        if (Array.isArray(enterprises)) {
          enterprisesCount += enterprises.length;
        }
      } catch (error) {
        logger.warn("Erreur parsing enterprises cache:", error)
      }
    });

    return {
      hasEnterprises: enterpriseKeys.length > 0,
      hasCurrentEnterprise: currentKeys.length > 0,
      enterprisesCount,
      lastModified: null,
    };
  }

  static validateCache(): {
    isValid: boolean;
    issues: string[];
  } {
    if (typeof window === "undefined" || !window.localStorage) {
      return { isValid: true, issues: [] };
    }

    const issues: string[] = [];

    const enterpriseKeys = this.getScopedKeys(this.ENTERPRISES_KEY);
    const currentKeys = this.getScopedKeys(this.CURRENT_ENTERPRISE_KEY);

    enterpriseKeys.forEach(key => {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return;
      }

      try {
        const enterprises = JSON.parse(raw);
        if (!Array.isArray(enterprises)) {
          issues.push(`Format du cache enterprises invalide pour ${key}`);
        }
      } catch (error) {
        issues.push(`Cache enterprises corrompu (JSON invalide) pour ${key}`);
      }
    });

    currentKeys.forEach(key => {
      const value = window.localStorage.getItem(key);
      if (!value) {
        return;
      }

      const segments = key.split("::");
      const userId = segments.length > 1 ? segments[1] : null;

      if (userId) {
        const associatedKey = `${this.ENTERPRISES_KEY}::${userId}`;
        if (!window.localStorage.getItem(associatedKey)) {
          issues.push(`Entreprise courante sans liste pour l'utilisateur ${userId}`);
        }
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  static triggerEnterpriseRefresh(): void {
    if (typeof window === "undefined") {
      return;
    }

    logger.info("?? Déclenchement d'un rafraîchissement du contexte Enterprise...");

    const event = new CustomEvent("enterpriseContextRefresh");
    window.dispatchEvent(event);
  }

  static smartClean(): void {
    if (typeof window === "undefined") {
      return;
    }

    logger.info("?? Nettoyage intelligent du cache...");

    const report = this.getCacheReport();
    const validation = this.validateCache();

    logger.info("?? Rapport du cache:", report);
    logger.info("? Validation:", validation);

    if (!validation.isValid || report.hasEnterprises) {
      logger.info("?? Nettoyage nécessaire...");
      this.clearEnterprises();
      this.triggerEnterpriseRefresh();
    } else {
      logger.info("? Cache propre, aucun nettoyage nécessaire")
    }
  }
}
