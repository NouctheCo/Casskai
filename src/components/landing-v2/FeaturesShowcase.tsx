/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Section showcase des fonctionnalités
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Wallet,
  FileSpreadsheet,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Sparkles,
  ChevronRight,
  Check
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface Feature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  benefits: string[];
  gradient: string;
  image?: string;
}

function FeatureCard({ feature, isActive, onClick }: {
  feature: Feature;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = feature.icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-4 rounded-xl transition-all ${
        isActive
          ? `bg-gradient-to-r ${feature.gradient} shadow-lg`
          : 'bg-gray-800/50 hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isActive ? 'bg-white/20' : 'bg-gray-700'
        }`}>
          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
            {feature.title}
          </h4>
        </div>
        <ChevronRight className={`w-5 h-5 transition-transform ${
          isActive ? 'text-white rotate-90' : 'text-gray-500'
        }`} />
      </div>
    </motion.button>
  );
}

export function FeaturesShowcase() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const FEATURES: Feature[] = [
    {
      id: 'ai',
      icon: Brain,
      title: t('landing.features.ai.title'),
      description: t('landing.features.ai.description'),
      benefits: [
        t('landing.features.ai.benefits.categorization'),
        t('landing.features.ai.benefits.suggestions'),
        t('landing.features.ai.benefits.detection'),
        t('landing.features.ai.benefits.assistant')
      ],
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'treasury',
      icon: Wallet,
      title: t('landing.features.treasury.title'),
      description: t('landing.features.treasury.description'),
      benefits: [
        t('landing.features.treasury.benefits.sync'),
        t('landing.features.treasury.benefits.forecast'),
        t('landing.features.treasury.benefits.alerts'),
        t('landing.features.treasury.benefits.reconciliation')
      ],
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'regulatory',
      icon: FileSpreadsheet,
      title: t('landing.features.regulatory.title'),
      description: t('landing.features.regulatory.description'),
      benefits: [
        t('landing.features.regulatory.benefits.tax'),
        t('landing.features.regulatory.benefits.vat'),
        t('landing.features.regulatory.benefits.fec'),
        t('landing.features.regulatory.benefits.payroll')
      ],
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'hr',
      icon: Users,
      title: t('landing.features.hr.title'),
      description: t('landing.features.hr.description'),
      benefits: [
        t('landing.features.hr.benefits.payslips'),
        t('landing.features.hr.benefits.leave'),
        t('landing.features.hr.benefits.expenses'),
        t('landing.features.hr.benefits.compliance')
      ],
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      benefits: [
        t('landing.features.analytics.benefits.customizable'),
        t('landing.features.analytics.benefits.realtime'),
        t('landing.features.analytics.benefits.comparison'),
        t('landing.features.analytics.benefits.export')
      ],
      gradient: 'from-indigo-500 to-violet-500'
    },
    {
      id: 'multi',
      icon: Globe,
      title: t('landing.features.multi.title'),
      description: t('landing.features.multi.description'),
      benefits: [
        t('landing.features.multi.benefits.pcg'),
        t('landing.features.multi.benefits.syscohada'),
        t('landing.features.multi.benefits.ifrs'),
        t('landing.features.multi.benefits.scf')
      ],
      gradient: 'from-teal-500 to-cyan-500'
    }
  ];

  const [activeFeature, setActiveFeature] = useState(FEATURES[0]);

  return (
    <section className="py-24 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-6"
          >
            <Sparkles className="w-4 h-4" />
            {t('landing.features.badge')}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            {t('landing.features.title')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {t('landing.features.titleHighlight')}
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            {t('landing.features.description')}
          </motion.p>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                isActive={activeFeature.id === feature.id}
                onClick={() => setActiveFeature(feature)}
              />
            ))}
          </motion.div>

          {/* Feature detail */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-24"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeFeature.gradient} flex items-center justify-center mb-6`}>
                  <activeFeature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {activeFeature.title}
                </h3>
                <p className="text-gray-400 mb-6">
                  {activeFeature.description}
                </p>

                {/* Benefits */}
                <div className="space-y-3">
                  {activeFeature.benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${activeFeature.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-300">{benefit}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className={`w-full py-3 px-6 rounded-xl bg-gradient-to-r ${activeFeature.gradient} text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                  >
                    <Zap className="w-5 h-5" />
                    {t('landing.features.cta')}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-8 border-t border-gray-800"
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-white mb-1">
              <Shield className="w-6 h-6 text-green-400" />
              100%
            </div>
            <p className="text-gray-500 text-sm">{t('landing.features.stats.gdpr')}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-white mb-1">
              <Zap className="w-6 h-6 text-yellow-400" />
              {'<'}2s
            </div>
            <p className="text-gray-500 text-sm">{t('landing.features.stats.aiResponse')}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-white mb-1">
              <Globe className="w-6 h-6 text-blue-400" />
              25+
            </div>
            <p className="text-gray-500 text-sm">{t('landing.features.stats.countries')}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-white mb-1">
              <Brain className="w-6 h-6 text-purple-400" />
              99.9%
            </div>
            <p className="text-gray-500 text-sm">{t('landing.features.stats.availability')}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturesShowcase;
