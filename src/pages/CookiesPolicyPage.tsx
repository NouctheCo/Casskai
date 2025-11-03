import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import CookiesService, { CookiePreferences } from '@/services/cookiesService';
import { 
  Cookie, 
  Settings, 
  BarChart3, 
  Target, 
  Shield, 
  Calendar, 
  ToggleLeft,
  ToggleRight,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PageContainer } from '@/components/ui/PageContainer';
import { PublicNavigation } from '@/components/navigation/PublicNavigation';

const CookiesPolicyPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cookieSettings, setCookieSettings] = useState({
    essential: true, // Toujours activé
    analytics: false,
    marketing: false,
    functional: false
  });

  const lastUpdated = "8 août 2025";

  // Charger les préférences existantes
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        const preferences = await CookiesService.getCookiePreferences();
        if (preferences) {
          setCookieSettings({
            essential: preferences.essential,
            functional: preferences.functional,
            analytics: preferences.analytics,
            marketing: preferences.marketing
          });
        }
      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Error loading cookie preferences:', error instanceof Error ? error.message : String(error));
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger vos préférences de cookies"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [toast]);

  const cookieTypes = [
    {
      id: 'essential',
      icon: Shield,
      title: 'Cookies essentiels',
      description: 'Nécessaires au fonctionnement de base de CassKai',
      required: true,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      examples: [
        'Authentification et sécurité',
        'Préférences de langue',
        'Panier et session utilisateur',
        'Protection CSRF'
      ],
      duration: 'Session ou 30 jours maximum'
    },
    {
      id: 'functional',
      icon: Settings,
      title: 'Cookies fonctionnels',
      description: 'Améliorent votre expérience d\'utilisation',
      required: false,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      examples: [
        'Préférences d\'interface',
        'Sauvegardes de formulaires',
        'Personnalisation des tableaux de bord',
        'Historique de navigation'
      ],
      duration: '1 an maximum'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: 'Cookies analytiques',
      description: 'Nous aident à comprendre l\'utilisation de CassKai',
      required: false,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      examples: [
        'Statistiques d\'usage anonymes',
        'Temps passé sur les pages',
        'Fonctionnalités les plus utilisées',
        'Performances techniques'
      ],
      duration: '2 ans maximum'
    },
    {
      id: 'marketing',
      icon: Target,
      title: 'Cookies marketing',
      description: 'Personnalisent nos communications',
      required: false,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      examples: [
        'Publicités personnalisées',
        'Suivi des campagnes',
        'Remarketing',
        'Analyse de conversion'
      ],
      duration: '13 mois maximum'
    }
  ];

  const handleCookieToggle = (cookieType) => {
    if (cookieType === 'essential') return; // Cannot toggle essential cookies
    
    setCookieSettings(prev => ({
      ...prev,
      [cookieType]: !prev[cookieType]
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const preferences: CookiePreferences = {
        essential: cookieSettings.essential,
        functional: cookieSettings.functional,
        analytics: cookieSettings.analytics,
        marketing: cookieSettings.marketing,
        consent_date: new Date().toISOString(),
        consent_version: '1.0'
      };

      await CookiesService.saveCookiePreferences(preferences);
      
      // Appliquer les préférences (configurer les scripts de tracking)
      CookiesService.applyCookiePreferences(preferences);
      
      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences de cookies ont été mises à jour avec succès"
      } as any);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error saving cookie preferences:', error instanceof Error ? error.message : String(error));
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences. Veuillez réessayer."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const acceptAllCookies = async () => {
    setIsSaving(true);
    try {
      const preferences = await CookiesService.acceptAllCookies();
      setCookieSettings({
        essential: preferences.essential,
        functional: preferences.functional,
        analytics: preferences.analytics,
        marketing: preferences.marketing
      });
      
      CookiesService.applyCookiePreferences(preferences);
      
      toast({
        title: "Tous les cookies acceptés",
        description: "Toutes les catégories de cookies ont été activées"
      } as any);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error accepting all cookies:', error instanceof Error ? error.message : String(error));
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'accepter tous les cookies"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const rejectOptionalCookies = async () => {
    setIsSaving(true);
    try {
      const preferences = await CookiesService.rejectOptionalCookies();
      setCookieSettings({
        essential: preferences.essential,
        functional: preferences.functional,
        analytics: preferences.analytics,
        marketing: preferences.marketing
      });
      
      CookiesService.applyCookiePreferences(preferences);
      
      // Nettoyer les cookies existants
      CookiesService.clearCookiesByType('functional');
      CookiesService.clearCookiesByType('analytics');
      CookiesService.clearCookiesByType('marketing');
      
      toast({
        title: "Cookies optionnels refusés",
        description: "Seuls les cookies essentiels sont activés"
      } as any);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error rejecting optional cookies:', error instanceof Error ? error.message : String(error));
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de refuser les cookies optionnels"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer variant="legal">
      <PublicNavigation variant="legal" />

      {/* Header */}
      <div className="bg-gradient-to-br from-orange-900 to-red-900 text-white py-16 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Cookie className="w-16 h-16 mx-auto mb-6 text-orange-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Politique des Cookies
            </h1>
            <p className="text-xl text-orange-100 mb-4">
              Comprendre et contrôler les cookies sur CassKai
            </p>
            <Badge className="bg-orange-800/50 text-orange-200 border-orange-700">
              <Calendar className="w-4 h-4 mr-2" />
              Dernière mise à jour : {lastUpdated}
            </Badge>
          </motion.div>
        </div>
      </div>

      {/* Gestionnaire de préférences */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-600">
              <Settings className="w-6 h-6 mr-3" />
              Gérer mes préférences cookies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Vous pouvez contrôler quels types de cookies CassKai peut utiliser. 
              Vos préférences seront respectées et sauvegardées.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cookieTypes.map((type) => (
                <div key={type.id} className={`p-4 rounded-lg border ${type.bgColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <type.icon className={`w-5 h-5 ${type.color} mr-2`} />
                      <h4 className="font-semibold text-sm">{type.title}</h4>
                    </div>
                    <div className="flex items-center">
                      {type.required ? (
                        <Badge variant="secondary" className="text-xs">
                          Obligatoire
                        </Badge>
                      ) : (
                        <Switch
                          checked={cookieSettings[type.id]}
                          onCheckedChange={() => handleCookieToggle(type.id)}
                          disabled={isLoading || isSaving}
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                    {type.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    Durée: {type.duration}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 mt-6">
              <Button 
                onClick={savePreferences} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSaving || isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder mes préférences'}
              </Button>
              <Button 
                variant="outline" 
                onClick={rejectOptionalCookies}
                disabled={isSaving || isLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isSaving ? 'Traitement...' : 'Refuser tous les cookies optionnels'}
              </Button>
              <Button 
                variant="default" 
                onClick={acceptAllCookies}
                disabled={isSaving || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSaving ? 'Traitement...' : 'Accepter tous les cookies'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          
          {/* Qu'est-ce qu'un cookie */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-6 h-6 mr-3 text-blue-600" />
                Qu'est-ce qu'un cookie ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, tablette, smartphone) 
                lors de votre navigation sur CassKai. Ces fichiers contiennent des informations qui permettent 
                d'améliorer votre expérience et le fonctionnement de notre plateforme.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Sécurisés</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Chiffrés et protégés contre l'accès non autorisé
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Temporaires</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Durée de vie limitée selon leur fonction
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Contrôlables</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Vous gardez le contrôle sur leur utilisation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Types de cookies détaillés */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cookie className="w-6 h-6 mr-3 text-orange-600" />
                Types de cookies utilisés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {cookieTypes.map((type, index) => (
                  <div key={type.id} className={`p-6 ${type.bgColor} rounded-lg`}>
                    <div className="flex items-center mb-4">
                      <type.icon className={`w-8 h-8 ${type.color} mr-3`} />
                      <div>
                        <h3 className="text-lg font-semibold">{type.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{type.description}</p>
                      </div>
                      <div className="ml-auto">
                        {type.required ? (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            Obligatoire
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Optionnel
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Exemples d'utilisation :</h4>
                        <ul className="text-sm space-y-1">
                          {type.examples.map((example, idx) => (
                            <li key={idx} className="flex items-center">
                              <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Informations :</h4>
                        <div className="text-sm space-y-1">
                          <p><strong>Durée de conservation :</strong> {type.duration}</p>
                          <p><strong>Finalité :</strong> {type.description}</p>
                          <p><strong>Base légale :</strong> {type.required ? 'Nécessité technique' : 'Consentement'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cookies tiers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-6 h-6 mr-3 text-purple-600" />
                Cookies de partenaires tiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                CassKai peut utiliser des services tiers qui déposent leurs propres cookies. 
                Voici la liste de nos principaux partenaires :
              </p>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Google Analytics</h4>
                    <Badge variant="outline">Analytique</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Mesure d'audience et analyse d'utilisation anonymisée
                  </p>
                  <div className="text-xs text-gray-500">
                    Cookies: _ga, _ga_*, _gid • Durée: 2 ans • 
                    <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline ml-1">
                      Politique de confidentialité
                    </a>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Stripe</h4>
                    <Badge variant="outline">Paiement</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Traitement sécurisé des paiements
                  </p>
                  <div className="text-xs text-gray-500">
                    Cookies: __stripe_* • Durée: Session • 
                    <a href="https://stripe.com/privacy" className="text-blue-600 hover:underline ml-1">
                      Politique de confidentialité
                    </a>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Intercom</h4>
                    <Badge variant="outline">Support</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Chat de support client intégré
                  </p>
                  <div className="text-xs text-gray-500">
                    Cookies: intercom-* • Durée: 1 an • 
                    <a href="https://www.intercom.com/legal/privacy" className="text-blue-600 hover:underline ml-1">
                      Politique de confidentialité
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestion des cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-6 h-6 mr-3 text-indigo-600" />
                Comment gérer vos cookies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">1. Via CassKai :</h4>
              <ul className="space-y-1 mb-6">
                <li>• Utilisez le gestionnaire de préférences en haut de cette page</li>
                <li>• Modifiez vos préférences dans les paramètres de votre compte</li>
                <li>• Contactez notre support pour assistance</li>
              </ul>

              <h4 className="font-semibold mb-3">2. Via votre navigateur :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <strong className="text-sm">Chrome :</strong>
                  <p className="text-xs mt-1">Paramètres → Confidentialité → Cookies</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <strong className="text-sm">Firefox :</strong>
                  <p className="text-xs mt-1">Options → Vie privée → Cookies</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <strong className="text-sm">Safari :</strong>
                  <p className="text-xs mt-1">Préférences → Confidentialité</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <strong className="text-sm">Edge :</strong>
                  <p className="text-xs mt-1">Paramètres → Confidentialité → Cookies</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm">
                  <strong>Attention :</strong> Désactiver certains cookies peut affecter 
                  le fonctionnement de CassKai. Les cookies essentiels ne peuvent pas 
                  être désactivés sans impacter l'utilisation de la plateforme.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="w-6 h-6 mr-3 text-blue-600" />
                Questions sur les cookies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Si vous avez des questions concernant notre utilisation des cookies 
                ou souhaitez exercer vos droits, contactez-nous :
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Délégué à la Protection des Données</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Email: privacy@casskai.app<br />
                    Réponse sous 48h maximum
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Support technique</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Email: support@casskai.app<br />
                    Chat en direct depuis votre compte
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modifications */}
          <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Modifications de cette politique</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Nous pouvons modifier cette politique des cookies pour refléter les évolutions 
              de nos pratiques ou pour des raisons légales. Toute modification sera communiquée 
              via votre compte CassKai.
            </p>
            <div className="text-sm text-gray-500">
              Version 2.0 • Dernière modification : {lastUpdated} • 
              Prochaine révision : Février 2026
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default CookiesPolicyPage;