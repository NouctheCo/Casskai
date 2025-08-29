import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, Key, Building2, Globe } from 'lucide-react';

interface SupabaseConfig {
  url: string;
  anonKey: string;
  validated: boolean;
}

interface CompanyConfig {
  name: string;
  country: string;
  currency: string;
  timezone: string;
}

const SupabaseSetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    validated: false
  });

  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>({
    name: '',
    country: 'FR',
    currency: 'EUR',
    timezone: 'Europe/Paris'
  });

  // Validation de la connexion Supabase
  const validateSupabaseConnection = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Validation du format de l'URL
      const urlRegex = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/;
      if (!urlRegex.test(supabaseConfig.url)) {
        throw new Error('Format d\'URL Supabase invalide. Format attendu: https://yourproject.supabase.co');
      }

      // Test de connexion simple
      const response = await fetch(`${supabaseConfig.url}/rest/v1/`, {
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`
        }
      });

      if (response.status === 200 || response.status === 404) {
        setSupabaseConfig(prev => ({ ...prev, validated: true }));
        setSuccess('✅ Connexion Supabase validée avec succès !');
      } else {
        throw new Error('Impossible de se connecter à Supabase. Vérifiez vos credentials.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de validation');
      setSupabaseConfig(prev => ({ ...prev, validated: false }));
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarde de la configuration
  const saveConfiguration = async () => {
    setLoading(true);
    try {
      // Sauvegarde sécurisée dans localStorage (en production, utiliser un système plus sécurisé)
      const config = {
        supabase: supabaseConfig,
        company: companyConfig,
        setupCompleted: true,
        setupDate: new Date().toISOString()
      };
      
      localStorage.setItem('casskai_config', JSON.stringify(config));
      
      // Simulation de l'initialisation de la base de données
      await initializeDatabase();
      
      setSuccess('🎉 Configuration terminée ! Redirection vers l\'application...');
      
      // En production, rediriger vers l'app principal
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Initialisation de la structure de base de données
  const initializeDatabase = async () => {
    // Ici on exécuterait les requêtes SQL pour créer les tables nécessaires
    // En attendant, simulation
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  const countries = [
    { code: 'FR', name: 'France', currency: 'EUR', timezone: 'Europe/Paris' },
    { code: 'BE', name: 'Belgique', currency: 'EUR', timezone: 'Europe/Brussels' },
    { code: 'BJ', name: 'Bénin', currency: 'XOF', timezone: 'Africa/Porto-Novo' },
    { code: 'CI', name: 'Côte d\'Ivoire', currency: 'XOF', timezone: 'Africa/Abidjan' }
  ];

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setCompanyConfig({
        ...companyConfig,
        country: countryCode,
        currency: country.currency,
        timezone: country.timezone
      });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Database className="mx-auto h-12 w-12 text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Configuration Supabase</h2>
        <p className="text-gray-600">Connectez votre instance Supabase personnelle</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="supabase-url">URL de votre projet Supabase</Label>
          <Input
            id="supabase-url"
            placeholder="https://yourproject.supabase.co"
            value={supabaseConfig.url}
            onChange={(e) => setSupabaseConfig({...supabaseConfig, url: e.target.value, validated: false})}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="supabase-key">Clé Anonyme (anon key)</Label>
          <Input
            id="supabase-key"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={supabaseConfig.anonKey}
            onChange={(e) => setSupabaseConfig({...supabaseConfig, anonKey: e.target.value, validated: false})}
            className="mt-1"
          />
        </div>

        <Button 
          onClick={validateSupabaseConnection}
          disabled={!supabaseConfig.url || !supabaseConfig.anonKey || loading}
          className="w-full"
        >
          {loading ? 'Validation en cours...' : 'Tester la connexion'}
        </Button>
      </div>

      <Alert className={supabaseConfig.validated ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
        <div className="flex items-center">
          {supabaseConfig.validated ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          )}
          <AlertDescription className="ml-2">
            {supabaseConfig.validated 
              ? 'Connexion Supabase validée ✅' 
              : 'Veuillez configurer et tester votre connexion Supabase'
            }
          </AlertDescription>
        </div>
      </Alert>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Comment obtenir vos credentials Supabase ?</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Créez un compte sur <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a></li>
          <li>2. Créez un nouveau projet</li>
          <li>3. Allez dans Settings → API</li>
          <li>4. Copiez l'URL et la clé anonyme</li>
        </ol>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Building2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Configuration de l'Entreprise</h2>
        <p className="text-gray-600">Configurez votre première entreprise</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="company-name">Nom de l'entreprise</Label>
          <Input
            id="company-name"
            placeholder="Mon Entreprise SARL"
            value={companyConfig.name}
            onChange={(e) => setCompanyConfig({...companyConfig, name: e.target.value})}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="country">Pays</Label>
          <select
            id="country"
            value={companyConfig.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currency">Devise</Label>
            <Input
              id="currency"
              value={companyConfig.currency}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Input
              id="timezone"
              value={companyConfig.timezone}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Globe className="h-4 w-4 text-blue-600" />
        <AlertDescription className="ml-2">
          La devise et le fuseau horaire sont automatiquement définis selon le pays sélectionné.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Finalisation</h2>
        <p className="text-gray-600">Récapitulatif de votre configuration</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold">Configuration Supabase</h3>
        <p className="text-sm"><strong>URL:</strong> {supabaseConfig.url}</p>
        <p className="text-sm"><strong>Status:</strong> ✅ Validé</p>
        
        <h3 className="font-semibold mt-4">Entreprise</h3>
        <p className="text-sm"><strong>Nom:</strong> {companyConfig.name}</p>
        <p className="text-sm"><strong>Pays:</strong> {countries.find(c => c.code === companyConfig.country)?.name}</p>
        <p className="text-sm"><strong>Devise:</strong> {companyConfig.currency}</p>
      </div>

      <Button 
        onClick={saveConfiguration}
        disabled={loading || !companyConfig.name}
        className="w-full"
      >
        {loading ? 'Initialisation en cours...' : 'Finaliser la configuration'}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Assistant de Configuration CassKai</CardTitle>
              <CardDescription>Configuration initiale de votre application</CardDescription>
            </div>
            <div className="text-sm text-gray-500">
              Étape {currentStep} sur 3
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="ml-2 text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="ml-2 text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Précédent
            </Button>
            
            {currentStep < 3 && (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && !supabaseConfig.validated}
              >
                Suivant
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseSetupWizard;
