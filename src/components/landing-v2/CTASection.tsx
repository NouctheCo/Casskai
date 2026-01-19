/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Section CTA finale avec pricing multi-devises
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket,
  ArrowRight,
  Check,
  Sparkles,
  Globe
} from 'lucide-react';
import {
  generateCountryPricing,
  formatPriceWithCurrency,
  getDefaultCountry,
  type CountryPricing
} from '@/services/pricingMultiCurrency';
import { COUNTRIES } from '@/config/currencies';
import { createWhatsAppUrl, WHATSAPP_CONFIG } from '@/config/whatsapp.config';
import { useLocale } from '@/contexts/LocaleContext';

export function CTASection() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedCountry, setSelectedCountry] = useState(getDefaultCountry());
  const [isYearly, setIsYearly] = useState(false);
  const [pricing, setPricing] = useState<CountryPricing | null>(null);

  // Charger les prix pour le pays sélectionné
  useEffect(() => {
    const countryPricing = generateCountryPricing(selectedCountry);
    setPricing(countryPricing);
  }, [selectedCountry]);

  // Effet particules
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    // Créer les particules
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const benefits = [
    t('landing.cta.benefits.trial'),
    t('landing.cta.benefits.noCard'),
    t('landing.cta.benefits.support'),
    t('landing.cta.benefits.cancel')
  ];

  const getPrice = (plan: 'starter' | 'professional' | 'enterprise') => {
    if (!pricing) return '...';
    const planPricing = pricing[plan];
    const price = isYearly ? Math.round(planPricing.yearly / 12) : planPricing.monthly;
    return formatPriceWithCurrency(price, pricing.currency);
  };

  const getOriginalPrice = (plan: 'starter' | 'professional' | 'enterprise') => {
    if (!pricing) return '';
    const planPricing = pricing[plan];
    const price = isYearly ? Math.round(planPricing.yearlyOriginal / 12) : planPricing.monthlyOriginal;
    return formatPriceWithCurrency(price, pricing.currency);
  };

  const getDiscount = (plan: 'starter' | 'professional' | 'enterprise') => {
    if (!pricing) return 0;
    return pricing[plan].discount;
  };

  const getYearlyTotal = (plan: 'starter' | 'professional' | 'enterprise') => {
    if (!pricing) return '';
    return formatPriceWithCurrency(pricing[plan].yearly, pricing.currency);
  };

  // Grouper les pays par région pour le sélecteur
  const countryOptions = COUNTRIES.map(c => ({
    code: c.code,
    name: c.name,
    flag: c.flag,
    region: c.region
  }));

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Canvas particules */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-black pointer-events-none" />

      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            {t('landing.cta.badge')}
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            {t('landing.cta.title')}
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              {t('landing.cta.titleHighlight')}
            </span>
          </motion.h2>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
          >
            {t('landing.cta.subtitle')}
          </motion.p>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mb-10"
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-gray-300"
              >
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/auth')}
              type="button"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold text-lg shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow flex items-center justify-center gap-3"
            >
              <Rocket className="w-5 h-5" />
              {t('landing.cta.buttons.start')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={createWhatsAppUrl(WHATSAPP_CONFIG.messages.demo)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-green-600 hover:bg-green-500 border border-green-500 rounded-xl text-white font-semibold text-lg transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('landing.cta.buttons.demo')}
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          {/* Pricing Controls */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
            {/* Country Selector */}
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {countryOptions.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly/Yearly Toggle */}
            <div className="flex items-center gap-3">
              <span className={`text-sm ${!isYearly ? 'text-white' : 'text-gray-500'}`}>{t('landing.cta.pricing.monthly')}</span>
              <button
                type="button"
                onClick={() => setIsYearly(!isYearly)}
                className="relative w-14 h-7 rounded-full bg-gray-700 transition-colors"
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-transform ${
                    isYearly ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isYearly ? 'text-white' : 'text-gray-500'}`}>
                {t('landing.cta.pricing.yearly')}
                <span className="ml-1 text-green-400 text-xs">{t('landing.cta.pricing.yearlyDiscount')}</span>
              </span>
            </div>
          </div>

          {/* Pricing info */}
          {pricing && (
            <p className="text-center text-gray-500 text-sm mb-6">
              {t('landing.cta.pricing.priceIn', {
                currency: pricing.currency,
                symbol: pricing.currencySymbol,
                standard: pricing.accountingStandard
              })}
            </p>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{t('landing.cta.pricing.plans.starter.name')}</h3>
                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                  -{getDiscount('starter')}%
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{t('landing.cta.pricing.plans.starter.desc')}</p>
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{getPrice('starter')}</span>
                  <span className="text-gray-500">{t('landing.cta.pricing.perMonth')}</span>
                </div>
                <div className="text-sm text-gray-500 line-through">
                  {getOriginalPrice('starter')}{t('landing.cta.pricing.perMonth')}
                </div>
                {isYearly && (
                  <div className="text-sm text-green-400 mt-1">
                    Soit {getYearlyTotal('starter')}{t('landing.cta.pricing.perYear')}
                  </div>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.starter.features.users')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.starter.features.accounting')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.starter.features.invoicing')}
                </li>
              </ul>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                {t('landing.cta.pricing.plans.starter.cta')}
              </button>
            </div>

            {/* Professional - Featured */}
            <div className="relative bg-gradient-to-b from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/50 shadow-xl shadow-blue-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-xs font-bold">
                {t('landing.cta.pricing.plans.professional.badge')}
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{t('landing.cta.pricing.plans.professional.name')}</h3>
                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                  -{getDiscount('professional')}%
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{t('landing.cta.pricing.plans.professional.desc')}</p>
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{getPrice('professional')}</span>
                  <span className="text-gray-500">{t('landing.cta.pricing.perMonth')}</span>
                </div>
                <div className="text-sm text-gray-500 line-through">
                  {getOriginalPrice('professional')}{t('landing.cta.pricing.perMonth')}
                </div>
                {isYearly && (
                  <div className="text-sm text-green-400 mt-1">
                    Soit {getYearlyTotal('professional')}{t('landing.cta.pricing.perYear')}
                  </div>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.professional.features.users')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.professional.features.starter')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.professional.features.ai')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.professional.features.multi')}
                </li>
              </ul>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
              >
                {t('landing.cta.pricing.plans.professional.cta')}
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{t('landing.cta.pricing.plans.enterprise.name')}</h3>
                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                  -{getDiscount('enterprise')}%
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{t('landing.cta.pricing.plans.enterprise.desc')}</p>
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{getPrice('enterprise')}</span>
                  <span className="text-gray-500">{t('landing.cta.pricing.perMonth')}</span>
                </div>
                <div className="text-sm text-gray-500 line-through">
                  {getOriginalPrice('enterprise')}{t('landing.cta.pricing.perMonth')}
                </div>
                {isYearly && (
                  <div className="text-sm text-green-400 mt-1">
                    Soit {getYearlyTotal('enterprise')}{t('landing.cta.pricing.perYear')}
                  </div>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.enterprise.features.all')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.enterprise.features.sso')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.enterprise.features.support')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('landing.cta.pricing.plans.enterprise.features.manager')}
                </li>
              </ul>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                {t('landing.cta.pricing.plans.enterprise.cta')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTASection;
