import React, { createContext, useContext, useEffect, useState } from 'react';

import { usePlausibleAnalytics, usePrivacyCompliantTracking } from '@/hooks/usePlausibleAnalytics';

type PlausibleEventProps = Record<string, string | number | boolean>;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Switch } from '@/components/ui/switch';

import { Shield, Eye, EyeOff, Settings } from 'lucide-react';



// Context pour les analytics

interface AnalyticsContextType {

  trackPageview: (url?: string) => void;

  trackEvent: (eventName: string, props?: PlausibleEventProps) => void;

  trackGoal: (goalName: string, props?: PlausibleEventProps) => void;

  hasConsent: boolean;

  isReady: boolean;

  isConsentLoaded: boolean;

  showConsentBanner: boolean;

  grantConsent: () => void;

  revokeConsent: () => void;

  openSettings: () => void;

}



const AnalyticsContext = createContext<AnalyticsContextType | null>(null);



// Configuration des analytics

interface AnalyticsProviderProps {

  children: React.ReactNode;

  domain?: string;

  trackLocalhost?: boolean;

  showConsentBanner?: boolean;

  enablePrivacyMode?: boolean;

}



export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({

  children,

  domain = 'casskai.app',

  trackLocalhost = false,

  showConsentBanner = true,

  enablePrivacyMode = true,

}) => {

  const [showSettings, setShowSettings] = useState(false);

  const [showBanner, setShowBanner] = useState(false);



  // Hooks de confidentialité et analytics

  const { hasConsent, isConsentLoaded, grantConsent, revokeConsent } = usePrivacyCompliantTracking();

  

  const { trackPageview, trackEvent, trackGoal, isReady } = usePlausibleAnalytics({

    domain,

    trackLocalhost,

    // Désactiver le tracking automatique si pas de consentement

    manualPageviews: enablePrivacyMode && !hasConsent,

  });



  // Gérer l'affichage de la bannière de consentement

  useEffect(() => {

    if (isConsentLoaded && showConsentBanner && enablePrivacyMode) {

      const consent = localStorage.getItem('analytics-consent');

      const shouldShowBanner = !consent && !navigator.doNotTrack;

      setShowBanner(shouldShowBanner);

    }

  }, [isConsentLoaded, showConsentBanner, enablePrivacyMode]);



  // Wrappers conditionnels pour respecter le consentement

  const conditionalTrackPageview = (url?: string) => {

    if (!enablePrivacyMode || hasConsent) {

      trackPageview(url);

    }

  };



  const conditionalTrackEvent = (eventName: string, props?: PlausibleEventProps) => {

    if (!enablePrivacyMode || hasConsent) {

      trackEvent(eventName, props);

    }

  };



  const conditionalTrackGoal = (goalName: string, props?: PlausibleEventProps) => {

    if (!enablePrivacyMode || hasConsent) {

      trackGoal(goalName, props);

    }

  };



  const handleGrantConsent = () => {

    grantConsent();

    setShowBanner(false);

  };



  const handleRejectConsent = () => {

    revokeConsent();

    setShowBanner(false);

  };



  const openSettings = () => {

    setShowSettings(true);

  };



  const contextValue: AnalyticsContextType = {

    trackPageview: conditionalTrackPageview,

    trackEvent: conditionalTrackEvent,

    trackGoal: conditionalTrackGoal,

    hasConsent,

    isReady: enablePrivacyMode ? (isReady && hasConsent) : isReady,

    isConsentLoaded,

    showConsentBanner: showBanner,

    grantConsent: handleGrantConsent,

    revokeConsent: handleRejectConsent,

    openSettings,

  };



  return (

    <AnalyticsContext.Provider value={contextValue}>

      {children}

      

      {/* Bannière de consentement */}

      {showBanner && <ConsentBanner onAccept={handleGrantConsent} onReject={handleRejectConsent} />}

      

      {/* Modal des paramètres */}

      {showSettings && (

        <AnalyticsSettingsModal 

          isOpen={showSettings} 

          onClose={() => setShowSettings(false)} 

          hasConsent={hasConsent}

          onGrantConsent={handleGrantConsent}

          onRevokeConsent={handleRejectConsent}

        />

      )}

    </AnalyticsContext.Provider>

  );

};



// Hook pour utiliser le contexte analytics

export const useAnalytics = () => {

  const context = useContext(AnalyticsContext);

  if (!context) {

    throw new Error('useAnalytics must be used within an AnalyticsProvider');

  }

  return context;

};



// Composant de bannière de consentement

