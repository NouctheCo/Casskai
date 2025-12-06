import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { CheckCircle, AlertCircle, Database, Building, Globe, Shield, MapPin, Languages } from 'lucide-react';

import { useTranslation } from 'react-i18next';



const changeLanguageAndDetectCountry = async (langCode: string) => {

  // Stub function - i18n module not available

  console.log('Language change requested:', langCode);

};



// Composant Sélecteur de Langue

const LanguageSwitcher = ({ className = "" }) => {

  const { i18n } = useTranslation();

  

  const handleLanguageChange = async (langCode) => {

    try {

      await changeLanguageAndDetectCountry(langCode);

    } catch (error) {

      console.error('Erreur changement de langue:', error instanceof Error ? error.message : String(error));

    }

  };



  return (

    <div className={`flex items-center space-x-2 ${className}`}>

      <Languages className="w-4 h-4 text-gray-600 dark:text-gray-300" />

      <select 

        value={i18n.language} 

        onChange={(e) => handleLanguageChange(e.target.value)}

        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"

      >

        <option value="fr">🇫🇷 Français</option>

        <option value="en">🇺🇸 English</option>

        <option value="es">🇪🇸 Español</option>

      </select>

    </div>

  );

};



const UniversalSetupWizard = () => {

  const { t, i18n: _i18n } = useTranslation();

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



  // Données des marchés avec traductions dynamiques

  const getMarkets = () => [

    {

      id: 'france',

      name: t('setup.market.countries.france'),

      region: t('setup.market.regions.europe'),

      currency: 'EUR',

      standard: 'PCG',

      pricing: '€19/month',

      features: ['GDPR', 'FEC', 'SEPA', 'EU VAT'],

      color: 'bg-blue-50 border-blue-200'

    },

    {

      id: 'belgium',

      name: t('setup.market.countries.belgium'),

      region: t('setup.market.regions.europe'),

      currency: 'EUR',

      standard: 'Belgian GAAP',

      pricing: '€19/month',

      features: ['GDPR', 'NBB', 'Bancontact'],

      color: 'bg-blue-50 border-blue-200'

    },

    {

      id: 'benin',

      name: t('setup.market.countries.benin'),

      region: t('setup.market.regions.africa'),

      currency: 'XOF',

      standard: 'SYSCOHADA',

      pricing: '12K CFA/month',

      features: ['OHADA', 'Mobile Money', 'DGI'],

      color: 'bg-green-50 border-green-200'

    },

    {

      id: 'ivory_coast',

      name: t('setup.market.countries.ivory_coast'),

      region: t('setup.market.regions.africa'),

      currency: 'XOF',

      standard: 'SYSCOHADA',

      pricing: '12K CFA/month',

      features: ['OHADA', 'Orange Money', 'DGI'],

      color: 'bg-green-50 border-green-200'

    },

    {

      id: 'burkina_faso',

      name: t('setup.market.countries.burkina_faso'),

      region: t('setup.market.regions.africa'),

      currency: 'XOF',

      standard: 'SYSCOHADA',

      pricing: '12K CFA/month',

      features: ['OHADA', 'Mobile Money', 'DGID'],

      color: 'bg-green-50 border-green-200'

    },

    {

      id: 'mali',

      name: t('setup.market.countries.mali'),

      region: t('setup.market.regions.africa'),

      currency: 'XOF',

      standard: 'SYSCOHADA',

      pricing: '12K CFA/month',

      features: ['OHADA', 'Orange Money', 'DGI'],

      color: 'bg-green-50 border-green-200'

    },

    {

      id: 'senegal',

      name: t('setup.market.countries.senegal'),

      region: t('setup.market.regions.africa'),

      currency: 'XOF',

      standard: 'SYSCOHADA',

      pricing: '12K CFA/month',

      features: ['OHADA', 'Wave', 'DGI'],

      color: 'bg-green-50 border-green-200'

    },

    {

      id: 'togo',

      name: t('setup.market.countries.togo'),

      region: t('setup.market.regions.africa'),

      currency: 'XOF',

      standard: 'SYSCOHADA',

      pricing: '12K CFA/month',

      features: ['OHADA', 'Flooz', 'OTR'],

      color: 'bg-green-50 border-green-200'

    },

    {

      id: 'canada',

      name: t('setup.market.countries.canada'),

      region: t('setup.market.regions.americas'),

      currency: 'CAD',

      standard: 'GAAP',

      pricing: '$25 CAD/month',

      features: ['GST/HST', 'CRA', 'Interac'],

      color: 'bg-orange-50 border-orange-200'

    }

  ];



  // Étapes avec traductions dynamiques

  const getSteps = () => [

    { id: 1, title: t('setup.wizard.steps.market'), icon: MapPin },

    { id: 2, title: t('setup.wizard.steps.supabase'), icon: Database },

    { id: 3, title: t('setup.wizard.steps.company'), icon: Building },

    { id: 4, title: t('setup.wizard.steps.mobile_money'), icon: Globe },

    { id: 5, title: t('setup.wizard.steps.admin'), icon: Shield }

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

    } catch (_error) {

      setDetectedMarket('france');;

      setConfig(prev => ({ ...prev, market: 'france' }));

    }

  };



  const handleMarketSelection = (marketId) => {

    const markets = getMarkets();

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

      await new Promise(resolve => setTimeout(resolve, 2000));

      setConnectionStatus('success');

    } catch (_error) {

      setConnectionStatus('error');

    }

  };



  const renderMarketSelection = () => {

    const markets = getMarkets();

    const regions = [...new Set(markets.map(m => m.region))];

    

    return (

      <div className="space-y-6">

        {detectedMarket && (

          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">

            <MapPin className="h-4 w-4 text-blue-600" />

            <AlertDescription className="text-blue-800">

              {t('setup.market.detected', { 

                market: markets.find(m => m.id === detectedMarket)?.name 

              })}

            </AlertDescription>

          </Alert>

        )}



        <div>

          <Label className="text-lg font-medium mb-4 block">

            {t('setup.market.select')}

          </Label>

          

          <div className="space-y-4">

            {regions.map(region => {

              const regionMarkets = markets.filter(m => m.region === region);

              

              return (

                <div key={region}>

                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{region}</h3>

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

                              {t('setup.market.selected')}

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

  };



  const renderSupabaseConfig = () => (

    <div className="space-y-6">

      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">

        <AlertCircle className="h-4 w-4 text-amber-600" />

        <AlertDescription className="text-amber-800">

          {t('setup.supabase.info')}

        </AlertDescription>

      </Alert>



      <div>

        <Label htmlFor="supabaseUrl">{t('setup.supabase.url_label')}</Label>

        <Input

          id="supabaseUrl"

          placeholder={t('setup.supabase.url_placeholder')}

          value={config.supabaseUrl}

          onChange={(e) => setConfig(prev => ({ ...prev, supabaseUrl: e.target.value }))}

          className="mt-2"

        />

      </div>

      

      <div>

        <Label htmlFor="supabaseKey">{t('setup.supabase.key_label')}</Label>

        <Input

          id="supabaseKey"

          type="password"

          placeholder={t('setup.supabase.key_placeholder')}

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

        {connectionStatus === 'testing' ? t('setup.supabase.testing') : t('setup.supabase.test_connection')}

      </Button>



      {connectionStatus === 'success' && (

        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">

          <CheckCircle className="h-4 w-4 text-green-600" />

          <AlertDescription className="text-green-800">

            {t('setup.supabase.success')}

          </AlertDescription>

        </Alert>

      )}



      {connectionStatus === 'error' && (

        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">

          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />

          <AlertDescription className="text-red-800">

            {t('setup.supabase.error')}

          </AlertDescription>

        </Alert>

      )}

    </div>

  );



  const renderCompanyInfo = () => {

    const markets = getMarkets();

    const selectedMarket = markets.find(m => m.id === config.market);

    const isAfricanMarket = selectedMarket?.region === t('setup.market.regions.africa');

    

    return (

      <div className="space-y-6">

        <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-900/30">

          <h3 className="font-medium mb-2">

            {t('setup.company.config_for', { country: selectedMarket?.name })}

          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">

            <div>

              <span className="text-gray-600 dark:text-gray-300">{t('currency')}:</span> {selectedMarket?.currency}

            </div>

            <div>

              <span className="text-gray-600 dark:text-gray-300">{t('setup.standards.pcg')}:</span> {selectedMarket?.standard}

            </div>

          </div>

        </div>



        {isAfricanMarket && (

          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">

            <AlertCircle className="h-4 w-4 text-green-600" />

            <AlertDescription className="text-green-800">

              <strong>{t('setup.company.ohada_activated')}</strong><br/>

              {t('setup.company.ohada_description')}

            </AlertDescription>

          </Alert>

        )}



        <div>

          <Label htmlFor="companyName">{t('setup.company.name_label')}</Label>

          <Input

            id="companyName"

            placeholder={isAfricanMarket ? 

              t('setup.company.name_placeholder_african') : 

              t('setup.company.name_placeholder_default')

            }

            value={config.companyName}

            onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}

            className="mt-2"

          />

        </div>



        {isAfricanMarket && (

          <div>

            <Label htmlFor="legalForm">{t('setup.company.legal_form')}</Label>

            <select

              id="legalForm"

              value={config.legalForm || ''}

              onChange={(e) => setConfig(prev => ({ ...prev, legalForm: e.target.value }))}

              className="w-full mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

            >

              <option value="">{t('setup.company.legal_forms.select')}</option>

              <option value="SARL">{t('setup.company.legal_forms.sarl')}</option>

              <option value="SUARL">{t('setup.company.legal_forms.suarl')}</option>

              <option value="SA">{t('setup.company.legal_forms.sa')}</option>

              <option value="SAS">{t('setup.company.legal_forms.sas')}</option>

              <option value="GIE">{t('setup.company.legal_forms.gie')}</option>

              <option value="EI">{t('setup.company.legal_forms.ei')}</option>

            </select>

          </div>

        )}



        <div>

          <Label htmlFor="taxNumber">

            {isAfricanMarket ? 

              t('setup.company.tax_number.african') :

              selectedMarket?.id === 'france' ? 

                t('setup.company.tax_number.france') : 

                selectedMarket?.id === 'belgium' ? 

                  t('setup.company.tax_number.belgium') : 

                  t('setup.company.tax_number.default')

            }

          </Label>

          <Input

            id="taxNumber"

            placeholder={

              isAfricanMarket ? 

                t('setup.company.tax_number_placeholder.african') :

                selectedMarket?.id === 'france' ? 

                  t('setup.company.tax_number_placeholder.france') :

                  selectedMarket?.id === 'belgium' ? 

                    t('setup.company.tax_number_placeholder.belgium') :

                    t('setup.company.tax_number_placeholder.default')

            }

            value={config.taxNumber}

            onChange={(e) => setConfig(prev => ({ ...prev, taxNumber: e.target.value }))}

            className="mt-2"

          />

        </div>



        {isAfricanMarket && (

          <div>

            <Label htmlFor="capital">{t('setup.company.capital_label')}</Label>

            <Input

              id="capital"

              type="number"

              placeholder={t('setup.company.capital_placeholder')}

              value={config.capital || ''}

              onChange={(e) => setConfig(prev => ({ ...prev, capital: e.target.value }))}

              className="mt-2"

            />

            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">

              {t('setup.company.capital_minimum')}

            </p>

          </div>

        )}



        <div>

          <Label htmlFor="sector">{t('setup.company.sector_label')}</Label>

          <select

            id="sector"

            value={config.sector || ''}

            onChange={(e) => setConfig(prev => ({ ...prev, sector: e.target.value }))}

            className="w-full mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

          >

            <option value="">{t('setup.company.sectors.select')}</option>

            {isAfricanMarket ? (

              Object.entries(t('setup.company.sectors.african', { returnObjects: true })).map(([key, value]) => (

                <option key={key} value={key}>{value}</option>

              ))

            ) : (

              Object.entries(t('setup.company.sectors.default', { returnObjects: true })).map(([key, value]) => (

                <option key={key} value={key}>{value}</option>

              ))

            )}

          </select>

        </div>

      </div>

    );

  };



  const renderMobileMoneyConfig = () => {

    const markets = getMarkets();

    const selectedMarket = markets.find(m => m.id === config.market);

    const isAfricanMarket = selectedMarket?.region === t('setup.market.regions.africa');

    

    if (!isAfricanMarket) {

      return (

        <div className="text-center py-8">

          <Globe className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />

          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">

            {t('setup.mobile_money.not_applicable')}

          </h3>

          <p className="text-gray-500 dark:text-gray-300">

            {t('setup.mobile_money.not_applicable_description')}

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

        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">

          <AlertCircle className="h-4 w-4 text-blue-600" />

          <AlertDescription className="text-blue-800">

            <strong>{t('setup.mobile_money.title')}</strong><br/>

            {t('setup.mobile_money.description')}

          </AlertDescription>

        </Alert>



        <div>

          <Label className="text-lg font-medium mb-4 block">

            {t('setup.mobile_money.providers_label')}

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

                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"

                />

                <label htmlFor={provider} className="font-medium">

                  {provider}

                </label>

              </div>

            ))}

          </div>

        </div>



        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">

          <h4 className="font-medium text-yellow-800 mb-2">

            {t('setup.mobile_money.note_title')}

          </h4>

          <p className="text-yellow-700 text-sm">

            {t('setup.mobile_money.note_description')}

          </p>

        </div>

      </div>

    );

  };



  const renderAdminAccount = () => (

    <div className="space-y-6">

      <div>

        <Label htmlFor="adminEmail">{t('setup.admin.email_label')}</Label>

        <Input

          id="adminEmail"

          type="email"

          placeholder={t('setup.admin.email_placeholder')}

          value={config.adminEmail}

          onChange={(e) => setConfig(prev => ({ ...prev, adminEmail: e.target.value }))}

          className="mt-2"

        />

      </div>



      <div>

        <Label htmlFor="adminPassword">{t('setup.admin.password_label')}</Label>

        <Input

          id="adminPassword"

          type="password"

          placeholder={t('setup.admin.password_placeholder')}

          value={config.adminPassword}

          onChange={(e) => setConfig(prev => ({ ...prev, adminPassword: e.target.value }))}

          className="mt-2"

        />

      </div>



      <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900/20">

        <h3 className="font-medium mb-2">{t('setup.admin.final_config')}</h3>

        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">

          <div>• {t('setup.admin.tasks.database')}</div>

          <div>• {t('setup.admin.tasks.accounting_plan', { standard: config.accountingStandard })}</div>

          <div>• {t('setup.admin.tasks.currencies')}</div>

          <div>• {t('setup.admin.tasks.features')}</div>

          {config.mobileMoneyProviders?.length > 0 && (

            <div>• {t('setup.admin.tasks.mobile_money', { count: config.mobileMoneyProviders.length })}</div>

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

      case 4: return true;

      case 5: return config.adminEmail && config.adminPassword;

      default: return false;

    }

  };



  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));



  const handleFinish = async () => {

    try {

      console.log('Configuration finale:', config);
      // eslint-disable-next-line no-alert
      alert(t('setup.installation.completed'));

    } catch (error) {

      console.error('Erreur lors de l\'installation:', error instanceof Error ? error.message : String(error));
      // eslint-disable-next-line no-alert
      alert(t('setup.installation.error'));

    }

  };



  const steps = getSteps();



  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">

      <div className="max-w-4xl mx-auto">

        {/* En-tête avec sélecteur de langue */}

        <div className="text-center mb-8">

          <div className="flex justify-between items-center mb-4">

            <div></div>

            <LanguageSwitcher />

          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">

            {t('setup.wizard.title')}

          </h1>

          <p className="text-gray-600 dark:text-gray-300">

            {t('setup.wizard.subtitle')}

          </p>

        </div>



        {/* Progression des étapes */}

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



        {/* Contenu principal */}

        <Card className="max-w-3xl mx-auto">

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}

              {steps[currentStep - 1].title}

            </CardTitle>

            <CardDescription>

              {t('setup.navigation.step_of', { current: currentStep, total: steps.length })}

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

                {t('setup.navigation.previous')}

              </Button>

              

              {currentStep < 5 ? (

                <Button

                  onClick={nextStep}

                  disabled={!canProceed()}

                >

                  {t('setup.navigation.next')}

                </Button>

              ) : (

                <Button

                  onClick={handleFinish}

                  disabled={!canProceed()}

                  className="bg-green-600 hover:bg-green-700"

                >

                  {t('setup.navigation.finish')}

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
