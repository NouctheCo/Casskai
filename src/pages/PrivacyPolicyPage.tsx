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

import { Shield, Eye, Lock, Database, Users, FileText, Calendar, Mail, Phone, Download, Edit, Trash2, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { Badge } from '@/components/ui/badge';

import { Link } from 'react-router-dom';

import { PageContainer } from '@/components/ui/PageContainer';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';

import { tSafe } from '@/i18n/i18n';



const PrivacyPolicyPage = () => {

  const { t, i18n } = useTranslation();



  const lastUpdated = "24 novembre 2025";



  // Fonction de traduction robuste avec fallbacks multiples

  const safeT = (key: string, fallbackFr: string, fallbackEn?: string, fallbackEs?: string) => {

    try {

      // Essayer d'abord tSafe

      const result = tSafe(key, fallbackFr);

      if (result !== key) return result;



      // Essayer t() standard

      const standardResult = t(key);

      if (standardResult !== key) return standardResult;



      // Fallback selon la langue actuelle

      const currentLang = i18n?.language || 'fr';

      if (currentLang.startsWith('en') && fallbackEn) return fallbackEn;

      if (currentLang.startsWith('es') && fallbackEs) return fallbackEs;



      // Fallback français par défaut

      return fallbackFr;

    } catch (error) {

      console.warn('Translation error:', error);

      return fallbackFr;

    }

  };



  // Données multilingues pour les listes

  const identificationItems = {

    fr: ['Nom, prénom, adresse email', 'Numéro de téléphone', 'Informations de l\'entreprise (nom, SIREN, adresse)', 'Photo de profil (optionnelle)'],

    en: ['Name, surname, email address', 'Phone number', 'Company information (name, SIREN, address)', 'Profile photo (optional)'],

    es: ['Nombre, apellido, dirección de correo', 'Número de teléfono', 'Información de la empresa (nombre, SIREN, dirección)', 'Foto de perfil (opcional)']

  };



  const usageItems = {

    fr: ['Logs de connexion et d\'activité', 'Adresse IP et informations sur l\'appareil', 'Pages visitées et fonctionnalités utilisées', 'Préférences et paramètres'],

    en: ['Connection and activity logs', 'IP address and device information', 'Pages visited and features used', 'Preferences and settings'],

    es: ['Registros de conexión y actividad', 'Dirección IP e información del dispositivo', 'Páginas visitadas y funcionalidades utilizadas', 'Preferencias y configuración']

  };



  const businessItems = {

    fr: ['Données comptables et financières', 'Informations clients et fournisseurs', 'Factures et devis', 'Documents et fichiers uploadés', 'Données RH (si module activé)'],

    en: ['Accounting and financial data', 'Customer and supplier information', 'Invoices and quotes', 'Uploaded documents and files', 'HR data (if module enabled)'],

    es: ['Datos contables y financieros', 'Información de clientes y proveedores', 'Facturas y presupuestos', 'Documentos y archivos cargados', 'Datos de RRHH (si el módulo está activado)']

  };



  const currentLang = i18n?.language || 'fr';

  const langKey = currentLang.startsWith('en') ? 'en' : currentLang.startsWith('es') ? 'es' : 'fr';



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

              {safeT('privacyPolicy.title', 'Politique de Confidentialité', 'Privacy Policy', 'Política de Privacidad')}

            </h1>

            <p className="text-xl text-blue-100 mb-4">

              {safeT('privacyPolicy.subtitle', 'CassKai s\'engage à protéger et respecter votre vie privée', 'CassKai is committed to protecting and respecting your privacy', 'CassKai se compromete a proteger y respetar su privacidad')}

            </p>

            <Badge className="bg-blue-800/50 text-blue-200 border-blue-700">

              <Calendar className="w-4 h-4 mr-2" />

              {safeT('privacyPolicy.lastUpdated', 'Dernière mise à jour', 'Last updated', 'Última actualización')} : {lastUpdated}

            </Badge>

          </motion.div>

        </div>

      </div>



      {/* Contenu principal */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="prose prose-lg dark:prose-invert max-w-none">

          

          {/* Introduction */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Eye className="w-6 h-6 mr-3 text-blue-600" />

                {safeT('privacyPolicy.introduction.title', 'Introduction', 'Introduction', 'Introducción')}

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p>

                {safeT('privacyPolicy.introduction.content', 'Noutche Conseil SAS, société éditrice de CassKai (ci-après "nous", "notre" ou "CassKai"), s\'engage à protéger et à respecter votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme de gestion d\'entreprise.', 'Noutche Conseil SASU, publisher of CassKai (hereinafter "we", "our" or "CassKai"), is committed to protecting and respecting your privacy. This privacy policy explains how we collect, use, share and protect your personal information when you use our business management platform.', 'Noutche Conseil SASU, editor de CassKai (en adelante "nosotros", "nuestro" o "CassKai"), se compromete a proteger y respetar su privacidad. Esta política de privacidad explica cómo recopilamos, usamos, compartimos y protegemos su información personal cuando usa nuestra plataforma de gestión empresarial.')}

              </p>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">

                <h4 className="font-semibold mb-2">{safeT('privacyPolicy.introduction.companyInfo', 'Informations sur l\'entreprise :', 'Company information:', 'Información de la empresa:')}</h4>

                <ul className="text-sm space-y-1">

                  <li><strong>{safeT('privacyPolicy.introduction.legalName', 'Raison sociale :', 'Legal name:', 'Razón social:')}</strong> {safeT('privacyPolicy.company.name', 'Noutche Conseil SAS', 'Noutche Conseil SAS', 'Noutche Conseil SAS')}</li>

                  <li><strong>{safeT('privacyPolicy.introduction.registrationNumber', 'SIREN :', 'SIREN:', 'SIREN:')}</strong> {safeT('privacyPolicy.company.siren', '909 672 685', '909 672 685', '909 672 685')}</li>

                  <li><strong>{safeT('privacyPolicy.introduction.businessNumber', 'SIRET :', 'SIRET:', 'SIRET:')}</strong> {safeT('privacyPolicy.company.siret', '909 672 685 00023', '909 672 685 00023', '909 672 685 00023')}</li>

                  <li><strong>{safeT('privacyPolicy.introduction.commercialRegister', 'RCS :', 'RCS:', 'RCS:')}</strong> {safeT('privacyPolicy.company.rcs', '909 672 685 R.C.S. Evry', '909 672 685 R.C.S. Evry', '909 672 685 R.C.S. Evry')}</li>

                  <li><strong>{safeT('privacyPolicy.introduction.registeredAddress', 'Adresse :', 'Address:', 'Dirección:')}</strong> {safeT('privacyPolicy.company.address', 'Inscrit au greffe d\'Evry', 'Registered at Evry registry', 'Registrado en el registro de Evry')}</li>

                </ul>

              </div>

            </CardContent>

          </Card>



          {/* Données collectées */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Database className="w-6 h-6 mr-3 text-green-600" />

                {safeT('privacyPolicy.dataCollection.title', 'Données que nous collectons', 'Data we collect', 'Datos que recopilamos')}

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">{safeT('privacyPolicy.dataCollection.identification.title', '1. Informations d\'identification :', '1. Identification information:', '1. Información de identificación:')}</h4>

              <ul className="mb-4 space-y-1">

                {identificationItems[langKey].map((item, index) => (

                  <li key={index}>• {item}</li>

                ))}

              </ul>



              <h4 className="font-semibold mb-3">{safeT('privacyPolicy.dataCollection.usage.title', '2. Données d\'utilisation :', '2. Usage data:', '2. Datos de uso:')}</h4>

              <ul className="mb-4 space-y-1">

                {usageItems[langKey].map((item, index) => (

                  <li key={index}>• {item}</li>

                ))}

              </ul>



              <h4 className="font-semibold mb-3">{safeT('privacyPolicy.dataCollection.business.title', '3. Données métier :', '3. Business data:', '3. Datos empresariales:')}</h4>

              <ul className="mb-4 space-y-1">

                {businessItems[langKey].map((item, index) => (

                  <li key={index}>• {item}</li>

                ))}

              </ul>



              <h4 className="font-semibold mb-3">4. Données de paiement :</h4>

              <ul className="space-y-1">

                <li>• Informations de carte bancaire (chiffrées et stockées par notre prestataire de paiement sécurisé)</li>

                <li>• Historique des transactions</li>

                <li>• Factures d'abonnement</li>

              </ul>

            </CardContent>

          </Card>



          {/* Utilisation des données */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Users className="w-6 h-6 mr-3 text-purple-600" />

                Comment nous utilisons vos données

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">Nous utilisons vos données personnelles pour :</h4>

              <ul className="space-y-2">

                <li>• <strong>Fournir nos services :</strong> Fonctionnement de la plateforme, gestion de votre compte</li>

                <li>• <strong>Communication :</strong> Support client, notifications importantes, mises à jour</li>

                <li>• <strong>Amélioration :</strong> Analyse d'utilisation pour améliorer nos services</li>

                <li>• <strong>Sécurité :</strong> Prévention de la fraude et protection des données</li>

                <li>• <strong>Conformité légale :</strong> Respect des obligations fiscales et comptables</li>

                <li>• <strong>Marketing :</strong> Avec votre consentement, pour vous informer de nos nouveautés</li>

              </ul>



              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">

                <p className="text-sm">

                  <strong>Base légale :</strong> Nous nous appuyons sur l'exécution du contrat, 

                  l'intérêt légitime, le consentement et les obligations légales selon le RGPD.

                </p>

              </div>

            </CardContent>

          </Card>



          {/* Partage des données */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Users className="w-6 h-6 mr-3 text-orange-600" />

                Partage des données

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">Nous partageons vos données uniquement avec :</h4>

              <ul className="space-y-2 mb-4">

                <li>• <strong>Prestataires de services :</strong> Hébergement (serveurs sécurisés), paiement, support</li>

                <li>• <strong>Partenaires techniques :</strong> Intégrations bancaires et comptables autorisées</li>

                <li>• <strong>Autorités légales :</strong> Sur demande légale ou judiciaire uniquement</li>

                <li>• <strong>Votre équipe :</strong> Selon les permissions que vous définissez</li>

              </ul>



              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">

                <p className="text-sm font-semibold text-red-800 dark:text-red-200">

                  Nous ne vendons jamais vos données personnelles à des tiers.

                </p>

              </div>

            </CardContent>

          </Card>



          {/* Sécurité */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Lock className="w-6 h-6 mr-3 text-red-600" />

                Sécurité des données

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">Mesures de sécurité :</h4>

              <ul className="space-y-2">

                <li>• <strong>Chiffrement :</strong> AES-256 pour le stockage, TLS 1.3 pour les communications</li>

                <li>• <strong>Accès :</strong> Authentification forte et contrôles d'accès stricts</li>

                <li>• <strong>Surveillance :</strong> Monitoring 24/7 et détection d'intrusions</li>

                <li>• <strong>Sauvegarde :</strong> Sauvegardes automatiques chiffrées et géo-répliquées</li>

                <li>• <strong>Formation :</strong> Personnel formé aux bonnes pratiques de sécurité</li>

                <li>• <strong>Certifications :</strong> Conformité ISO 27001, SOC 2, RGPD</li>

              </ul>

            </CardContent>

          </Card>



          {/* Droits des utilisateurs */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <FileText className="w-6 h-6 mr-3 text-indigo-600" />

                Vos droits RGPD

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p className="mb-4">

                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez de droits étendus sur vos données personnelles :

              </p>

              

              {/* Article 15 - Droit d'accès */}

              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-600">

                <h4 className="font-semibold mb-2 flex items-center">

                  <Download className="w-5 h-5 mr-2" />

                  Article 15 - Droit d'accès et de portabilité

                </h4>

                <p className="text-sm mb-3">

                  Vous pouvez télécharger l'intégralité de vos données dans un format structuré, couramment utilisé et lisible par machine (JSON).

                </p>

                <p className="text-sm mb-3">

                  <strong>Inclus dans l'export :</strong> profil utilisateur, sociétés, documents comptables, statistiques d'utilisation, logs d'audit RGPD.

                </p>

                <Link to="/gdpr" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">

                  Accéder à l'export de données →

                </Link>

              </div>



              {/* Article 16 - Droit de rectification */}

              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-600">

                <h4 className="font-semibold mb-2 flex items-center">

                  <Edit className="w-5 h-5 mr-2" />

                  Article 16 - Droit de rectification

                </h4>

                <p className="text-sm mb-3">

                  Vous pouvez corriger ou mettre à jour vos informations personnelles à tout moment depuis votre espace utilisateur.

                </p>

                <Link to="/settings" className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700">

                  Modifier mes informations →

                </Link>

              </div>



              {/* Article 17 - Droit à l'effacement */}

              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-600">

                <h4 className="font-semibold mb-2 flex items-center">

                  <Trash2 className="w-5 h-5 mr-2" />

                  Article 17 - Droit à l'effacement ("droit à l'oubli")

                </h4>

                <p className="text-sm mb-3">

                  Vous pouvez demander la suppression définitive de votre compte et de vos données personnelles.

                </p>

                <Alert className="mb-3">

                  <AlertTriangle className="h-4 w-4" />

                  <AlertDescription className="text-xs">

                    <strong>Important :</strong> Les données comptables seront <strong>anonymisées</strong> et non supprimées, 

                    conformément aux obligations légales de conservation (10 ans selon le Code de commerce français, Article L123-22).

                    Votre identité sera effacée mais les écritures comptables conservées sous forme anonyme.

                  </AlertDescription>

                </Alert>

                <Link to="/gdpr" className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700">

                  Supprimer mon compte →

                </Link>

              </div>



              {/* Article 18 - Droit à la limitation */}

              <div className="mb-6">

                <h4 className="font-semibold mb-2">• Article 18 - Droit à la limitation du traitement</h4>

                <p className="text-sm">

                  Vous pouvez demander la suspension temporaire du traitement de vos données dans certains cas 

                  (contestation de l'exactitude, traitement illicite, opposition au traitement).

                </p>

              </div>



              {/* Article 20 - Droit à la portabilité */}

              <div className="mb-6">

                <h4 className="font-semibold mb-2">• Article 20 - Droit à la portabilité</h4>

                <p className="text-sm">

                  Récupérez vos données dans un format JSON structuré pour les transférer vers un autre service.

                  Cette fonctionnalité est directement accessible via l'export de données.

                </p>

              </div>



              {/* Article 21 - Droit d'opposition */}

              <div className="mb-6">

                <h4 className="font-semibold mb-2">• Article 21 - Droit d'opposition</h4>

                <p className="text-sm">

                  Vous pouvez vous opposer au traitement de vos données à des fins de marketing direct ou pour des motifs légitimes.

                  Pour les cookies, utilisez notre <Link to="/cookies-policy" className="text-blue-600 underline">gestionnaire de consentement</Link>.

                </p>

              </div>



              {/* Article 7 - Retrait du consentement */}

              <div className="mb-6">

                <h4 className="font-semibold mb-2">• Article 7 - Droit de retrait du consentement</h4>

                <p className="text-sm">

                  Vous pouvez retirer votre consentement à tout moment (cookies, newsletter, etc.) sans justification.

                  Le retrait n'affecte pas la licéité du traitement effectué avant le retrait.

                </p>

              </div>



              {/* Délais de réponse */}

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mt-6">

                <h4 className="font-semibold mb-2">⏱️ Délais de réponse</h4>

                <p className="text-sm mb-2">

                  Conformément à l'Article 12 du RGPD, nous nous engageons à répondre à vos demandes dans un délai maximum de <strong>1 mois</strong> 

                  suivant la réception de votre demande. Ce délai peut être prolongé de 2 mois supplémentaires en cas de complexité.

                </p>

                <p className="text-sm">

                  <strong>Export automatique :</strong> L'export de données est disponible instantanément via la page RGPD (pas de délai d'attente).

                </p>

              </div>



              {/* Contact */}

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-6">

                <h4 className="font-semibold mb-2">📧 Contact pour exercer vos droits</h4>

                <p className="text-sm mb-2">

                  Email : <strong>privacy@casskai.app</strong>

                </p>

                <p className="text-sm mb-2">

                  Ou via notre <Link to="/gdpr" className="text-blue-600 underline font-medium">page RGPD dédiée</Link> 

                  pour les actions automatisées (export, suppression).

                </p>

                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 mt-3">

                  En cas de litige, vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> 

                  (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline">www.cnil.fr</a>

                </p>

              </div>

            </CardContent>

          </Card>



          {/* Rétention des données */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Calendar className="w-6 h-6 mr-3 text-yellow-600" />

                Durée de conservation

              </CardTitle>

            </CardHeader>

            <CardContent>

              <h4 className="font-semibold mb-3">Nous conservons vos données :</h4>

              <ul className="space-y-2">

                <li>• <strong>Données de compte :</strong> Pendant la durée de votre abonnement + 3 ans</li>

                <li>• <strong>Données comptables :</strong> 10 ans (obligation légale)</li>

                <li>• <strong>Données de facturation :</strong> 10 ans (obligation légale)</li>

                <li>• <strong>Logs techniques :</strong> 13 mois maximum</li>

                <li>• <strong>Données marketing :</strong> 3 ans après le dernier contact</li>

                <li>• <strong>Données supprimées :</strong> Suppression définitive après 30 jours</li>

              </ul>

            </CardContent>

          </Card>



          {/* Cookies */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Database className="w-6 h-6 mr-3 text-pink-600" />

                Cookies et traceurs

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p className="mb-4">

                Nous utilisons des cookies pour améliorer votre expérience :

              </p>

              <ul className="space-y-2 mb-4">

                <li>• <strong>Cookies essentiels :</strong> Fonctionnement de la plateforme (pas de consentement requis)</li>

                <li>• <strong>Cookies de performance :</strong> Statistiques anonymes d'utilisation</li>

                <li>• <strong>Cookies de confort :</strong> Préférences et paramètres</li>

                <li>• <strong>Cookies marketing :</strong> Avec votre consentement explicite</li>

              </ul>

              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">

                Vous pouvez gérer vos préférences cookies dans les paramètres de votre compte 

                ou via notre bandeau de consentement.

              </p>

            </CardContent>

          </Card>



          {/* Transferts internationaux */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Users className="w-6 h-6 mr-3 text-teal-600" />

                Transferts internationaux

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p className="mb-4">

                Vos données sont hébergées en Europe (France et Union Européenne). 

                En cas de transfert vers un pays tiers, nous nous assurons d'un niveau 

                de protection adéquat via :

              </p>

              <ul className="space-y-1">

                <li>• Clauses contractuelles types de la Commission européenne</li>

                <li>• Décisions d'adéquation de la Commission européenne</li>

                <li>• Certifications appropriées (Privacy Shield, etc.)</li>

              </ul>

            </CardContent>

          </Card>



          {/* Contact DPO */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <Mail className="w-6 h-6 mr-3 text-blue-600" />

                Contact et réclamations

              </CardTitle>

            </CardHeader>

            <CardContent>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>

                  <h4 className="font-semibold mb-3">Délégué à la Protection des Données</h4>

                  <ul className="text-sm space-y-1">

                    <li><Mail className="w-4 h-4 inline mr-2" />privacy@casskai.app</li>

                    <li><Phone className="w-4 h-4 inline mr-2" />+33 6 88 89 33 72</li>

                  </ul>

                </div>

                <div>

                  <h4 className="font-semibold mb-3">Autorité de contrôle</h4>

                  <p className="text-sm">

                    Vous pouvez introduire une réclamation auprès de la CNIL 

                    (Commission Nationale de l'Informatique et des Libertés) 

                    si vous estimez que nous ne respectons pas vos droits.

                  </p>

                </div>

              </div>

            </CardContent>

          </Card>



          {/* Modifications */}

          <Card className="mb-8">

            <CardHeader>

              <CardTitle className="flex items-center">

                <FileText className="w-6 h-6 mr-3 text-gray-600 dark:text-gray-400" />

                Modifications de cette politique

              </CardTitle>

            </CardHeader>

            <CardContent>

              <p>

                Nous pouvons modifier cette politique de confidentialité pour refléter 

                les changements dans nos pratiques ou pour des raisons légales. 

                Nous vous informerons de tout changement significatif par email ou 

                via une notification sur la plateforme au moins 30 jours avant l'entrée en vigueur.

              </p>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">

                <p className="text-sm">

                  <strong>Version actuelle :</strong> 2.1<br />

                  <strong>Date d'entrée en vigueur :</strong> {lastUpdated}<br />

                  <strong>Prochaine révision prévue :</strong> Août 2026

                </p>

              </div>

            </CardContent>

          </Card>



          {/* Footer légal */}

          <div className="text-center py-8 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">

            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">

              Cette politique de confidentialité est régie par le droit français. 

              En cas de litige, les tribunaux français seront compétents.

            </p>

          </div>

        </div>

      </div>

    </PageContainer>

  );

};



export default PrivacyPolicyPage;
