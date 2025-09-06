import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DashboardLayout, DashboardWidget, DashboardContextType } from '@/types/dashboard-widget.types';
import { useAuth } from '@/contexts/AuthContext';

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const DEFAULT_WIDGETS: Omit<DashboardWidget, 'id'>[] = [
  {
    title: 'Revenus du mois',
    type: 'metric',
    priority: 'high',
    size: 'medium',
    category: 'financial',
    position: { x: 0, y: 0, width: 6, height: 4 },
    isVisible: true,
    isCollapsed: false,
  },
  {
    title: 'Factures en attente',
    type: 'table',
    priority: 'high',
    size: 'large',
    category: 'financial',
    position: { x: 6, y: 0, width: 6, height: 6 },
    isVisible: true,
    isCollapsed: false,
  },
  {
    title: 'Graphique de trésorerie',
    type: 'chart',
    priority: 'medium',
    size: 'large',
    category: 'analytics',
    position: { x: 0, y: 4, width: 12, height: 6 },
    isVisible: true,
    isCollapsed: false,
  },
  {
    title: 'Actions rapides',
    type: 'quick-action',
    priority: 'medium',
    size: 'small',
    category: 'operational',
    position: { x: 0, y: 10, width: 4, height: 3 },
    isVisible: true,
    isCollapsed: false,
  },
  {
    title: 'Alertes système',
    type: 'alert',
    priority: 'low',
    size: 'small',
    category: 'alerts',
    position: { x: 4, y: 10, width: 4, height: 3 },
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
    if (!user || currentLayout) return;
    
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

    // Try to load from localStorage first
    const savedLayout = localStorage.getItem(`dashboard-layout-${user.id}`);
    if (savedLayout) {
      try {
        setCurrentLayout(JSON.parse(savedLayout));
      } catch (error) {
        console.error('Error parsing saved layout:', error);
        setCurrentLayout(defaultLayout);
      }
    } else {
      setCurrentLayout(defaultLayout);
    }
  }, [user, currentLayout]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev);
    if (currentLayout) {
      const updatedLayout = { ...currentLayout, focusMode: !focusMode };
      setCurrentLayout(updatedLayout);
    }
  }, [focusMode, currentLayout]);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev);
  }, []);

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

  const saveLayout = useCallback(() => {
    if (!currentLayout || !user) return;

    try {
      localStorage.setItem(`dashboard-layout-${user.id}`, JSON.stringify(currentLayout));
      console.log('Layout saved successfully');
    } catch (error) {
      console.error('Error saving layout:', error);
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
    localStorage.removeItem(`dashboard-layout-${user.id}`);
    setFocusMode(false);
    setEditMode(false);
  }, [user]);

  // Auto-save layout changes
  useEffect(() => {
    if (currentLayout && user) {
      const timeoutId = setTimeout(() => {
        saveLayout();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentLayout, user, saveLayout]);

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