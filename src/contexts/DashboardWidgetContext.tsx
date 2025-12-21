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

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { DashboardLayout, DashboardWidget, DashboardContextType } from '@/types/dashboard-widget.types';

import { useAuth } from '@/contexts/AuthContext';

import { supabase } from '@/lib/supabase';

import { inferSizeFromWidth } from '@/utils/dashboardLayout';



const DashboardContext = createContext<DashboardContextType | undefined>(undefined);



const DEFAULT_WIDGETS: Omit<DashboardWidget, 'id'>[] = [

  {

    title: 'Revenus du mois',

    type: 'metric',

    priority: 'high',

    size: 'medium',

    category: 'financial',

    position: { x: 0, y: 0, w: 6, h: 4 },

    isVisible: true,

    isCollapsed: false,

  },

  {

    title: 'Factures en attente',

    type: 'table',

    priority: 'high',

    size: 'large',

    category: 'financial',

    position: { x: 6, y: 0, w: 6, h: 6 },

    isVisible: true,

    isCollapsed: false,

  },

  {

    title: 'Graphique de trésorerie',

    type: 'chart',

    priority: 'medium',

    size: 'large',

    category: 'analytics',

    position: { x: 0, y: 4, w: 12, h: 6 },

    isVisible: true,

    isCollapsed: false,

  },

  {

    title: 'Actions rapides',

    type: 'quick-action',

    priority: 'medium',

    size: 'small',

    category: 'operational',

    position: { x: 0, y: 10, w: 4, h: 3 },

    isVisible: true,

    isCollapsed: false,

  },

  {

    title: 'Alertes système',

    type: 'alert',

    priority: 'low',

    size: 'small',

    category: 'alerts',

    position: { x: 4, y: 10, w: 4, h: 3 },

    isVisible: true,

    isCollapsed: false,

  },

];



export function DashboardWidgetProvider({ children }: { children: React.ReactNode }) {

  const { user } = useAuth();

  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null);

  const [focusMode, setFocusMode] = useState(false);

  const [editMode, setEditMode] = useState(false);



  // Initialize default layout

  useEffect(() => {

    if (!user) return;



    const loadLayout = async () => {

      const { data, error: _error } = await supabase

        .from('dashboard_layouts')

        .select('layout')

        .eq('user_id', user.id)

        .single();



      if (data && data.layout) {

        setCurrentLayout(data.layout);

      } else {

        const defaultLayout: DashboardLayout = {

          id: `default-${user.id}`,

          name: 'Layout par défaut',

          userId: user.id,

          widgets: DEFAULT_WIDGETS.map((widget, index) => ({

            ...widget,

            id: `widget-${index}`,

          })),

          focusMode: false,

          createdAt: new Date(),

          updatedAt: new Date(),

        };

        setCurrentLayout(defaultLayout);

      }

    };



    loadLayout();

  }, [user]);



  const toggleFocusMode = useCallback(() => {

    setFocusMode(prev => !prev);

    if (currentLayout) {

      const updatedLayout = { ...currentLayout, focusMode: !focusMode };

      setCurrentLayout(updatedLayout);

    }

  }, [focusMode, currentLayout]);



  const toggleEditMode = useCallback(() => {

    if (editMode) {

      saveLayout();

    }

    setEditMode(prev => !prev);

  }, [editMode]);



  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {

    if (!currentLayout) return;



    const updatedWidgets = currentLayout.widgets.map(widget =>

      widget.id === widgetId ? { ...widget, ...updates } : widget

    );



    const updatedLayout = {

      ...currentLayout,

      widgets: updatedWidgets,

      updatedAt: new Date(),

    };



    setCurrentLayout(updatedLayout);

  }, [currentLayout]);



  const addWidget = useCallback((widget: Omit<DashboardWidget, 'id'>) => {

    if (!currentLayout) return;



    const newWidget: DashboardWidget = {

      ...widget,

      id: `widget-${Date.now()}`,

    };



    const updatedLayout = {

      ...currentLayout,

      widgets: [...currentLayout.widgets, newWidget],

      updatedAt: new Date(),

    };



    setCurrentLayout(updatedLayout);

  }, [currentLayout]);



  const removeWidget = useCallback((widgetId: string) => {

    if (!currentLayout) return;



    const updatedWidgets = currentLayout.widgets.filter(widget => widget.id !== widgetId);

    const updatedLayout = {

      ...currentLayout,

      widgets: updatedWidgets,

      updatedAt: new Date(),

    };



    setCurrentLayout(updatedLayout);

  }, [currentLayout]);



  const saveLayout = useCallback(async () => {

    if (!currentLayout || !user) return;



    try {

      const { error } = await supabase

        .from('dashboard_layouts')

        .upsert({ user_id: user.id, layout: currentLayout });



      if (error) {

        console.error('Error saving layout:', error);

      }

    } catch (error) {

      console.error('Error saving layout:', error instanceof Error ? error.message : String(error));

    }

  }, [currentLayout, user]);



  const resetLayout = useCallback(() => {

    if (!user) return;



    const defaultLayout: DashboardLayout = {

      id: `default-${user.id}`,

      name: 'Layout par défaut',

      userId: user.id,

      widgets: DEFAULT_WIDGETS.map((widget, index) => ({

        ...widget,

        id: `widget-${index}`,

      })),

      focusMode: false,

      createdAt: new Date(),

      updatedAt: new Date(),

    };



    setCurrentLayout(defaultLayout);

    saveLayout(); // Save the reset layout to supabase

    setFocusMode(false);

    setEditMode(false);

  }, [user, saveLayout]);



  const updateLayout = useCallback((layout: any) => {

    if (!currentLayout) return;



    const updatedWidgets = currentLayout.widgets.map(widget => {

      const layoutItem = layout.find((l: any) => l.i === widget.id);

      if (layoutItem) {

        const inferredSize = inferSizeFromWidth(layoutItem.w);

        return {

          ...widget,

          size: inferredSize,

          position: { x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h },

        };

      }

      return widget;

    });



    const updatedLayout = {

      ...currentLayout,

      widgets: updatedWidgets,

      updatedAt: new Date(),

    };



    setCurrentLayout(updatedLayout);

  }, [currentLayout]);



  // Auto-save layout changes

  useEffect(() => {

    if (currentLayout && user && editMode) {

      const timeoutId = setTimeout(() => {

        saveLayout();

      }, 1000);



      return () => clearTimeout(timeoutId);

    }

  }, [currentLayout, user, saveLayout, editMode]);



  const value: DashboardContextType = {

    currentLayout,

    focusMode,

    editMode,

    toggleFocusMode,

    toggleEditMode,

    updateWidget,

    addWidget,

    removeWidget,

    saveLayout,

    resetLayout,

    updateLayout,

  };



  return (

    <DashboardContext.Provider value={value}>

      {children}

    </DashboardContext.Provider>

  );

}



export function useDashboardWidget() {

  const context = useContext(DashboardContext);

  if (context === undefined) {

    throw new Error('useDashboardWidget must be used within a DashboardWidgetProvider');

  }

  return context;

}
