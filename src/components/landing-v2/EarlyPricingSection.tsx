/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Early Pricing Section - High visibility pricing for conversion optimization
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Globe, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';
import {
  generateCountryPricing,
  formatPriceWithCurrency,
  getDefaultCountry,
  type CountryPricing
} from '@/services/pricingMultiCurrency';
import { COUNTRIES } from '@/config/currencies';

export function EarlyPricingSection() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [selectedCountry, setSelectedCountry] = useState(getDefaultCountry());
  const [isYearly, setIsYearly] = useState(false);
  const [pricing, setPricing] = useState<CountryPricing | null>(null);

  // Load pricing data
  useEffect(() => {
    const countryPricing = generateCountryPricing(selectedCountry);
    setPricing(countryPricing);
  }, [selectedCountry]);

  // Helper functions (copied from CTASection)
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

  // Country options for selector
  const countryOptions = COUNTRIES.map(c => ({
    code: c.code,
    name: c.name,
    flag: c.flag,
    region: c.region
  }));

  return (
    <section id="plans" className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            {t('landing.earlyPricing.badge')}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('landing.earlyPricing.title')}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-4">
            {t('landing.earlyPricing.subtitle')}
          </p>
          <p className="text-sm text-gray-500">
            {t('landing.earlyPricing.reassurance')}
          </p>
        </motion.div>

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

        {/* Pricing Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
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
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-6 mt-10 text-center"
        >
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            {t('landing.earlyPricing.trust.trial')}
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            {t('landing.earlyPricing.trust.noCard')}
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            {t('landing.earlyPricing.trust.cancel')}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default EarlyPricingSection;
