import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Calculator,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Wand2,
  TrendingUp,
  Equal,
  Calendar,
  Percent,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Account {
  id: string;
  account_number: string;
  name: string;
  type: string;
  class: number;
}

interface BudgetCategory {
  id?: string;
  account_id: string;
  account_number?: string;
  account_name?: string;
  subcategory?: string;
  type: 'revenue' | 'expense';
  annual_amount: number;
  growth_rate: number;
  monthly_distribution: number[];
  notes?: string;
}

interface RepartitionMode {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  calculate: (annual: number) => number[];
}

const REPARTITION_MODES: RepartitionMode[] = [
  {
    id: 'equal',
    name: 'Égale',
    icon: <Equal className="h-4 w-4" />,
    description: 'Montant identique chaque mois',
    calculate: (annual) => Array(12).fill(Math.round((annual / 12) * 100) / 100),
  },
  {
    id: 'progressive',
    name: 'Progressive',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Croissance de 5% par mois',
    calculate: (annual) => {
      const r = 1.05;
      const sum = (Math.pow(r, 12) - 1) / (r - 1);
      const m1 = annual / sum;
      return Array.from({ length: 12 }, (_, i) => Math.round(m1 * Math.pow(r, i) * 100) / 100);
    },
  },
  {
    id: 'seasonal_summer',
    name: 'Saisonnier (été fort)',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Pic en juin-août',
    calculate: (annual) => {
      const weights = [0.06, 0.06, 0.07, 0.08, 0.09, 0.12, 0.14, 0.13, 0.08, 0.07, 0.05, 0.05];
      return weights.map((w) => Math.round(annual * w * 100) / 100);
    },
  },
  {
    id: 'seasonal_winter',
    name: 'Saisonnier (hiver fort)',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Pic en novembre-décembre',
    calculate: (annual) => {
      const weights = [0.06, 0.05, 0.06, 0.07, 0.08, 0.08, 0.07, 0.07, 0.08, 0.1, 0.13, 0.15];
      return weights.map((w) => Math.round(annual * w * 100) / 100);
    },
  },
  {
    id: 'q1_heavy',
    name: 'Q1 fort',
    icon: <Percent className="h-4 w-4" />,
    description: '40% au T1, reste réparti',
    calculate: (annual) => {
      const q1 = (annual * 0.4) / 3;
      const rest = (annual * 0.6) / 9;
      return [q1, q1, q1, rest, rest, rest, rest, rest, rest, rest, rest, rest].map(
        (v) => Math.round(v * 100) / 100
      );
    },
  },
  {
    id: 'q4_heavy',
    name: 'Q4 fort',
    icon: <Percent className="h-4 w-4" />,
    description: '40% au T4, reste réparti',
    calculate: (annual) => {
      const rest = (annual * 0.6) / 9;
      const q4 = (annual * 0.4) / 3;
      return [rest, rest, rest, rest, rest, rest, rest, rest, rest, q4, q4, q4].map(
        (v) => Math.round(v * 100) / 100
      );
    },
  },
];

const MONTHS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Jun',
  'Jul',
  'Aoû',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

interface BudgetCategoryFormProps {
  category?: BudgetCategory;
  onSave: (category: BudgetCategory) => void;
  onCancel: () => void;
}

