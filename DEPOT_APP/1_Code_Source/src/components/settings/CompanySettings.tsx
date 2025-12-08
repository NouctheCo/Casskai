import React, { useState, useEffect } from 'react';

import { devLogger } from '@/utils/devLogger';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useToast } from '@/components/ui/use-toast';

import { useAuth } from '@/contexts/AuthContext';

import { supabase } from '@/lib/supabase';

import { Building, MapPin, Phone, Mail, Globe, Save, Loader2, Trash2, AlertTriangle, Calendar } from 'lucide-react';

import { useCountries } from '@/hooks/useReferentials';



interface CompanySettingsForm {

  name: string;

  siret: string;

  address: string;

  postalCode: string;

  city: string;

  country: string;

  phone: string;

  email: string;

  website: string;

  logo: string;

  currency: string;

  fiscalYear: string;

  fiscalYearStartMonth: number;

  fiscalYearStartDay: number;

  accountingMethod: string;

  taxId: string;

  legalForm: string;

  activity: string;

  employees: string;

  description: string;

}



export function CompanySettings() {

  const { user: _user, currentCompany } = useAuth();

  const { toast } = useToast();

  const { countries, loading: _countriesLoading } = useCountries();

  const [isLoading, setIsLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [showCompanyDeletion, setShowCompanyDeletion] = useState(false);



  const [settings, setSettings] = useState<CompanySettingsForm>({

    name: '',

    siret: '',

    address: '',

    postalCode: '',

    city: '',

    country: 'FR',

    phone: '',

    email: '',

    website: '',

    logo: '',

    currency: 'EUR',

    fiscalYear: 'calendar',

    fiscalYearStartMonth: 1,

    fiscalYearStartDay: 1,

    accountingMethod: 'accrual',

    taxId: '',

    legalForm: '',

    activity: '',

    employees: '',

    description: ''

  });



  // Fonction pour charger les paramètres entreprise

  const loadCompanySettings = async () => {

    devLogger.info('📋 [DEBUG] loadCompanySettings appelé');

    devLogger.info('🏢 [DEBUG] currentCompany?.id:', currentCompany?.id);



    if (!currentCompany?.id) {

      devLogger.warn('❌ [DEBUG] Pas de currentCompany.id, arrêt du chargement');

      return;

    }



    setIsLoading(true);

    try {

      devLogger.info('🔍 [DEBUG] Requête Supabase SELECT...');

      devLogger.info('🆔 [DEBUG] Recherche entreprise avec ID:', currentCompany.id);



      // Charger les données depuis Supabase

      const { data, error } = await supabase

        .from('companies')

        .select('*')

        .eq('id', currentCompany.id)

        .single();



      devLogger.info('📥 [DEBUG] Résultat chargement data:', data);

      devLogger.info('❌ [DEBUG] Résultat chargement error:', error);



      if (error) {

        devLogger.error('💥 [DEBUG] Erreur Supabase chargement détaillée:', {

          message: error.message,

          details: error.details,

          hint: error.hint,

          code: error.code

        });

        throw error;

      }



      if (data) {

        devLogger.info('✅ [DEBUG] Données brutes Supabase:', data);

        devLogger.info('🔍 [DEBUG] Type de data:', typeof data, Array.isArray(data));



        // ✅ CORRECTION : Extraire l'objet du tableau si nécessaire

        const company = Array.isArray(data) ? data[0] : data;

        devLogger.info('🔍 [DEBUG] Objet company extrait:', company);

        devLogger.info('🔍 [DEBUG] Colonnes disponibles:', Object.keys(company));



        // Tests de mapping individuels

        devLogger.info('🔍 [DEBUG] company.name:', company.name);

        devLogger.info('🔍 [DEBUG] company.address:', company.address);

        devLogger.info('🔍 [DEBUG] company.postal_code:', company.postal_code);

        devLogger.info('🔍 [DEBUG] company.city:', company.city);

        devLogger.info('🔍 [DEBUG] company.phone:', company.phone);

        devLogger.info('🔍 [DEBUG] company.email:', company.email);

        devLogger.info('🔍 [DEBUG] company.default_currency:', company.default_currency);

        devLogger.info('🔍 [DEBUG] company.fiscal_year_type:', company.fiscal_year_type);



        const newSettings = {

          // ✅ Informations de base (COLONNES CONFIRMÉES)

          name: company.name || '',

          address: company.address || '',

          postalCode: company.postal_code || '',

          city: company.city || '',

          country: company.country || 'FR',

          phone: company.phone || '',

          email: company.email || '',

          website: company.website || '',

          logo: company.logo || '',

          currency: company.default_currency || 'EUR',



          // ✅ Identifiants fiscaux (COLONNES CONFIRMÉES + NOUVELLES)

          taxId: company.vat_number || '',  // NOUVELLE COLONNE

          siret: company.siret || '',

          description: company.description || '',  // NOUVELLE COLONNE



          // ✅ Paramètres comptables et fiscaux (COLONNES CONFIRMÉES)

          fiscalYear: company.fiscal_year_type || 'calendar',

          fiscalYearStartMonth: company.fiscal_year_start_month || 1,

          fiscalYearStartDay: company.fiscal_year_start_day || 1,

          accountingMethod: company.accounting_method || 'accrual',  // NOUVELLE COLONNE



          // ✅ Informations légales (COLONNES CONFIRMÉES)

          legalForm: company.legal_form || '',

          activity: company.activity_sector || '',

          employees: company.employee_count || ''

        };



        devLogger.info('📊 [DEBUG] Settings mappés:', newSettings);

        devLogger.info('🔍 [DEBUG] Valeurs mappées - name:', newSettings.name);

        devLogger.info('🔍 [DEBUG] Valeurs mappées - address:', newSettings.address);

        devLogger.info('🔍 [DEBUG] Valeurs mappées - postalCode:', newSettings.postalCode);



        setSettings(newSettings);

      } else {

        devLogger.warn('⚠️ [DEBUG] Aucune donnée retournée par Supabase');

      }

    } catch (error) {

      devLogger.error('💥 [DEBUG] Erreur dans catch chargement:', error instanceof Error ? error.message : String(error));

      toast({

        title: 'Erreur',

        description: 'Impossible de charger les paramètres entreprise',

        variant: 'destructive'

      });

    } finally {

      devLogger.info('🏁 [DEBUG] Fin chargement, setIsLoading(false)');

      setIsLoading(false);

    }

  };



  // Charger les paramètres entreprise

  useEffect(() => {

    devLogger.info('🔄 [DEBUG] useEffect loadCompanySettings déclenché');

    devLogger.info('🏢 [DEBUG] currentCompany dans useEffect:', currentCompany);



    loadCompanySettings();

  }, [currentCompany?.id, toast]);



  const handleSave = async () => {

    devLogger.info('🚀 [DEBUG] handleSave appelé');

    devLogger.info('🏢 [DEBUG] currentCompany:', currentCompany);

    devLogger.info('🏢 [DEBUG] currentCompany?.id:', currentCompany?.id);



    if (!currentCompany?.id) {

      devLogger.warn('❌ [DEBUG] Pas de currentCompany.id, arrêt de la fonction');

      return;

    }



    devLogger.info('📝 [DEBUG] Démarrage sauvegarde, données à sauvegarder:', settings);

    setIsSaving(true);



    try {

      devLogger.info('🔄 [DEBUG] Appel Supabase UPDATE...');



      // ✅ MAPPING COMPLET ALIGNÉ AVEC LE SCHÉMA SUPABASE

      const updateData = {

        // Informations de base

        name: settings.name.trim(),

        address: settings.address.trim(),

        postal_code: settings.postalCode.trim(),

        city: settings.city.trim(),

        country: settings.country,

        phone: settings.phone.trim(),

        email: settings.email.trim(),

        website: settings.website.trim(),

        default_currency: settings.currency,

        updated_at: new Date().toISOString(),



        // Identifiants fiscaux

        vat_number: settings.taxId.trim(),  // NOUVELLE COLONNE

        siret: settings.siret.trim(),

        description: settings.description.trim(),  // NOUVELLE COLONNE



        // Paramètres comptables et fiscaux

        fiscal_year_type: settings.fiscalYear,

        fiscal_year_start_month: settings.fiscalYearStartMonth,

        fiscal_year_start_day: settings.fiscalYearStartDay,

        accounting_method: settings.accountingMethod,  // NOUVELLE COLONNE



        // Informations légales

        legal_form: settings.legalForm,

        activity_sector: settings.activity.trim(),

        employee_count: settings.employees,

      };



      devLogger.info('📊 [DEBUG] Données sécurisées envoyées à Supabase:', updateData);

      devLogger.info('🆔 [DEBUG] ID entreprise pour WHERE:', currentCompany.id);



      // Sauvegarder dans Supabase

      const { data, error } = await supabase

        .from('companies')

        .update(updateData)

        .eq('id', currentCompany.id)

        .select(); // Ajout de select() pour récupérer les données modifiées



      devLogger.info('📥 [DEBUG] Réponse Supabase data:', data);

      devLogger.info('❌ [DEBUG] Réponse Supabase error:', error);



      if (error) {

        devLogger.error('💥 [DEBUG] Erreur Supabase détaillée:', {

          message: error.message,

          details: error.details,

          hint: error.hint,

          code: error.code

        });

        throw error;

      }



      devLogger.info('✅ [DEBUG] Sauvegarde réussie!');

      toast({

        title: 'Paramètres sauvegardés',

        description: 'Les paramètres de l\'entreprise ont été mis à jour avec succès'

      });



      // Recharger les données après sauvegarde pour s'assurer que l'interface est à jour

      devLogger.info('🔄 [DEBUG] Rechargement des données après sauvegarde...');

      await loadCompanySettings();

      devLogger.info('✅ [DEBUG] Données rechargées après sauvegarde');

    } catch (error) {

      devLogger.error('💥 [DEBUG] Erreur dans catch:', error instanceof Error ? error.message : String(error));

      devLogger.error('💥 [DEBUG] Type d\'erreur:', typeof error);

      devLogger.error('💥 [DEBUG] Erreur complète:', JSON.stringify(error instanceof Error ? error.message : String(error), null, 2));



      toast({

        title: 'Erreur',

        description: 'Impossible de sauvegarder les paramètres. Veuillez réessayer.',

        variant: 'destructive'

      });

    } finally {

      devLogger.info('🏁 [DEBUG] Fin handleSave, setIsSaving(false)');

      setIsSaving(false);

    }

  };



  if (isLoading) {

    return (

      <Card>

        <CardContent className="flex items-center justify-center py-8">

          <Loader2 className="h-8 w-8 animate-spin" />

        </CardContent>

      </Card>

    );

  }



  return (

    <div className="space-y-6">

      {/* Informations générales */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <Building className="h-5 w-5" />

            Informations générales

          </CardTitle>

          <CardDescription>

            Informations de base de votre entreprise

          </CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">

              <Label htmlFor="companyName">Nom de l'entreprise</Label>

              <Input

                key={`companyName-${settings.name}`}

                id="companyName"

                value={settings.name}

                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}

                placeholder="Ma Société SARL"

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="legalForm">Forme juridique</Label>

              <Select value={settings.legalForm} onValueChange={(value) => setSettings(prev => ({ ...prev, legalForm: value }))}>

                <SelectTrigger>

                  <SelectValue placeholder="Sélectionner..." />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="sarl">SARL</SelectItem>

                  <SelectItem value="sas">SAS</SelectItem>

                  <SelectItem value="sasu">SASU</SelectItem>

                  <SelectItem value="eurl">EURL</SelectItem>

                  <SelectItem value="sa">SA</SelectItem>

                  <SelectItem value="ei">Entreprise Individuelle</SelectItem>

                </SelectContent>

              </Select>

            </div>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">

              <Label htmlFor="siret">SIRET</Label>

              <Input

                id="siret"

                value={settings.siret}

                onChange={(e) => setSettings(prev => ({ ...prev, siret: e.target.value }))}

                placeholder="123 456 789 01234"

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="taxId">Numéro de TVA</Label>

              <Input

                id="taxId"

                value={settings.taxId}

                onChange={(e) => setSettings(prev => ({ ...prev, taxId: e.target.value }))}

                placeholder="FR 12 345678901"

              />

            </div>

          </div>



          <div className="space-y-2">

            <Label htmlFor="activity">Secteur d'activité</Label>

            <Input

              id="activity"

              value={settings.activity}

              onChange={(e) => setSettings(prev => ({ ...prev, activity: e.target.value }))}

              placeholder="Commerce de détail, Services informatiques..."

            />

          </div>



          <div className="space-y-2">

            <Label htmlFor="description">Description</Label>

            <Textarea

              id="description"

              value={settings.description}

              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}

              placeholder="Décrivez brièvement votre activité..."

              rows={3}

            />

          </div>

        </CardContent>

      </Card>



      {/* Adresse */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <MapPin className="h-5 w-5" />

            Adresse

          </CardTitle>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="space-y-2">

            <Label htmlFor="address">Adresse</Label>

            <Input

              key={`address-${settings.address}`}

              id="address"

              value={settings.address}

              onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}

              placeholder="123 Rue de la Paix"

            />

          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="space-y-2">

              <Label htmlFor="postalCode">Code postal</Label>

              <Input

                key={`postalCode-${settings.postalCode}`}

                id="postalCode"

                value={settings.postalCode}

                onChange={(e) => setSettings(prev => ({ ...prev, postalCode: e.target.value }))}

                placeholder="75001"

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="city">Ville</Label>

              <Input

                key={`city-${settings.city}`}

                id="city"

                value={settings.city}

                onChange={(e) => setSettings(prev => ({ ...prev, city: e.target.value }))}

                placeholder="Paris"

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="country">Pays</Label>

              <Select value={settings.country} onValueChange={(value) => setSettings(prev => ({ ...prev, country: value }))}>

                <SelectTrigger>

                  <SelectValue />

                </SelectTrigger>

                <SelectContent>

                  {countries.map(country => (

                    <SelectItem key={country.code} value={country.code}>

                      {country.name} ({country.currency_symbol})

                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>

          </div>

        </CardContent>

      </Card>



      {/* Contact */}

      <Card>

        <CardHeader>

          <CardTitle>Contact</CardTitle>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">

              <Label htmlFor="companyPhone">Téléphone</Label>

              <div className="relative">

                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input

                  key={`companyPhone-${settings.phone}`}

                  id="companyPhone"

                  value={settings.phone}

                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}

                  className="pl-10"

                  placeholder="+33 1 23 45 67 89"

                />

              </div>

            </div>

            <div className="space-y-2">

              <Label htmlFor="companyEmail">Email</Label>

              <div className="relative">

                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input

                  key={`companyEmail-${settings.email}`}

                  id="companyEmail"

                  type="email"

                  value={settings.email}

                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}

                  className="pl-10"

                  placeholder="contact@masociete.com"

                />

              </div>

            </div>

          </div>



          <div className="space-y-2">

            <Label htmlFor="companyWebsite">Site web</Label>

            <div className="relative">

              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input

                id="companyWebsite"

                value={settings.website}

                onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}

                className="pl-10"

                placeholder="https://www.monsite.com"

              />

            </div>

          </div>

        </CardContent>

      </Card>



      {/* Paramètres comptables */}

      <Card>

        <CardHeader>

          <CardTitle>Paramètres comptables</CardTitle>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="space-y-2">

              <Label htmlFor="currency">Devise</Label>

              <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>

                <SelectTrigger>

                  <SelectValue />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="EUR">EUR (€)</SelectItem>

                  <SelectItem value="USD">USD ($)</SelectItem>

                  <SelectItem value="GBP">GBP (£)</SelectItem>

                  <SelectItem value="CHF">CHF (Fr)</SelectItem>

                </SelectContent>

              </Select>

            </div>

            <div className="space-y-2">

              <Label htmlFor="fiscalYear">Exercice fiscal</Label>

              <Select value={settings.fiscalYear} onValueChange={(value) => setSettings(prev => ({ ...prev, fiscalYear: value }))}>

                <SelectTrigger>

                  <SelectValue />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="calendar">Calendrier (Jan-Déc)</SelectItem>

                  <SelectItem value="april">Avril - Mars</SelectItem>

                  <SelectItem value="july">Juillet - Juin</SelectItem>

                  <SelectItem value="october">Octobre - Septembre</SelectItem>

                  <SelectItem value="custom">Personnalisé</SelectItem>

                </SelectContent>

              </Select>

            </div>

            <div className="space-y-2">

              <Label htmlFor="accountingMethod">Méthode comptable</Label>

              <Select value={settings.accountingMethod} onValueChange={(value) => setSettings(prev => ({ ...prev, accountingMethod: value }))}>

                <SelectTrigger>

                  <SelectValue />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="accrual">Engagement</SelectItem>

                  <SelectItem value="cash">Trésorerie</SelectItem>

                </SelectContent>

              </Select>

            </div>

          </div>



          {/* Configuration exercice fiscal personnalisé */}

          {settings.fiscalYear === 'custom' && (

            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20">

              <CardHeader>

                <CardTitle className="text-lg flex items-center gap-2">

                  <Calendar className="h-5 w-5" />

                  Configuration de l'exercice fiscal

                </CardTitle>

                <CardDescription>

                  Définissez les dates de début et de fin de votre exercice fiscal

                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">

                    <Label htmlFor="fiscalYearStartMonth">Mois de début</Label>

                    <Select

                      value={settings.fiscalYearStartMonth.toString()}

                      onValueChange={(value) => setSettings(prev => ({

                        ...prev,

                        fiscalYearStartMonth: parseInt(value)

                      }))}

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

                    <Label htmlFor="fiscalYearStartDay">Jour de début</Label>

                    <Select

                      value={settings.fiscalYearStartDay.toString()}

                      onValueChange={(value) => setSettings(prev => ({

                        ...prev,

                        fiscalYearStartDay: parseInt(value)

                      }))}

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

                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">

                  <p className="text-blue-800 text-sm">

                    <strong>Exercice fiscal :</strong> Du {settings.fiscalYearStartDay} {

                      ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',

                       'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][settings.fiscalYearStartMonth]

                    } au {settings.fiscalYearStartDay - 1 || 31} {

                      ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin',

                       'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][settings.fiscalYearStartMonth === 12 ? 1 : settings.fiscalYearStartMonth + 1]

                    } (année suivante)

                  </p>

                </div>

              </CardContent>

            </Card>

          )}



          <div className="space-y-2">

            <Label htmlFor="employees">Nombre d'employés</Label>

            <Select value={settings.employees} onValueChange={(value) => setSettings(prev => ({ ...prev, employees: value }))}>

              <SelectTrigger>

                <SelectValue placeholder="Sélectionner..." />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="1-5">1-5 employés</SelectItem>

                <SelectItem value="6-10">6-10 employés</SelectItem>

                <SelectItem value="11-50">11-50 employés</SelectItem>

                <SelectItem value="51-200">51-200 employés</SelectItem>

                <SelectItem value="200+">Plus de 200 employés</SelectItem>

              </SelectContent>

            </Select>

          </div>

        </CardContent>

      </Card>



      {/* Actions dangereuses */}

      <Card className="border-red-200">

        <CardHeader>

          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">

            <AlertTriangle className="h-5 w-5" />

            Zone de danger

          </CardTitle>

          <CardDescription>

            Ces actions sont irréversibles et peuvent supprimer définitivement l'entreprise et ses données.

          </CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20">

            <div className="flex items-start justify-between">

              <div className="space-y-1">

                <h3 className="font-medium text-red-900">

                  Supprimer cette entreprise

                </h3>

                <p className="text-sm text-red-700">

                  Suppression définitive de l'entreprise avec consensus des propriétaires.

                  Inclut l'export FEC et l'archivage légal des données.

                </p>

              </div>

              <Button

                variant="destructive"

                size="sm"

                onClick={() => setShowCompanyDeletion(true)}

                className="ml-4 shrink-0"

              >

                <Trash2 className="h-4 w-4 mr-2" />

                Supprimer

              </Button>

            </div>

          </div>

        </CardContent>

      </Card>



      {/* Bouton de sauvegarde */}

      <div className="flex justify-end">

        <Button

          onClick={() => {

            devLogger.info('🔘 [DEBUG] Bouton "Sauvegarder" cliqué');

            devLogger.info('🔘 [DEBUG] isSaving:', isSaving);

            handleSave();

          }}

          disabled={isSaving}

        >

          {isSaving ? (

            <>

              <Loader2 className="mr-2 h-4 w-4 animate-spin" />

              Sauvegarde...

            </>

          ) : (

            <>

              <Save className="mr-2 h-4 w-4" />

              Sauvegarder les paramètres

            </>

          )}

        </Button>

      </div>



      {/* Placeholder pour Company Deletion Dialog */}

      {showCompanyDeletion && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <Card className="max-w-md w-full">

            <CardHeader>

              <CardTitle className="text-red-600 dark:text-red-400">Suppression d'entreprise</CardTitle>

              <CardDescription>

                Cette fonctionnalité sera bientôt disponible avec le système de consensus des propriétaires.

              </CardDescription>

            </CardHeader>

            <CardContent className="space-y-4">

              <p className="text-sm text-gray-600 dark:text-gray-400">

                La suppression d'entreprise nécessite l'accord de tous les propriétaires

                et inclura un export FEC automatique avant suppression.

              </p>

              <div className="flex space-x-2">

                <Button

                  variant="outline"

                  className="flex-1"

                  onClick={() => setShowCompanyDeletion(false)}

                >

                  Annuler

                </Button>

                <Button

                  variant="destructive"

                  className="flex-1"

                  onClick={() => {

                    toast({

                      title: "Fonctionnalité à venir",

                      description: "La suppression d'entreprise sera disponible prochainement.",

                    });

                    setShowCompanyDeletion(false);

                  }}

                >

                  Continuer

                </Button>

              </div>

            </CardContent>

          </Card>

        </div>

      )}

    </div>

  );

}
