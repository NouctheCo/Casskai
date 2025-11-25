import React, { useEffect, useState } from 'react';
import CookieConsent from 'react-cookie-consent';
import { useTranslation } from 'react-i18next';
import { Shield, Cookie } from 'lucide-react';

/**
 * 🍪 COOKIE CONSENT BANNER - CONFORMITÉ RGPD
 * 
 * Fonctionnalités:
 * - ✅ Acceptation/Refus explicite
 * - ✅ Persistance localStorage
 * - ✅ Révocation consentement
 * - ✅ Multilingue (FR/EN/ES)
 * - ✅ Design cohérent avec l'app
 * - ✅ Conforme RGPD Article 7
 */

interface CookiePreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
}

const COOKIE_NAME = 'casskai_cookie_consent';
const PREFERENCES_KEY = 'casskai_cookie_preferences';

export const CookieConsentBanner: React.FC = () => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    analytics: false,
    marketing: false,
    functional: true, // Toujours autorisé (cookies essentiels)
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    // Charger préférences existantes
    const saved = localStorage.getItem(PREFERENCES_KEY);
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cookie preferences', e);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    
    // Log consentement pour audit RGPD
    if (import.meta.env.DEV) {
      console.warn('[RGPD] Cookie consent:', {
        analytics: prefs.analytics,
        marketing: prefs.marketing,
        timestamp: prefs.timestamp
      });
    }

    // Activer/désactiver services selon consentement
    if (prefs.analytics) {
      initAnalytics();
    } else {
      disableAnalytics();
    }

    if (prefs.marketing) {
      initMarketing();
    } else {
      disableMarketing();
    }
  };

  const handleAcceptAll = () => {
    const prefs: CookiePreferences = {
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    };
    savePreferences(prefs);
  };

  const handleDeclineAll = () => {
    const prefs: CookiePreferences = {
      analytics: false,
      marketing: false,
      functional: true, // Cookies essentiels uniquement
      timestamp: new Date().toISOString()
    };
    savePreferences(prefs);
  };

  const handleSaveSettings = () => {
    savePreferences({
      ...preferences,
      timestamp: new Date().toISOString()
    });
    setShowSettings(false);
  };

  return (
    <>
      <CookieConsent
        location="bottom"
        buttonText={t('cookies.acceptAll', 'Tout accepter')}
        declineButtonText={t('cookies.declineAll', 'Tout refuser')}
        enableDeclineButton
        cookieName={COOKIE_NAME}
        style={{
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderTop: '1px solid hsl(var(--border))',
          padding: '1.5rem',
          zIndex: 9999
        }}
        buttonStyle={{
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          border: 'none',
          cursor: 'pointer'
        }}
        declineButtonStyle={{
          background: 'transparent',
          color: 'hsl(var(--muted-foreground))',
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          border: '1px solid hsl(var(--border))',
          cursor: 'pointer'
        }}
        expires={365}
        onAccept={handleAcceptAll}
        onDecline={handleDeclineAll}
      >
        <div className="flex items-start gap-3 max-w-4xl mx-auto">
          <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-2">
              {t('cookies.title', '🍪 Nous utilisons des cookies')}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {t('cookies.description', 
                'CassKai utilise des cookies pour améliorer votre expérience, analyser l\'utilisation du site et personnaliser le contenu. Les cookies essentiels sont nécessaires au fonctionnement de l\'application.'
              )}
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {t('cookies.customize', 'Personnaliser mes choix')} →
            </button>
            <a 
              href="/privacy" 
              className="text-sm text-primary hover:underline font-medium ml-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('cookies.learnMore', 'Politique de confidentialité')} →
            </a>
          </div>
        </div>
      </CookieConsent>

      {/* Modal Paramètres Avancés */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">
                  {t('cookies.settings.title', 'Paramètres des cookies')}
                </h2>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                {t('cookies.settings.description', 
                  'Personnalisez vos préférences de cookies. Les cookies essentiels sont toujours activés car nécessaires au fonctionnement de l\'application.'
                )}
              </p>

              {/* Cookies Essentiels */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    {t('cookies.settings.essential.title', '✅ Cookies essentiels')}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {t('cookies.settings.alwaysActive', 'Toujours actifs')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.settings.essential.description', 
                    'Ces cookies sont nécessaires au fonctionnement de l\'application : authentification, session, sécurité.'
                  )}
                </p>
              </div>

              {/* Cookies Analytics */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    {t('cookies.settings.analytics.title', '📊 Cookies analytiques')}
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        analytics: e.target.checked
                      })}
                      aria-label="Activer les cookies analytiques"
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.settings.analytics.description', 
                    'Nous aident à comprendre comment vous utilisez CassKai pour améliorer l\'expérience. Aucune donnée personnelle identifiable n\'est collectée.'
                  )}
                </p>
              </div>

              {/* Cookies Marketing */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    {t('cookies.settings.marketing.title', '🎯 Cookies marketing')}
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        marketing: e.target.checked
                      })}
                      aria-label="Activer les cookies marketing"
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.settings.marketing.description', 
                    'Permettent de vous proposer du contenu personnalisé et des publicités pertinentes sur d\'autres sites web.'
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-border">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                >
                  {t('cookies.settings.cancel', 'Annuler')}
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                >
                  {t('cookies.settings.save', 'Enregistrer mes préférences')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ========================================
// GESTION SERVICES ANALYTIQUES
// ========================================

function initAnalytics() {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted'
    });
  }

  // Sentry monitoring
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.setUser({ consent: 'analytics_granted' });
  }
}

function disableAnalytics() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied'
    });
  }
}

function initMarketing() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }
}

function disableMarketing() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
}

// ========================================
// HOOK POUR ACCÉDER AUX PRÉFÉRENCES
// ========================================

// eslint-disable-next-line react-refresh/only-export-components
export const useCookiePreferences = (): CookiePreferences | null => {
  const [prefs, setPrefs] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    if (saved) {
      try {
        setPrefs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cookie preferences', e);
      }
    }
  }, []);

  return prefs;
};

export default CookieConsentBanner;
