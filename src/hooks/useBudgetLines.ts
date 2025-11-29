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

/**
 * Hook personnalisé pour gérer les lignes de budget avec mapping automatique
 * Gère la conversion entre le format TypeScript (type) et DB (line_type)
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  toBudgetLineDB,
  fromBudgetLinesDB,
  type BudgetCategory,
  type BudgetLineDB,
} from '@/utils/budgetMapping';

interface UseBudgetLinesOptions {
  budgetId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useBudgetLines = ({ budgetId, onSuccess, onError }: UseBudgetLinesOptions) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<BudgetCategory[]>([]);

  /**
   * Récupère les lignes de budget pour un budget donné
   */
  const fetchLines = useCallback(async () => {
    if (!budgetId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('budget_id', budgetId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mapper les données DB vers TypeScript
      const mappedLines = fromBudgetLinesDB(data as BudgetLineDB[]);
      setLines(mappedLines);

      return mappedLines;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur lors du chargement des lignes');
      console.error('Error fetching budget lines:', err);
      toast.error('Erreur lors du chargement des lignes de budget');
      if (onError) onError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [budgetId, onError]);

  /**
   * Ajoute une nouvelle ligne de budget
   */
  const addLine = useCallback(
    async (category: Omit<BudgetCategory, 'id' | 'budget_id'>) => {
      setSaving(true);
      try {
        // Convertir vers format DB
        const dbData = toBudgetLineDB({
          ...category,
          budget_id: budgetId,
        } as BudgetCategory);

        const { data, error } = await supabase
          .from('budget_lines')
          .insert(dbData)
          .select()
          .single();

        if (error) throw error;

        // Mapper la réponse vers TypeScript
        const mappedLine = fromBudgetLinesDB([data as BudgetLineDB])[0];
        setLines((prev) => [...prev, mappedLine]);

        toast.success('Ligne de budget ajoutée');
        if (onSuccess) onSuccess();

        return mappedLine;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erreur lors de l\'ajout');
        console.error('Error adding budget line:', err);
        toast.error('Erreur lors de l\'ajout de la ligne');
        if (onError) onError(err);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [budgetId, onSuccess, onError]
  );

  /**
   * Met à jour une ligne de budget existante
   */
  const updateLine = useCallback(
    async (lineId: string, updates: Partial<BudgetCategory>) => {
      setSaving(true);
      try {
        // Convertir vers format DB si 'type' est présent
        const dbUpdates = updates.type
          ? toBudgetLineDB({ ...updates, type: updates.type } as BudgetCategory)
          : updates;

        const { data, error } = await supabase
          .from('budget_lines')
          .update(dbUpdates)
          .eq('id', lineId)
          .select()
          .single();

        if (error) throw error;

        // Mapper la réponse vers TypeScript
        const mappedLine = fromBudgetLinesDB([data as BudgetLineDB])[0];
        setLines((prev) => prev.map((line) => (line.id === lineId ? mappedLine : line)));

        toast.success('Ligne de budget mise à jour');
        if (onSuccess) onSuccess();

        return mappedLine;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erreur lors de la mise à jour');
        console.error('Error updating budget line:', err);
        toast.error('Erreur lors de la mise à jour');
        if (onError) onError(err);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Supprime une ligne de budget
   */
  const deleteLine = useCallback(
    async (lineId: string) => {
      setSaving(true);
      try {
        const { error } = await supabase.from('budget_lines').delete().eq('id', lineId);

        if (error) throw error;

        setLines((prev) => prev.filter((line) => line.id !== lineId));

        toast.success('Ligne de budget supprimée');
        if (onSuccess) onSuccess();

        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erreur lors de la suppression');
        console.error('Error deleting budget line:', err);
        toast.error('Erreur lors de la suppression');
        if (onError) onError(err);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Calcule les totaux du budget
   */
  const calculateTotals = useCallback(() => {
    const totalRevenue = lines
      .filter((line) => line.type === 'revenue')
      .reduce((sum, line) => sum + line.annual_amount, 0);

    const totalExpenses = lines
      .filter((line) => line.type === 'expense')
      .reduce((sum, line) => sum + line.annual_amount, 0);

    const netResult = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netResult / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      netResult,
      margin,
    };
  }, [lines]);

  return {
    lines,
    loading,
    saving,
    fetchLines,
    addLine,
    updateLine,
    deleteLine,
    calculateTotals,
  };
};
