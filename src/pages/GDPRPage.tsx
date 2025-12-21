/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { motion } from 'framer-motion';

import { toastSuccess } from '@/lib/toast-helpers';

import GDPRService from '@/services/gdprRequestsService';

import { 

  Shield, 

  Eye, 

  Download, 

  Trash2, 

  Edit, 

  Ban, 

  UserCheck,

  FileText,

  Calendar,

  Clock,

  Mail,

  AlertTriangle,

  CheckCircle,

  Info,

  Lock,

  Database,

  Globe,

  Building,

  Phone

} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

import { PageContainer } from '@/components/ui/PageContainer';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';



const GDPRPage = () => {

  const { t: _t, i18n } = useTranslation();



  // Fonction de traduction robuste avec fallbacks multiples

  const safeT = (key: string, fallbackFr: string, fallbackEn?: string, fallbackEs?: string) => {

    try {

      const currentLang = i18n?.language || 'fr';

      if (currentLang.startsWith('en') && fallbackEn) return fallbackEn;

      if (currentLang.startsWith('es') && fallbackEs) return fallbackEs;

      return fallbackFr;

    } catch (error) {

      console.warn('Translation error:', error);

      return fallbackFr;

    }

  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [requestForm, setRequestForm] = useState({

    type: '',

    email: '',

    firstName: '',

    lastName: '',

    company: '',

    description: ''

  });



  const lastUpdated = "8 août 2025";



  const rights = [

    {

      id: 'access',

      icon: Eye,

      title: 'Droit d\'accès',

      description: 'Connaître les données que nous détenons sur vous',

      details: [

        'Consulter toutes vos données personnelles',

        'Connaître les finalités du traitement',

        'Identifier les destinataires',

        'Connaître la durée de conservation'

      ],

      timeLimit: '1 mois',

      color: 'text-blue-600',

      bgColor: 'bg-blue-50 dark:bg-blue-900/20'

    },

    {

      id: 'rectification',

      icon: Edit,

      title: 'Droit de rectification',

      description: 'Corriger ou compléter vos données',

      details: [

        'Modifier des informations inexactes',

        'Compléter des données incomplètes',

        'Mettre à jour vos coordonnées',

        'Corriger votre profil entreprise'

      ],

      timeLimit: '1 mois',

      color: 'text-green-600',

      bgColor: 'bg-green-50 dark:bg-green-900/20'

    },

    {

      id: 'erasure',

      icon: Trash2,

      title: 'Droit à l\'effacement',

      description: 'Supprimer vos données personnelles',

      details: [

        'Suppression de votre compte',

        'Effacement des données obsolètes',

        'Retrait des données illégales',

        'Suppression après opposition'

      ],

      timeLimit: '1 mois',

      color: 'text-red-600',

      bgColor: 'bg-red-50 dark:bg-red-900/20'

    },

    {

      id: 'portability',

      icon: Download,

      title: 'Droit à la portabilité',

      description: 'Récupérer et transférer vos données',

      details: [

        'Export dans un format lisible',

        'Récupération de toutes vos données',

        'Transmission à un tiers',

        'Format structuré (JSON, CSV)'

      ],

      timeLimit: '1 mois',

      color: 'text-purple-600',

      bgColor: 'bg-purple-50 dark:bg-purple-900/20'

    },

    {

      id: 'restriction',

      icon: Ban,

      title: 'Droit de limitation',

      description: 'Limiter le traitement de vos données',

      details: [

        'Suspension temporaire du traitement',

        'Conservation sans utilisation',

        'Traitement limité aux cas légaux',

        'Notification des tiers concernés'

      ],

      timeLimit: '1 mois',

      color: 'text-orange-600',

      bgColor: 'bg-orange-50 dark:bg-orange-900/20'

    },

    {

      id: 'objection',

      icon: AlertTriangle,

      title: 'Droit d\'opposition',

      description: 'Vous opposer au traitement de vos données',

      details: [

        'Opposition au marketing direct',

        'Opposition à l\'intérêt légitime',

        'Opposition au profilage',

        'Arrêt des communications'

      ],

      timeLimit: '1 mois',

      color: 'text-yellow-600',

      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'

    }

  ];



  const dataTypes = [

    {

      category: 'Identité',

      icon: UserCheck,

      data: [

        'Nom, prénom, email',

        'Numéro de téléphone',

        'Photo de profil',

        'Préférences linguistiques'

      ],

      retention: '3 ans après résiliation',

      legal: 'Exécution du contrat'

    },

    {

      category: 'Entreprise',

      icon: Building,

      data: [

        'Dénomination sociale',

        'SIREN, SIRET',

        'Adresse du siège',

        'Secteur d\'activité'

      ],

      retention: '10 ans (obligations comptables)',

      legal: 'Obligation légale'

    },

    {

      category: 'Usage',

      icon: Database,

      data: [

        'Logs de connexion',

        'Adresse IP',

        'Actions effectuées',

        'Préférences interface'

      ],

      retention: '13 mois maximum',

      legal: 'Intérêt légitime'

    },

    {

      category: 'Métier',

      icon: FileText,

      data: [

        'Données comptables',

        'Factures et devis',

        'Contacts clients/fournisseurs',

        'Données RH (si activé)'

      ],

      retention: '10 ans (obligations légales)',

      legal: 'Exécution du contrat + obligations légales'

    }

  ];



  const handleRequestSubmit = async (e: React.FormEvent) => {

    e.preventDefault();



    // Validation des données

    const validationErrors = GDPRService.validateGDPRRequest(requestForm);

    if (validationErrors.length > 0) {

      setFormErrors(validationErrors);

      toastSuccess(validationErrors.join(', '));

      return;

    }

    

    setFormErrors([]);



    setIsSubmitting(true);

    

    try {

      // Créer la demande RGPD via le service

      const gdprRequest = await GDPRService.createGDPRRequest(requestForm);

      

      // Envoyer l'email de confirmation

      await GDPRService.sendConfirmationEmail(gdprRequest);

      

      // Afficher la confirmation avec toast

      toastSuccess(`Votre demande de ${getRequestTypeLabel(requestForm.type)} a été enregistrée. Vous recevrez une réponse sous ${GDPRService.getLegalTimeframe(requestForm.type)}.`);

      

      // Réinitialiser le formulaire

      setRequestForm({

        type: '',

        email: '',

        firstName: '',

        lastName: '',

        company: '',

        description: ''

      });

      

    } catch (error) {

      console.error('Error submitting GDPR request:', error instanceof Error ? error.message : String(error));

      toastSuccess("Impossible d'envoyer votre demande. Veuillez réessayer ou nous contacter directement.");

    } finally {

      setIsSubmitting(false);

    }

  };



  // Fonction utilitaire pour obtenir le libellé du type de demande

  const getRequestTypeLabel = (type: string): string => {

    const typeLabels = {

      'access': 'droit d\'accès',

      'rectification': 'droit de rectification',

      'erasure': 'droit à l\'effacement',

      'portability': 'droit à la portabilité',

      'restriction': 'droit de limitation',

      'objection': 'droit d\'opposition'

    };

    return typeLabels[type] || 'demande RGPD';

  };



  // Fonction pour gérer les changements de formulaire et effacer les erreurs

  const handleFormChange = (field: string, value: string) => {

    setRequestForm({...requestForm, [field]: value});

    // Effacer les erreurs quand l'utilisateur commence à corriger

    if (formErrors.length > 0) {

      setFormErrors([]);

    }

  };



  return (

    <PageContainer variant="legal">

      <PublicNavigation variant="legal" />



      {/* Header */}

      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-16 pt-24">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="text-center"

          >

            <Shield className="w-16 h-16 mx-auto mb-6 text-blue-200" />

            <h1 className="text-4xl md:text-5xl font-bold mb-4">

              {safeT('gdpr.title', 'Conformité RGPD', 'GDPR Compliance', 'Cumplimiento RGPD')}

            </h1>

            <p className="text-xl text-blue-100 mb-4">

              {safeT('gdpr.subtitle', 'Vos droits en matière de protection des données personnelles', 'Your rights regarding personal data protection', 'Sus derechos sobre la protección de datos personales')}

            </p>

            <Badge className="bg-blue-800/50 text-blue-200 border-blue-700">

              <Calendar className="w-4 h-4 mr-2" />

              {safeT('gdpr.updated', 'Mise à jour', 'Last updated', 'Última actualización')} : {lastUpdated}

            </Badge>

          </motion.div>

        </div>

      </div>



      {/* Intro RGPD */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <Card className="mb-8">

          <CardHeader>

            <CardTitle className="flex items-center">

              <Info className="w-6 h-6 mr-3 text-blue-600" />

              {safeT('gdpr.whatIsGDPR', 'Qu\'est-ce que le RGPD ?', 'What is GDPR?', '¿Qué es el RGPD?')}

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="mb-4">

              {safeT('gdpr.description', 'Le Règlement Général sur la Protection des Données (RGPD) est une réglementation européenne qui renforce et unifie la protection des données personnelles. Chez CassKai, nous nous engageons à respecter scrupuleusement vos droits.', 'The General Data Protection Regulation (GDPR) is European legislation that strengthens and unifies the protection of personal data. At CassKai, we are committed to scrupulously respecting your rights.', 'El Reglamento General de Protección de Datos (RGPD) es una regulación europea que refuerza y unifica la protección de datos personales. En CassKai, nos comprometemos a respetar escrupulosamente sus derechos.')}

            </p>

            

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">

                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />

                <h4 className="font-semibold text-sm mb-1">{safeT('gdpr.protectionTitle', 'Protection renforcée', 'Enhanced protection', 'Protección reforzada')}</h4>

                <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-300">

                  {safeT('gdpr.protectionDesc', 'Vos données sont protégées par des standards stricts', 'Your data is protected by strict standards', 'Sus datos están protegidos por estándares estrictos')}

                </p>

              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">

                <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />

                <h4 className="font-semibold text-sm mb-1">{safeT('gdpr.rightsTitle', 'Droits étendus', 'Extended rights', 'Derechos extendidos')}</h4>

                <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-300">

                  {safeT('gdpr.rightsDesc', '6 droits fondamentaux à votre disposition', '6 fundamental rights at your disposal', '6 derechos fundamentales a su disposición')}

                </p>

              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">

                <Globe className="w-8 h-8 text-purple-600 mx-auto mb-2" />

                <h4 className="font-semibold text-sm mb-1">{safeT('gdpr.europeTitle', 'Norme européenne', 'European standard', 'Norma europea')}</h4>

                <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-300">

                  {safeT('gdpr.europeDesc', 'Applicable dans toute l\'Union Européenne', 'Applicable throughout the European Union', 'Aplicable en toda la Unión Europea')}

                </p>

              </div>

            </div>

          </CardContent>

        </Card>



        {/* Données traitées */}

        <Card className="mb-8">

          <CardHeader>

            <CardTitle className="flex items-center">

              <Database className="w-6 h-6 mr-3 text-purple-600" />

              {safeT('gdpr.dataWeProcess', 'Données que nous traitons', 'Data we process', 'Datos que procesamos')}

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="mb-6">

              {safeT('gdpr.dataDescription', 'Voici un aperçu transparent des données personnelles que CassKai collecte et traite :', 'Here is a transparent overview of the personal data that CassKai collects and processes:', 'Aquí tienes una visión transparente de los datos personales que CassKai recopila y procesa:')}

            </p>

            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {dataTypes.map((type, index) => (

                <div key={index} className="border rounded-lg p-4">

                  <div className="flex items-center mb-3">

                    <type.icon className="w-6 h-6 text-blue-600 mr-2" />

                    <h3 className="font-semibold">{type.category}</h3>

                  </div>

                  

                  <div className="space-y-3">

                    <div>

                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">

                        Données collectées :

                      </h4>

                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">

                        {type.data.map((item, idx) => (

                          <li key={idx} className="flex items-center">

                            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />

                            {item}

                          </li>

                        ))}

                      </ul>

                    </div>

                    

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">

                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">

                        <p><strong>Conservation :</strong> {type.retention}</p>

                        <p><strong>Base légale :</strong> {type.legal}</p>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </CardContent>

        </Card>



        {/* Vos droits RGPD */}

        <Card className="mb-8">

          <CardHeader>

            <CardTitle className="flex items-center">

              <UserCheck className="w-6 h-6 mr-3 text-green-600" />

              {safeT('gdpr.yourRights', 'Vos droits RGPD', 'Your GDPR Rights', 'Sus derechos RGPD')}

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="mb-6">

              Le RGPD vous confère 6 droits fondamentaux que vous pouvez exercer à tout moment :

            </p>

            

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {rights.map((right, index) => (

                <motion.div

                  key={right.id}

                  initial={{ opacity: 0, y: 20 }}

                  animate={{ opacity: 1, y: 0 }}

                  transition={{ delay: index * 0.1 }}

                  className={`p-4 ${right.bgColor} rounded-lg border`}

                >

                  <div className="flex items-center mb-3">

                    <right.icon className={`w-6 h-6 ${right.color} mr-3`} />

                    <h3 className="font-semibold text-sm">{right.title}</h3>

                  </div>

                  

                  <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-3">

                    {right.description}

                  </p>

                  

                  <ul className="text-xs space-y-1 mb-3">

                    {right.details.map((detail, idx) => (

                      <li key={idx} className="flex items-center">

                        <div className={`w-1.5 h-1.5 ${right.color.replace('text-', 'bg-')} rounded-full mr-2 flex-shrink-0`} />

                        {detail}

                      </li>

                    ))}

                  </ul>

                  

                  <div className="flex items-center justify-between text-xs">

                    <span className="text-gray-500 dark:text-gray-400">

                      <Clock className="w-3 h-3 inline mr-1" />

                      {right.timeLimit}

                    </span>

                    <Badge variant="outline" className="text-xs px-2 py-1">

                      Gratuit

                    </Badge>

                  </div>

                </motion.div>

              ))}

            </div>

          </CardContent>

        </Card>



        {/* Formulaire de demande */}

        <Card className="mb-8">

          <CardHeader>

            <CardTitle className="flex items-center">

              <Mail className="w-6 h-6 mr-3 text-orange-600" />

              Exercer vos droits

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="mb-6">

              Utilisez ce formulaire pour exercer vos droits RGPD. 

              Nous traiterons votre demande dans les meilleurs délais.

            </p>

            

            {/* Affichage des erreurs de validation */}

            {formErrors.length > 0 && (

              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">

                <div className="flex">

                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5 dark:text-red-400" />

                  <div>

                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">

                      Veuillez corriger les erreurs suivantes :

                    </h4>

                    <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">

                      {formErrors.map((error, index) => (

                        <li key={index}>{error}</li>

                      ))}

                    </ul>

                  </div>

                </div>

              </div>

            )}

            

            <form onSubmit={handleRequestSubmit} className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium mb-2">Type de demande</label>

                  <select
                    aria-label="Type de demande RGPD"
                    value={requestForm.type}

                    onChange={(e) => handleFormChange('type', e.target.value)}

                    className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"

                    required

                  >

                    <option value="">Sélectionner...</option>

                    <option value="access">Droit d'accès</option>

                    <option value="rectification">Droit de rectification</option>

                    <option value="erasure">Droit à l'effacement</option>

                    <option value="portability">Droit à la portabilité</option>

                    <option value="restriction">Droit de limitation</option>

                    <option value="objection">Droit d'opposition</option>

                    <option value="other">Autre</option>

                  </select>

                </div>

                

                <div>

                  <label className="block text-sm font-medium mb-2">Email</label>

                  <Input

                    type="email"

                    value={requestForm.email}

                    onChange={(e) => handleFormChange('email', e.target.value)}

                    placeholder="votre@email.com"

                    required

                  />

                </div>

              </div>

              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium mb-2">Prénom</label>

                  <Input

                    type="text"

                    value={requestForm.firstName}

                    onChange={(e) => handleFormChange('firstName', e.target.value)}

                    placeholder="Votre prénom"

                    required

                  />

                </div>

                

                <div>

                  <label className="block text-sm font-medium mb-2">Nom</label>

                  <Input

                    type="text"

                    value={requestForm.lastName}

                    onChange={(e) => handleFormChange('lastName', e.target.value)}

                    placeholder="Votre nom"

                    required

                  />

                </div>

              </div>

              

              <div>

                <label className="block text-sm font-medium mb-2">Entreprise (optionnel)</label>

                <Input

                  type="text"

                  value={requestForm.company}

                  onChange={(e) => handleFormChange('company', e.target.value)}

                  placeholder="Nom de votre entreprise"

                />

              </div>

              

              <div>

                <label className="block text-sm font-medium mb-2">Description de votre demande</label>

                <Textarea

                  value={requestForm.description}

                  onChange={(e) => handleFormChange('description', e.target.value)}

                  placeholder="Décrivez précisément votre demande..."

                  rows={4}

                  required

                />

              </div>

              

              <div className="flex gap-4">

                <Button 

                  type="submit" 

                  className="bg-blue-600 hover:bg-blue-700"

                  disabled={isSubmitting}

                >

                  <Mail className="w-4 h-4 mr-2" />

                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}

                </Button>

                <Button 

                  type="button" 

                  variant="outline"

                  onClick={() => setRequestForm({

                    type: '', email: '', firstName: '', lastName: '', company: '', description: ''

                  })}

                >

                  Effacer le formulaire

                </Button>

              </div>

            </form>

            

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">

              <div className="flex items-start">

                <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />

                <div className="text-sm">

                  <p className="font-semibold mb-1">Information importante :</p>

                  <ul className="space-y-1 text-gray-600 dark:text-gray-400 dark:text-gray-300">

                    <li>• Nous vous répondrons sous 72 heures maximum</li>

                    <li>• Une vérification d'identité pourra être demandée</li>

                    <li>• Le traitement complet prend 30 jours maximum</li>

                    <li>• Service entièrement gratuit</li>

                  </ul>

                </div>

              </div>

            </div>

          </CardContent>

        </Card>



        {/* Informations de contact */}

        <Card className="mb-8">

          <CardHeader>

            <CardTitle className="flex items-center">

              <Phone className="w-6 h-6 mr-3 text-indigo-600" />

              Contact et réclamations

            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>

                <h3 className="font-semibold mb-3">Délégué à la Protection des Données</h3>

                <div className="space-y-2 text-sm">

                  <p className="flex items-center">

                    <Mail className="w-4 h-4 mr-2 text-blue-600" />

                    privacy@casskai.app

                  </p>

                  <p className="flex items-center">

                    <Phone className="w-4 h-4 mr-2 text-blue-600" />

                    +33 6 88 89 33 72

                  </p>

                  <p className="flex items-center">

                    <Clock className="w-4 h-4 mr-2 text-blue-600" />

                    Réponse sous 72h maximum

                  </p>

                </div>

              </div>

              

              <div>

                <h3 className="font-semibold mb-3">Autorité de contrôle</h3>

                <div className="space-y-2 text-sm">

                  <p><strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés)</p>

                  <p>3 Place de Fontenoy - TSA 80715</p>

                  <p>75334 PARIS CEDEX 07</p>

                  <p className="text-blue-600">

                    <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="hover:underline">

                      www.cnil.fr

                    </a>

                  </p>

                </div>

              </div>

            </div>

            

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">

              <div className="flex items-start">

                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />

                <div className="text-sm">

                  <p className="font-semibold mb-1">Droit de réclamation :</p>

                  <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300">

                    Si vous estimez que nous ne respectons pas vos droits, 

                    vous pouvez introduire une réclamation auprès de la CNIL à tout moment, 

                    sans avoir à nous contacter au préalable.

                  </p>

                </div>

              </div>

            </div>

          </CardContent>

        </Card>



        {/* Mesures techniques */}

        <Card className="mb-8">

          <CardHeader>

            <CardTitle className="flex items-center">

              <Lock className="w-6 h-6 mr-3 text-red-600 dark:text-red-400" />

              Mesures de protection

            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="mb-4">

              CassKai met en œuvre des mesures techniques et organisationnelles 

              appropriées pour assurer la sécurité de vos données :

            </p>

            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>

                <h4 className="font-semibold mb-3 text-sm">Mesures techniques :</h4>

                <ul className="text-sm space-y-2">

                  <li className="flex items-center">

                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />

                    Chiffrement AES-256

                  </li>

                  <li className="flex items-center">

                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />

                    Authentification multi-facteurs

                  </li>

                  <li className="flex items-center">

                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />

                    Monitoring 24/7

                  </li>

                  <li className="flex items-center">

                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />

                    Sauvegardes chiffrées

                  </li>

                </ul>

              </div>

              

              <div>

                <h4 className="font-semibold mb-3 text-sm">Mesures organisationnelles :</h4>

                <ul className="text-sm space-y-2">

                  <li className="flex items-center">

                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />

                    Formation du personnel

                  </li>

                  <li className="flex items-center">

                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />

                    Politique de sécurité

                  </li>

                  <li className="flex items-center">

                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />

                    Audits réguliers

                  </li>

                  <li className="flex items-center">

                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />

                    Contrôles d'accès stricts

                  </li>

                </ul>

              </div>

            </div>

            

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

              {[

                { label: 'ISO 27001', desc: 'Certification sécurité', color: 'text-green-600' },

                { label: 'SOC 2', desc: 'Audit de conformité', color: 'text-blue-600' },

                { label: 'ANSSI', desc: 'Recommandations françaises', color: 'text-purple-600' }

              ].map((cert, index) => (

                <div key={index} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">

                  <div className={`font-semibold ${cert.color}`}>{cert.label}</div>

                  <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-300">{cert.desc}</div>

                </div>

              ))}

            </div>

          </CardContent>

        </Card>



        {/* Footer légal */}

        <div className="text-center py-8 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">

          <h3 className="text-lg font-semibold mb-4">Responsable du traitement</h3>

          <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 space-y-1">

            <p><strong>Noutche Conseil SAS</strong></p>

            <p>SIREN : 909 672 685 • SIRET : 909 672 685 00023</p>

            <p>RCS Evry 909 672 685 • TVA : FR85909672685</p>

            <p>Société par Actions Simplifiée Unipersonnelle au capital de 1 500,00 €</p>

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">

              Cette page respecte les exigences de transparence du RGPD (articles 12, 13 et 14)

            </p>

          </div>

        </div>

      </div>

    </PageContainer>

  );

};



export default GDPRPage;
