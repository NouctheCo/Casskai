import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTranslation } from 'react-i18next';
import { useOnboardingReferentials, useCountryAutoConfig } from '@/hooks/useReferentials';

type CompanyFormData = {
  name?: string;
  legalName?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  registrationNumber?: string;
  vatNumber?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  shareCapital?: string;
  ceoName?: string;
  sector?: string;
  fiscalYearStart?: number;
  fiscalYearEnd?: number;
  fiscalYearType?: string;
  fiscalYearStartMonth?: number;
  fiscalYearStartDay?: number;
  siret?: string;
  address?: string;
  ceoTitle?: string;
};

// Icônes par secteur (mapping dynamique)
const getSectorIcon = (sectorCode: string): string => {
  const iconMap: Record<string, string> = {
    'SERVICES_PROF': '💼',
    'SERVICES_PERSO': '👥',
    'COMMERCE_DETAIL': '🏪',
    'COMMERCE_GROS': '🏭',
    'INDUSTRIE_MANUF': '🏭',
    'INDUSTRIE_ALIM': '🍎',
    'AGRICULTURE': '🌾',
    'CONSTRUCTION': '🏗️',
    'TRANSPORT': '🚚',
    'TECH_INFO': '💻',
    'SANTE': '🏥',
    'EDUCATION': '🎓',
    'FINANCE': '💰',
    'IMMOBILIER': '🏠',
    'AUTRES': '⚙️'
  };
  return iconMap[sectorCode] || '🏢';
};

