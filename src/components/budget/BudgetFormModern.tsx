// Formulaire moderne de création et édition de budget pour CassKai
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, X, Plus, Trash2, Calculator, TrendingUp, AlertTriangle, CheckCircle, DollarSign, BarChart3 } from 'lucide-react';
import { budgetService } from '@/services/budgetService';
import type {
  BudgetFormData,
  BudgetCategoryFormData,
  BudgetAssumptionFormData,
  CategoryType
} from '@/types/budget.types';

interface BudgetFormModernProps {
  companyId: string;
  budgetId?: string;
  onSave: (budget: any) => void;
  onCancel: () => void;
}

export const BudgetFormModern: React.FC<BudgetFormModernProps> = ({
  companyId,
  budgetId,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BudgetFormData>({
    year: new Date().getFullYear() + 1,
    categories: [],
    assumptions: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

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
        toast({
          title: "Erreur",
          description: "Impossible de charger le budget",
          variant: "destructive"
        });
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
          notes: cat.notes
        })) || [],
        assumptions: data.budget_assumptions?.map(ass => ({
          key: ass.key,
          description: ass.description,
          value: ass.value,
          unit: ass.unit,
          category: ass.category,
          confidence_level: ass.confidence_level
        })) || []
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du chargement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeNewBudget = () => {
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
        notes: 'Revenus principaux'
      },
      {
        category: 'Charges de personnel',
        subcategory: 'Salaires et charges',
        category_type: 'expense',
        account_codes: ['641', '645'],
        annual_amount: 0,
        monthly_amounts: Array(12).fill(0),
        growth_rate: 3,
        driver_type: 'fixed',
        notes: 'Coûts de personnel'
      }
    ];

    setFormData({
      year: new Date().getFullYear() + 1,
      categories: defaultCategories,
      assumptions: []
    });
  };

  const handleSave = async () => {
    if (formData.categories.length === 0) {
      toast({
        title: "Erreur de validation",
        description: "Au moins une catégorie est requise",
        variant: "destructive"
      });
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
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer le budget",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Succès",
          description: budgetId ? "Budget mis à jour" : "Budget créé avec succès"
        });
        onSave(result.data);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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
      notes: ''
    };
    setFormData({ ...formData, categories: [...formData.categories, newCategory] });
  };

  const removeCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index)
    });
  };

  const updateCategory = (index: number, field: keyof BudgetCategoryFormData, value: any) => {
    const updatedCategories = [...formData.categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };

    if (field === 'annual_amount') {
      const monthlyAmount = value / 12;
      updatedCategories[index].monthly_amounts = Array(12).fill(monthlyAmount);
    }

    setFormData({ ...formData, categories: updatedCategories });
  };

  const totals = useMemo(() => {
    const revenue = formData.categories
      .filter(cat => cat.category_type === 'revenue')
      .reduce((sum, cat) => sum + cat.annual_amount, 0);

    const expenses = formData.categories
      .filter(cat => cat.category_type === 'expense')
      .reduce((sum, cat) => sum + cat.annual_amount, 0);

    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return { revenue, expenses, profit, margin };
  }, [formData.categories]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {budgetId ? 'Modifier le budget' : 'Nouveau budget'} {formData.year}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Définissez vos objectifs financiers par catégorie
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Year Selection */}
      <div className="px-6">
        <Label>Année budgétaire</Label>
        <Select
          value={formData.year.toString()}
          onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027, 2028].map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Revenus</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.revenue)}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-600">Charges</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totals.expenses)}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Bénéfice</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totals.profit)}</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Marge</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{totals.margin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Catégories Budgétaires
          </h3>
          <Button onClick={addCategory} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une catégorie
          </Button>
        </div>

        <div className="space-y-4">
          {formData.categories.map((category, index) => (
            <Card key={index} className="border-2">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>Catégorie *</Label>
                    <Input
                      value={category.category}
                      onChange={(e) => updateCategory(index, 'category', e.target.value)}
                      placeholder="Ex: Chiffre d'affaires"
                    />
                  </div>

                  <div>
                    <Label>Sous-catégorie</Label>
                    <Input
                      value={category.subcategory || ''}
                      onChange={(e) => updateCategory(index, 'subcategory', e.target.value)}
                      placeholder="Ex: Ventes produits"
                    />
                  </div>

                  <div>
                    <Label>Type *</Label>
                    <Select
                      value={category.category_type}
                      onValueChange={(value) => updateCategory(index, 'category_type', value as CategoryType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenus</SelectItem>
                        <SelectItem value="expense">Charges</SelectItem>
                        <SelectItem value="capex">Investissements</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCategory(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Montant annuel (€)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={category.annual_amount}
                        onChange={(e) => updateCategory(index, 'annual_amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                      <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <Label>Taux de croissance (%)</Label>
                    <Input
                      type="number"
                      value={category.growth_rate || 0}
                      onChange={(e) => updateCategory(index, 'growth_rate', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Notes</Label>
                  <Textarea
                    value={category.notes || ''}
                    onChange={(e) => updateCategory(index, 'notes', e.target.value)}
                    rows={2}
                    placeholder="Commentaires..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {formData.categories.length === 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calculator className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Aucune catégorie budgétaire
                </p>
                <Button onClick={addCategory} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une catégorie
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
