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

/**
 * 📄 Page Documents Légaux
 * 
 * Hub central pour tous les documents légaux de CassKai :
 * - CGU, Privacy Policy, CGV, Cookies
 * - Téléchargement PDF
 * - Contact DPO
 */

import { FileText, Download, Calendar, Shield, Mail, Phone, MapPin } from 'lucide-react';
import { LegalPageSEO } from '@/components/SEO/SEOHelmet';

interface LegalDocument {
  id: string;
  title: string;
  description: string;
  url: string;
  pdfUrl?: string;
  version: string;
  lastUpdated: string;
  category: 'legal' | 'privacy' | 'commercial';
}

const legalDocuments: LegalDocument[] = [
  {
    id: 'cgu',
    title: 'Conditions Générales d\'Utilisation (CGU)',
    description: 'Règles d\'utilisation de la plateforme CassKai et droits des utilisateurs.',
    url: '/terms-of-service',
    pdfUrl: '/docs/legal/pdf/CGU_v2.1_CassKai.pdf',
    version: '2.1',
    lastUpdated: '24 novembre 2025',
    category: 'legal'
  },
  {
    id: 'privacy',
    title: 'Politique de Confidentialité',
    description: 'Comment nous collectons, utilisons et protégeons vos données personnelles (RGPD).',
    url: '/privacy-policy',
    pdfUrl: '/docs/legal/pdf/Politique_Confidentialite_v2.1_CassKai.pdf',
    version: '2.1',
    lastUpdated: '24 novembre 2025',
    category: 'privacy'
  },
  {
    id: 'cgv',
    title: 'Conditions Générales de Vente (CGV)',
    description: 'Tarifs, modalités d\'achat et conditions de remboursement.',
    url: '/terms-of-sale',
    pdfUrl: '/docs/legal/pdf/CGV_v1.0_CassKai.pdf',
    version: '1.0',
    lastUpdated: '24 novembre 2025',
    category: 'commercial'
  },
  {
    id: 'cookies',
    title: 'Politique des Cookies',
    description: 'Utilisation des cookies et traceurs sur notre plateforme.',
    url: '/cookies-policy',
    pdfUrl: '/docs/legal/pdf/Politique_Cookies_v1.0_CassKai.pdf',
    version: '1.0',
    lastUpdated: '24 novembre 2025',
    category: 'privacy'
  }
];

const categoryColors = {
  legal: 'bg-blue-500',
  privacy: 'bg-green-500',
  commercial: 'bg-purple-500'
};

const categoryLabels = {
  legal: 'Juridique',
  privacy: 'Confidentialité',
  commercial: 'Commercial'
};

export default function LegalPage() {
  return (
    <>
      <LegalPageSEO />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4">
            Documents Légaux
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 dark:text-gray-300 max-w-2xl mx-auto">
            Transparence totale : consultez et téléchargez tous nos documents juridiques.
            Conformité RGPD garantie.
          </p>
        </div>

        {/* Documents Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {legalDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
            >
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${categoryColors[doc.category]}`}>
                  {categoryLabels[doc.category]}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                  v{doc.version}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                {doc.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-4">
                {doc.description}
              </p>

              {/* Last Updated */}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                Dernière mise à jour : {doc.lastUpdated}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={doc.url}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Consulter
                </a>
                {doc.pdfUrl && (
                  <a
                    href={doc.pdfUrl}
                    download
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-200 rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* RGPD Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-3">
                Vos Droits RGPD
              </h2>
              <p className="text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-4">
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez de droits sur vos données personnelles :
              </p>
              <ul className="grid md:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300 dark:text-gray-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Droit d'accès à vos données
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Droit de rectification
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Droit à l'effacement
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Droit à la portabilité
                </li>
              </ul>
              <div className="mt-4">
                <a
                  href="/gdpr"
                  className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                >
                  Gérer mes données personnelles →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact DPO */}
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6">
            Contact Délégué à la Protection des Données (DPO)
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-4">
                Questions sur vos données ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-6">
                Notre DPO est à votre disposition pour toute question relative à la protection de vos données personnelles.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">Email</div>
                    <a href="mailto:dpo@casskai.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                      dpo@casskai.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">Téléphone</div>
                    <a href="tel:+33752027198" className="text-blue-600 dark:text-blue-400 hover:underline">
                      +33 7 52 02 71 98
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">Adresse postale</div>
                    <address className="not-italic text-gray-600 dark:text-gray-400 dark:text-gray-300">
                      NC NOUTCHE CONSEIL<br />
                      12 rue Jean-Baptiste Charcot<br />
                      91300 Massy, France
                    </address>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-4">
                Délais de réponse
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3 font-bold">48h</span>
                  <span>Accusé de réception de votre demande</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3 font-bold">15j</span>
                  <span>Réponse complète aux demandes d'accès</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-3 font-bold">30j</span>
                  <span>Délai maximum légal (RGPD)</span>
                </li>
              </ul>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                  🇫🇷 Vous pouvez également adresser une réclamation à la CNIL :
                  <a 
                    href="https://www.cnil.fr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                  >
                    www.cnil.fr
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
          <p>
            Ces documents sont régulièrement mis à jour. La dernière version fait toujours foi.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
