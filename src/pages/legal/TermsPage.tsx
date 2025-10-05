import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Page CGU/CGV - Conditions Générales d'Utilisation et de Vente
 * Dernière mise à jour : 5 octobre 2025
 */
export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <article className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conditions Générales d'Utilisation et de Vente
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Dernière mise à jour : 5 octobre 2025
          </p>

          {/* 1. Préambule */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Préambule</h2>
            <p className="text-gray-700 mb-4">
              Les présentes Conditions Générales d'Utilisation et de Vente (ci-après "CGU/CGV")
              régissent l'utilisation de la plateforme CassKai (ci-après "le Service") accessible
              à l'adresse https://casskai.app et exploitée par CassKai SARL (ci-après "CassKai"
              ou "nous").
            </p>
            <p className="text-gray-700">
              En accédant et en utilisant le Service, vous acceptez sans réserve les présentes
              CGU/CGV. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le Service.
            </p>
          </section>

          {/* 2. Définitions */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Définitions</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Utilisateur</strong> : Toute personne physique ou morale utilisant le
                Service.
              </li>
              <li>
                <strong>Client</strong> : Utilisateur ayant souscrit à un abonnement payant.
              </li>
              <li>
                <strong>Compte</strong> : Espace personnel créé par l'Utilisateur pour accéder au
                Service.
              </li>
              <li>
                <strong>Données</strong> : Toutes informations saisies, stockées ou traitées via
                le Service.
              </li>
              <li>
                <strong>Abonnement</strong> : Souscription mensuelle ou annuelle donnant accès aux
                fonctionnalités du Service.
              </li>
            </ul>
          </section>

          {/* 3. Inscription et Compte */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Inscription et Compte Utilisateur
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Création de compte</h3>
            <p className="text-gray-700 mb-4">
              Pour utiliser le Service, vous devez créer un compte en fournissant une adresse email
              valide et un mot de passe sécurisé. Vous vous engagez à fournir des informations
              exactes, complètes et à jour.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Responsabilité</h3>
            <p className="text-gray-700 mb-4">
              Vous êtes seul responsable de la confidentialité de vos identifiants de connexion et
              de toutes les activités effectuées depuis votre compte. Vous vous engagez à nous
              informer immédiatement de toute utilisation non autorisée de votre compte.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Compte multi-entreprises</h3>
            <p className="text-gray-700">
              Un compte peut gérer plusieurs entreprises selon les limites de votre plan
              d'abonnement. Chaque entreprise doit correspondre à une entité juridique distincte.
            </p>
          </section>

          {/* 4. Abonnements et Tarifs */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Abonnements et Tarifs
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Plans disponibles</h3>
            <p className="text-gray-700 mb-4">
              CassKai propose quatre plans d'abonnement :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Gratuit</strong> : 0 XOF/mois - Limité à 50 transactions/mois</li>
              <li><strong>Essentiel</strong> : 15,000 XOF/mois - Pour indépendants</li>
              <li><strong>Pro</strong> : 40,000 XOF/mois - Pour PME</li>
              <li><strong>Enterprise</strong> : Sur devis - Solution sur mesure</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Période d'essai</h3>
            <p className="text-gray-700 mb-4">
              Les plans payants incluent une période d'essai gratuite de 14 jours. Aucun paiement
              n'est requis pendant cette période. À l'expiration de l'essai, votre abonnement sera
              automatiquement activé sauf annulation de votre part.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Facturation</h3>
            <p className="text-gray-700 mb-4">
              Les abonnements sont facturés mensuellement ou annuellement d'avance. Le renouvellement
              est automatique sauf résiliation. Nous acceptons les paiements par :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Mobile Money (Orange Money, MTN, Wave, Moov)</li>
              <li>Carte bancaire (Visa, Mastercard)</li>
              <li>Virement bancaire</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.4 Modification des tarifs</h3>
            <p className="text-gray-700">
              Nous nous réservons le droit de modifier nos tarifs à tout moment. Les changements
              seront notifiés 30 jours à l'avance par email. Les tarifs en vigueur au moment de
              votre souscription resteront applicables jusqu'à votre prochain renouvellement.
            </p>
          </section>

          {/* 5. Résiliation et Remboursement */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Résiliation et Remboursement
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Résiliation par le Client</h3>
            <p className="text-gray-700 mb-4">
              Vous pouvez résilier votre abonnement à tout moment depuis votre espace personnel.
              La résiliation prend effet à la fin de la période de facturation en cours. Aucun
              remboursement au prorata n'est effectué pour les périodes non utilisées.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Résiliation par CassKai</h3>
            <p className="text-gray-700 mb-4">
              Nous nous réservons le droit de suspendre ou résilier votre compte en cas de :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Non-paiement après 15 jours de retard</li>
              <li>Violation des présentes CGU/CGV</li>
              <li>Utilisation frauduleuse ou abusive du Service</li>
              <li>Activités illégales</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 Politique de remboursement</h3>
            <p className="text-gray-700">
              Les paiements effectués sont non remboursables, sauf en cas de dysfonctionnement
              majeur du Service non résolu sous 7 jours. Dans ce cas, un remboursement au prorata
              sera effectué sur demande.
            </p>
          </section>

          {/* 6. Propriété Intellectuelle */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Propriété Intellectuelle
            </h2>
            <p className="text-gray-700 mb-4">
              Le Service, incluant son code source, son interface utilisateur, ses logos, marques
              et contenus, est la propriété exclusive de CassKai et est protégé par les lois sur
              la propriété intellectuelle.
            </p>
            <p className="text-gray-700 mb-4">
              Vous conservez tous les droits sur vos Données. En utilisant le Service, vous nous
              accordez une licence limitée pour traiter vos Données uniquement dans le but de
              fournir le Service.
            </p>
          </section>

          {/* 7. Protection des Données */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Protection des Données Personnelles
            </h2>
            <p className="text-gray-700 mb-4">
              Le traitement de vos données personnelles est régi par notre{' '}
              <Link to="/legal/privacy" className="text-purple-600 hover:underline">
                Politique de Confidentialité
              </Link>
              , conforme au Règlement Général sur la Protection des Données (RGPD).
            </p>
            <p className="text-gray-700">
              Vous disposez d'un droit d'accès, de rectification, de portabilité, d'effacement et
              d'opposition au traitement de vos données. Pour exercer ces droits, contactez-nous à
              privacy@casskai.app.
            </p>
          </section>

          {/* 8. Garanties et Responsabilités */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Garanties et Responsabilités
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.1 Disponibilité du Service</h3>
            <p className="text-gray-700 mb-4">
              Nous nous efforçons de maintenir le Service accessible 24/7. Cependant, nous ne
              garantissons pas une disponibilité ininterrompue et ne pourrons être tenus responsables
              des interruptions temporaires pour maintenance ou cas de force majeure.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.2 Limitation de responsabilité</h3>
            <p className="text-gray-700 mb-4">
              CassKai ne saurait être tenu responsable de :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Pertes de données dues à une mauvaise utilisation du Service</li>
              <li>Décisions d'affaires prises sur la base des rapports générés</li>
              <li>Erreurs de saisie ou d'interprétation des données par l'Utilisateur</li>
              <li>Dommages indirects (perte de chiffre d'affaires, de clientèle, etc.)</li>
            </ul>
            <p className="text-gray-700">
              En tout état de cause, notre responsabilité est limitée au montant des sommes versées
              par le Client au cours des 12 derniers mois.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.3 Obligations de l'Utilisateur</h3>
            <p className="text-gray-700 mb-4">
              L'Utilisateur s'engage à :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Utiliser le Service conformément à sa destination</li>
              <li>Ne pas tenter de contourner les mesures de sécurité</li>
              <li>Ne pas utiliser le Service à des fins illégales</li>
              <li>Sauvegarder régulièrement ses données</li>
              <li>Vérifier l'exactitude des données saisies et des rapports générés</li>
            </ul>
          </section>

          {/* 9. Modifications des CGU */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Modifications des Conditions
            </h2>
            <p className="text-gray-700">
              Nous nous réservons le droit de modifier les présentes CGU/CGV à tout moment. Les
              modifications seront notifiées par email et prendront effet 30 jours après notification.
              Votre utilisation continue du Service après cette période vaut acceptation des nouvelles
              conditions.
            </p>
          </section>

          {/* 10. Loi applicable et juridiction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Loi Applicable et Juridiction
            </h2>
            <p className="text-gray-700 mb-4">
              Les présentes CGU/CGV sont régies par le droit sénégalais et les dispositions de
              l'OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires).
            </p>
            <p className="text-gray-700">
              En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut,
              les tribunaux de Dakar (Sénégal) seront seuls compétents.
            </p>
          </section>

          {/* 11. Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Contact
            </h2>
            <p className="text-gray-700 mb-4">
              Pour toute question relative aux présentes CGU/CGV, vous pouvez nous contacter :
            </p>
            <ul className="list-none space-y-2 text-gray-700">
              <li>
                <strong>Email</strong> : legal@casskai.app
              </li>
              <li>
                <strong>Téléphone</strong> : +221 XX XXX XX XX
              </li>
              <li>
                <strong>Adresse</strong> : Dakar, Sénégal
              </li>
            </ul>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Dernière mise à jour : 5 octobre 2025
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Version 1.0
            </p>
          </div>
        </article>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/legal/privacy">
            <Button variant="outline">Politique de Confidentialité</Button>
          </Link>
          <Link to="/legal/cookies">
            <Button variant="outline">Politique de Cookies</Button>
          </Link>
          <Link to="/">
            <Button variant="ghost">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
