import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, Building, Globe, Shield, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UniversalSetupWizard = () => {
  const { t } = useTranslation('setup');
  const [currentStep, setCurrentStep] = useState(1);
  const [detectedMarket, setDetectedMarket] = useState(null);
  const [config, setConfig] = useState({
    market: '',
    supabaseUrl: '',
    supabaseKey: '',
    companyName: '',
    country: '',
    currency: '',
    accountingStandard: '',
    taxNumber: '',
    legalForm: '',
    capital: '',
    sector: '',
    mobileMoneyProviders: [],
    adminEmail: '',
    adminPassword: '',
    acceptTerms: false
  });
  const [connectionStatus, setConnectionStatus] = useState(null);

  const markets = [
    {
      id: 'france',
      name: 'France',
      region: '🇪🇺 Europe',
      currency: 'EUR',
      standard: 'PCG',
      pricing: '19€/mois',
      features: ['RGPD', 'FEC', 'SEPA', 'TVA EU'],
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'belgium',
      name: 'Belgique',
      region: '🇪🇺 Europe',
      currency: 'EUR',
      standard: 'PCG Belge',
      pricing: '19€/mois',
      features: ['RGPD', 'BNB', 'Bancontact'],
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'benin',
      name: 'Bénin',
      region: '🌍 Afrique',
      currency: 'XOF',
      standard: 'SYSCOHADA',
      pricing: '12K FCFA/mois',
      features: ['OHADA', 'Mobile Money', 'DGI'],
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'ivory_coast',
      name: 'Côte d\'Ivoire',
      region: '🌍 Afrique',
      currency: 'XOF',
      standard: 'SYSCOHADA',
      pricing: '12K FCFA/mois',
      features: ['OHADA', 'Orange Money', 'DGI'],
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'burkina_faso',
      name: 'Burkina Faso',
      region: '🌍 Afrique',
      currency: 'XOF',
      standard: 'SYSCOHADA',
      pricing: '12K FCFA/mois',
      features: ['OHADA', 'Mobile Money', 'DGID'],
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'mali',
      name: 'Mali',
      region: '🌍 Afrique',
      currency: 'XOF',
      standard: 'SYSCOHADA',
      pricing: '12K FCFA/mois',
      features: ['OHADA', 'Orange Money', 'DGI'],
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'senegal',
      name: 'Sénégal',
      region: '🌍 Afrique',
      currency: 'XOF',
      standard: 'SYSCOHADA',
      pricing: '12K FCFA/mois',
      features: ['OHADA', 'Wave', 'DGI'],
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'togo',
      name: 'Togo',
      region: '🌍 Afrique',
      currency: 'XOF',
      standard: 'SYSCOHADA',
      pricing: '12K FCFA/mois',
      features: ['OHADA', 'Flooz', 'OTR'],
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'canada',
      name: 'Canada (QC)',
      region: '🌎 Amériques',
      currency: 'CAD',
      standard: 'GAAP',
      pricing: '25$ CAD/mois',
      features: ['TPS/TVQ', 'ARC', 'Interac'],
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  // CORRIGÉ: Ajout de l'étape Mobile Money
  const steps = [
    { id: 1, title: 'Marché & Localisation', icon: MapPin },
    { id: 2, title: 'Configuration Supabase', icon: Database },
    { id: 3, title: 'Informations Entreprise', icon: Building },
    { id: 4, title: 'Mobile Money', icon: Globe },
    { id: 5, title: 'Compte Administrateur', icon: Shield }
  ];

  // Détection automatique du marché au chargement
  useEffect(() => {
    detectUserMarket();
  }, []);

  const detectUserMarket = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const marketMap = {
        'FR': 'france',
        'BE': 'belgium',
        'BJ': 'benin',
        'CI': 'ivory_coast',
        'BF': 'burkina_faso',
        'ML': 'mali',
        'SN': 'senegal',
        'TG': 'togo',
        'CA': 'canada'
      };
      
      const detected = marketMap[data.country_code] || 'france';
      setDetectedMarket(detected);
      setConfig(prev => ({ ...prev, market: detected }));
    } catch (error) {
      setDetectedMarket('france');
      setConfig(prev => ({ ...prev, market: 'france' }));
    }
  };

  const handleMarketSelection = (marketId) => {
    const market = markets.find(m => m.id === marketId);
    setConfig(prev => ({
      ...prev,
      market: marketId,
      currency: market.currency,
      accountingStandard: market.standard
    }));
  };

  const testSupabaseConnection = async () => {
    setConnectionStatus('testing');
    try {
      // Simulation du test de connexion
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const formatCurrency = (amount, currency) => {
    if (currency === 'XOF') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount) + ' CFA';
    }
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const renderMarketSelection = () => (
    <div className="space-y-6">
      {detectedMarket && (
        <Alert className="border-blue-200 bg-blue-50">
          <MapPin className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Marché détecté automatiquement : <strong>{markets.find(m => m.id === detectedMarket)?.name}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label className="text-lg font-medium mb-4 block">Sélectionnez votre marché principal</Label>
        
        <div className="space-y-4">
          {['🇪🇺 Europe', '🌍 Afrique', '🌎 Amériques'].map(region => {
            const regionMarkets = markets.filter(m => m.region === region);
            
            return (
              <div key={region}>
                <h3 className="font-medium text-gray-700 mb-2">{region}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {regionMarkets.map(market => (
                    <Card 
                      key={market.id}
                      className={`cursor-pointer transition-all ${market.color} ${
                        config.market === market.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                      }`}
                      onClick={() => handleMarketSelection(market.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{market.name}</CardTitle>
                            <CardDescription>
                              {market.currency} • {market.standard}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {market.pricing}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {market.features.map(feature => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        {config.market === market.id && (
                          <div className="mt-2 flex items-center text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Sélectionné
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSupabaseConfig = () => (
    <div className="space-y-6">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Vous devez créer un projet Supabase gratuit sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a>
        </AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="supabaseUrl">URL du projet Supabase</Label>
        <Input
          id="supabaseUrl"
          placeholder="https://votre-projet.supabase.co"
          value={config.supabaseUrl}
          onChange={(e) => setConfig(prev => ({ ...prev, supabaseUrl: e.target.value }))}
          className="mt-2"
        />
      </div>
      
      <div>
        <Label htmlFor="supabaseKey">Clé API Supabase (anon)</Label>
        <Input
          id="supabaseKey"
          type="password"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
          value={config.supabaseKey}
          onChange={(e) => setConfig(prev => ({ ...prev, supabaseKey: e.target.value }))}
          className="mt-2"
        />
      </div>

      <Button 
        onClick={testSupabaseConnection}
        disabled={!config.supabaseUrl || !config.supabaseKey || connectionStatus === 'testing'}
        className="w-full"
      >
        {connectionStatus === 'testing' ? 'Test en cours...' : 'Tester la connexion'}
      </Button>

      {connectionStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Connexion Supabase réussie ! Configuration automatique en cours...
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Erreur de connexion. Vérifiez vos paramètres Supabase.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderCompanyInfo = () => {
    const selectedMarket = markets.find(m => m.id === config.market);
    const isAfricanMarket = selectedMarket?.region === '🌍 Afrique';
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Configuration pour : {selectedMarket?.name}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Devise :</span> {selectedMarket?.currency}
            </div>
            <div>
              <span className="text-gray-600">Standard :</span> {selectedMarket?.standard}
            </div>
          </div>
        </div>

        {isAfricanMarket && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Configuration OHADA activée</strong><br/>
              Plan comptable SYSCOHADA, support Mobile Money, conformité fiscale locale.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="companyName">Nom de l'entreprise</Label>
          <Input
            id="companyName"
            placeholder={isAfricanMarket ? "Entreprise SARL-U" : "Mon Entreprise SARL"}
            value={config.companyName}
            onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
            className="mt-2"
          />
        </div>

        {isAfricanMarket && (
          <div>
            <Label htmlFor="legalForm">Forme juridique</Label>
            <select
              id="legalForm"
              value={config.legalForm || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, legalForm: e.target.value }))}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
              <option value="SUARL">SUARL (Société Unipersonnelle à Responsabilité Limitée)</option>
              <option value="SA">SA (Société Anonyme)</option>
              <option value="SAS">SAS (Société par Actions Simplifiée)</option>
              <option value="GIE">GIE (Groupement d'Intérêt Économique)</option>
              <option value="EI">EI (Entreprise Individuelle)</option>
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="taxNumber">
            {isAfricanMarket ? 'Numéro d\'Identification Fiscale (NIF)' :
             selectedMarket?.id === 'france' ? 'SIREN/SIRET' : 
             selectedMarket?.id === 'belgium' ? 'TVA BE' : 'Numéro fiscal'}
          </Label>
          <Input
            id="taxNumber"
            placeholder={
              isAfricanMarket ? 'Ex: 2024123456789' :
              selectedMarket?.id === 'france' ? '12345678901234' :
              selectedMarket?.id === 'belgium' ? 'BE0123456789' :
              'Numéro fiscal'
            }
            value={config.taxNumber}
            onChange={(e) => setConfig(prev => ({ ...prev, taxNumber: e.target.value }))}
            className="mt-2"
          />
        </div>

        {isAfricanMarket && (
          <div>
            <Label htmlFor="capital">Capital social (en CFA)</Label>
            <Input
              id="capital"
              type="number"
              placeholder="1000000"
              value={config.capital || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, capital: e.target.value }))}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Capital minimum : 1,000,000 CFA pour SARL, 10,000,000 CFA pour SA
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="sector">Secteur d'activité</Label>
          <select
            id="sector"
            value={config.sector || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, sector: e.target.value }))}
            className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner...</option>
            {isAfricanMarket ? (
              <>
                <option value="agriculture">Agriculture et élevage</option>
                <option value="commerce">Commerce et distribution</option>
                <option value="services">Services</option>
                <option value="industrie">Industrie et manufacturing</option>
                <option value="btp">BTP et construction</option>
                <option value="transport">Transport et logistique</option>
                <option value="telecom">Télécommunications</option>
                <option value="finance">Services financiers</option>
                <option value="education">Éducation et formation</option>
                <option value="sante">Santé</option>
                <option value="tourisme">Tourisme et hôtellerie</option>
                <option value="energie">Énergie et mines</option>
              </>
            ) : (
              <>
                <option value="commerce">Commerce</option>
                <option value="services">Services</option>
                <option value="industrie">Industrie</option>
                <option value="btp">BTP</option>
                <option value="it">Informatique</option>
                <option value="consulting">Conseil</option>
              </>
            )}
          </select>
        </div>
      </div>
    );
  };

  const renderMobileMoneyConfig = () => {
    const selectedMarket = markets.find(m => m.id === config.market);
    const isAfricanMarket = selectedMarket?.region === '🌍 Afrique';
    
    if (!isAfricanMarket) {
      return (
        <div className="text-center py-8">
          <Globe className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Mobile Money non applicable
          </h3>
          <p className="text-gray-500">
            Cette fonctionnalité est spécifique aux marchés africains.
          </p>
        </div>
      );
    }

    const mobileMoneyProviders = {
      'benin': ['MTN Mobile Money', 'Moov Money'],
      'ivory_coast': ['Orange Money', 'MTN Mobile Money', 'Moov Money'],
      'burkina_faso': ['Orange Money', 'Moov Money'],
      'mali': ['Orange Money', 'Moov Money'],
      'senegal': ['Orange Money', 'Wave', 'Free Money'],
      'togo': ['Flooz', 'T-Money']
    };

    const providers = mobileMoneyProviders[config.market] || [];

    return (
      <div className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Mobile Money</strong><br/>
            Configurez les moyens de paiement mobile populaires dans votre région.
          </AlertDescription>
        </Alert>

        <div>
          <Label className="text-lg font-medium mb-4 block">
            Moyens de paiement mobile à activer
          </Label>
          
          <div className="space-y-3">
            {providers.map(provider => (
              <div key={provider} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={provider}
                  checked={config.mobileMoneyProviders?.includes(provider) || false}
                  onChange={(e) => {
                    const current = config.mobileMoneyProviders || [];
                    const updated = e.target.checked
                      ? [...current, provider]
                      : current.filter(p => p !== provider);
                    setConfig(prev => ({ ...prev, mobileMoneyProviders: updated }));
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={provider} className="font-medium">
                  {provider}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Note importante</h4>
          <p className="text-yellow-700 text-sm">
            L'intégration Mobile Money nécessite des partenariats avec les opérateurs. 
            Ces options seront disponibles dans une version future de CassKai.
          </p>
        </div>
      </div>
    );
  };

  const renderAdminAccount = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="adminEmail">Email administrateur</Label>
        <Input
          id="adminEmail"
          type="email"
          placeholder="admin@monentreprise.com"
          value={config.adminEmail}
          onChange={(e) => setConfig(prev => ({ ...prev, adminEmail: e.target.value }))}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="adminPassword">Mot de passe</Label>
        <Input
          id="adminPassword"
          type="password"
          placeholder="Mot de passe sécurisé"
          value={config.adminPassword}
          onChange={(e) => setConfig(prev => ({ ...prev, adminPassword: e.target.value }))}
          className="mt-2"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Configuration finale</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <div>• Installation du schéma de base de données</div>
          <div>• Import du plan comptable {config.accountingStandard}</div>
          <div>• Configuration des devises et taux</div>
          <div>• Activation des fonctionnalités locales</div>
          {config.mobileMoneyProviders?.length > 0 && (
            <div>• Configuration Mobile Money ({config.mobileMoneyProviders.length} opérateurs)</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderMarketSelection();
      case 2: return renderSupabaseConfig();
      case 3: return renderCompanyInfo();
      case 4: return renderMobileMoneyConfig();
      case 5: return renderAdminAccount();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return config.market;
      case 2: return connectionStatus === 'success';
      case 3: return config.companyName;
      case 4: return true; // Mobile Money optionnel
      case 5: return config.adminEmail && config.adminPassword;
      default: return false;
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleFinish = async () => {
    try {
      // Ici vous ajouterez la logique pour :
      // - Créer les tables Supabase
      // - Configurer la première entreprise
      // - Créer le compte admin
      console.log('Configuration finale:', config);
      
      alert('Installation terminée ! Redirection vers Casskai...');
      // window.location.href = '/dashboard';
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
      alert('Erreur lors de l\'installation. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Configuration Casskai</h1>
          <p className="text-gray-600">Solution de gestion financière multi-marchés</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2
                    ${isCompleted ? 'bg-green-500 text-white' : 
                      isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}
                  `}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className={`text-sm text-center ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              Étape {currentStep} sur {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Précédent
              </Button>
              
              {currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={!canProceed()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Finaliser l'installation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UniversalSetupWizard;
