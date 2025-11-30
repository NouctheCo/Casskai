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
import { motion } from 'framer-motion';
import { ShoppingCart, CreditCard, Calendar, FileText, Shield, AlertCircle, Scale, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/ui/PageContainer';
import { PublicNavigation } from '@/components/navigation/PublicNavigation';

/* eslint-disable max-lines-per-function */
const TermsOfSalePage = () => {
  const lastUpdated = "24 novembre 2025";
  const version = "1.0";

  return (
    <>
      <PublicNavigation />
      <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto py-12 px-4"
        >
          {/* En-tête */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Conditions Générales de Vente
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              Conditions Générales de Vente (CGV)
            </h1>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">
              Version {version} - Dernière mise à jour : {lastUpdated}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 dark:text-gray-400 mt-2">
              Applicables à tous les abonnements CassKai SaaS
            </p>
          </div>

          {/* Alert Important */}
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important :</strong> En souscrivant à un abonnement CassKai, vous acceptez les présentes 
              Conditions Générales de Vente ainsi que nos <a href="/terms-of-service" className="underline">CGU</a> et 
              notre <a href="/privacy-policy" className="underline">Politique de Confidentialité</a>.
            </AlertDescription>
          </Alert>

          {/* 1. Préambule */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-6 h-6 mr-3 text-blue-600" />
                1. Préambule et objet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Les présentes Conditions Générales de Vente (ci-après "CGV") régissent les relations contractuelles 
                entre NC NOUTCHE CONSEIL, société par actions simplifiée unipersonnelle au capital de 1 500€, 
                immatriculée au RCS d'Evry sous le numéro 909 672 685, dont le siège social est situé au 
                12 rue Jean-Baptiste Charcot, 91300 Massy, France, représentée par Aldric AFANNOU en qualité de Président 
                (ci-après "CassKai" ou "le Prestataire"), et toute personne physique ou morale souscrivant à un abonnement 
                sur la plateforme CassKai (ci-après "le Client").
              </p>
              <p className="mb-4">
                CassKai propose une solution SaaS (Software as a Service) de gestion comptable, financière et administrative 
                pour les entreprises, accessible via l'URL <strong>https://casskai.app</strong>.
              </p>
              <p>
                Les présentes CGV prévalent sur toutes autres conditions générales ou particulières non expressément agréées 
                par CassKai.
              </p>
            </CardContent>
          </Card>

          {/* 2. Offres et Tarification */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-6 h-6 mr-3 text-green-600" />
                2. Offres commerciales et tarification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">2.1 Formules d'abonnement</h4>
              <p className="mb-4">
                CassKai propose trois formules d'abonnement mensuel ou annuel :
              </p>

              {/* Plan Starter */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-600">
                <h5 className="font-semibold mb-2">Formule STARTER</h5>
                <p className="text-sm mb-2">
                  <strong>Tarif :</strong> 39€ HT/mois (46,80€ TTC) ou 390€ HT/an (468€ TTC, soit 2 mois offerts)
                </p>
                <p className="text-sm mb-2">
                  <strong>Afrique de l'Ouest :</strong> 18 000 FCFA/mois ou 180 000 FCFA/an
                </p>
                <p className="text-sm mb-2">
                  <strong>Inclus :</strong>
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• 1 société</li>
                  <li>• 3 utilisateurs</li>
                  <li>• Comptabilité complète (SYSCOHADA, PCG français)</li>
                  <li>• Facturation et CRM de base</li>
                  <li>• Rapports standards</li>
                  <li>• Support email (48h)</li>
                  <li>• Stockage : 5 Go</li>
                </ul>
              </div>

              {/* Plan Pro */}
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-600">
                <h5 className="font-semibold mb-2">Formule PRO</h5>
                <p className="text-sm mb-2">
                  <strong>Tarif :</strong> 89€ HT/mois (106,80€ TTC) ou 890€ HT/an (1068€ TTC, soit 2 mois offerts)
                </p>
                <p className="text-sm mb-2">
                  <strong>Afrique de l'Ouest :</strong> 40 000 FCFA/mois ou 400 000 FCFA/an
                </p>
                <p className="text-sm mb-2">
                  <strong>Inclus :</strong> Tous les avantages Starter +
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Sociétés illimitées</li>
                  <li>• 10 utilisateurs</li>
                  <li>• Gestion RH et paie</li>
                  <li>• Rapports avancés et exports personnalisés</li>
                  <li>• Intégrations bancaires automatiques</li>
                  <li>• Support prioritaire (24h)</li>
                  <li>• SLA 99,5% uptime</li>
                  <li>• Stockage : 50 Go</li>
                  <li>• Accès API</li>
                </ul>
              </div>

              {/* Plan Enterprise */}
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-600">
                <h5 className="font-semibold mb-2">Formule ENTERPRISE</h5>
                <p className="text-sm mb-2">
                  <strong>Tarif :</strong> 159€ HT/mois (190,80€ TTC) ou sur devis pour besoins spécifiques
                </p>
                <p className="text-sm mb-2">
                  <strong>Afrique de l'Ouest :</strong> 75 000 FCFA/mois ou sur devis
                </p>
                <p className="text-sm mb-2">
                  <strong>Inclus :</strong> Tous les avantages Pro +
                </p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Utilisateurs illimités</li>
                  <li>• Support dédié 24/7</li>
                  <li>• SLA 99,9% uptime</li>
                  <li>• Hébergement dédié possible</li>
                  <li>• Stockage illimité</li>
                  <li>• Développements sur mesure</li>
                  <li>• Formation personnalisée</li>
                  <li>• Account Manager dédié</li>
                </ul>
              </div>

              <h4 className="font-semibold mb-3 mt-6">2.2 Prix et TVA</h4>
              <p className="mb-4">
                Les prix sont indiqués en euros (€), <strong>hors taxes (HT)</strong>. La TVA française au taux en vigueur 
                (20% au 24 novembre 2025) s'applique aux clients établis en France, sauf pour les auto-entrepreneurs 
                bénéficiant de la franchise en base de TVA (Article 293 B du CGI).
              </p>
              <p className="mb-4">
                Pour les clients établis dans l'Union Européenne (hors France), la TVA applicable est celle du pays du Client 
                si celui-ci fournit un numéro de TVA intracommunautaire valide (mécanisme d'autoliquidation).
              </p>
              <p>
                CassKai se réserve le droit de modifier ses tarifs à tout moment, les nouveaux tarifs s'appliquant aux 
                nouvelles souscriptions et aux renouvellements d'abonnement après notification préalable de 30 jours.
              </p>
            </CardContent>
          </Card>

          {/* 3. Période d'essai */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-yellow-600" />
                3. Période d'essai gratuite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">3.1 Durée et conditions</h4>
              <p className="mb-4">
                CassKai offre une <strong>période d'essai gratuite de 30 jours</strong> pour toute nouvelle inscription. 
                Cette période permet au Client de tester l'intégralité des fonctionnalités de la formule Starter sans 
                engagement ni saisie de carte bancaire.
              </p>

              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Aucune carte bancaire requise</strong> : Vous pouvez créer votre compte et utiliser CassKai 
                  pendant 30 jours sans communiquer vos informations de paiement.
                </AlertDescription>
              </Alert>

              <h4 className="font-semibold mb-3">3.2 Conversion en abonnement payant</h4>
              <p className="mb-4">
                À l'issue de la période d'essai :
              </p>
              <ul className="space-y-2 mb-4">
                <li>• <strong>Sans action du Client :</strong> Le compte bascule automatiquement en abonnement Starter mensuel 
                (49€ HT/mois). Le premier paiement sera effectué au début du 31ème jour.</li>
                <li>• <strong>Avec action du Client :</strong> Le Client peut choisir de souscrire à une formule Pro/Enterprise 
                ou de résilier son compte avant la fin des 30 jours (aucun paiement ne sera demandé).</li>
              </ul>

              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                <strong>Note :</strong> Une seule période d'essai est autorisée par entreprise (basée sur le numéro SIRET/identification fiscale).
              </p>
            </CardContent>
          </Card>

          {/* 4. Modalités de paiement */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-6 h-6 mr-3 text-indigo-600" />
                4. Modalités de paiement et facturation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">4.1 Moyens de paiement</h4>
              <p className="mb-4">
                Les paiements sont acceptés par :
              </p>
              <ul className="space-y-2 mb-4">
                <li>• <strong>Carte bancaire</strong> (Visa, Mastercard, American Express) via notre partenaire sécurisé Stripe</li>
                <li>• <strong>Virement bancaire SEPA</strong> pour les formules Pro et Enterprise (paiement annuel uniquement)</li>
                <li>• <strong>Mobile Money</strong> (Orange Money, MTN, Moov) pour l'Afrique de l'Ouest</li>
                <li>• <strong>Prélèvement SEPA</strong> sur demande (formules Pro/Enterprise)</li>
              </ul>

              <h4 className="font-semibold mb-3">4.2 Fréquence de facturation</h4>
              <p className="mb-4">
                Les abonnements sont facturés :
              </p>
              <ul className="space-y-2 mb-4">
                <li>• <strong>Mensuellement :</strong> Paiement d'avance le 1er de chaque mois</li>
                <li>• <strong>Annuellement :</strong> Paiement d'avance pour 12 mois (équivalent de 10 mois, soit 2 mois offerts)</li>
              </ul>

              <h4 className="font-semibold mb-3">4.3 Émission et envoi des factures</h4>
              <p className="mb-4">
                Les factures sont générées automatiquement et envoyées par email à l'adresse de facturation renseignée. 
                Elles sont également accessibles dans l'espace client (Menu → Facturation → Historique).
              </p>
              <p className="mb-4">
                Conformément à l'Article 289 du CGI, les factures mentionnent :
              </p>
              <ul className="text-sm space-y-1 ml-4 mb-4">
                <li>• Numéro de facture unique</li>
                <li>• Date d'émission</li>
                <li>• Identité et coordonnées du Prestataire (CassKai SAS)</li>
                <li>• Identité et coordonnées du Client</li>
                <li>• Numéro SIRET/TVA intracommunautaire</li>
                <li>• Description des services (abonnement CassKai formule X)</li>
                <li>• Prix HT, taux de TVA, montant TTC</li>
              </ul>

              <h4 className="font-semibold mb-3">4.4 Défaut de paiement</h4>
              <p className="mb-4">
                En cas de défaut de paiement à l'échéance :
              </p>
              <ul className="space-y-2 mb-4">
                <li>• <strong>Jour 0 :</strong> Relance email automatique</li>
                <li>• <strong>Jour +7 :</strong> Suspension de l'accès à la plateforme (lecture seule)</li>
                <li>• <strong>Jour +15 :</strong> Blocage complet du compte</li>
                <li>• <strong>Jour +30 :</strong> Résiliation du contrat et suppression des données (conformément au RGPD)</li>
              </ul>
              <p>
                Des pénalités de retard au taux de 10% par an ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement 
                seront appliquées conformément aux Articles L441-3 et L441-6 du Code de commerce.
              </p>
            </CardContent>
          </Card>

          {/* 5. Renouvellement et résiliation */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-red-600" />
                5. Renouvellement et résiliation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">5.1 Renouvellement automatique</h4>
              <p className="mb-4">
                Les abonnements sont renouvelés automatiquement par tacite reconduction pour une période identique 
                (mensuelle ou annuelle) sauf résiliation par le Client avant l'échéance.
              </p>

              <h4 className="font-semibold mb-3">5.2 Résiliation par le Client</h4>
              <p className="mb-4">
                Le Client peut résilier son abonnement à tout moment, sans frais ni justification, via :
              </p>
              <ul className="space-y-2 mb-4">
                <li>• L'interface en ligne : Menu → Abonnement → Résilier</li>
                <li>• Email à : <strong>billing@casskai.app</strong></li>
                <li>• Courrier recommandé avec AR à l'adresse du siège social</li>
              </ul>

              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Clients B2C (consommateurs) :</strong> Conformément à l'Article L221-18 du Code de la consommation, 
                  vous disposez d'un droit de rétractation de <strong>14 jours</strong> à compter de la souscription. 
                  En cas d'exercice de ce droit, vous serez remboursé intégralement sous 14 jours.
                </AlertDescription>
              </Alert>

              <h4 className="font-semibold mb-3">5.3 Remboursement et proratisation</h4>
              <p className="mb-4">
                <strong>Abonnements mensuels :</strong> Résiliation effective à la fin de la période en cours. 
                Aucun remboursement au prorata du temps non consommé.
              </p>
              <p className="mb-4">
                <strong>Abonnements annuels :</strong> Le Client peut demander un remboursement au prorata temporis 
                des mois non consommés, déduction faite d'une indemnité de 10% pour frais de gestion.
              </p>
              <p className="mb-4">
                <strong>Clients B2C uniquement :</strong> Remboursement intégral si résiliation dans les 14 jours (droit de rétractation).
              </p>

              <h4 className="font-semibold mb-3">5.4 Résiliation par CassKai</h4>
              <p className="mb-4">
                CassKai se réserve le droit de résilier un abonnement de plein droit en cas de :
              </p>
              <ul className="space-y-2">
                <li>• Défaut de paiement supérieur à 30 jours</li>
                <li>• Violation des CGU (usage frauduleux, partage de compte, etc.)</li>
                <li>• Comportement préjudiciable à la plateforme ou aux autres utilisateurs</li>
                <li>• Fausse déclaration lors de l'inscription</li>
              </ul>
            </CardContent>
          </Card>

          {/* 6. Garanties et responsabilités */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-6 h-6 mr-3 text-green-600" />
                6. Garanties et limitations de responsabilité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">6.1 Garanties de service</h4>
              <p className="mb-4">
                CassKai s'engage à fournir un service de qualité conforme aux fonctionnalités décrites sur le site 
                <a href="https://casskai.app" className="text-blue-600 underline ml-1">casskai.app</a>.
              </p>
              <ul className="space-y-2 mb-4">
                <li>• <strong>Disponibilité Starter :</strong> Meilleurs efforts (pas de SLA garanti)</li>
                <li>• <strong>Disponibilité Pro :</strong> SLA 99,5% mensuel (43 minutes d'indisponibilité max/mois)</li>
                <li>• <strong>Disponibilité Enterprise :</strong> SLA 99,9% mensuel (4 minutes d'indisponibilité max/mois)</li>
              </ul>
              <p className="mb-4">
                Les interruptions planifiées pour maintenance (annoncées 48h à l'avance) ne sont pas comptabilisées dans le SLA.
              </p>

              <h4 className="font-semibold mb-3">6.2 Sauvegardes</h4>
              <p className="mb-4">
                CassKai effectue des sauvegardes quotidiennes automatiques des données. La rétention est de :
              </p>
              <ul className="space-y-2 mb-4">
                <li>• <strong>Starter :</strong> 7 jours glissants</li>
                <li>• <strong>Pro :</strong> 30 jours glissants</li>
                <li>• <strong>Enterprise :</strong> 90 jours + archivage annuel</li>
              </ul>

              <h4 className="font-semibold mb-3">6.3 Limitations de responsabilité</h4>
              <p className="mb-4">
                La responsabilité de CassKai est limitée au montant de l'abonnement payé par le Client sur les 12 derniers mois. 
                CassKai ne saurait être tenu responsable :
              </p>
              <ul className="space-y-2 mb-4">
                <li>• Des pertes de chiffre d'affaires, de profits ou de données</li>
                <li>• Des dommages indirects ou immatériels</li>
                <li>• Des erreurs de saisie du Client</li>
                <li>• Des conseils comptables ou fiscaux (CassKai est un outil, pas un cabinet d'expertise comptable)</li>
                <li>• Des cas de force majeure (panne majeure hébergeur, catastrophe naturelle, cyberattaque massive, etc.)</li>
              </ul>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important :</strong> CassKai est un outil de gestion comptable. Il appartient au Client de faire valider 
                  ses déclarations fiscales et ses comptes annuels par un expert-comptable agréé. CassKai ne se substitue pas 
                  à un professionnel du chiffre.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* 7. Propriété intellectuelle */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-6 h-6 mr-3 text-purple-600" />
                7. Propriété intellectuelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                La plateforme CassKai, son code source, son design, sa documentation et tous les éléments qui la composent 
                sont la propriété exclusive de CassKai SAS et sont protégés par le droit d'auteur, les droits sur les marques 
                et les brevets applicables.
              </p>
              <p className="mb-4">
                Le Client dispose d'un droit d'usage personnel, non-exclusif et non-cessible de la plateforme pendant la durée 
                de son abonnement. Toute reproduction, représentation, modification, distribution ou exploitation non autorisée 
                est strictement interdite et constitue une contrefaçon passible de sanctions pénales.
              </p>
              <p>
                Les données saisies par le Client lui appartiennent. CassKai s'engage à ne pas les utiliser à d'autres fins 
                que la fourniture du service (cf. Politique de Confidentialité).
              </p>
            </CardContent>
          </Card>

          {/* 8. Protection des données */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-6 h-6 mr-3 text-blue-600" />
                8. Protection des données personnelles (RGPD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                CassKai s'engage à protéger les données personnelles de ses Clients conformément au Règlement Général sur 
                la Protection des Données (RGPD - Règlement UE 2016/679) et à la Loi Informatique et Libertés.
              </p>
              <p className="mb-4">
                Les modalités de traitement, de conservation et d'exercice de vos droits (accès, rectification, effacement, 
                portabilité) sont détaillées dans notre <a href="/privacy-policy" className="text-blue-600 underline">Politique de Confidentialité</a>.
              </p>
              <p>
                Pour toute question relative à vos données personnelles : <strong>privacy@casskai.app</strong>
              </p>
            </CardContent>
          </Card>

          {/* 9. Force majeure */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-6 h-6 mr-3 text-orange-600" />
                9. Force majeure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                CassKai ne pourra être tenu responsable de tout retard ou inexécution de ses obligations résultant d'un cas 
                de force majeure au sens de l'Article 1218 du Code civil, notamment :
              </p>
              <ul className="space-y-2 mb-4">
                <li>• Catastrophes naturelles (inondation, tremblement de terre, incendie)</li>
                <li>• Pannes majeures des infrastructures Internet ou des fournisseurs de services cloud</li>
                <li>• Cyberattaques d'ampleur exceptionnelle (DDoS massif, ransomware)</li>
                <li>• Grèves générales, émeutes, guerres</li>
                <li>• Décisions gouvernementales (interdiction, embargo)</li>
              </ul>
              <p>
                En cas de force majeure, CassKai informera le Client dans les meilleurs délais et s'efforcera de minimiser 
                l'impact sur la continuité de service.
              </p>
            </CardContent>
          </Card>

          {/* 10. Litiges et droit applicable */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="w-6 h-6 mr-3 text-red-600" />
                10. Litiges, médiation et droit applicable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">10.1 Droit applicable</h4>
              <p className="mb-4">
                Les présentes CGV sont régies par le droit français. La langue du contrat est le français.
              </p>

              <h4 className="font-semibold mb-3">10.2 Juridiction compétente</h4>
              <p className="mb-4">
                En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux de 
                Paris seront seuls compétents, sauf dispositions impératives contraires (notamment pour les consommateurs 
                domiciliés hors métropole).
              </p>

              <h4 className="font-semibold mb-3">10.3 Mode alternatif de résolution des litiges</h4>
              <p className="mb-4">
                En cas de litige, les parties s'efforceront de trouver une solution amiable avant toute action judiciaire. 
                Les litiges pourront être soumis à une procédure de médiation ou de conciliation conventionnelle.
              </p>
              <p className="text-sm text-muted-foreground">
                Note : Les présentes CGV s'adressent exclusivement aux professionnels (B2B). Les obligations relatives 
                à la médiation de la consommation ne sont donc pas applicables.
              </p>
            </CardContent>
          </Card>

          {/* 11. Dispositions diverses */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-6 h-6 mr-3 text-gray-600 dark:text-gray-400" />
                11. Dispositions diverses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">11.1 Modification des CGV</h4>
              <p className="mb-4">
                CassKai se réserve le droit de modifier les présentes CGV à tout moment. Les modifications entreront en vigueur 
                30 jours après notification par email au Client. La poursuite de l'utilisation du service après cette date 
                vaudra acceptation des nouvelles CGV.
              </p>

              <h4 className="font-semibold mb-3">11.2 Nullité partielle</h4>
              <p className="mb-4">
                Si une ou plusieurs stipulations des présentes CGV sont tenues pour non valides ou déclarées comme telles en 
                application d'une loi, d'un règlement ou à la suite d'une décision judiciaire, les autres stipulations 
                garderont toute leur force et leur portée.
              </p>

              <h4 className="font-semibold mb-3">11.3 Non-renonciation</h4>
              <p className="mb-4">
                Le fait pour CassKai de ne pas se prévaloir d'un manquement du Client à l'une quelconque des obligations 
                visées dans les présentes CGV ne saurait être interprété comme une renonciation à se prévaloir ultérieurement 
                de ce manquement.
              </p>

              <h4 className="font-semibold mb-3">11.4 Intégralité</h4>
              <p>
                Les présentes CGV, conjointement avec les CGU et la Politique de Confidentialité, constituent l'intégralité 
                de l'accord entre CassKai et le Client et remplacent tous accords antérieurs relatifs au même objet.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 mr-3 text-indigo-600" />
                Nous contacter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Pour toute question relative aux présentes Conditions Générales de Vente :
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Service Commercial</h4>
                  <p className="text-sm">Email : sales@casskai.app</p>
                  <p className="text-sm">Tél : +33 7 52 02 71 98</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Service Facturation</h4>
                  <p className="text-sm">Email : billing@casskai.app</p>
                  <p className="text-sm">Tél : +33 7 52 02 71 98</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2">Siège social</h4>
                <p className="text-sm">NC NOUTCHE CONSEIL</p>
                <p className="text-sm">12 rue Jean-Baptiste Charcot</p>
                <p className="text-sm">91300 Massy, France</p>
                <p className="text-sm">RCS Evry : 909 672 685</p>
                <p className="text-sm">SIRET : 909 672 685 00023</p>
                <p className="text-sm">TVA intracommunautaire : FR85909672685</p>
                <p className="text-sm">Capital social : 1 500 €</p>
                <div className="mt-3">
                  <p className="text-sm font-semibold">Contact :</p>
                  <p className="text-sm">France : +33 7 52 02 71 98</p>
                  <p className="text-sm">Côte d'Ivoire : +225 74 58 83 83</p>
                  <p className="text-sm">Bénin : +229 01 69 18 76 03</p>
                  <p className="text-sm">Email : contact@casskai.app</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer CGV */}
          <div className="text-center py-8 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-2">
              Conditions Générales de Vente - Version {version}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dernière mise à jour : {lastUpdated}
            </p>
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <a href="/terms-of-service" className="text-blue-600 hover:underline">
                CGU
              </a>
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
                Confidentialité
              </a>
              <a href="/cookies-policy" className="text-blue-600 hover:underline">
                Cookies
              </a>
              <a href="/gdpr" className="text-blue-600 hover:underline">
                RGPD
              </a>
            </div>
          </div>
        </motion.div>
      </PageContainer>
    </>
  );
};

export default TermsOfSalePage;
