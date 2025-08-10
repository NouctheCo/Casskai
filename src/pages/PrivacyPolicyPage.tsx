import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Database, Users, FileText, Calendar, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PrivacyPolicyPage = () => {
  const { t } = useTranslation();

  const lastUpdated = "8 août 2025";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Shield className="w-16 h-16 mx-auto mb-6 text-blue-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              CassKai s'engage à protéger et respecter votre vie privée
            </p>
            <Badge className="bg-blue-800/50 text-blue-200 border-blue-700">
              <Calendar className="w-4 h-4 mr-2" />
              Dernière mise à jour : {lastUpdated}
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
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Noutche Conseil SASU, société éditrice de CassKai (ci-après "nous", "notre" ou "CassKai"), 
                s'engage à protéger et à respecter votre vie privée. Cette politique de confidentialité 
                explique comment nous collectons, utilisons, partageons et protégeons vos informations 
                personnelles lorsque vous utilisez notre plateforme de gestion d'entreprise.
              </p>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2">Informations sur l'entreprise :</h4>
                <ul className="text-sm space-y-1">
                  <li><strong>Raison sociale :</strong> Noutche Conseil SASU</li>
                  <li><strong>SIREN :</strong> 909 672 685</li>
                  <li><strong>SIRET :</strong> 909 672 685 00023</li>
                  <li><strong>RCS :</strong> 909 672 685 R.C.S. Evry</li>
                  <li><strong>Adresse :</strong> Inscrit au greffe d'Evry</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Données collectées */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-6 h-6 mr-3 text-green-600" />
                Données que nous collectons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">1. Informations d'identification :</h4>
              <ul className="mb-4 space-y-1">
                <li>• Nom, prénom, adresse email</li>
                <li>• Numéro de téléphone</li>
                <li>• Informations de l'entreprise (nom, SIREN, adresse)</li>
                <li>• Photo de profil (optionnelle)</li>
              </ul>

              <h4 className="font-semibold mb-3">2. Données d'utilisation :</h4>
              <ul className="mb-4 space-y-1">
                <li>• Logs de connexion et d'activité</li>
                <li>• Adresse IP et informations sur l'appareil</li>
                <li>• Pages visitées et fonctionnalités utilisées</li>
                <li>• Préférences et paramètres</li>
              </ul>

              <h4 className="font-semibold mb-3">3. Données métier :</h4>
              <ul className="mb-4 space-y-1">
                <li>• Données comptables et financières</li>
                <li>• Informations clients et fournisseurs</li>
                <li>• Factures et devis</li>
                <li>• Données RH (si module activé)</li>
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
                Vos droits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="space-y-2 mb-6">
                <li>• <strong>Droit d'accès :</strong> Consulter les données que nous détenons sur vous</li>
                <li>• <strong>Droit de rectification :</strong> Corriger les informations inexactes</li>
                <li>• <strong>Droit à l'effacement :</strong> Supprimer vos données dans certains cas</li>
                <li>• <strong>Droit à la portabilité :</strong> Récupérer vos données dans un format lisible</li>
                <li>• <strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
                <li>• <strong>Droit de limitation :</strong> Limiter le traitement dans certains cas</li>
                <li>• <strong>Droit de retrait du consentement :</strong> Retirer votre consentement à tout moment</li>
              </ul>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2">Pour exercer vos droits :</h4>
                <p className="text-sm mb-2">
                  Contactez-nous à : <strong>privacy@casskai.app</strong>
                </p>
                <p className="text-sm">
                  Nous répondrons dans un délai maximum de 30 jours.
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
              <p className="text-sm text-gray-600 dark:text-gray-300">
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
                <FileText className="w-6 h-6 mr-3 text-gray-600" />
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
                  <strong>Version actuelle :</strong> 2.0<br />
                  <strong>Date d'entrée en vigueur :</strong> {lastUpdated}<br />
                  <strong>Prochaine révision prévue :</strong> Août 2026
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer légal */}
          <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Cette politique de confidentialité est régie par le droit français. 
              En cas de litige, les tribunaux français seront compétents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;