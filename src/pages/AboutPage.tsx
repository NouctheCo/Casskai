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
 * 📄 Page À propos
 *
 * Présentation de CassKai et de Noutche Conseil
 */

import { Building2, Globe2, Target, Heart, Shield, Sparkles, Users, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';
import { FaXTwitter, FaLinkedin, FaYoutube } from 'react-icons/fa6';
import { SEO } from '@/components/SEO/SEOHelmet';
import { motion } from 'framer-motion';

const stats = [
  { value: '21', label: 'Pays supportés', icon: '🌍' },
  { value: '5', label: 'Normes comptables', icon: '📊' },
  { value: '12', label: 'Devises', icon: '💱' },
  { value: '2022', label: 'Année de création', icon: '🚀' },
];

const values = [
  {
    icon: Users,
    title: 'Proximité',
    description: 'Support en français et anglais, connaissance approfondie des réalités locales en Afrique francophone et en Europe.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Shield,
    title: 'Conformité',
    description: 'Respect strict des normes comptables de chaque pays : PCG, SYSCOHADA, IFRS, SCF. Conformité RGPD garantie.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Sparkles,
    title: 'Innovation',
    description: 'Intelligence artificielle intégrée pour simplifier les tâches complexes et piloter votre activité efficacement.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Heart,
    title: 'Accessibilité',
    description: 'Tarifs adaptés aux PME et indépendants. Essai gratuit 30 jours sans engagement ni carte bancaire.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
];

const standards = [
  { name: 'PCG 2025', region: 'France, Belgique, Luxembourg', flag: '🇫🇷' },
  { name: 'SYSCOHADA', region: '17 pays OHADA', flag: '🌍' },
  { name: 'IFRS', region: 'International', flag: '🌐' },
  { name: 'SCF', region: 'Algérie', flag: '🇩🇿' },
  { name: 'SCE', region: 'Tunisie', flag: '🇹🇳' },
];

export default function AboutPage() {
  return (
    <>
      <SEO
        title="À propos"
        description="CassKai est développé par Noutche Conseil, société française fondée en 2022. Notre mission : démocratiser l'accès à une gestion financière professionnelle pour les PME en Afrique et en Europe."
        keywords={['à propos casskai', 'noutche conseil', 'logiciel comptable', 'qui sommes-nous']}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-2xl mb-6">
                <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                À propos de{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CassKai
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Une solution de gestion financière née de l'expertise terrain en comptabilité africaine et européenne,
                développée par <strong className="text-gray-900 dark:text-white">Noutche Conseil</strong>.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800"
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Notre Histoire */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Notre histoire
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>
                    <strong className="text-gray-900 dark:text-white">CassKai</strong> est né d'un constat simple :
                    les PME en Afrique francophone et en France manquent d'outils adaptés à leurs réalités comptables locales.
                  </p>
                  <p>
                    Développé par <strong className="text-gray-900 dark:text-white">Noutche Conseil</strong>,
                    société française fondée en <strong className="text-blue-600 dark:text-blue-400">2022</strong>,
                    CassKai répond à ce besoin en proposant une plateforme unique qui s'adapte automatiquement
                    aux normes comptables de chaque pays.
                  </p>
                  <p>
                    Que vous soyez en France (PCG), dans la zone OHADA (SYSCOHADA), au Maghreb (SCF) ou ailleurs,
                    CassKai parle votre langage comptable et respecte vos obligations fiscales locales.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Globe2 className="w-6 h-6 text-blue-600" />
                  Normes comptables supportées
                </h3>
                <div className="space-y-3">
                  {standards.map((standard) => (
                    <div key={standard.name} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-2xl">{standard.flag}</span>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{standard.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{standard.region}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Target className="w-12 h-12 text-white/80 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-6">Notre mission</h2>
              <p className="text-xl text-white/90 leading-relaxed">
                Démocratiser l'accès à une gestion financière professionnelle pour les PME et indépendants,
                en combinant la puissance de l'intelligence artificielle avec une parfaite adaptation
                aux réalités comptables locales.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Valeurs */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12"
            >
              Nos valeurs
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className={`w-12 h-12 ${value.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                    <value.icon className={`w-6 h-6 ${value.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Société */}
        <section className="py-16 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Infos société */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Noutche Conseil
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Raison sociale</div>
                      <div className="text-gray-600 dark:text-gray-400">NC NOUTCHE CONSEIL SAS</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">SIREN</div>
                      <div className="text-gray-600 dark:text-gray-400">909 672 685</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Siège social</div>
                      <div className="text-gray-600 dark:text-gray-400">France</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Présence</div>
                      <div className="text-gray-600 dark:text-gray-400">France, Côte d'Ivoire, Bénin</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Nous contacter
                </h2>
                <div className="space-y-4">
                  <a
                    href="mailto:contact@casskai.com"
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Email</div>
                      <div className="text-blue-600">contact@casskai.com</div>
                    </div>
                  </a>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <a
                      href="tel:+33752027198"
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">🇫🇷 Europe</div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">+33 7 52 02 71 98</div>
                      </div>
                    </a>
                    <a
                      href="tel:+22574588383"
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">🇨🇮 Afrique</div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">+225 74 58 83 83</div>
                      </div>
                    </a>
                  </div>

                  {/* Social links */}
                  <div className="flex gap-3 pt-4">
                    <a
                      href="https://x.com/casskai170725"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <FaXTwitter className="w-5 h-5" />
                    </a>
                    <a
                      href="https://linkedin.com/company/noutcheco"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <FaLinkedin className="w-5 h-5" />
                    </a>
                    <a
                      href="https://youtube.com/@casskai_app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <FaYoutube className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Prêt à simplifier votre gestion financière ?
              </h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                Rejoignez les entreprises qui font confiance à CassKai pour piloter leur activité.
                Essai gratuit 30 jours, sans engagement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Commencer gratuitement
                </a>
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  Voir les tarifs
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
