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
// Hook personnalisé pour gérer la logique des budgets
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { budgetService } from '@/services/budgetService';
import type { Budget, BudgetFilter, BudgetStatus } from '@/types/budget.types';
import { logger } from '@/lib/logger';
export const useBudgetManager = (companyId: string, initialFilter: BudgetFilter = {}) => {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BudgetFilter>(initialFilter);
  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await budgetService.getBudgets(companyId, filter);
      if (error) {
        // Pour les nouveaux utilisateurs, il est normal qu'il n'y ait pas de budgets
        // Ne pas afficher d'erreur toast dans ce cas, seulement logger
        logger.warn('UseBudgetManager', 'Erreur lors du chargement des budgets:', error);
        setBudgets([]);
      } else {
        setBudgets(data || []);
      }
    } catch (_error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, filter, toast]);
  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);
  const handleStatusChange = async (budgetId: string, newStatus: BudgetStatus) => {
    try {
      const { data: _data, error } = await budgetService.updateBudgetStatus(
        budgetId,
        newStatus,
        'current-user-id' // À remplacer par l'ID utilisateur réel
      );
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de changer le statut du budget",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Statut modifié",
          description: `Le budget a été ${newStatus === 'active' ? 'activé' : 'mis à jour'} avec succès`
        });
        await loadBudgets();
      }
    } catch (_error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    }
  };
  const handleDuplicate = async (budget: Budget) => {
    try {
      const currentYear = new Date().getFullYear();
      const { data: _data, error } = await budgetService.duplicateBudget(
        budget.id,
        currentYear + 1,
        5 // 5% de croissance par défaut
      );
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de dupliquer le budget",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Budget dupliqué",
          description: `Le budget ${budget.year} a été dupliqué pour ${currentYear + 1}`
        });
        await loadBudgets();
      }
    } catch (_error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    }
  };
  const handleDelete = async (budgetId: string) => {
    try {
      const { error } = await budgetService.deleteBudget(budgetId);
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le budget",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Budget supprim\u00e9",
          description: "Le budget a \u00e9t\u00e9 supprim\u00e9 avec succ\u00e8s"
        });
        await loadBudgets();
      }
    } catch (_error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    }
  };
  return {
    budgets,
    loading,
    filter,
    setFilter,
    loadBudgets,
    handleStatusChange,
    handleDuplicate,
    handleDelete
  };
};