/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Section témoignages beta testeurs
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Quote,
  Building2,
  MapPin,
  TrendingUp,
  Clock,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

interface Testimonial {
  id: string;
  name: string;
  sector: string;
  location: string;
  country: string;
  flag: string;
  avatar: string;
  quote: string;
  metrics: {
    timeSaved: string;
    errorReduction: string;
    satisfaction: number;
  };
  tags: string[];
  isBeta: boolean;
}

function TestimonialCard({ testimonial, isActive, t }: { testimonial: Testimonial; isActive: boolean; t: (key: string) => string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isActive ? 1 : 0.5, scale: isActive ? 1 : 0.9 }}
      transition={{ duration: 0.3 }}
      className={`relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border ${
        isActive ? 'border-blue-500/50 shadow-2xl shadow-blue-500/10' : 'border-gray-700'
      }`}
    >
      {/* Badge Beta */}
      {testimonial.isBeta && (
        <div className="absolute -top-3 -right-3">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <BadgeCheck className="w-3 h-3" />
            {t('landing.testimonials.betaBadge')}
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          {testimonial.avatar}
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold">{testimonial.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400 text-sm">{testimonial.sector}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500 text-xs">
              {testimonial.location}, {testimonial.country} {testimonial.flag}
            </span>
          </div>
        </div>
      </div>

      {/* Citation */}
      <div className="relative mb-4">
        <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-500/20" />
        <p className="text-gray-300 text-sm leading-relaxed pl-4 italic">
          "{testimonial.quote}"
        </p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <Clock className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <p className="text-green-400 font-bold text-lg">{testimonial.metrics.timeSaved}</p>
          <p className="text-gray-500 text-xs">{t('landing.testimonials.metrics.timeSaved')}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <p className="text-blue-400 font-bold text-lg">{testimonial.metrics.errorReduction}</p>
          <p className="text-gray-500 text-xs">{t('landing.testimonials.metrics.errorReduction')}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <div className="flex justify-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < testimonial.metrics.satisfaction
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-gray-500 text-xs">{t('landing.testimonials.metrics.satisfaction')}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {testimonial.tags.map((tag, i) => (
          <span
            key={i}
            className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function BetaTestimonials() {
  const { t } = useLocale();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const TESTIMONIALS: Testimonial[] = [
    {
      id: '1',
      name: 'Aminata D.',
      sector: t('landing.testimonials.items.0.sector'),
      location: 'Dakar',
      country: t('landing.testimonials.items.0.country'),
      flag: '🇸🇳',
      avatar: 'AD',
      quote: t('landing.testimonials.items.0.quote'),
      metrics: { timeSaved: '70%', errorReduction: '95%', satisfaction: 5 },
      tags: t('landing.testimonials.items.0.tags').split(',').map(s => s.trim()),
      isBeta: true
    },
    {
      id: '2',
      name: 'Jean-Pierre D.',
      sector: t('landing.testimonials.items.1.sector'),
      location: 'Lyon',
      country: t('landing.testimonials.items.1.country'),
      flag: '🇫🇷',
      avatar: 'JP',
      quote: t('landing.testimonials.items.1.quote'),
      metrics: { timeSaved: '45%', errorReduction: '80%', satisfaction: 5 },
      tags: t('landing.testimonials.items.1.tags').split(',').map(s => s.trim()),
      isBeta: true
    },
    {
      id: '3',
      name: 'Kouadio Y.',
      sector: t('landing.testimonials.items.2.sector'),
      location: 'Abidjan',
      country: t('landing.testimonials.items.2.country'),
      flag: '🇨🇮',
      avatar: 'KY',
      quote: t('landing.testimonials.items.2.quote'),
      metrics: { timeSaved: '60%', errorReduction: '90%', satisfaction: 5 },
      tags: t('landing.testimonials.items.2.tags').split(',').map(s => s.trim()),
      isBeta: true
    },
    {
      id: '4',
      name: 'Sophie M.',
      sector: t('landing.testimonials.items.3.sector'),
      location: 'Paris',
      country: t('landing.testimonials.items.3.country'),
      flag: '🇫🇷',
      avatar: 'SM',
      quote: t('landing.testimonials.items.3.quote'),
      metrics: { timeSaved: '55%', errorReduction: '85%', satisfaction: 4 },
      tags: t('landing.testimonials.items.3.tags').split(',').map(s => s.trim()),
      isBeta: true
    },
    {
      id: '5',
      name: 'Moussa T.',
      sector: t('landing.testimonials.items.4.sector'),
      location: 'Bamako',
      country: t('landing.testimonials.items.4.country'),
      flag: '🇲🇱',
      avatar: 'MT',
      quote: t('landing.testimonials.items.4.quote'),
      metrics: { timeSaved: '50%', errorReduction: '75%', satisfaction: 5 },
      tags: t('landing.testimonials.items.4.tags').split(',').map(s => s.trim()),
      isBeta: true
    },
    {
      id: '6',
      name: 'Fatima B.',
      sector: t('landing.testimonials.items.5.sector'),
      location: 'Casablanca',
      country: t('landing.testimonials.items.5.country'),
      flag: '🇲🇦',
      avatar: 'FB',
      quote: t('landing.testimonials.items.5.quote'),
      metrics: { timeSaved: '65%', errorReduction: '88%', satisfaction: 5 },
      tags: t('landing.testimonials.items.5.tags').split(',').map(s => s.trim()),
      isBeta: true
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % TESTIMONIALS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setActiveIndex(prev => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex(prev => (prev + 1) % TESTIMONIALS.length);
  };

  // Calculer les indices visibles (3 cartes sur desktop)
  const getVisibleIndices = () => {
    const indices = [];
    for (let i = -1; i <= 1; i++) {
      indices.push((activeIndex + i + TESTIMONIALS.length) % TESTIMONIALS.length);
    }
    return indices;
  };

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* En-tête */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm mb-6"
          >
            <BadgeCheck className="w-4 h-4" />
            {t('landing.testimonials.badge')}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            {t('landing.testimonials.title')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {t('landing.testimonials.titleHighlight')}
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            {t('landing.testimonials.description')}
          </motion.p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation */}
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors shadow-lg"
            aria-label={t('landing.testimonials.previous')}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors shadow-lg"
            aria-label={t('landing.testimonials.next')}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Cards */}
          <div className="flex justify-center items-center gap-6 overflow-hidden px-8">
            <AnimatePresence mode="popLayout">
              {getVisibleIndices().map((index, position) => (
                <motion.div
                  key={TESTIMONIALS[index].id}
                  initial={{ opacity: 0, x: position === 0 ? -100 : position === 2 ? 100 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`w-full max-w-md ${position !== 1 ? 'hidden lg:block' : ''}`}
                >
                  <TestimonialCard
                    testimonial={TESTIMONIALS[index]}
                    isActive={position === 1}
                    t={t}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Indicateurs */}
          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setActiveIndex(index);
                }}
                aria-label={t('landing.testimonials.goToSlide', { number: index + 1 })}
                className={`h-2 rounded-full transition-all ${
                  index === activeIndex
                    ? 'w-8 bg-blue-500'
                    : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          {/* Auto-play indicator */}
          {isAutoPlaying && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Play className="w-3 h-3" />
                {t('landing.testimonials.autoPlay')}
              </div>
            </div>
          )}
        </div>

        {/* Stats globales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-gray-800"
        >
          <div className="text-center">
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              50+
            </p>
            <p className="text-gray-500 mt-1">{t('landing.testimonials.stats.betaTesters')}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              12
            </p>
            <p className="text-gray-500 mt-1">{t('landing.testimonials.stats.countries')}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              4.8/5
            </p>
            <p className="text-gray-500 mt-1">{t('landing.testimonials.stats.rating')}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              97%
            </p>
            <p className="text-gray-500 mt-1">{t('landing.testimonials.stats.recommend')}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default BetaTestimonials;