// Composant pour les informations générales
const GeneralInfoSection: React.FC<{
  companyData: CompanyFormData;
  updateField: (field: string, value: string | number) => void;
  errors: Record<string, string>;
  // ✨ RÉFÉRENTIELS DYNAMIQUES - PHASE 3
  countries?: any[];
  sectors?: any[];
  companySizes?: any[];
  getSectorIcon: (code: string) => string;
}> = ({ companyData, updateField, errors, countries = [], sectors = [], companySizes = [], getSectorIcon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
    className="space-y-4"
  >
    <div className="flex items-center space-x-2 mb-4">
      <Building className="w-5 h-5 text-orange-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Informations générales
      </h3>
    </div>
    
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="company-name">
          Nom de l'entreprise <span className="text-red-500">*</span>
        </Label>
        <Input
          id="company-name"
          name="company-name"
          value={companyData.name ?? ''}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ex: Mon Entreprise SAS"
          autoComplete="organization"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <div className="flex items-center space-x-1 text-red-500 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{errors.name}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sector">
          Secteur d'activité <span className="text-red-500">*</span>
        </Label>
  <Select value={companyData.sector ?? ''} onValueChange={(value) => updateField('sector', value)}>
          <SelectTrigger id="sector" name="sector" className={errors.sector ? 'border-red-500' : ''}>
            <SelectValue placeholder="Sélectionnez votre secteur" />
          </SelectTrigger>
          <SelectContent>
            {sectors.map(sector => (
              <SelectItem key={sector.sector_code} value={sector.sector_code}>
                <div className="flex items-center space-x-2">
                  <span>{getSectorIcon(sector.sector_code)}</span>
                  <span>{sector.sector_name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sector && (
          <div className="flex items-center space-x-1 text-red-500 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{errors.sector}</span>
          </div>
        )}
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="siret">SIRET / Numéro d'entreprise</Label>
        <Input
          id="siret"
          name="siret"
          value={companyData.siret ?? ''}
          onChange={(e) => updateField('siret', e.target.value)}
          placeholder="Ex: 12345678901234"
          autoComplete="off"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="vat-number">Numéro de TVA</Label>
        <Input
          id="vat-number"
          name="vat-number"
          value={companyData.vatNumber ?? ''}
          onChange={(e) => updateField('vatNumber', e.target.value)}
          placeholder="Ex: FR12345678901"
          autoComplete="off"
        />
      </div>
    </div>
  </motion.div>
);

// Composant pour les coordonnées
const AddressSection: React.FC<{
  companyData: CompanyFormData;
  updateField: (field: string, value: string | number) => void;
  errors: Record<string, string>;
  // ✨ RÉFÉRENTIELS DYNAMIQUES - PHASE 3
  countries?: any[];
  timezones?: any[];
}> = ({ companyData, updateField, errors, countries = [], timezones = [] }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4, duration: 0.5 }}
    className="space-y-4"
  >
    <div className="flex items-center space-x-2 mb-4">
      <MapPin className="w-5 h-5 text-green-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Coordonnées
      </h3>
    </div>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Textarea
          id="address"
          name="address"
          value={companyData.address ?? ''}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="Ex: 123 Rue de la Paix"
          autoComplete="address-line1"
          rows={2}
        />
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            name="city"
            value={companyData.city ?? ''}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Ex: Paris"
            autoComplete="address-level2"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="postal-code">Code postal</Label>
          <Input
            id="postal-code"
            name="postal-code"
            value={companyData.postalCode ?? ''}
            onChange={(e) => updateField('postalCode', e.target.value)}
            placeholder="Ex: 75001"
            autoComplete="postal-code"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country">
            Pays <span className="text-red-500">*</span>
          </Label>
          <Select value={companyData.country ?? ''} onValueChange={(value) => updateField('country', value)}>
            <SelectTrigger id="country" name="country" className={errors.country ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionnez un pays" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name} ({country.currency_symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <div className="flex items-center space-x-1 text-red-500 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.country}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

// Composant pour les informations de contact
const ContactSection: React.FC<{
  companyData: CompanyFormData;
  updateField: (field: string, value: string | number) => void;
  errors: Record<string, string>;
}> = ({ companyData, updateField, errors }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.5 }}
    className="space-y-4"
  >
    <div className="flex items-center space-x-2 mb-4">
      <Phone className="w-5 h-5 text-purple-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Contact
      </h3>
    </div>
    
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="email">
          Email professionnel <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="email"
            name="email"
            type="email"
            value={companyData.email ?? ''}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="contact@monentreprise.com"
            autoComplete="email"
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
          />
        </div>
        {errors.email && (
          <div className="flex items-center space-x-1 text-red-500 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{errors.email}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={companyData.phone ?? ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+33 1 23 45 67 89"
            autoComplete="tel"
            className="pl-10"
          />
        </div>
      </div>
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="website">Site web (optionnel)</Label>
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          id="website"
          name="website"
          type="url"
          value={companyData.website ?? ''}
          onChange={(e) => updateField('website', e.target.value)}
          placeholder="https://www.monentreprise.com"
          autoComplete="url"
          className="pl-10"
        />
      </div>
    </div>
  </motion.div>
);

// Composant pour les informations du dirigeant
const CeoSection: React.FC<{
  companyData: CompanyFormData;
  updateField: (field: string, value: string | number) => void;
}> = ({ companyData, updateField }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.6, duration: 0.5 }}
    className="space-y-4"
  >
    <div className="flex items-center space-x-2 mb-4">
      <Users className="w-5 h-5 text-blue-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Dirigeant
      </h3>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="ceo-name">Nom du dirigeant</Label>
        <Input
          id="ceo-name"
          name="ceo-name"
          value={companyData.ceoName ?? ''}
          onChange={(e) => updateField('ceoName', e.target.value)}
          placeholder="Ex: Jean Dupont"
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ceo-title">Fonction</Label>
  <Select value={companyData.ceoTitle ?? ''} onValueChange={(value) => updateField('ceoTitle', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Gérant">Gérant</SelectItem>
            <SelectItem value="Président">Président</SelectItem>
            <SelectItem value="Directeur Général">Directeur Général</SelectItem>
            <SelectItem value="PDG">PDG</SelectItem>
            <SelectItem value="Autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </motion.div>
);

// Composant pour l'exercice fiscal
const FiscalYearSection: React.FC<{
  companyData: CompanyFormData;
  updateField: (field: string, value: string | number) => void;
}> = ({ companyData, updateField }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.7, duration: 0.5 }}
    className="space-y-4"
  >
    <div className="flex items-center space-x-2 mb-4">
      <Calendar className="w-5 h-5 text-indigo-600" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Exercice fiscal
      </h3>
    </div>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fiscal-year-type">Type d'exercice fiscal</Label>
        <Select value={companyData.fiscalYearType ?? 'calendar'} onValueChange={(value) => updateField('fiscalYearType', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="calendar">Calendrier (Janvier - Décembre)</SelectItem>
            <SelectItem value="april">Avril - Mars</SelectItem>
            <SelectItem value="july">Juillet - Juin</SelectItem>
            <SelectItem value="october">Octobre - Septembre</SelectItem>
            <SelectItem value="custom">Personnalisé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {companyData.fiscalYearType === 'custom' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-medium text-indigo-900">Configuration personnalisée</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fiscal-start-month">Mois de début</Label>
              <Select
                value={(companyData.fiscalYearStartMonth ?? 1).toString()}
                onValueChange={(value) => updateField('fiscalYearStartMonth', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Janvier</SelectItem>
                  <SelectItem value="2">Février</SelectItem>
                  <SelectItem value="3">Mars</SelectItem>
                  <SelectItem value="4">Avril</SelectItem>
                  <SelectItem value="5">Mai</SelectItem>
                  <SelectItem value="6">Juin</SelectItem>
                  <SelectItem value="7">Juillet</SelectItem>
                  <SelectItem value="8">Août</SelectItem>
                  <SelectItem value="9">Septembre</SelectItem>
                  <SelectItem value="10">Octobre</SelectItem>
                  <SelectItem value="11">Novembre</SelectItem>
                  <SelectItem value="12">Décembre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal-start-day">Jour de début</Label>
              <Select
                value={(companyData.fiscalYearStartDay ?? 1).toString()}
                onValueChange={(value) => updateField('fiscalYearStartDay', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-3">
            <p className="text-indigo-800 text-sm">
              <strong>Exercice fiscal :</strong> Du {companyData.fiscalYearStartDay || 1} {
                ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][companyData.fiscalYearStartMonth || 1]
              } au {(companyData.fiscalYearStartDay || 1) - 1 || 31} {
                ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][(companyData.fiscalYearStartMonth || 1) === 12 ? 1 : (companyData.fiscalYearStartMonth || 1) + 1]
              } (année suivante)
            </p>
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

// Fonctions utilitaires pour la validation et gestion des erreurs
const validateCompanyForm = (companyData: CompanyFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Sanitiser le nom de l'entreprise (remplacer & par et)
  const sanitizedName = companyData.name?.trim().replace(/&/g, 'et') || '';

  if (!sanitizedName) {
    errors.name = 'Le nom de l\'entreprise est requis';
  }

  if (!companyData.sector) {
    errors.sector = 'Veuillez sélectionner un secteur d\'activité';
  }

  if (!companyData.email?.trim()) {
    errors.email = 'L\'adresse email est requise';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)) {
    errors.email = 'Format d\'email invalide';
  }

  if (!companyData.country) {
    errors.country = 'Veuillez sélectionner un pays';
  }

  return errors;
};

const clearFieldError = (field: string, errors: Record<string, string>, setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>) => {
  if (errors[field]) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }
};

// Fonctions de rendu pour le header et la navigation
const renderHeader = (t: (key: string, options?: { defaultValue?: string }) => string) => (
  <CardHeader className="text-center pb-6">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
      className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
    >
      <Building className="w-8 h-8 text-white" />
    </motion.div>
    
    <CardTitle className="text-2xl font-bold gradient-text mb-2">
      {t('onboarding.company.title', {
        defaultValue: 'Informations de votre entreprise'
      })}
    </CardTitle>
    <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
      {t('onboarding.company.subtitle', {
        defaultValue: 'Renseignez les détails de votre entreprise pour personnaliser votre expérience CassKai.'
      })}
    </CardDescription>
  </CardHeader>
);

const renderNavigation = (prevStep: () => void, handleNext: () => void) => (
  <div className="flex justify-between pt-6">
    <Button
      variant="outline"
      onClick={prevStep}
      className="flex items-center space-x-2"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Précédent</span>
    </Button>
    
    <Button
      onClick={handleNext}
      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center space-x-2"
    >
      <span>Continuer</span>
      <ArrowRight className="w-4 h-4" />
    </Button>
  </div>
);

export default function CompanyStep() {
  const { goToNextStep, goToPreviousStep, state, updateCompanyProfile } = useOnboarding();
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✨ RÉFÉRENTIELS DYNAMIQUES - PHASE 3
  const {
    countries,
    sectors,
    companySizes,
    timezones,
    currencies,
    loading: referentialsLoading
  } = useOnboardingReferentials();

  const { config: countryConfig, loadCountryConfig } = useCountryAutoConfig();

  const updateField = (field: string, value: string | number) => {
    updateCompanyProfile({ [field]: value });
    clearFieldError(field, errors, setErrors);

    // ✨ AUTO-CONFIGURATION PAYS - PHASE 3
    if (field === 'country') {
      loadCountryConfig(value as string);
    }
  };

  // Auto-complétion quand configuration pays chargée
  useEffect(() => {
    if (countryConfig && countryConfig.country) {
      const country = countryConfig.country;
      updateCompanyProfile({
        currency: country.currency_code,
        timezone: country.timezone
      });
    }
  }, [countryConfig, updateCompanyProfile]);

  const handleNext = () => {
    // Sanitiser le nom de l'entreprise avant validation
    const currentCompanyData = state.data?.companyProfile || {};
    const sanitizedCompanyData = {
      ...currentCompanyData,
      name: currentCompanyData.name?.trim().replace(/&/g, 'et') || ''
    };

    const newErrors = validateCompanyForm(sanitizedCompanyData);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      // Mettre à jour les données avec le nom sanitizé
      updateCompanyProfile(sanitizedCompanyData);
      goToNextStep();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="glass-card">
        {renderHeader(t)}

        <CardContent className="p-6 space-y-6">
          {referentialsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Chargement des référentiels...</span>
            </div>
          ) : (
            <>
              <GeneralInfoSection
                companyData={state.data?.companyProfile || {}}
                updateField={updateField}
                errors={errors}
                // ✨ RÉFÉRENTIELS DYNAMIQUES
                countries={countries}
                sectors={sectors}
                companySizes={companySizes}
                getSectorIcon={getSectorIcon}
              />

              <AddressSection
                companyData={state.data?.companyProfile || {}}
                updateField={updateField}
                errors={errors}
                // ✨ RÉFÉRENTIELS DYNAMIQUES
                countries={countries}
                timezones={timezones}
              />

              <ContactSection
                companyData={state.data?.companyProfile || {}}
                updateField={updateField}
                errors={errors}
              />

              <CeoSection
                companyData={state.data?.companyProfile || {}}
                updateField={updateField}
              />

              <FiscalYearSection
                companyData={state.data?.companyProfile || {}}
                updateField={updateField}
              />

              {renderNavigation(goToPreviousStep, handleNext)}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
