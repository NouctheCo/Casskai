/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Platform Coverage Section - Showcase CassKai as complete business OS
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Briefcase, Users, Sparkles, Check } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export function PlatformCoverageSection() {
  const { t } = useLocale();

  const blocks = [
    {
      id: 'finance',
      icon: Wallet,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'management',
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      id: 'operations',
      icon: Briefcase,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      id: 'hr',
      icon: Users,
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-500/10 to-amber-500/10',
      borderColor: 'border-orange-500/20'
    }
  ];

  return (
    <section id="platform" className="py-20 bg-gradient-to-b from-slate-900 via-black to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            {t('landing.platform.badge')}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('landing.platform.title')}
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            {t('landing.platform.subtitle')}
          </p>
        </motion.div>

        {/* Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
          {blocks.map((block, index) => {
            const Icon = block.icon;
            // Get bullets with safe fallback
            const bulletsRaw = t(`landing.platform.blocks.${block.id}.bullets`, { returnObjects: true });
            const bullets = Array.isArray(bulletsRaw) ? bulletsRaw : [
              t(`landing.platform.blocks.${block.id}.bullets.0`),
              t(`landing.platform.blocks.${block.id}.bullets.1`),
              t(`landing.platform.blocks.${block.id}.bullets.2`),
              t(`landing.platform.blocks.${block.id}.bullets.3`)
            ];

            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${block.bgGradient} backdrop-blur-sm rounded-2xl p-6 border ${block.borderColor} hover:border-opacity-40 transition-all duration-300 group`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${block.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-4">
                  {t(`landing.platform.blocks.${block.id}.title`)}
                </h3>

                {/* Bullets */}
                <ul className="space-y-3">
                  {bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Closing line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-sm max-w-2xl mx-auto"
        >
          {t('landing.platform.closing')}
        </motion.p>
      </div>
    </section>
  );
}

export default PlatformCoverageSection;
