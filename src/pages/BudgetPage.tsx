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

// Page principale de gestion des budgets pour CassKai - Version modernisée

import React, { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';

import { useEnterprise } from '@/contexts/EnterpriseContext';

import { BudgetManager } from '@/components/budget/BudgetManager';

import { BudgetForm } from '@/components/budget/BudgetForm';

import { BudgetForecastView } from '@/components/budget/BudgetForecastView';

import { Building, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useTranslation } from 'react-i18next';



type ViewMode = 'list' | 'create' | 'edit' | 'forecast';



const BudgetPage: React.FC = () => {

  const { currentEnterprise } = useEnterprise();

  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [editingBudgetId, setEditingBudgetId] = useState<string | undefined>();

  const [forecastBudgetId, setForecastBudgetId] = useState<string | undefined>();

  const [forecastBudgetYear, setForecastBudgetYear] = useState<number>(new Date().getFullYear());



  // Si pas d'entreprise sélectionnée

  if (!currentEnterprise) {

    return (

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

          <Card className="border-0 shadow-md">

            <CardContent className="flex flex-col items-center justify-center py-16">

              <div className="mb-6">

                <div className="relative">

                  <Building className="h-20 w-20 text-gray-300 mx-auto" />

                  <Target className="h-8 w-8 text-blue-500 absolute -right-2 -bottom-2" />

                </div>

              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">

                {t('budget.noCompanySelected.title')}

              </h2>

              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">

                {t('budget.noCompanySelected.description')}

              </p>

            </CardContent>

          </Card>

        </div>

      </div>

    );

  }



  const handleCreateBudget = () => {

    setEditingBudgetId(undefined);

    setViewMode('create');

  };



  const handleEditBudget = (budgetId: string) => {

    setEditingBudgetId(budgetId);

    setViewMode('edit');

  };



  const handleBudgetSaved = (budget: any) => {

    console.log('Budget saved:', budget);

    setViewMode('list');

    setEditingBudgetId(undefined);

  };



  const handleCancel = () => {

    setViewMode('list');

    setEditingBudgetId(undefined);

    setForecastBudgetId(undefined);

  };



  const handleViewForecast = (budgetId: string, year: number) => {

    setForecastBudgetId(budgetId);

    setForecastBudgetYear(year);

    setViewMode('forecast');

  };



  return (

    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

        {viewMode === 'list' && (

          <BudgetManager

            companyId={currentEnterprise.id}

            onCreateBudget={handleCreateBudget}

            onEditBudget={handleEditBudget}

            onViewForecast={handleViewForecast}

          />

        )}



        {(viewMode === 'create' || viewMode === 'edit') && (

          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">

            <BudgetForm

              companyId={currentEnterprise.id}

              budgetId={editingBudgetId}

              onSave={handleBudgetSaved}

              onCancel={handleCancel}

            />

          </Card>

        )}



        {viewMode === 'forecast' && forecastBudgetId && (

          <div className="space-y-4">

            <Button

              variant="outline"

              onClick={handleCancel}

              className="mb-4 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"

            >

              ← {t('budget.backToList')}

            </Button>

            <BudgetForecastView

              companyId={currentEnterprise.id}

              budgetId={forecastBudgetId}

              budgetYear={forecastBudgetYear}

            />

          </div>

        )}

      </div>

    </div>

  );

};



export default BudgetPage;
