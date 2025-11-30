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
import { Building2, Mail, Phone, MapPin, User, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EXTERNAL_LINKS } from '@/config/links';

const MentionsLegalesPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-600 dark:border-gray-700 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                Mentions Légales
              </h1>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">
                Informations légales obligatoires
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
            <span>Dernière mise à jour: Janvier 2025</span>
            <span>•</span>
            <span>Version 2.0</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <div className="p-8 space-y-8">
            {/* 1. Éditeur du site */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  1. Éditeur du site
                </h2>
              </div>
              <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Raison sociale</p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">NOUTCHE CONSEIL</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Forme juridique</p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Société par Actions Simplifiée Unipersonnelle (SASU)</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Capital social</p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">1 500 €</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">SIREN</p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">909 672 685</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">SIRET</p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">909 672 685 00023</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">RCS</p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Evry B 909 672 685</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">N° TVA Intracommunautaire</p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">FR85909672685</p>
                </div>
              </div>
            </section>

            {/* 2. Siège social */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  2. Siège social
                </h2>
              </div>
              <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-6">
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  NOUTCHE CONSEIL<br />
                  12 rue Jean-Baptiste Charcot<br />
                  Bâtiment EA<br />
                  91300 MASSY<br />
                  France
                </p>
              </div>
            </section>

            {/* 3. Contact */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  3. Contact
                </h2>
              </div>
              <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Email</p>
                    <a
                      href={`mailto:${EXTERNAL_LINKS.supportEmail}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {EXTERNAL_LINKS.supportEmail}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Téléphone</p>
                    <a
                      href={`tel:${EXTERNAL_LINKS.supportPhone}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {EXTERNAL_LINKS.supportPhone}
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Directeur de la publication */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  4. Directeur de la publication
                </h2>
              </div>
              <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-6">
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  <span className="font-semibold">Nom:</span> Monsieur Aldric Cassius AFANNOU<br />
                  <span className="font-semibold">Qualité:</span> Président de NOUTCHE CONSEIL<br />
                  <span className="font-semibold">Email:</span>{' '}
                  <a
                    href={`mailto:${EXTERNAL_LINKS.supportEmail}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {EXTERNAL_LINKS.supportEmail}
                  </a>
                </p>
              </div>
            </section>

            {/* 5. Hébergement */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  5. Hébergement
                </h2>
              </div>
              <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Hébergeur</p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">Hostinger International Ltd</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Adresse</p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                    61 Lordou Vironos Street<br />
                    6023 Larnaca<br />
                    Chypre
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Site web</p>
                  <a
                    href="https://www.hostinger.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    www.hostinger.fr
                  </a>
                </div>
              </div>
            </section>

            {/* 6. Propriété intellectuelle */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  6. Propriété intellectuelle
                </h2>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  Le site <strong>CassKai</strong> et l'ensemble de son contenu (textes, images,
                  graphismes, logo, icônes, sons, logiciels) sont la propriété exclusive de
                  NOUTCHE CONSEIL, à l'exception des marques, logos ou contenus appartenant à
                  d'autres sociétés partenaires ou auteurs.
                </p>
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mt-4">
                  <strong>Marque déposée :</strong> CassKai - Numéro INPI 5202212 - Date de dépôt : 25/11/2025<br />
                  Titulaire : NOUTCHE CONSEIL
                </p>
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mt-4">
                  Toute reproduction, distribution, modification, adaptation, retransmission
                  ou publication, même partielle, de ces différents éléments est strictement
                  interdite sans l'accord exprès par écrit de NOUTCHE CONSEIL. Cette représentation
                  ou reproduction, par quelque procédé que ce soit, constitue une contrefaçon
                  sanctionnée par les articles L.335-2 et suivants du Code de la propriété
                  intellectuelle.
                </p>
              </div>
            </section>

            {/* 7. Protection des données personnelles */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  7. Protection des données personnelles
                </h2>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  NOUTCHE CONSEIL collecte et traite des données personnelles dans le respect du
                  Règlement Général sur la Protection des Données (RGPD) et de la loi Informatique
                  et Libertés.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mt-4 border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                    Responsable du traitement
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3">
                    NOUTCHE CONSEIL - SIREN : 909 672 685
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                    Délégué à la Protection des Données (DPO)
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                    Email:{' '}
                    <a
                      href="mailto:dpo@casskai.app"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      dpo@casskai.app
                    </a>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mt-3">
                    Pour plus d'informations sur le traitement de vos données personnelles,
                    consultez notre{' '}
                    <a
                      href={EXTERNAL_LINKS.privacy}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Politique de Confidentialité
                    </a>
                    {' '}et notre{' '}
                    <a
                      href={EXTERNAL_LINKS.gdpr}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      page RGPD
                    </a>.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  8. Cookies
                </h2>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  Le site utilise des cookies pour améliorer l'expérience utilisateur et
                  réaliser des statistiques de visites. Pour plus d'informations, consultez
                  notre{' '}
                  <a
                    href={EXTERNAL_LINKS.cookies}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Politique de Cookies
                  </a>.
                </p>
              </div>
            </section>

            {/* 9. Loi applicable */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  9. Loi applicable et juridiction compétente
                </h2>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  Les présentes mentions légales sont régies par la loi française. En cas de
                  litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux
                  français conformément aux règles de compétence en vigueur.
                </p>
              </div>
            </section>

            {/* 10. Crédits */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  10. Crédits
                </h2>
              </div>
              <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-6">
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300">
                  <span className="font-semibold">Conception et développement:</span> NOUTCHE CONSEIL<br />
                  <span className="font-semibold">Icônes:</span> Lucide Icons<br />
                  <span className="font-semibold">Police:</span> Inter (Google Fonts)<br />
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <a
              href={EXTERNAL_LINKS.terms}
              className="text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              Conditions d'utilisation
            </a>
            <span className="text-gray-300 dark:text-gray-700 dark:text-gray-300">•</span>
            <a
              href={EXTERNAL_LINKS.privacy}
              className="text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              Politique de confidentialité
            </a>
            <span className="text-gray-300 dark:text-gray-700 dark:text-gray-300">•</span>
            <a
              href={EXTERNAL_LINKS.cookies}
              className="text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              Cookies
            </a>
            <span className="text-gray-300 dark:text-gray-700 dark:text-gray-300">•</span>
            <a
              href={EXTERNAL_LINKS.gdpr}
              className="text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
            >
              RGPD
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentionsLegalesPage;
