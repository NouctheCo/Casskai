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

import React from 'react';

import { useTranslation } from 'react-i18next';

import { motion } from 'framer-motion';

import { 

  FileText, 

  Users, 

  CreditCard, 

  Shield, 

  AlertTriangle, 

  Scale, 

  Calendar,

  Building,

  Lock,

  Zap,

  CheckCircle,

  XCircle

} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { PageContainer } from '@/components/ui/PageContainer';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';



const TermsOfServicePage = () => {

  const { t } = useTranslation();



  const lastUpdated = "24 novembre 2025";



  return (

    <PageContainer variant="legal">

      <PublicNavigation variant="legal" />



      {/* Header */}

      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-16 pt-24">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="text-center"

          >

            <Scale className="w-16 h-16 mx-auto mb-6 text-indigo-200" />

            <h1 className="text-4xl md:text-5xl font-bold mb-4">

              {t('termsOfService.title')}

            </h1>

            <p className="text-xl text-indigo-100 mb-4">

              {t('termsOfService.subtitle')}

            </p>

            <Badge className="bg-indigo-800/50 text-indigo-200 border-indigo-700">

              <Calendar className="w-4 h-4 mr-2" />

              {t('termsOfService.lastUpdated')} : {lastUpdated}

            </Badge>

          </motion.div>

        </div>

      </div>



      {/* Contenu principal */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="prose prose-lg dark:prose-invert max-w-none">

          

          {/* Préambule */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Building className="w-6 h-6 mr-3 text-blue-600" />

                {t('termsOfService.preamble.title')}

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p>

                {t('termsOfService.preamble.content')}

              </p>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">

                <h4 className="font-semibold mb-2">{t('termsOfService.preamble.legalInfo')}</h4>

                <ul className="text-sm space-y-1">

                  <li><strong>{t('termsOfService.preamble.fields.denomination')}</strong> {t('termsOfService.preamble.company.name')}</li>

                  <li><strong>{t('termsOfService.preamble.fields.legalForm')}</strong> {t('termsOfService.preamble.company.legalForm')}</li>

                  <li><strong>{t('termsOfService.preamble.fields.capital')}</strong> {t('termsOfService.preamble.company.capital')}</li>

                  <li><strong>{t('termsOfService.preamble.fields.siren')}</strong> {t('termsOfService.preamble.company.siren')}</li>

                  <li><strong>{t('termsOfService.preamble.fields.siret')}</strong> {t('termsOfService.preamble.company.siret')}</li>

                  <li><strong>{t('termsOfService.preamble.fields.rcs')}</strong> {t('termsOfService.preamble.company.rcs')}</li>

                  <li><strong>{t('termsOfService.preamble.fields.vat')}</strong> {t('termsOfService.preamble.company.vat')}</li>

                  <li><strong>{t('termsOfService.preamble.fields.nafCode')}</strong> {t('termsOfService.preamble.company.nafCode')}</li>

                  <li><strong>{t('termsOfService.preamble.fields.collectiveAgreement')}</strong> {t('termsOfService.preamble.company.collectiveAgreement')}</li>

                </ul>

              </div>

            </CardContent>

          </Card>



          {/* Définitions */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <FileText className="w-6 h-6 mr-3 text-green-600" />

                {t('termsOfService.definitions.title')}

              </CardTitle>

            </CardHeader>

            <CardContent>

              <div className="space-y-3">

                <div>

                  <strong>•</strong> {t('termsOfService.definitions.platform')}

                </div>

                <div>

                  <strong>•</strong> {t('termsOfService.definitions.editor')}

                </div>

                <div>

                  <strong>•</strong> {t('termsOfService.definitions.user')}

                </div>

                <div>

                  <strong>•</strong> {t('termsOfService.definitions.client')}

                </div>

                <div>

                  <strong>•</strong> {t('termsOfService.definitions.services')}

                </div>

                <div>

                  <strong>•</strong> {t('termsOfService.definitions.data')}

                </div>

                <div>

                  <strong>•</strong> {t('termsOfService.definitions.account')}

                </div>

              </div>

            </CardContent>

          </Card>



          {/* Objet et acceptation */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <CheckCircle className="w-6 h-6 mr-3 text-purple-600" />

                {t('termsOfService.acceptance.title')}

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p className="mb-4">

                {t('termsOfService.acceptance.content')}

              </p>

              

              <h4 className="font-semibold mb-3">Acceptation :</h4>

              <ul className="space-y-2">

                <li>• {t('termsOfService.acceptance.content')}</li>

                <li>• {t('termsOfService.acceptance.binding')}</li>

                <li>• {t('termsOfService.acceptance.updates')}</li>

                <li>• {t('termsOfService.acceptance.notification')}</li>

              </ul>

            </CardContent>

          </Card>



          {/* Services proposés */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Zap className="w-6 h-6 mr-3 text-yellow-600" />

                Services proposés

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p className="mb-4">

                CassKai propose une suite logicielle de gestion d'entreprise comprenant :

              </p>

              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">

                  <h4 className="font-semibold mb-2">Modules de base :</h4>

                  <ul className="text-sm space-y-1">

                    <li>• Comptabilité générale</li>

                    <li>• Facturation et devis</li>

                    <li>• Gestion des tiers</li>

                    <li>• Tableaux de bord</li>

                  </ul>

                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">

                  <h4 className="font-semibold mb-2">Modules avancés :</h4>

                  <ul className="text-sm space-y-1">

                    <li>• CRM et gestion commerciale</li>

                    <li>• Gestion de projets</li>

                    <li>• Ressources humaines</li>

                    <li>• Intégrations bancaires</li>

                  </ul>

                </div>

              </div>



              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">

                <p className="text-sm">

                  <strong>Note importante :</strong> Les fonctionnalités disponibles dépendent 

                  du plan d'abonnement souscrit. Certains modules peuvent nécessiter 

                  des frais supplémentaires ou être en version bêta.

                </p>

              </div>

            </CardContent>

          </Card>



          {/* Conditions d'accès */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Lock className="w-6 h-6 mr-3 text-red-600" />

                Conditions d'accès et d'utilisation

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">1. Conditions d'éligibilité :</h4>

              <ul className="space-y-1 mb-4">

                <li>• Être majeur ou représenté par un tuteur légal</li>

                <li>• Disposer de la capacité juridique pour contracter</li>

                <li>• Fournir des informations exactes et à jour</li>

                <li>• Respecter les lois applicables dans votre juridiction</li>

              </ul>



              <h4 className="font-semibold mb-3">2. Création du compte :</h4>

              <ul className="space-y-1 mb-4">

                <li>• Un seul compte par personne/entreprise</li>

                <li>• Vérification d'identité requise</li>

                <li>• Mot de passe sécurisé obligatoire</li>

                <li>• Activation par email nécessaire</li>

              </ul>



              <h4 className="font-semibold mb-3">3. Utilisation autorisée :</h4>

              <ul className="space-y-1">

                <li>• Usage professionnel uniquement</li>

                <li>• Respect de la propriété intellectuelle</li>

                <li>• Interdiction de revente ou sous-location</li>

                <li>• Conformité aux réglementations sectorielles</li>

              </ul>

            </CardContent>

          </Card>



          {/* Obligations de l'utilisateur */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Users className="w-6 h-6 mr-3 text-indigo-600" />

                Obligations de l'utilisateur

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">L'utilisateur s'engage à :</h4>

              <div className="space-y-3">

                <div className="flex items-start">

                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>Utiliser CassKai conformément à sa destination et aux présentes CGU</span>

                </div>

                <div className="flex items-start">

                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>Maintenir la confidentialité de ses identifiants de connexion</span>

                </div>

                <div className="flex items-start">

                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>Informer immédiatement en cas d'utilisation non autorisée de son compte</span>

                </div>

                <div className="flex items-start">

                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>S'assurer de la régularité et de l'exactitude des données saisies</span>

                </div>

                <div className="flex items-start">

                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>Sauvegarder régulièrement ses données importantes</span>

                </div>

              </div>



              <h4 className="font-semibold mb-3 mt-6">L'utilisateur s'interdit de :</h4>

              <div className="space-y-3">

                <div className="flex items-start">

                  <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>Tenter de contourner les mesures de sécurité</span>

                </div>

                <div className="flex items-start">

                  <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>Utiliser des robots, scripts ou moyens automatisés non autorisés</span>

                </div>

                <div className="flex items-start">

                  <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>Porter atteinte aux droits de tiers ou aux bonnes mœurs</span>

                </div>

                <div className="flex items-start">

                  <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>Diffuser des virus ou codes malveillants</span>

                </div>

                <div className="flex items-start">

                  <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />

                  <span>Reproduire, copier ou vendre tout ou partie du service</span>

                </div>

              </div>

            </CardContent>

          </Card>



          {/* Tarifs et paiement */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <CreditCard className="w-6 h-6 mr-3 text-green-600" />

                Tarifs et modalités de paiement

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">1. Tarification :</h4>

              <ul className="space-y-2 mb-4">

                <li>• Les tarifs sont affichés TTC et actualisés en temps réel</li>

                <li>• Période d'essai gratuite de 14 jours sans engagement</li>

                <li>• Facturation mensuelle ou annuelle selon l'abonnement choisi</li>

                <li>• Tarifs préférentiels pour les paiements annuels</li>

              </ul>



              <h4 className="font-semibold mb-3">2. Paiement :</h4>

              <ul className="space-y-2 mb-4">

                <li>• Paiement par carte bancaire ou prélèvement SEPA</li>

                <li>• Facturation automatique à chaque échéance</li>

                <li>• Suspension du service en cas de défaut de paiement</li>

                <li>• Relances automatiques avant suspension</li>

              </ul>



              <h4 className="font-semibold mb-3">3. Modification des tarifs :</h4>

              <ul className="space-y-2">

                <li>• Préavis de 30 jours minimum pour toute augmentation</li>

                <li>• Notification par email et dans l'interface</li>

                <li>• Droit de résiliation sans pénalité en cas d'augmentation</li>

                <li>• Application immédiate pour les nouveaux abonnements</li>

              </ul>



              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">

                <p className="text-sm">

                  <strong>TVA :</strong> Selon la réglementation en vigueur, les tarifs peuvent 

                  inclure ou non la TVA en fonction de votre localisation et statut.

                </p>

              </div>

            </CardContent>

          </Card>



          {/* Résiliation */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <XCircle className="w-6 h-6 mr-3 text-orange-600" />

                Résiliation

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">1. Résiliation par l'utilisateur :</h4>

              <ul className="space-y-2 mb-4">

                <li>• Possible à tout moment via l'interface ou par email</li>

                <li>• Prise d'effet à la fin de la période déjà payée</li>

                <li>• Aucun remboursement des sommes déjà versées</li>

                <li>• Conservation des données pendant 30 jours après résiliation</li>

              </ul>



              <h4 className="font-semibold mb-3">2. Résiliation par CassKai :</h4>

              <ul className="space-y-2 mb-4">

                <li>• En cas de manquement grave aux CGU</li>

                <li>• Défaut de paiement persistant (7 jours après relance)</li>

                <li>• Usage contraire à la destination du service</li>

                <li>• Préavis de 15 jours sauf urgence</li>

              </ul>



              <h4 className="font-semibold mb-3">3. Effets de la résiliation :</h4>

              <ul className="space-y-2">

                <li>• Arrêt immédiat de l'accès aux services</li>

                <li>• Possibilité d'export des données pendant 30 jours</li>

                <li>• Suppression définitive des données après 30 jours</li>

                <li>• Remboursement au prorata en cas de résiliation par CassKai</li>

              </ul>

            </CardContent>

          </Card>



          {/* Propriété intellectuelle */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Shield className="w-6 h-6 mr-3 text-blue-600" />

                Propriété intellectuelle

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">Droits de CassKai :</h4>

              <ul className="space-y-2 mb-4">

                <li>• CassKai et ses composants sont protégés par le droit d'auteur</li>

                <li>• Toute reproduction non autorisée est interdite</li>

                <li>• Les marques, logos et noms de domaine sont déposés</li>

                <li>• L'utilisateur ne peut utiliser ces éléments sans autorisation</li>

              </ul>



              <h4 className="font-semibold mb-3">Droits de l'utilisateur :</h4>

              <ul className="space-y-2">

                <li>• L'utilisateur reste propriétaire de ses données</li>

                <li>• Licence d'utilisation limitée aux besoins du service</li>

                <li>• Droit de récupération des données à tout moment</li>

                <li>• Protection contre l'usage non autorisé par des tiers</li>

              </ul>

            </CardContent>

          </Card>



          {/* Responsabilité */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <AlertTriangle className="w-6 h-6 mr-3 text-yellow-600" />

                Limitation de responsabilité

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">Responsabilité de CassKai :</h4>

              <ul className="space-y-2 mb-4">

                <li>• Fourniture du service avec diligence professionnelle</li>

                <li>• Sécurisation des données selon l'état de l'art</li>

                <li>• Disponibilité de 99,9% hors maintenance programmée</li>

                <li>• Support technique aux heures ouvrées</li>

              </ul>



              <h4 className="font-semibold mb-3">Exclusions de responsabilité :</h4>

              <ul className="space-y-2 mb-4">

                <li>• Dommages indirects ou perte d'exploitation</li>

                <li>• Utilisation non conforme du service</li>

                <li>• Défaillance des réseaux Internet</li>

                <li>• Cas de force majeure</li>

              </ul>



              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">

                <p className="text-sm">

                  <strong>Limitation :</strong> La responsabilité de CassKai est limitée 

                  au montant des sommes versées au titre des 12 derniers mois.

                </p>

              </div>

            </CardContent>

          </Card>



          {/* Données personnelles */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Lock className="w-6 h-6 mr-3 text-purple-600" />

                Protection des données personnelles

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p className="mb-4">

                CassKai s'engage à protéger les données personnelles conformément au RGPD. 

                Les modalités détaillées sont décrites dans notre Politique de Confidentialité.

              </p>

              

              <h4 className="font-semibold mb-3">Principes appliqués :</h4>

              <ul className="space-y-2">

                <li>• Collecte limitée aux besoins du service</li>

                <li>• Chiffrement et sécurisation des données</li>

                <li>• Respect des droits des personnes concernées</li>

                <li>• Conservation limitée dans le temps</li>

                <li>• Transferts sécurisés uniquement</li>

              </ul>

            </CardContent>

          </Card>



          {/* Droit applicable */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Scale className="w-6 h-6 mr-3 text-indigo-600" />

                Droit applicable et juridiction

              </CardTitle>

            </CardHeader>

            <CardContent>

              <div className="space-y-4">

                <div>

                  <strong>Droit applicable :</strong>

                  <p className="text-sm mt-1">

                    Les présentes CGU sont régies par le droit français. 

                    Toute question relative à leur interprétation ou exécution 

                    sera tranchée selon la législation française.

                  </p>

                </div>

                

                <div>

                  <strong>Médiation :</strong>

                  <p className="text-sm mt-1">

                    En cas de litige, les parties s'engagent à rechercher une solution amiable. 

                    À défaut, recours à la médiation de la consommation via la plateforme officielle.

                  </p>

                </div>

                

                <div>

                  <strong>Juridiction :</strong>

                  <p className="text-sm mt-1">

                    En cas d'échec de la médiation, les tribunaux de Paris seront seuls compétents, 

                    y compris en cas de référé ou de pluralité de défendeurs.

                  </p>

                </div>

              </div>

            </CardContent>

          </Card>



          {/* Dispositions finales */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <FileText className="w-6 h-6 mr-3 text-gray-600" />

                Dispositions finales

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">Modification des CGU :</h4>

              <p className="mb-4 text-sm">

                CassKai se réserve le droit de modifier les présentes CGU. 

                Toute modification sera notifiée 30 jours avant son entrée en vigueur. 

                L'utilisation continue du service vaut acceptation des nouvelles conditions.

              </p>



              <h4 className="font-semibold mb-3">Nullité partielle :</h4>

              <p className="mb-4 text-sm">

                Si une clause des présentes CGU était déclarée nulle, les autres dispositions 

                resteraient en vigueur. La clause nulle serait remplacée par une disposition 

                équivalente conforme au droit applicable.

              </p>



              <h4 className="font-semibold mb-3">Intégralité :</h4>

              <p className="text-sm">

                Les présentes CGU, complétées par la Politique de Confidentialité, 

                constituent l'intégralité de l'accord entre les parties et annulent 

                tout engagement antérieur sur le même objet.

              </p>

            </CardContent>

          </Card>



          {/* Contact */}

          <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">

            <h3 className="text-lg font-semibold mb-4">Contact</h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">

              Pour toute question relative aux présentes CGU :

            </p>

            <p className="text-sm">

              <strong>Email :</strong> legal@casskai.app<br />

              <strong>Adresse :</strong> Noutche Conseil SAS - RCS Evry 909 672 685<br />

              <strong>Version :</strong> 2.1 - Entrée en vigueur : {lastUpdated}

            </p>

          </div>

        </div>

      </div>

    </PageContainer>

  );

};



export default TermsOfServicePage;
