// Gestionnaire de budgets principal pour CassKai - Version modernisée

import React, { useState, useRef } from 'react';

import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

import { Plus, Upload, Download, AlertCircle, RefreshCw } from 'lucide-react';

import { BudgetStats } from './BudgetStats';

import { BudgetFilters } from './BudgetFilters';

import { BudgetList } from './BudgetList';

import { useBudgetManager } from '@/hooks/useBudgetManager';

import { budgetImportExportService } from '@/services/budgetImportExportService';

import { budgetService } from '@/services/budgetService';

import { useToast } from '@/components/ui/use-toast';

import type { Budget } from '@/types/budget.types';



interface BudgetManagerProps {

  companyId: string;

  onCreateBudget?: () => void;

  onEditBudget?: (budgetId: string) => void;

  onViewForecast?: (budgetId: string, year: number) => void;

}



export const BudgetManager: React.FC<BudgetManagerProps> = ({

  companyId,

  onCreateBudget,

  onEditBudget,

  onViewForecast

}) => {

  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showImportDialog, setShowImportDialog] = useState(false);

  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();



  const {

    budgets,

    loading,

    filter,

    setFilter,

    loadBudgets,

    handleStatusChange,

    handleDuplicate,

    handleDelete

  } = useBudgetManager(companyId);



  const handleDeleteClick = (budget: Budget) => {

    setBudgetToDelete(budget);

    setShowDeleteDialog(true);

  };



  const handleDeleteConfirm = async () => {

    if (!budgetToDelete) return;



    await handleDelete(budgetToDelete.id);

    setShowDeleteDialog(false);

    setBudgetToDelete(null);

  };



  const handleEdit = (budget: Budget) => {

    if (onEditBudget) {

      onEditBudget(budget.id);

    }

  };



  const handleCreateNewBudget = () => {

    if (onCreateBudget) {

      onCreateBudget();

    } else {

      setShowCreateModal(true);

    }

  };



  const handleResetFilters = () => {

    setFilter({});

    setSearchTerm('');

  };



  // Télécharger le modèle Excel

  const handleDownloadTemplate = async () => {

    try {

      const currentYear = new Date().getFullYear();

      await budgetImportExportService.downloadBudgetTemplate(currentYear, 'MonEntreprise');

      toast({

        title: 'Modèle téléchargé',

        description: 'Le modèle de budget a été téléchargé avec succès',

      });

    } catch (error) {

      toast({

        title: 'Erreur',

        description: error instanceof Error ? error.message : 'Erreur lors du téléchargement du modèle',

        variant: 'destructive',

      });

    }

  };



  // Importer un fichier Excel

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (!file) return;



    setImporting(true);

    try {

      // Importer les données du fichier

      const importData = await budgetImportExportService.importBudgetFromExcel(file);

      

      // Créer le budget

      const { data, error } = await budgetService.createBudgetFromImport(companyId, importData);

      

      if (error) throw error;



      toast({

        title: 'Budget importé',

        description: `Le budget ${importData.year} a été importé avec succès`,

      });



      // Recharger la liste des budgets

      await loadBudgets();

      setShowImportDialog(false);



    } catch (error) {

      toast({

        title: 'Erreur d\'import',

        description: error instanceof Error ? error.message : 'Erreur lors de l\'import du budget',

        variant: 'destructive',

      });

    } finally {

      setImporting(false);

      if (fileInputRef.current) {

        fileInputRef.current.value = '';

      }

    }

  };



  // Ouvrir la boîte de dialogue d'import

  const handleOpenImportDialog = () => {

    setShowImportDialog(true);

  };



  // Exporter un budget vers Excel

  const handleExportBudget = async (budget: Budget) => {

    try {

      await budgetImportExportService.exportBudgetToExcel(

        budget.year,

        budget.budget_categories?.map(cat => ({

          category: cat.category,

          subcategory: cat.subcategory,

          category_type: cat.category_type,

          monthly_amounts: cat.monthly_amounts,

          notes: cat.notes,

        })) || [],

        budget.budget_assumptions?.map(ass => ({

          key: ass.key,

          description: ass.description,

          value: ass.value,

          unit: ass.unit,

          category: ass.category,

        })),

        'MonEntreprise'

      );



      toast({

        title: 'Budget exporté',

        description: `Le budget ${budget.year} a été exporté avec succès`,

      });

    } catch (error) {

      toast({

        title: 'Erreur d\'export',

        description: error instanceof Error ? error.message : 'Erreur lors de l\'export du budget',

        variant: 'destructive',

      });

    }

  };



  // Filtrage local complet avec recherche ET filtres

  const filteredBudgets = budgets.filter(budget => {

    // Filtre par recherche

    if (searchTerm) {

      const searchLower = searchTerm.toLowerCase();

      if (!budget.year.toString().includes(searchLower)) {

        return false;

      }

    }



    // Filtre par année

    if (filter.years && filter.years.length > 0) {

      if (!filter.years.includes(budget.year)) {

        return false;

      }

    }



    // Filtre par statut

    if (filter.status && filter.status.length > 0) {

      if (!filter.status.includes(budget.status)) {

        return false;

      }

    }



    return true;

  });



  if (loading) {

    return (

      <div className="flex items-center justify-center h-64">

        <div className="flex flex-col items-center space-y-4">

          <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />

          <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300">Chargement des budgets...</p>

        </div>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">

            Gestion des Budgets

          </h1>

          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mt-1">

            Créez et gérez vos budgets annuels avec suivi en temps réel

          </p>

        </div>



        <div className="flex space-x-3">

          <Button variant="outline" onClick={loadBudgets}>

            <RefreshCw className="w-4 h-4 mr-2" />

            Actualiser

          </Button>



          <Button variant="outline" onClick={handleOpenImportDialog}>

            <Upload className="w-4 h-4 mr-2" />

            Importer

          </Button>



          <Button onClick={handleCreateNewBudget}>

            <Plus className="w-4 h-4 mr-2" />

            Nouveau Budget

          </Button>

        </div>

      </div>



      {/* Statistics */}

      {budgets.length > 0 && <BudgetStats budgets={budgets} />}



      {/* Filters */}

      <BudgetFilters

        searchTerm={searchTerm}

        setSearchTerm={setSearchTerm}

        filter={filter}

        setFilter={setFilter}

        onResetFilters={handleResetFilters}

        loading={loading}

      />



      {/* Budget List */}

      <BudgetList

        budgets={filteredBudgets}

        onEdit={handleEdit}

        onDuplicate={handleDuplicate}

        onDelete={handleDeleteClick}

        onActivate={(budget) => handleStatusChange(budget.id, 'active')}

        onSubmitForReview={(budget) => handleStatusChange(budget.id, 'under_review')}

        onViewForecast={onViewForecast || (() => {})}

        onCreateBudget={handleCreateNewBudget}

        onExport={handleExportBudget}

      />



      {/* Create Budget Modal */}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>

        <DialogContent className="max-w-md bg-white dark:bg-gray-800 dark:bg-gray-800 border-gray-200 dark:border-gray-600 dark:border-gray-700">

          <DialogHeader>

            <DialogTitle className="text-gray-900 dark:text-gray-100 dark:text-gray-100">Créer un nouveau budget</DialogTitle>

            <DialogDescription className="text-gray-600 dark:text-gray-300 dark:text-gray-300">

              Choisissez comment créer votre budget

            </DialogDescription>

          </DialogHeader>



          <div className="space-y-3">

            <Button

              variant="outline"

              className="w-full justify-start text-left h-auto py-4 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"

              onClick={() => {

                setShowCreateModal(false);

                handleCreateNewBudget();

              }}

            >

              <div>

                <div className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Partir de zéro</div>

                <div className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-300">Créer un budget vierge</div>

              </div>

            </Button>



            <Button

              variant="outline"

              className="w-full justify-start text-left h-auto py-4 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"

            >

              <div>

                <div className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Utiliser un modèle</div>

                <div className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-300">Basé sur des templates sectoriels</div>

              </div>

            </Button>



            <Button

              variant="outline"

              className="w-full justify-start text-left h-auto py-4 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"

            >

              <div>

                <div className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">Dupliquer budget existant</div>

                <div className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-300">Reprendre un budget précédent</div>

              </div>

            </Button>

          </div>



          <DialogFooter>

            <Button variant="outline" onClick={() => setShowCreateModal(false)}>

              Annuler

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      {/* Delete Confirmation Dialog */}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>

        <DialogContent className="bg-white dark:bg-gray-800 dark:bg-gray-800 border-gray-200 dark:border-gray-600 dark:border-gray-700">

          <DialogHeader>

            <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 dark:text-gray-100">

              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />

              <span>Confirmer la suppression</span>

            </DialogTitle>

            <DialogDescription className="text-gray-600 dark:text-gray-300 dark:text-gray-300">

              Êtes-vous sûr de vouloir supprimer le budget {budgetToDelete?.year} ?

              Cette action est irréversible.

            </DialogDescription>

          </DialogHeader>



          <DialogFooter>

            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>

              Annuler

            </Button>

            <Button variant="destructive" onClick={handleDeleteConfirm}>

              Supprimer

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      {/* Import Budget Dialog */}

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>

        <DialogContent className="max-w-md bg-white dark:bg-gray-800 dark:bg-gray-800 border-gray-200 dark:border-gray-600 dark:border-gray-700">

          <DialogHeader>

            <DialogTitle className="text-gray-900 dark:text-gray-100 dark:text-gray-100">Importer un budget</DialogTitle>

            <DialogDescription className="text-gray-600 dark:text-gray-300 dark:text-gray-300">

              Importez un budget depuis un fichier Excel

            </DialogDescription>

          </DialogHeader>



          <div className="space-y-4">

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-lg p-6 text-center">

              <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-300 mb-3" />

              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-2">

                Glissez-déposez votre fichier Excel ou

              </p>

              <input

                ref={fileInputRef}

                type="file"

                accept=".xlsx,.xls"

                onChange={handleImportFile}

                disabled={importing}

                className="hidden"

                id="budget-import-file"

              />

              <label htmlFor="budget-import-file">

                <Button

                  variant="outline"

                  disabled={importing}

                  onClick={() => fileInputRef.current?.click()}

                  className="dark:bg-gray-700 dark:border-gray-600"

                  type="button"

                >

                  {importing ? (

                    <>

                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />

                      Import en cours...

                    </>

                  ) : (

                    <>

                      <Upload className="w-4 h-4 mr-2" />

                      Choisir un fichier

                    </>

                  )}

                </Button>

              </label>

            </div>



            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">

              <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2">

                💡 Besoin d'un modèle ?

              </p>

              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">

                Téléchargez notre modèle Excel pré-formaté avec des exemples

              </p>

              <Button

                variant="outline"

                size="sm"

                onClick={handleDownloadTemplate}

                className="w-full dark:bg-gray-700 dark:border-gray-600"

              >

                <Download className="w-4 h-4 mr-2" />

                Télécharger le modèle

              </Button>

            </div>

          </div>



          <DialogFooter>

            <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={importing}>

              Annuler

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  );

};
