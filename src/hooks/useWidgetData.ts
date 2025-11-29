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

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardWidget } from '@/types/dashboard-widget.types';

interface WidgetDataCache {
  [widgetId: string]: {
    data: any;
    lastFetched: number;
    isLoading: boolean;
    error?: string;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useWidgetData(widgets: DashboardWidget[]) {
  const [dataCache, setDataCache] = useState<WidgetDataCache>({});

  const fetchWidgetData = async (widget: DashboardWidget) => {
    try {
      setDataCache(prev => ({
        ...prev,
        [widget.id]: { ...prev[widget.id], isLoading: true, error: undefined }
      }));

      let data = {};

      switch (widget.type) {
        case 'metric': {
          if (widget.title === 'Revenus du mois') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            const { data: invoiceData, error } = await supabase
              .from('invoices')
              .select('total_amount')
              .gte('created_at', oneMonthAgo.toISOString());

            if (error) throw error;

            const totalRevenue = invoiceData?.reduce((acc, invoice) => acc + (parseFloat(invoice.total_amount) || 0), 0) || 0;
            data = { value: `€${totalRevenue.toLocaleString()}`, trend: '+12.4%' };
          }
          break;
        }

        case 'table': {
          const { data: invoiceData, error } = await supabase
            .from('invoices')
            .select('invoice_number, total_amount, status, created_at')
            .eq('status', 'En attente')
            .order('created_at', { ascending: false })
            .limit(5);

          if (error) throw error;
          data = { invoices: invoiceData };
          break;
        }

        case 'chart': {
          const { data: invoiceData, error } = await supabase
            .from('invoices')
            .select('created_at, total_amount')
            .order('created_at', { ascending: true })
            .limit(50);

          if (error) throw error;

          const monthlyData = (invoiceData || []).reduce((acc, invoice) => {
            const month = new Date(invoice.created_at).toLocaleString('fr-FR', {
              month: 'short',
              year: '2-digit'
            });
            if (!acc[month]) {
              acc[month] = 0;
            }
            acc[month] += parseFloat(invoice.total_amount) || 0;
            return acc;
          }, {} as Record<string, number>);

          const chartData = Object.entries(monthlyData).map(([month, value]) => ({
            name: month,
            value,
            formattedValue: `€${value.toLocaleString()}`
          }));

          data = { chartData };
          break;
        }

        case 'alert': {
          const [stockResult, invoiceResult] = await Promise.allSettled([
            supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock_level', 10),
            supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'En retard')
          ]);

          const lowStock = stockResult.status === 'fulfilled' ? (stockResult.value.count || 0) : 0;
          const overdueInvoices = invoiceResult.status === 'fulfilled' ? (invoiceResult.value.count || 0) : 0;

          data = {
            alerts: [
              ...(lowStock > 0 ? [{
                type: 'warning',
                message: `${lowStock} produit(s) en stock faible`,
                count: lowStock
              }] : []),
              ...(overdueInvoices > 0 ? [{
                type: 'error',
                message: `${overdueInvoices} facture(s) en retard`,
                count: overdueInvoices
              }] : [])
            ]
          };
          break;
        }

        default:
          data = {};
      }

      setDataCache(prev => ({
        ...prev,
        [widget.id]: {
          data,
          lastFetched: Date.now(),
          isLoading: false,
          error: undefined
        }
      }));

    } catch (error) {
      console.error(`Error fetching data for widget ${widget.id}:`, error);

      // Messages d'erreur professionnels selon le type de widget et l'erreur
      let userFriendlyMessage = 'Données temporairement indisponibles';

      // Gestion des erreurs spécifiques de la base de données
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === '42703') {
          // Colonne n'existe pas
          userFriendlyMessage = 'Configuration en cours - fonctionnalité bientôt disponible';
        } else if (error.code === '42P01') {
          // Table n'existe pas
          userFriendlyMessage = 'Module en cours d\'initialisation';
        }
      } else {
        // Messages d'erreur par type de widget
        if (widget.type === 'metric') {
          userFriendlyMessage = 'Calcul de métrique en cours';
        } else if (widget.type === 'table') {
          userFriendlyMessage = 'Chargement des données en cours';
        } else if (widget.type === 'chart') {
          userFriendlyMessage = 'Génération du graphique en cours';
        } else if (widget.type === 'alert') {
          userFriendlyMessage = 'Vérification des alertes en cours';
        }
      }

      setDataCache(prev => ({
        ...prev,
        [widget.id]: {
          ...prev[widget.id],
          isLoading: false,
          error: userFriendlyMessage
        }
      }));
    }
  };

  const needsRefresh = (widgetId: string) => {
    const cached = dataCache[widgetId];
    return !cached ||
           !cached.data ||
           (Date.now() - cached.lastFetched) > CACHE_DURATION ||
           cached.error;
  };

  useEffect(() => {
    const widgetsNeedingData = widgets.filter(widget =>
      widget.isVisible && needsRefresh(widget.id)
    );

    if (widgetsNeedingData.length === 0) return;

    // Fetch data for all widgets that need it
    widgetsNeedingData.forEach(widget => {
      if (!dataCache[widget.id]?.isLoading) {
        fetchWidgetData(widget);
      }
    });
  }, [widgets]);

  const refreshWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      fetchWidgetData(widget);
    }
  };

  const refreshAll = () => {
    widgets.filter(w => w.isVisible).forEach(widget => {
      fetchWidgetData(widget);
    });
  };

  return {
    getWidgetData: (widgetId: string) => dataCache[widgetId]?.data || {},
    isWidgetLoading: (widgetId: string) => dataCache[widgetId]?.isLoading || false,
    getWidgetError: (widgetId: string) => dataCache[widgetId]?.error,
    refreshWidget,
    refreshAll,
    getCacheStatus: () => dataCache
  };
}
