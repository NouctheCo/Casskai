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

  Shield, 

  Lock, 

  Database, 

  Eye, 

  CheckCircle, 

  AlertTriangle,

  Key,

  Server,

  FileCheck,

  Globe,

  UserCheck,

  Zap

} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { PageContainer } from '@/components/ui/PageContainer';

import { useNavigate } from 'react-router-dom';



const SecurityPage = () => {

  const { t: _t } = useTranslation();

  const navigate = useNavigate();



  const securityFeatures = [

    {

      icon: Shield,

      title: 'Chiffrement de niveau militaire',

      description: 'Toutes vos données sont chiffrées en AES-256 en transit et au repos.',

      details: [

        'Chiffrement AES-256 pour le stockage',

        'TLS 1.3 pour les communications',

        'Clés de chiffrement rotées automatiquement',

        'Hashage sécurisé des mots de passe (bcrypt)'

      ]

    },

    {

      icon: Database,

      title: 'Sauvegarde et redondance',

      description: 'Vos données sont sauvegardées automatiquement et stockées dans plusieurs centres de données.',

      details: [

        'Sauvegarde automatique toutes les heures',

        'Stockage redondant sur 3 centres de données',

        'Récupération instantanée en cas de panne',

        'Conservation des sauvegardes pendant 90 jours'

      ]

    },

    {

      icon: Key,

      title: 'Authentification multi-facteurs',

      description: 'Protection renforcée de vos comptes avec l\'authentification à deux facteurs.',

      details: [

        'Authentification par SMS ou email',

        'Support des applications TOTP (Google Authenticator)',

        'Codes de récupération sécurisés',

        'Connexion biométrique sur mobile'

      ]

    },

    {

      icon: Eye,

      title: 'Surveillance et monitoring',

      description: 'Surveillance 24/7 de notre infrastructure et détection proactive des menaces.',

      details: [

        'Monitoring en temps réel',

        'Détection automatique d\'intrusions',

        'Alertes de sécurité instantanées',

        'Logs d\'audit complets'

      ]

    },

    {

      icon: UserCheck,

      title: 'Contrôle d\'accès granulaire',

      description: 'Gérez précisément qui a accès à quoi dans votre organisation.',

      details: [

        'Rôles et permissions personnalisables',

        'Accès basé sur les équipes',

        'Sessions temporaires pour les consultants',

        'Révocation instantanée des accès'

      ]

    },

    {

      icon: Globe,

      title: 'Conformité internationale',

      description: 'Respecte les normes de sécurité les plus strictes au niveau mondial.',

      details: [

        'Conforme RGPD/GDPR',

        'Certification ISO 27001',

        'Conforme SOC 2 Type II',

        'Respect des normes ANSSI'

      ]

    }

  ];



  const certifications = [

    {

      name: 'ISO 27001',

      description: 'Norme internationale pour la gestion de la sécurité de l\'information',

      status: 'Certifié',

      icon: FileCheck

    },

    {

      name: 'RGPD/GDPR',

      description: 'Règlement Général sur la Protection des Données',

      status: 'Conforme',

      icon: Shield

    },

    {

      name: 'SOC 2 Type II',

      description: 'Audit de sécurité et de disponibilité des systèmes',

      status: 'Certifié',

      icon: CheckCircle

    },

    {

      name: 'ANSSI',

      description: 'Recommandations de l\'Agence Nationale de la Sécurité des SI',

      status: 'Conforme',

      icon: Lock

    }

  ];



  const securityStats = [

    { number: '99.99%', label: 'Disponibilité', icon: Server },

    { number: '0', label: 'Incidents de sécurité', icon: Shield },

    { number: '< 24h', label: 'Temps de réponse', icon: Zap },

    { number: '256 bits', label: 'Niveau de chiffrement', icon: Key }

  ];



  return (

    <PageContainer variant="default">

      {/* Header */}

      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white py-20">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            className="text-center"

          >

            <Shield className="w-20 h-20 mx-auto mb-6 text-blue-300" />

            <h1 className="text-4xl md:text-6xl font-bold mb-6">

              Sécurité & Confidentialité

            </h1>

            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">

              Vos données sont notre priorité absolue. Découvrez les mesures de sécurité 

              de niveau entreprise qui protègent votre activité 24h/24, 7j/7.

            </p>

            <Button

              onClick={() => navigate('/register')}

              size="lg"

              className="bg-white dark:bg-gray-800 text-blue-900 hover:bg-gray-100 dark:bg-gray-900/50 dark:text-blue-100"

            >

              <Shield className="w-5 h-5 mr-2" />

              Commencer en toute sécurité

            </Button>

          </motion.div>

        </div>

      </div>



      {/* Statistiques de sécurité */}

      <div className="py-16">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {securityStats.map((stat, index) => (

              <motion.div

                key={index}

                initial={{ opacity: 0, scale: 0.9 }}

                animate={{ opacity: 1, scale: 1 }}

                transition={{ delay: index * 0.1 }}

                className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"

              >

                <stat.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />

                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">

                  {stat.number}

                </div>

                <div className="text-gray-600 dark:text-gray-400 dark:text-gray-300">

                  {stat.label}

                </div>

              </motion.div>

            ))}

          </div>

        </div>

      </div>



      {/* Fonctionnalités de sécurité */}

      <div className="py-16 bg-white dark:bg-gray-800 dark:bg-gray-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">

            <Badge className="mb-4 px-4 py-2 bg-blue-100 text-blue-800 border-blue-200">

              Sécurité avancée

            </Badge>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6">

              Protection multicouche

            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-400 dark:text-gray-300 max-w-3xl mx-auto">

              Notre approche de sécurité en profondeur protège vos données à chaque étape.

            </p>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {securityFeatures.map((feature, index) => (

              <motion.div

                key={index}

                initial={{ opacity: 0, y: 20 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ delay: index * 0.1 }}

              >

                <Card className="h-full hover:shadow-xl transition-shadow duration-300">

                  <CardHeader>

                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">

                      <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />

                    </div>

                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>

                  </CardHeader>

                  <CardContent>

                    <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-6">

                      {feature.description}

                    </p>

                    <ul className="space-y-2">

                      {feature.details.map((detail, idx) => (

                        <li key={idx} className="flex items-center text-sm">

                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />

                          {detail}

                        </li>

                      ))}

                    </ul>

                  </CardContent>

                </Card>

              </motion.div>

            ))}

          </div>

        </div>

      </div>



      {/* Certifications */}

      <div className="py-16 bg-gray-50 dark:bg-gray-800">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6">

              Certifications et conformité

            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-400 dark:text-gray-300 max-w-3xl mx-auto">

              Nous respectons les standards les plus stricts de l'industrie.

            </p>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {certifications.map((cert, index) => (

              <motion.div

                key={index}

                initial={{ opacity: 0, scale: 0.9 }}

                animate={{ opacity: 1, scale: 1 }}

                transition={{ delay: index * 0.1 }}

                className="bg-white dark:bg-gray-800 dark:bg-gray-900 p-6 rounded-xl shadow-lg text-center"

              >

                <cert.icon className="w-12 h-12 text-green-600 mx-auto mb-4" />

                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">

                  {cert.name}

                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-3">

                  {cert.description}

                </p>

                <Badge className="bg-green-100 text-green-800 border-green-200">

                  {cert.status}

                </Badge>

              </motion.div>

            ))}

          </div>

        </div>

      </div>



      {/* Centre de transparence */}

      <div className="py-16 bg-white dark:bg-gray-800 dark:bg-gray-900">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6">

            Transparence totale

          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-8">

            Nous croyons en la transparence complète concernant nos pratiques de sécurité.

          </p>

          

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <Card>

              <CardContent className="p-6">

                <FileCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />

                <h3 className="text-xl font-bold mb-3">Rapports de sécurité</h3>

                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-4">

                  Consultez nos rapports d'audit et de conformité.

                </p>

                <Button variant="outline" className="w-full">

                  Voir les rapports

                </Button>

              </CardContent>

            </Card>

            

            <Card>

              <CardContent className="p-6">

                <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto mb-4" />

                <h3 className="text-xl font-bold mb-3">Signalement de vulnérabilités</h3>

                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-4">

                  Vous avez identifié une faille ? Contactez-nous.

                </p>

                <Button variant="outline" className="w-full">

                  Signaler

                </Button>

              </CardContent>

            </Card>

          </div>

        </div>

      </div>



      {/* CTA Final */}

      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <h2 className="text-3xl md:text-4xl font-bold mb-6">

            Prêt à protéger votre entreprise ?

          </h2>

          <p className="text-xl mb-8">

            Rejoignez des milliers d'entreprises qui font confiance à CassKai pour sécuriser leurs données.

          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Button

              onClick={() => navigate('/register')}

              size="lg"

              className="bg-white dark:bg-gray-800 text-blue-600 hover:bg-gray-100 dark:bg-gray-900/50"

            >

              Essai gratuit 14 jours

            </Button>

            <Button

              onClick={() => navigate('/contact')}

              size="lg"

              variant="outline"

              className="border-white text-white hover:bg-white/10 dark:bg-gray-800"

            >

              Parler à un expert

            </Button>

          </div>

        </div>

      </div>

    </PageContainer>

  );

};



export default SecurityPage;
