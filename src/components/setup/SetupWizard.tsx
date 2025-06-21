import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, Building, Globe, Shield, MapPin } from 'lucide-react';

const UniversalSetupWizard = () => {
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

  const steps = [
    { id: 1, title: 'Marché & Localisation', icon: MapPin },
    { id: 2, title: 'Configuration Supabase', icon: Database },
    { id: 3, title: 'Informations Entreprise', icon: Building },
    { id: 4, title: 'Compte Administrateur', icon: Shield }
  ];

  // Détection automatique du marché au chargement
  useEffect(() => {
    detectUserMarket();
  }, []);

  const detectUserMarket = async () => {
    try {
      // Simulation détection IP/géolocalisation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const marketMap = {
        'FR': 'france',
        'BE': 'belgium',
        'BJ': 'benin',
        'CI': 'ivory_coast',
        'CA': 'canada'
      };
      
      const detected = marketMap[data.country_code] || 'france';
      setDetectedMarket(detected);
      setConfig(prev => ({ ...prev, market: detected }));
    } catch (error) {
      // Fallback sur France
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
    // ... logique de test connection
    setTimeout(() => setConnectionStatus('success'), 2000);
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
          Vous devez créer un projet Supabase gratuit sur <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a>
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
        disabled={!config.supabaseUrl || !config.supabaseKey}
        className="w-full"
      >
        Tester la connexion
      </Button>

      {connectionStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Connexion Supabase réussie ! Configuration automatique en cours...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderCompanyInfo = () => {
    const selectedMarket = markets.find(m => m.id === config.market);
    
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

        <div>
          <Label htmlFor="companyName">Nom de l'entreprise</Label>
          <Input
            id="companyName"
            placeholder="Mon Entreprise SARL"
            value={config.companyName}
            onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="taxNumber">
            Numéro fiscal {selectedMarket?.id === 'france' ? '(SIREN/SIRET)' : 
                          selectedMarket?.id === 'belgium' ? '(TVA BE)' :
                          selectedMarket?.region === '🌍 Afrique' ? '(NIF)' : ''}
          </Label>
          <Input
            id="taxNumber"
            placeholder={
              selectedMarket?.id === 'france' ? '12345678901234' :
              selectedMarket?.id === 'belgium' ? 'BE0123456789' :
              selectedMarket?.region === '🌍 Afrique' ? 'Numéro d\'identification fiscale' :
              'Numéro fiscal'
            }
            value={config.taxNumber}
            onChange={(e) => setConfig(prev => ({ ...prev, taxNumber: e.target.value }))}
            className="mt-2"
          />
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
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderMarketSelection();
      case 2: return renderSupabaseConfig();
      case 3: return renderCompanyInfo();
      case 4: return renderAdminAccount();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return config.market;
      case 2: return connectionStatus === 'success';
      case 3: return config.companyName;
      case 4: return config.adminEmail && config.adminPassword;
      default: return false;
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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
                  <span className={`text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
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
              
              {currentStep < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={() => alert('Installation terminée ! Redirection vers Casskai...')}
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

export default SetupWizard;
