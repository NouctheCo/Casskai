// Formulaire de création et édition de budget pour CassKai
// Interface professionnelle avec saisie mensuelle et validation
import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Calculator, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { budgetService } from '@/services/budgetService';
import type {
  BudgetFormData,
  BudgetCategoryFormData,
  BudgetAssumptionFormData,
  CategoryType,
  DriverType,
  BudgetValidationResult
} from '@/types/budget.types';

interface BudgetFormProps {
  companyId: string;
  budgetId?: string; // Pour l'édition
  onSave: (budget: any) => void;
  onCancel: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  companyId,
  budgetId,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<BudgetFormData>({
    year: new Date().getFullYear() + 1,
    categories: [],
    assumptions: []
  });

  const [activeTab, setActiveTab] = useState<'categories' | 'assumptions' | 'summary'>('categories');
  const [validation, setValidation] = useState<BudgetValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const monthNames = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ];

  useEffect(() => {
    if (budgetId) {
      loadExistingBudget();
    } else {
      initializeNewBudget();
    }
  }, [budgetId]);

  const loadExistingBudget = async () => {
    try {
      setLoading(true);
      const { data, error } = await budgetService.getBudgetById(budgetId!);

      if (error || !data) {
        console.error('Error loading budget:', error);
        return;
      }

      setFormData({
        year: data.year,
        categories: data.budget_categories?.map(cat => ({
          category: cat.category,
          subcategory: cat.subcategory,
          category_type: cat.category_type,
          account_codes: cat.account_codes || [],
          annual_amount: cat.annual_amount,
          monthly_amounts: cat.monthly_amounts,
          growth_rate: cat.growth_rate || 0,
          driver_type: cat.driver_type,
          base_value: cat.base_value,
          variable_rate: cat.variable_rate,
          formula: cat.formula,
          notes: cat.notes,
          responsible_person: cat.responsible_person
        })) || [],
        assumptions: data.budget_assumptions?.map(ass => ({
          key: ass.key,
          description: ass.description,
          value: ass.value,
          unit: ass.unit,
          category: ass.category,
          impact_description: ass.impact_description,
          confidence_level: ass.confidence_level,
          source: ass.source
        })) || []
      });

    } catch (error) {
      console.error('Error loading budget:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const initializeNewBudget = () => {
    // Catégories par défaut pour un nouveau budget
    const defaultCategories: BudgetCategoryFormData[] = [
      {
        category: 'Chiffre d\'affaires',
        subcategory: 'Ventes produits/services',
        category_type: 'revenue',
        account_codes: ['706', '707'],
        annual_amount: 0,
        monthly_amounts: Array(12).fill(0),
        growth_rate: 5,
        driver_type: 'variable',
        notes: 'Revenus principaux de l\'activité',
        responsible_person: ''
      },
      {
        category: 'Charges de personnel',
        subcategory: 'Salaires et charges sociales',
        category_type: 'expense',
        account_codes: ['641', '645'],
        annual_amount: 0,
        monthly_amounts: Array(12).fill(0),
        growth_rate: 3,
        driver_type: 'fixed',
        notes: 'Coûts de personnel',
        responsible_person: ''
      },
      {
        category: 'Charges externes',
        subcategory: 'Loyers et charges locatives',
        category_type: 'expense',
        account_codes: ['613', '614'],
        annual_amount: 0,
        monthly_amounts: Array(12).fill(0),
        growth_rate: 2,
        driver_type: 'fixed',
        notes: 'Loyers, assurances, maintenance',
        responsible_person: ''
      }
    ];

    const defaultAssumptions: BudgetAssumptionFormData[] = [
      {
        key: 'croissance_marche',
        description: 'Taux de croissance du marché',
        value: 5,
        unit: '%',
        category: 'market',
        confidence_level: 75,
        source: 'Étude sectorielle'
      },
      {
        key: 'inflation',
        description: 'Taux d\'inflation prévu',
        value: 2.5,
        unit: '%',
        category: 'economic',
        confidence_level: 80,
        source: 'BCE/INSEE'
      }
    ];

    setFormData({
      year: new Date().getFullYear() + 1,
      categories: defaultCategories,
      assumptions: defaultAssumptions
    });
  };

  const addCategory = () => {
    const newCategory: BudgetCategoryFormData = {
      category: '',
      subcategory: '',
      category_type: 'expense',
      account_codes: [],
      annual_amount: 0,
      monthly_amounts: Array(12).fill(0),
      growth_rate: 0,
      driver_type: 'fixed',
      notes: '',
      responsible_person: ''
    };

    setFormData({
      ...formData,
      categories: [...formData.categories, newCategory]
    });
  };

  const removeCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index)
    });
  };

  const updateCategory = (index: number, field: keyof BudgetCategoryFormData, value: any) => {
    const updatedCategories = [...formData.categories];

    if (field === 'monthly_amounts') {
      updatedCategories[index] = { ...updatedCategories[index], [field]: value };
      // Recalculer le montant annuel
      const annualAmount = value.reduce((sum: number, amount: number) => sum + amount, 0);
      updatedCategories[index].annual_amount = annualAmount;
    } else if (field === 'annual_amount') {
      updatedCategories[index] = { ...updatedCategories[index], [field]: value };
      // Redistribuer équitablement sur les 12 mois
      const monthlyAmount = value / 12;
      updatedCategories[index].monthly_amounts = Array(12).fill(monthlyAmount);
    } else {
      updatedCategories[index] = { ...updatedCategories[index], [field]: value };
    }

    setFormData({ ...formData, categories: updatedCategories });
  };

  const updateMonthlyAmount = (categoryIndex: number, monthIndex: number, value: number) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[categoryIndex].monthly_amounts[monthIndex] = value;

    // Recalculer le montant annuel
    const annualAmount = updatedCategories[categoryIndex].monthly_amounts.reduce((sum, amount) => sum + amount, 0);
    updatedCategories[categoryIndex].annual_amount = annualAmount;

    setFormData({ ...formData, categories: updatedCategories });
  };

  const distributeEqually = (categoryIndex: number) => {
    const category = formData.categories[categoryIndex];
    const monthlyAmount = category.annual_amount / 12;
    updateCategory(categoryIndex, 'monthly_amounts', Array(12).fill(monthlyAmount));
  };

  const addAssumption = () => {
    const newAssumption: BudgetAssumptionFormData = {
      key: '',
      description: '',
      value: 0,
      unit: '',
      category: '',
      confidence_level: 80,
      source: ''
    };

    setFormData({
      ...formData,
      assumptions: [...formData.assumptions, newAssumption]
    });
  };

  const removeAssumption = (index: number) => {
    setFormData({
      ...formData,
      assumptions: formData.assumptions.filter((_, i) => i !== index)
    });
  };

  const updateAssumption = (index: number, field: keyof BudgetAssumptionFormData, value: any) => {
    const updatedAssumptions = [...formData.assumptions];
    updatedAssumptions[index] = { ...updatedAssumptions[index], [field]: value };
    setFormData({ ...formData, assumptions: updatedAssumptions });
  };

  const validateForm = (): BudgetValidationResult => {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Validation de l'année
    const currentYear = new Date().getFullYear();
    if (formData.year < currentYear - 1 || formData.year > currentYear + 5) {
      errors.push({
        field: 'year',
        message: `L'année doit être comprise entre ${  currentYear - 1  } et ${  currentYear + 5}`,
        severity: 'error'
      });
    }

    // Validation des catégories
    if (formData.categories.length === 0) {
      errors.push({
        field: 'categories',
        message: 'Au moins une catégorie budgétaire est requise',
        severity: 'error'
      });
    }

    formData.categories.forEach((cat, index) => {
      if (!cat.category.trim()) {
        errors.push({
          field: `categories[${index}].category`,
          message: 'Le nom de la catégorie est requis',
          severity: 'error'
        });
      }

      if (cat.monthly_amounts.length !== 12) {
        errors.push({
          field: `categories[${index}].monthly_amounts`,
          message: '12 montants mensuels sont requis',
          severity: 'error'
        });
      }

      // Vérifier la cohérence mensuel/annuel
      const monthlyTotal = cat.monthly_amounts.reduce((sum, amount) => sum + amount, 0);
      if (Math.abs(monthlyTotal - cat.annual_amount) > 0.01) {
        warnings.push({
          field: `categories[${index}].amounts`,
          message: 'Incohérence entre total mensuel et montant annuel',
          suggestion: 'Vérifiez la répartition mensuelle'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const handleSave = async () => {
    const validationResult = validateForm();
    setValidation(validationResult);

    if (!validationResult.isValid) {
      return;
    }

    try {
      setSaving(true);

      let result;
      if (budgetId) {
        result = await budgetService.updateBudget(budgetId, formData);
      } else {
        result = await budgetService.createBudget(companyId, formData);
      }

      if (result.error) {
        console.error('Error saving budget:', result.error);
      } else {
        onSave(result.data);
      }

    } catch (error) {
      console.error('Error saving budget:', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const calculateTotals = () => {
    const revenue = formData.categories
      .filter(cat => cat.category_type === 'revenue')
      .reduce((sum, cat) => sum + cat.annual_amount, 0);

    const expenses = formData.categories
      .filter(cat => cat.category_type === 'expense')
      .reduce((sum, cat) => sum + cat.annual_amount, 0);

    const capex = formData.categories
      .filter(cat => cat.category_type === 'capex')
      .reduce((sum, cat) => sum + cat.annual_amount, 0);

    return { revenue, expenses, capex, profit: revenue - expenses };
  };

  const totals = calculateTotals();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {budgetId ? 'Modifier le budget' : 'Nouveau budget'} {formData.year}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Définissez vos objectifs financiers par catégorie et mois
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100 transition-colors"
            >
              <X className="h-4 w-4 mr-2 inline" />
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
              ) : (
                <Save className="h-4 w-4 mr-2 inline" />
              )}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Validation Messages */}
        {validation && (
          <div className="mt-4 space-y-2">
            {validation.errors.map((error, index) => (
              <div key={index} className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error.message}</span>
              </div>
            ))}
            {validation.warnings.map((warning, index) => (
              <div key={index} className="flex items-center space-x-2 text-orange-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Year Selection */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Année budgétaire :
          </label>
          <select
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
          >
            {[2024, 2025, 2026, 2027, 2028].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'categories', label: 'Catégories Budgétaires', icon: Calculator },
            { id: 'assumptions', label: 'Hypothèses', icon: TrendingUp },
            { id: 'summary', label: 'Résumé', icon: CheckCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Catégories Budgétaires
              </h3>
              <button
                onClick={addCategory}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter une catégorie</span>
              </button>
            </div>

            {formData.categories.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Calculator className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Aucune catégorie budgétaire
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Commencez par ajouter vos premières catégories de revenus et charges
                </p>
                <button
                  onClick={addCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ajouter une catégorie
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {formData.categories.map((category, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-700/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Catégorie *
                          </label>
                          <input
                            type="text"
                            value={category.category}
                            onChange={(e) => updateCategory(index, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                            placeholder="Ex: Chiffre d'affaires"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sous-catégorie
                          </label>
                          <input
                            type="text"
                            value={category.subcategory || ''}
                            onChange={(e) => updateCategory(index, 'subcategory', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                            placeholder="Ex: Ventes produits"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type *
                          </label>
                          <select
                            value={category.category_type}
                            onChange={(e) => updateCategory(index, 'category_type', e.target.value as CategoryType)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                          >
                            <option value="revenue">Revenus</option>
                            <option value="expense">Charges</option>
                            <option value="capex">Investissements</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => removeCategory(index)}
                        className="ml-4 p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Montant annuel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Montant annuel (€)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={category.annual_amount}
                            onChange={(e) => updateCategory(index, 'annual_amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                            placeholder="0"
                          />
                          <button
                            onClick={() => distributeEqually(index)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Répartir équitablement sur 12 mois"
                          >
                            <Calculator className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Taux de croissance (%)
                        </label>
                        <input
                          type="number"
                          value={category.growth_rate || 0}
                          onChange={(e) => updateCategory(index, 'growth_rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Répartition mensuelle */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Répartition mensuelle (€)
                      </label>
                      <div className="grid grid-cols-4 md:grid-cols-12 gap-2">
                        {monthNames.map((month, monthIndex) => (
                          <div key={month} className="text-center">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{month}</div>
                            <input
                              type="number"
                              value={category.monthly_amounts[monthIndex]}
                              onChange={(e) => updateMonthlyAmount(index, monthIndex, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={category.notes || ''}
                        onChange={(e) => updateCategory(index, 'notes', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                        placeholder="Commentaires ou justifications..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assumptions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Hypothèses Budgétaires
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Définissez les principales hypothèses qui sous-tendent votre budget
                </p>
              </div>
              <button
                onClick={addAssumption}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter une hypothèse</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.assumptions.map((assumption, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-700/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Clé d'hypothèse *
                      </label>
                      <input
                        type="text"
                        value={assumption.key}
                        onChange={(e) => updateAssumption(index, 'key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                        placeholder="Ex: taux_croissance_marche"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valeur *
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={assumption.value}
                          onChange={(e) => updateAssumption(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                          placeholder="5"
                        />
                        <input
                          type="text"
                          value={assumption.unit || ''}
                          onChange={(e) => updateAssumption(index, 'unit', e.target.value)}
                          className="w-16 px-2 py-2 border-l-0 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                          placeholder="%"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={assumption.description}
                      onChange={(e) => updateAssumption(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                      placeholder="Ex: Taux de croissance du marché prévu"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Catégorie
                      </label>
                      <select
                        value={assumption.category}
                        onChange={(e) => updateAssumption(index, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="market">Marché</option>
                        <option value="economic">Économique</option>
                        <option value="operational">Opérationnel</option>
                        <option value="financial">Financier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confiance (%)
                      </label>
                      <input
                        type="number"
                        value={assumption.confidence_level}
                        onChange={(e) => updateAssumption(index, 'confidence_level', parseInt(e.target.value) || 80)}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => removeAssumption(index)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Source
                    </label>
                    <input
                      type="text"
                      value={assumption.source || ''}
                      onChange={(e) => updateAssumption(index, 'source', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                      placeholder="Ex: Étude sectorielle, INSEE, BCE..."
                    />
                  </div>
                </div>
              ))}

              {formData.assumptions.length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <TrendingUp className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Aucune hypothèse définie
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Les hypothèses permettent de documenter les bases de votre budget
                  </p>
                  <button
                    onClick={addAssumption}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter une hypothèse
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Résumé du Budget {formData.year}
              </h3>

              {/* Indicateurs principaux */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-6 rounded-lg">
                  <div className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
                    Total Revenus
                  </div>
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {formatCurrency(totals.revenue)}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-6 rounded-lg">
                  <div className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                    Total Charges
                  </div>
                  <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                    {formatCurrency(totals.expenses)}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                    Résultat Prévu
                  </div>
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {formatCurrency(totals.profit)}
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 p-6 rounded-lg">
                  <div className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">
                    Marge Nette
                  </div>
                  <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>

              {/* Détail par catégorie */}
              <div className="bg-white dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Détail par catégorie
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Catégorie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Montant Annuel
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          % du Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                      {formData.categories.map((category, index) => {
                        const totalBase = category.category_type === 'revenue' ? totals.revenue :
                                         category.category_type === 'expense' ? totals.expenses : totals.capex;
                        const percentage = totalBase > 0 ? (category.annual_amount / totalBase * 100).toFixed(1) : '0';

                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {category.category}
                                </div>
                                {category.subcategory && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {category.subcategory}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                category.category_type === 'revenue' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                category.category_type === 'expense' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {category.category_type === 'revenue' ? 'Revenus' :
                                 category.category_type === 'expense' ? 'Charges' : 'Investissements'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(category.annual_amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                              {percentage}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hypothèses résumées */}
              {formData.assumptions.length > 0 && (
                <div className="bg-white dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Hypothèses clés
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.assumptions.map((assumption, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {assumption.description}
                          </div>
                          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {assumption.value} {assumption.unit}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Confiance: {assumption.confidence_level}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};