const ConsentBanner: React.FC<{

  onAccept: () => void;

  onReject: () => void;

}> = ({ onAccept, onReject }) => {

  return (

    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50 p-4">

      <div className="max-w-6xl mx-auto">

        <Card className="border-0 shadow-none bg-transparent">

          <CardContent className="pt-4">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div className="flex items-start gap-3">

                <div className="mt-1">

                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                </div>

                <div>

                  <h3 className="font-semibold text-foreground mb-1">

                    Respect de votre vie privée

                  </h3>

                  <p className="text-sm text-muted-foreground mb-2">

                    Nous utilisons Plausible Analytics, une solution respectueuse de la vie privée, 

                    pour comprendre comment améliorer notre service. Aucune donnée personnelle n'est collectée.

                  </p>

                  <p className="text-xs text-muted-foreground">

                    <a 

                      href="https://plausible.io/privacy" 

                      target="_blank" 

                      rel="noopener noreferrer"

                      className="underline hover:text-blue-600 dark:hover:text-blue-400"

                    >

                      En savoir plus sur Plausible

                    </a>

                  </p>

                </div>

              </div>

              

              <div className="flex flex-col sm:flex-row gap-2 min-w-fit">

                <Button

                  onClick={onReject}

                  variant="outline"

                  size="sm"

                  

                >

                  Refuser

                </Button>

                <Button

                  onClick={onAccept}

                  size="sm"

                  className="bg-blue-600 hover:bg-blue-700"

                >

                  Accepter

                </Button>

              </div>

            </div>

          </CardContent>

        </Card>

      </div>

    </div>

  );

};



// Modal des paramètres analytics

const AnalyticsSettingsModal: React.FC<{

  isOpen: boolean;

  onClose: () => void;

  hasConsent: boolean;

  onGrantConsent: () => void;

  onRevokeConsent: () => void;

}> = ({ isOpen, onClose, hasConsent, onGrantConsent, onRevokeConsent }) => {

  if (!isOpen) return null;



  const handleToggleConsent = () => {

    if (hasConsent) {

      onRevokeConsent();

    } else {

      onGrantConsent();

    }

  };



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

      <Card className="w-full max-w-md">

        <CardHeader>

          <div className="flex items-center gap-2">

            <Settings className="w-5 h-5" />

            <CardTitle>Paramètres de confidentialité</CardTitle>

          </div>

          <CardDescription>

            Gérez vos préférences concernant les analytics

          </CardDescription>

        </CardHeader>

        

        <CardContent className="space-y-4">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              {hasConsent ? (

                <Eye className="w-4 h-4 text-green-600" />

              ) : (

                <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />

              )}

              <span className="font-medium">Analytics activés</span>

            </div>

            <Switch

              checked={hasConsent}

              onCheckedChange={handleToggleConsent}

            />

          </div>

          

          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">

            <p>

              <strong>Qu'est-ce qui est collecté :</strong>

            </p>

            <ul className="list-disc list-inside space-y-1 text-xs ml-2">

              <li>Pages visitées (sans données personnelles)</li>

              <li>Durée des sessions</li>

              <li>Pays de provenance (basé sur l'IP, anonymisée)</li>

              <li>Type d'appareil et navigateur</li>

              <li>Actions sur l'interface (clics, formulaires)</li>

            </ul>

            

            <p className="mt-3">

              <strong>Qu'est-ce qui N'est PAS collecté :</strong>

            </p>

            <ul className="list-disc list-inside space-y-1 text-xs ml-2">

              <li>Adresses IP complètes</li>

              <li>Informations personnelles</li>

              <li>Cookies de tracking</li>

              <li>Données cross-site</li>

            </ul>

          </div>

          

          <div className="bg-blue-50 p-3 rounded-lg dark:bg-blue-900/20">

            <div className="flex items-start gap-2">

              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />

              <div className="text-xs text-blue-700 dark:text-blue-400">

                <strong>Plausible Analytics</strong> est conforme au RGPD, 

                ne collecte aucune donnée personnelle et respecte Do Not Track.

              </div>

            </div>

          </div>

          

          <div className="flex gap-2 pt-4">

            <Button

              onClick={onClose}

              variant="outline"

              className="flex-1"

            >

              Fermer

            </Button>

            {!hasConsent && (

              <Button

                onClick={onGrantConsent}

                className="flex-1 bg-blue-600 hover:bg-blue-700"

              >

                Activer

              </Button>

            )}

          </div>

        </CardContent>

      </Card>

    </div>

  );

};



// Hook simplifié pour les actions courantes

export const useAnalyticsActions = () => {

  const { trackEvent, trackGoal, hasConsent } = useAnalytics();



  return {

    // Actions business

    trackSignup: (method?: string) => {

      trackGoal('Signup', method ? { method } : undefined);

    },

    

    trackLogin: (method?: string) => {

      trackEvent('Login', method ? { method } : undefined);

    },

    

    trackFeatureUsed: (feature: string) => {

      trackEvent('Feature Used', { feature });

    },

    

    trackFormSubmitted: (formName: string) => {

      trackEvent('Form Submitted', { form: formName });

    },

    

    trackDownload: (fileName: string) => {

      trackEvent('File Downloaded', { file: fileName });

    },

    

    trackSearch: (query: string, results?: number) => {

      trackEvent('Search Performed', { 

        query: query.substring(0, 100), // Limiter la longueur

        results: results || 0 

      });

    },

    

    trackError: (errorType: string, page?: string) => {

      trackEvent('Error Occurred', { 

        type: errorType,

        page: page || window.location.pathname

      });

    },

    

    // État du consentement

    hasAnalyticsConsent: hasConsent,

  };

};



export default AnalyticsProvider;
