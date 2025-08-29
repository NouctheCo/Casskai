import React, { useState } from 'react';
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
  Calendar,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTranslation } from 'react-i18next';

const sectors = [
  { code: 'services', name: 'Services aux entreprises', icon: '💼' },
  { code: 'commerce', name: 'Commerce de détail', icon: '🏪' },
  { code: 'commerce-gros', name: 'Commerce de gros', icon: '🏭' },
  { code: 'industrie', name: 'Industrie manufacturière', icon: '🏭' },
  { code: 'agriculture', name: 'Agriculture & Agroalimentaire', icon: '🌾' },
  { code: 'btp', name: 'BTP & Construction', icon: '🏗️' },
  { code: 'transport', name: 'Transport & Logistique', icon: '🚚' },
  { code: 'tech', name: 'Technologies & Digital', icon: '💻' },
  { code: 'sante', name: 'Santé & Bien-être', icon: '🏥' },
  { code: 'education', name: 'Éducation & Formation', icon: '🎓' },
  { code: 'restauration', name: 'Restauration & Hôtellerie', icon: '🍽️' },
  { code: 'immobilier', name: 'Immobilier', icon: '🏠' },
  { code: 'autres', name: 'Autres secteurs', icon: '⚙️' }
];

const companySizes = [
  { code: 'micro', name: 'Micro-entreprise (1 personne)', range: '1 employé' },
  { code: 'tpe', name: 'Très petite entreprise', range: '2-9 employés' },
  { code: 'pe', name: 'Petite entreprise', range: '10-49 employés' },
  { code: 'me', name: 'Moyenne entreprise', range: '50-249 employés' },
  { code: 'ge', name: 'Grande entreprise', range: '250+ employés' }
];

export default function CompanyStep() {
  const { nextStep, prevStep, companyData, setCompanyData } = useOnboarding();
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!companyData.name.trim()) {
      newErrors.name = 'Le nom de l\'entreprise est requis';
    }

    if (!companyData.sector) {
      newErrors.sector = 'Veuillez sélectionner un secteur d\'activité';
    }

    if (!companyData.email.trim()) {
      newErrors.email = 'L\'adresse email est requise';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!companyData.country) {
      newErrors.country = 'Veuillez sélectionner un pays';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      nextStep();
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

        <CardContent className="p-6 space-y-6">
          {/* Informations de base */}
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
                  value={companyData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ex: Mon Entreprise SAS"
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
                <Select value={companyData.sector} onValueChange={(value) => updateField('sector', value)}>
                  <SelectTrigger className={errors.sector ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionnez votre secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(sector => (
                      <SelectItem key={sector.code} value={sector.code}>
                        <div className="flex items-center space-x-2">
                          <span>{sector.icon}</span>
                          <span>{sector.name}</span>
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
                  value={companyData.siret}
                  onChange={(e) => updateField('siret', e.target.value)}
                  placeholder="Ex: 12345678901234"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vat-number">Numéro de TVA</Label>
                <Input
                  id="vat-number"
                  value={companyData.vatNumber}
                  onChange={(e) => updateField('vatNumber', e.target.value)}
                  placeholder="Ex: FR12345678901"
                />
              </div>
            </div>
          </motion.div>

          {/* Coordonnées */}
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
                  value={companyData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Ex: 123 Rue de la Paix"
                  rows={2}
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={companyData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Ex: Paris"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postal-code">Code postal</Label>
                  <Input
                    id="postal-code"
                    value={companyData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder="Ex: 75001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">
                    Pays <span className="text-red-500">*</span>
                  </Label>
                  <Select value={companyData.country} onValueChange={(value) => updateField('country', value)}>
                    <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">🇫🇷 France</SelectItem>
                      <SelectItem value="SN">🇸🇳 Sénégal</SelectItem>
                      <SelectItem value="CI">🇨🇮 Côte d'Ivoire</SelectItem>
                      <SelectItem value="MA">🇲🇦 Maroc</SelectItem>
                      <SelectItem value="TN">🇹🇳 Tunisie</SelectItem>
                      <SelectItem value="CM">🇨🇲 Cameroun</SelectItem>
                      <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
                      <SelectItem value="ML">🇲🇱 Mali</SelectItem>
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

          {/* Contact */}
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
                    type="email"
                    value={companyData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="contact@monentreprise.com"
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
                    type="tel"
                    value={companyData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+33 1 23 45 67 89"
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
                  type="url"
                  value={companyData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://www.monentreprise.com"
                  className="pl-10"
                />
              </div>
            </div>
          </motion.div>

          {/* Dirigeant */}
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
                  value={companyData.ceoName}
                  onChange={(e) => updateField('ceoName', e.target.value)}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ceo-title">Fonction</Label>
                <Select value={companyData.ceoTitle} onValueChange={(value) => updateField('ceoTitle', value)}>
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

          {/* Navigation */}
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
              <span>Finaliser</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}