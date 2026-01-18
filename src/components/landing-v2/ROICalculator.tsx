/**
 * CassKai Landing V2 - Calculateur ROI Dynamique
 * Calcul personnalisé du retour sur investissement
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';

// Prix CassKai par plan (mensuel)
const CASSKAI_PRICES = {
  starter: 29,
  pro: 49,
  enterprise: 99,
};

// Données de référence pour les calculs
const REFERENCE_DATA = {
  hourlyRate: 35, // Taux horaire moyen d'un comptable/gestionnaire
  hoursPerTransactionManual: 0.05, // 3 minutes par transaction manuelle
  hoursPerTransactionCasskai: 0.005, // 18 secondes avec CassKai
  monthlyReconciliationHours: 8, // 8h de rapprochement bancaire/mois
  monthlyReportingHours: 4, // 4h de reporting/mois
  errorCostPerYear: 2400, // Coût des erreurs comptables par an
  accountantMonthlyCost: 350, // Coût mensuel expert-comptable moyen
};

interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number; // Taux vs EUR
}

const COUNTRIES: CountryOption[] = [
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€', exchangeRate: 1 },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', currency: 'XOF', currencySymbol: 'FCFA', exchangeRate: 655.957 },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', currency: 'XOF', currencySymbol: 'FCFA', exchangeRate: 655.957 },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', currency: 'XAF', currencySymbol: 'FCFA', exchangeRate: 655.957 },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦', currency: 'MAD', currencySymbol: 'DH', exchangeRate: 10.9 },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿', currency: 'DZD', currencySymbol: 'DA', exchangeRate: 147 },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳', currency: 'TND', currencySymbol: 'DT', exchangeRate: 3.4 },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪', currency: 'EUR', currencySymbol: '€', exchangeRate: 1 },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭', currency: 'CHF', currencySymbol: 'CHF', exchangeRate: 0.95 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: '$', exchangeRate: 1.45 },
];

export function ROICalculator() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [country, setCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [employees, setEmployees] = useState(10);
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [monthlyTransactions, setMonthlyTransactions] = useState(200);

  // Calculs ROI
  const calculations = useMemo(() => {
    const { hourlyRate, hoursPerTransactionManual, hoursPerTransactionCasskai,
            monthlyReconciliationHours, monthlyReportingHours, errorCostPerYear,
            accountantMonthlyCost } = REFERENCE_DATA;

    // Temps économisé sur les transactions
    const manualTransactionHours = monthlyTransactions * hoursPerTransactionManual;
    const casskaiTransactionHours = monthlyTransactions * hoursPerTransactionCasskai;
    const transactionTimeSaved = manualTransactionHours - casskaiTransactionHours;

    // Temps total économisé par mois
    const totalTimeSavedMonthly = transactionTimeSaved +
      (monthlyReconciliationHours * 0.9) + // 90% de réduction
      (monthlyReportingHours * 0.8); // 80% de réduction

    // Valeur du temps économisé
    const timeSavingsMonthly = totalTimeSavedMonthly * hourlyRate;

    // Réduction des erreurs
    const errorSavingsMonthly = errorCostPerYear / 12;

    // Réduction coût expert-comptable (estimation 30%)
    const accountantSavingsMonthly = accountantMonthlyCost * 0.3;

    // Plan recommandé
    let recommendedPlan: 'starter' | 'pro' | 'enterprise' = 'starter';
    if (employees > 20 || monthlyRevenue > 200000) {
      recommendedPlan = 'enterprise';
    } else if (employees > 5 || monthlyRevenue > 50000) {
      recommendedPlan = 'pro';
    }

    const casskaiCostMonthly = CASSKAI_PRICES[recommendedPlan];

    // Économies totales
    const totalSavingsMonthly = timeSavingsMonthly + errorSavingsMonthly + accountantSavingsMonthly;
    const totalSavingsYearly = totalSavingsMonthly * 12;
    const casskaiCostYearly = casskaiCostMonthly * 12;
    const netSavingsYearly = totalSavingsYearly - casskaiCostYearly;
    const roiPercentage = ((netSavingsYearly / casskaiCostYearly) * 100);

    // Conversion en devise locale
    const convertToLocal = (amount: number) => Math.round(amount * country.exchangeRate);

    return {
      timeSavedHoursMonthly: Math.round(totalTimeSavedMonthly),
      timeSavingsMonthly: convertToLocal(timeSavingsMonthly),
      errorSavingsMonthly: convertToLocal(errorSavingsMonthly),
      accountantSavingsMonthly: convertToLocal(accountantSavingsMonthly),
      totalSavingsMonthly: convertToLocal(totalSavingsMonthly),
      totalSavingsYearly: convertToLocal(totalSavingsYearly),
      casskaiCostMonthly: convertToLocal(casskaiCostMonthly),
      casskaiCostYearly: convertToLocal(casskaiCostYearly),
      netSavingsYearly: convertToLocal(netSavingsYearly),
      roiPercentage: Math.round(roiPercentage),
      recommendedPlan,
    };
  }, [country, employees, monthlyRevenue, monthlyTransactions]);

  const formatCurrency = (amount: number) => {
    if (country.currency === 'XOF' || country.currency === 'XAF') {
      return `${amount.toLocaleString('fr-FR')} ${country.currencySymbol}`;
    }
    return `${amount.toLocaleString('fr-FR')} ${country.currencySymbol}`;
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-900 to-slate-950" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 mb-6">
            <Calculator className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">{t('landing.calculator.badge')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t('landing.calculator.title')}{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {t('landing.calculator.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            {t('landing.calculator.subtitle')}
          </p>
        </motion.div>

        {/* Calculator */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-8"
          >
            <h3 className="text-xl font-semibold text-white mb-6">{t('landing.calculator.inputs.title')}</h3>

            {/* Country selector */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">{t('landing.calculator.inputs.country')}</label>
              <div className="grid grid-cols-5 gap-2">
                {COUNTRIES.slice(0, 5).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCountry(c)}
                    className={`p-3 rounded-lg border transition-all ${
                      country.code === c.code
                        ? 'bg-blue-500/20 border-blue-500 text-white'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl">{c.flag}</span>
                  </button>
                ))}
              </div>
              <select
                value={country.code}
                onChange={(e) => setCountry(COUNTRIES.find(c => c.code === e.target.value) || COUNTRIES[0])}
                className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Employees slider */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-slate-400">{t('landing.calculator.inputs.employees')}</label>
                <span className="text-sm font-semibold text-white">{employees}</span>
              </div>
              <Slider
                value={[employees]}
                onValueChange={(v) => setEmployees(v[0])}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Monthly revenue slider */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-slate-400">{t('landing.calculator.inputs.revenue')} ({country.currencySymbol})</label>
                <span className="text-sm font-semibold text-white">
                  {formatCurrency(monthlyRevenue * country.exchangeRate)}
                </span>
              </div>
              <Slider
                value={[monthlyRevenue]}
                onValueChange={(v) => setMonthlyRevenue(v[0])}
                min={10000}
                max={500000}
                step={5000}
                className="w-full"
              />
            </div>

            {/* Transactions slider */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-slate-400">{t('landing.calculator.inputs.transactions')}</label>
                <span className="text-sm font-semibold text-white">{monthlyTransactions}</span>
              </div>
              <Slider
                value={[monthlyTransactions]}
                onValueChange={(v) => setMonthlyTransactions(v[0])}
                min={50}
                max={1000}
                step={10}
                className="w-full"
              />
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-400">
                {t('landing.calculator.inputs.note')}
              </p>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {/* ROI Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-semibold">{t('landing.calculator.results.roiTitle')}</span>
                </div>

                <div className="text-5xl font-bold text-white mb-2">
                  {calculations.roiPercentage}%
                </div>

                <div className="text-2xl font-semibold text-green-400">
                  {formatCurrency(calculations.netSavingsYearly)}/an
                </div>

                <p className="text-slate-400 mt-2">
                  {t('landing.calculator.results.savingsAfter')}
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
              <h4 className="font-semibold text-white mb-4">{t('landing.calculator.results.breakdown')}</h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-white">{t('landing.calculator.results.timeSaved')}</div>
                      <div className="text-xs text-slate-500">{t('landing.calculator.results.hoursPerMonth', { hours: calculations.timeSavedHoursMonthly })}</div>
                    </div>
                  </div>
                  <span className="text-green-400 font-semibold">
                    +{formatCurrency(calculations.timeSavingsMonthly)}/mois
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-white">{t('landing.calculator.results.errorsAvoided')}</div>
                      <div className="text-xs text-slate-500">{t('landing.calculator.results.guaranteedCompliance')}</div>
                    </div>
                  </div>
                  <span className="text-green-400 font-semibold">
                    +{formatCurrency(calculations.errorSavingsMonthly)}/mois
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-white">{t('landing.calculator.results.accountant')}</div>
                      <div className="text-xs text-slate-500">{t('landing.calculator.results.optimizedCollab')}</div>
                    </div>
                  </div>
                  <span className="text-green-400 font-semibold">
                    +{formatCurrency(calculations.accountantSavingsMonthly)}/mois
                  </span>
                </div>

                <div className="border-t border-slate-700 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{t('landing.calculator.results.totalSavings')}</div>
                    </div>
                    <span className="text-xl text-green-400 font-bold">
                      {formatCurrency(calculations.totalSavingsMonthly)}/mois
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended plan */}
            <div className="bg-slate-800/30 rounded-2xl border border-blue-500/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-blue-400 mb-1">{t('landing.calculator.results.recommendedPlan')}</div>
                  <div className="text-2xl font-bold text-white capitalize">
                    CassKai {calculations.recommendedPlan}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    {formatCurrency(calculations.casskaiCostMonthly)}
                  </div>
                  <div className="text-sm text-slate-400">{t('landing.calculator.results.perMonth')}</div>
                </div>
              </div>

              <Button
                size="lg"
                type="button"
                onClick={() => navigate('/register')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-6 text-lg rounded-xl"
              >
                {t('landing.calculator.results.tryFree')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <p className="text-center text-sm text-slate-500 mt-3">
                {t('landing.calculator.results.trialInfo')}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ROICalculator;
