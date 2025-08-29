import { supabase } from '@/lib/supabase';

// Types pour les préférences de cookies
export interface CookiePreferences {
  id?: string;
  user_id?: string;
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  consent_date: string;
  consent_version: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CookieConsent {
  preferences: CookiePreferences;
  consentGiven: boolean;
  consentDate: string;
  version: string;
}

export class CookiesService {
  private static readonly CONSENT_VERSION = '1.0';
  private static readonly STORAGE_KEY = 'casskai-cookie-preferences';

  // Sauvegarder les préférences de cookies
  static async saveCookiePreferences(preferences: Omit<CookiePreferences, 'id' | 'created_at' | 'updated_at'>): Promise<CookiePreferences> {
    try {
      // Essayer de sauvegarder dans la base de données
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Utilisateur connecté - sauvegarder en base
        const { data, error } = await supabase
          .from('cookie_preferences')
          .upsert({
            user_id: user.id,
            ...preferences,
            consent_date: new Date().toISOString(),
            consent_version: this.CONSENT_VERSION,
            ip_address: await this.getClientIP(),
            user_agent: navigator.userAgent
          })
          .select()
          .single();

        if (error) throw error;
        
        // Sauvegarder aussi localement pour un accès rapide
        this.saveToLocalStorage(preferences);
        
        return data;
      } else {
        // Utilisateur non connecté - sauvegarder uniquement localement
        return this.saveToLocalStorage(preferences);
      }
    } catch (error) {
      console.error('Error saving cookie preferences to database:', error);
      // Fallback vers le stockage local en cas d'erreur
      return this.saveToLocalStorage(preferences);
    }
  }

  // Récupérer les préférences de cookies
  static async getCookiePreferences(): Promise<CookiePreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Utilisateur connecté - essayer de récupérer depuis la base
        const { data, error } = await supabase
          .from('cookie_preferences')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          return data;
        }
      }
      
      // Fallback vers le stockage local
      return this.getFromLocalStorage();
    } catch (error) {
      console.error('Error fetching cookie preferences:', error);
      return this.getFromLocalStorage();
    }
  }

  // Vérifier si l'utilisateur a donné son consentement
  static async hasGivenConsent(): Promise<boolean> {
    const preferences = await this.getCookiePreferences();
    return preferences !== null;
  }

  // Obtenir les préférences par défaut
  static getDefaultPreferences(): CookiePreferences {
    return {
      essential: true, // Toujours requis
      functional: false,
      analytics: false,
      marketing: false,
      consent_date: new Date().toISOString(),
      consent_version: this.CONSENT_VERSION
    };
  }

  // Accepter tous les cookies
  static async acceptAllCookies(): Promise<CookiePreferences> {
    const preferences: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      consent_date: new Date().toISOString(),
      consent_version: this.CONSENT_VERSION
    };

    return await this.saveCookiePreferences(preferences);
  }

  // Refuser tous les cookies optionnels
  static async rejectOptionalCookies(): Promise<CookiePreferences> {
    const preferences: CookiePreferences = {
      essential: true, // Toujours requis
      functional: false,
      analytics: false,
      marketing: false,
      consent_date: new Date().toISOString(),
      consent_version: this.CONSENT_VERSION
    };

    return await this.saveCookiePreferences(preferences);
  }

  // Appliquer les préférences de cookies (configurer les scripts de tracking)
  static applyCookiePreferences(preferences: CookiePreferences): void {
    // Configurer Google Analytics
    if (preferences.analytics) {
      this.enableGoogleAnalytics();
    } else {
      this.disableGoogleAnalytics();
    }

    // Configurer les cookies marketing/publicitaires
    if (preferences.marketing) {
      this.enableMarketingCookies();
    } else {
      this.disableMarketingCookies();
    }

    // Configurer les cookies fonctionnels
    if (preferences.functional) {
      this.enableFunctionalCookies();
    } else {
      this.disableFunctionalCookies();
    }

    // Les cookies essentiels sont toujours activés
    this.enableEssentialCookies();
  }

  // Récupérer l'IP du client (pour la conformité RGPD)
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not fetch client IP:', error);
      return 'unknown';
    }
  }

  // Sauvegarder localement
  private static saveToLocalStorage(preferences: Omit<CookiePreferences, 'id' | 'created_at' | 'updated_at'>): CookiePreferences {
    const fullPreferences: CookiePreferences = {
      ...preferences,
      consent_date: new Date().toISOString(),
      consent_version: this.CONSENT_VERSION
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fullPreferences));
    return fullPreferences;
  }

  // Récupérer depuis le stockage local
  private static getFromLocalStorage(): CookiePreferences | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading cookie preferences from localStorage:', error);
      return null;
    }
  }

  // Méthodes pour configurer les différents types de cookies
  private static enableGoogleAnalytics(): void {
    // Configuration Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  }

  private static disableGoogleAnalytics(): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  }

  private static enableMarketingCookies(): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
    }
  }

  private static disableMarketingCookies(): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
    }
  }

  private static enableFunctionalCookies(): void {
    // Activer les cookies fonctionnels (préférences utilisateur, etc.)
    if (typeof window !== 'undefined') {
      (window as any).functionalCookiesEnabled = true;
    }
  }

  private static disableFunctionalCookies(): void {
    if (typeof window !== 'undefined') {
      (window as any).functionalCookiesEnabled = false;
    }
  }

  private static enableEssentialCookies(): void {
    // Les cookies essentiels sont toujours activés
    if (typeof window !== 'undefined') {
      (window as any).essentialCookiesEnabled = true;
    }
  }

  // Nettoyer les cookies existants si l'utilisateur retire son consentement
  static clearCookiesByType(type: 'functional' | 'analytics' | 'marketing'): void {
    if (typeof document === 'undefined') return;

    const cookiesToClear = this.getCookiesByType(type);
    
    cookiesToClear.forEach(cookieName => {
      // Effacer le cookie dans le domaine actuel
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.casskai.app`;
    });
  }

  private static getCookiesByType(type: 'functional' | 'analytics' | 'marketing'): string[] {
    const cookieMap = {
      functional: ['preferences', 'ui_settings', 'dashboard_config'],
      analytics: ['_ga', '_gid', '_gat', '_ga_*', 'plausible_ignore'],
      marketing: ['_fbp', '_fbc', 'fr', 'tr', 'ads_preferences']
    };

    return cookieMap[type] || [];
  }

  // Vérifier si les préférences doivent être redemandées (changement de version)
  static async shouldRequestConsent(): Promise<boolean> {
    const preferences = await this.getCookiePreferences();
    
    if (!preferences) {
      return true; // Pas de consentement précédent
    }

    if (preferences.consent_version !== this.CONSENT_VERSION) {
      return true; // Nouvelle version de la politique
    }

    // Vérifier si le consentement est encore valide (ex: 1 an)
    const consentDate = new Date(preferences.consent_date);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return consentDate < oneYearAgo;
  }

  // Récupérer les statistiques de consentement (pour l'admin)
  static async getConsentStatistics(): Promise<{
    total: number;
    essential: number;
    functional: number;
    analytics: number;
    marketing: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('cookie_preferences')
        .select('essential, functional, analytics, marketing');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        essential: data?.filter(p => p.essential).length || 0,
        functional: data?.filter(p => p.functional).length || 0,
        analytics: data?.filter(p => p.analytics).length || 0,
        marketing: data?.filter(p => p.marketing).length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching consent statistics:', error);
      return {
        total: 0,
        essential: 0,
        functional: 0,
        analytics: 0,
        marketing: 0
      };
    }
  }
}

export default CookiesService;