export const BudgetCategoryForm: React.FC<BudgetCategoryFormProps> = ({
  category,
  onSave,
  onCancel,
}) => {
  const { currentCompany } = useAuth();
  const { t } = useTranslation();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [formData, setFormData] = useState<BudgetCategory>({
    account_id: category?.account_id || '',
    type: category?.type || 'expense',
    annual_amount: category?.annual_amount || 0,
    growth_rate: category?.growth_rate || 0,
    monthly_distribution: category?.monthly_distribution || Array(12).fill(0),
    subcategory: category?.subcategory || '',
    notes: category?.notes || '',
  });

  const [showRepartitionMenu, setShowRepartitionMenu] = useState(false);
  const [selectedRepartitionMode, setSelectedRepartitionMode] = useState<string>('equal');

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_number, name, type, class')
        .eq('company_id', currentCompany.id)
        .in('class', [6, 7])
        .order('account_number');

      if (error) {
        console.error('Error loading accounts:', error);
        toast.error(t('errors.loadAccounts', 'Erreur lors du chargement des comptes'));
      } else {
        setAccounts(data || []);
      }
      setLoadingAccounts(false);
    };

    fetchAccounts();
  }, [currentCompany?.id, t]);

  const groupedAccounts = useMemo(() => {
    return {
      charges: accounts.filter((a) => a.class === 6),
      produits: accounts.filter((a) => a.class === 7),
    };
  }, [accounts]);

  const monthlySum = useMemo(() => {
    return formData.monthly_distribution.reduce((sum, val) => sum + (val || 0), 0);
  }, [formData.monthly_distribution]);

  const variance = useMemo(() => {
    return Math.round((formData.annual_amount - monthlySum) * 100) / 100;
  }, [formData.annual_amount, monthlySum]);

  const hasVariance = Math.abs(variance) > 0.01;

  const applyRepartition = (mode: RepartitionMode) => {
    if (formData.annual_amount <= 0) {
      toast.error(t('errors.enterAnnualAmount', "Veuillez d'abord saisir un montant annuel"));
      return;
    }

    const distribution = mode.calculate(formData.annual_amount);
    setFormData({ ...formData, monthly_distribution: distribution });
    setSelectedRepartitionMode(mode.id);
    setShowRepartitionMenu(false);
    toast.success(t('success.distributionApplied', 'Répartition appliquée'));
  };

  const adjustToAnnual = () => {
    if (monthlySum === 0) return;

    const ratio = formData.annual_amount / monthlySum;
    const adjusted = formData.monthly_distribution.map((val) =>
      Math.round(val * ratio * 100) / 100
    );

    const newSum = adjusted.reduce((s, v) => s + v, 0);
    const diff = formData.annual_amount - newSum;
    adjusted[11] = Math.round((adjusted[11] + diff) * 100) / 100;

    setFormData({ ...formData, monthly_distribution: adjusted });
    toast.success(t('success.adjusted', 'Répartition ajustée'));
  };

  const updateMonth = (index: number, value: number) => {
    const newDistribution = [...formData.monthly_distribution];
    newDistribution[index] = value;
    setFormData({ ...formData, monthly_distribution: newDistribution });
  };

  const handleAnnualChange = (value: number) => {
    setFormData({ ...formData, annual_amount: value });
  };

  const handleAccountSelect = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (account) {
      setFormData({
        ...formData,
        account_id: accountId,
        type: account.class === 7 ? 'revenue' : 'expense',
      });
    }
  };

  const isValid = formData.account_id && formData.annual_amount > 0 && !hasVariance;

  const handleSubmit = () => {
    if (!isValid) return;

    const account = accounts.find((a) => a.id === formData.account_id);
    onSave({
      ...formData,
      account_number: account?.account_number,
      account_name: account?.name,
    });
  };

  return (
    <div className="space-y-6">
      {/* Sélection compte comptable */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Compte comptable <span className="text-red-500">*</span>
          </label>
          {loadingAccounts ? (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-300">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Chargement du plan comptable...
            </div>
          ) : (
            <select
              value={formData.account_id}
              onChange={(e) => handleAccountSelect(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-800"
            >
              <option value="">-- Sélectionner un compte --</option>

              <optgroup label="📈 Classe 7 - Produits (Revenus)">
                {groupedAccounts.produits.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_number} - {account.name}
                  </option>
                ))}
              </optgroup>

              <optgroup label="📉 Classe 6 - Charges (Dépenses)">
                {groupedAccounts.charges.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_number} - {account.name}
                  </option>
                ))}
              </optgroup>
            </select>
          )}

          {formData.account_id && (
            <div
              className={`mt-2 text-sm flex items-center gap-2 ${
                formData.type === 'revenue' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formData.type === 'revenue' ? (
                <>📈 Compte de produit (revenu)</>
              ) : (
                <>📉 Compte de charge (dépense)</>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Sous-catégorie <span className="text-gray-400 dark:text-gray-500">(optionnel)</span>
          </label>
          <input
            type="text"
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            placeholder="Ex: Ventes produits / Services"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Montant annuel et croissance */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Montant annuel (€) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.annual_amount || ''}
              onChange={(e) => handleAnnualChange(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 border rounded-lg pr-20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">€/an</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Taux de croissance annuel (%)</label>
          <div className="relative">
            <input
              type="number"
              value={formData.growth_rate || ''}
              onChange={(e) =>
                setFormData({ ...formData, growth_rate: parseFloat(e.target.value) || 0 })
              }
              placeholder="0"
              step="0.1"
              className="w-full px-3 py-2 border rounded-lg pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">%</span>
          </div>
        </div>
      </div>

      {/* Répartition mensuelle */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Répartition mensuelle (€)
          </h3>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRepartitionMenu(!showRepartitionMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Wand2 className="h-4 w-4" />
              Répartir automatiquement
              <ChevronDown className="h-4 w-4" />
            </button>

            {showRepartitionMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl border z-50">
                <div className="p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-300 px-3 py-1 mb-1">
                    Choisir un mode de répartition
                  </div>
                  {REPARTITION_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => applyRepartition(mode)}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
                        selectedRepartitionMode === mode.id
                          ? 'bg-primary/10 text-primary'
                          : ''
                      }`}
                    >
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">{mode.icon}</div>
                      <div>
                        <div className="font-medium">{mode.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">{mode.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grille des 12 mois */}
        <div className="grid grid-cols-12 gap-2">
          {MONTHS.map((month, index) => (
            <div key={month} className="text-center">
              <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">{month}</label>
              <input
                type="number"
                value={formData.monthly_distribution[index] || ''}
                onChange={(e) => updateMonth(index, parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-center text-sm"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        {/* Barre de vérification */}
        <div
          className={`mt-4 p-3 rounded-lg flex items-center justify-between ${
            hasVariance
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {hasVariance ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <div>
              <div className="font-medium">
                Total mensuel :{' '}
                {monthlySum.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
              {hasVariance && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  Écart de {variance > 0 ? '+' : ''}
                  {variance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € avec le
                  montant annuel
                </div>
              )}
            </div>
          </div>

          {hasVariance && (
            <button
              type="button"
              onClick={adjustToAnnual}
              className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              <Calculator className="h-4 w-4" />
              Ajuster automatiquement
            </button>
          )}
        </div>

        {/* Graphique répartition */}
        <div className="mt-4 h-20 flex items-end gap-1">
          {formData.monthly_distribution.map((value, index) => {
            const maxValue = Math.max(...formData.monthly_distribution, 1);
            const height = (value / maxValue) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-primary/60 hover:bg-primary rounded-t transition-all"
                style={{ height: `${height}%` }}
                title={`${MONTHS[index]}: ${value.toLocaleString('fr-FR')} €`}
              />
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Hypothèses, commentaires..."
          rows={3}
          className="w-full px-3 py-2 border rounded-lg resize-none"
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:bg-gray-900/30"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {hasVariance && <AlertTriangle className="h-4 w-4" />}
          {category?.id ? 'Modifier' : 'Ajouter'}
        </button>
      </div>

      {!isValid && (
        <div className="text-sm text-red-500 text-center">
          {!formData.account_id && 'Veuillez sélectionner un compte comptable. '}
          {formData.annual_amount <= 0 && 'Veuillez saisir un montant annuel. '}
          {hasVariance && 'La répartition mensuelle doit correspondre au montant annuel.'}
        </div>
      )}
    </div>
  );
};
