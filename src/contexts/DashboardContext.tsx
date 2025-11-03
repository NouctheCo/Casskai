import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import {
  DashboardConfig,
  WidgetConfig,
  WidgetLayout,
  RealtimeEvent,
  CollaborationState,
  DashboardSettings as _DashboardSettings,
  NotificationSettings,
  DashboardTemplate
} from '../types/dashboard.types';

interface DashboardState {
  // Configuration
  currentDashboard: DashboardConfig | null;
  dashboards: DashboardConfig[];
  widgets: WidgetConfig[];
  templates: DashboardTemplate[];
  
  // Realtime
  realtimeEvents: RealtimeEvent[];
  collaborators: CollaborationState[];
  isConnected: boolean;
  
  // UI State
  isEditing: boolean;
  selectedWidget: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Settings
  notificationSettings: NotificationSettings;
}

type DashboardAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_DASHBOARD'; payload: DashboardConfig | null }
  | { type: 'SET_DASHBOARDS'; payload: DashboardConfig[] }
  | { type: 'UPDATE_DASHBOARD'; payload: Partial<DashboardConfig> }
  | { type: 'SET_WIDGETS'; payload: WidgetConfig[] }
  | { type: 'ADD_WIDGET'; payload: WidgetConfig }
  | { type: 'UPDATE_WIDGET'; payload: { id: string; updates: Partial<WidgetConfig> } }
  | { type: 'REMOVE_WIDGET'; payload: string }
  | { type: 'UPDATE_LAYOUT'; payload: WidgetLayout[] }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_SELECTED_WIDGET'; payload: string | null }
  | { type: 'SET_TEMPLATES'; payload: DashboardTemplate[] }
  | { type: 'ADD_REALTIME_EVENT'; payload: RealtimeEvent }
  | { type: 'SET_COLLABORATORS'; payload: CollaborationState[] }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'UPDATE_NOTIFICATION_SETTINGS'; payload: Partial<NotificationSettings> };

const initialState: DashboardState = {
  currentDashboard: null,
  dashboards: [],
  widgets: [],
  templates: [],
  realtimeEvents: [],
  collaborators: [],
  isConnected: false,
  isEditing: false,
  selectedWidget: null,
  isLoading: false,
  error: null,
  notificationSettings: {
    enabled: true,
    types: ['data_alert', 'system_alert'],
    sound: true,
    desktop: true,
    email: false,
    frequency: 'realtime'
  }
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CURRENT_DASHBOARD':
      return { ...state, currentDashboard: action.payload };
    
    case 'SET_DASHBOARDS':
      return { ...state, dashboards: action.payload };
    
    case 'UPDATE_DASHBOARD': {
      if (!state.currentDashboard) return state;
      const updatedDashboard = { ...state.currentDashboard, ...action.payload };
      return {
        ...state,
        currentDashboard: updatedDashboard,
        dashboards: state.dashboards.map(d => 
          d.id === updatedDashboard.id ? updatedDashboard : d
        )
      };
    }
    
    case 'SET_WIDGETS':
      return { ...state, widgets: action.payload };
    
    case 'ADD_WIDGET':
      return { ...state, widgets: [...state.widgets, action.payload] };
    
    case 'UPDATE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.map(w => 
          w.id === action.payload.id 
            ? { ...w, ...action.payload.updates }
            : w
        )
      };
    
    case 'REMOVE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.filter(w => w.id !== action.payload),
        currentDashboard: state.currentDashboard ? {
          ...state.currentDashboard,
          layout: state.currentDashboard.layout.filter(l => l.i !== action.payload)
        } : null
      };
    
    case 'UPDATE_LAYOUT':
      if (!state.currentDashboard) return state;
      return {
        ...state,
        currentDashboard: {
          ...state.currentDashboard,
          layout: action.payload
        }
      };
    
    case 'SET_EDITING':
      return { ...state, isEditing: action.payload };
    
    case 'SET_SELECTED_WIDGET':
      return { ...state, selectedWidget: action.payload };
    
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    
    case 'ADD_REALTIME_EVENT':
      return {
        ...state,
        realtimeEvents: [action.payload, ...state.realtimeEvents.slice(0, 99)] // Keep last 100 events
      };
    
    case 'SET_COLLABORATORS':
      return { ...state, collaborators: action.payload };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    
    case 'UPDATE_NOTIFICATION_SETTINGS':
      return {
        ...state,
        notificationSettings: { ...state.notificationSettings, ...action.payload }
      };
    
    default:
      return state;
  }
}

interface DashboardContextType {
  // State
  state: DashboardState;
  
  // Dashboard Management
  loadDashboards: () => Promise<void>;
  createDashboard: (config: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDashboard: (updates: Partial<DashboardConfig>) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  setCurrentDashboard: (id: string) => Promise<void>;
  duplicateDashboard: (id: string) => Promise<string>;
  
  // Widget Management
  addWidget: (widget: Omit<WidgetConfig, 'id'>) => Promise<string>;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => Promise<void>;
  removeWidget: (id: string) => Promise<void>;
  updateLayout: (layout: WidgetLayout[]) => Promise<void>;
  
  // Templates
  loadTemplates: () => Promise<void>;
  applyTemplate: (templateId: string) => Promise<void>;
  saveAsTemplate: (template: Omit<DashboardTemplate, 'id'>) => Promise<string>;
  
  // Editing
  startEditing: () => void;
  stopEditing: () => void;
  selectWidget: (widgetId: string | null) => void;
  
  // Realtime
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
  sendCollaborationUpdate: (state: Partial<CollaborationState>) => void;
  
  // Notifications
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Persistence
  saveDashboardToStorage: () => void;
  loadDashboardFromStorage: () => void;
  exportDashboard: () => string;
  importDashboard: (data: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const realtimeChannel = React.useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardFromStorage();
    loadDashboards();
    loadTemplates();
    initializeDefaultDashboard();
  }, []);

  // Initialize default dashboard with example data
  const initializeDefaultDashboard = async () => {
    try {
      // Create default dashboard if none exists
      const defaultDashboard: DashboardConfig = {
        id: 'default-dashboard',
        userId: 'current-user',
        name: 'Dashboard Principal',
        description: 'Vue d\'ensemble des métriques importantes',
        isDefault: true,
        layout: [], // Layout vide par défaut pour éviter les conflits
        settings: {
          gridCols: 12,
          gridRows: 20,
          margin: [12, 12],
          containerPadding: [0, 0],
          rowHeight: 60,
          theme: 'light',
          autoRefreshInterval: 5,
          showGridLines: false,
          compactType: 'vertical',
          breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
          cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Ne pas créer de widgets par défaut pour éviter les conflits d'IDs
      const exampleWidgets: WidgetConfig[] = [];

      // Set default dashboard
      dispatch({ type: 'SET_CURRENT_DASHBOARD', payload: defaultDashboard });
      dispatch({ type: 'SET_WIDGETS', payload: exampleWidgets });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error initializing default dashboard:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de l\'initialisation du dashboard' });
    }
  };

  // Auto-save to localStorage
  useEffect(() => {
    if (state.currentDashboard) {
      saveDashboardToStorage();
    }
  }, [state.currentDashboard]);

  const loadDashboards = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      dispatch({ type: 'SET_DASHBOARDS', payload: data || [] });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error loading dashboards:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load dashboards' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createDashboard = async (config: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const newDashboard: DashboardConfig = {
        ...config,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('dashboard_configs')
        .insert(newDashboard);

      if (error) throw error;

      dispatch({ type: 'SET_DASHBOARDS', payload: [...state.dashboards, newDashboard] });
      
      return newDashboard.id;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error creating dashboard:', error);
      throw new Error('Failed to create dashboard');
    }
  };

  const updateDashboard = async (updates: Partial<DashboardConfig>) => {
    if (!state.currentDashboard) return;

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('dashboard_configs')
        .update(updatedData)
        .eq('id', state.currentDashboard.id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_DASHBOARD', payload: updatedData });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error updating dashboard:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update dashboard' });
    }
  };

  const deleteDashboard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ 
        type: 'SET_DASHBOARDS', 
        payload: state.dashboards.filter(d => d.id !== id) 
      });

      if (state.currentDashboard?.id === id) {
        dispatch({ type: 'SET_CURRENT_DASHBOARD', payload: null });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error deleting dashboard:', error);
      throw new Error('Failed to delete dashboard');
    }
  };

  const setCurrentDashboard = async (id: string) => {
    try {
      const dashboard = state.dashboards.find(d => d.id === id);
      if (!dashboard) {
        const { data, error } = await supabase
          .from('dashboard_configs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        dispatch({ type: 'SET_CURRENT_DASHBOARD', payload: data });
      } else {
        dispatch({ type: 'SET_CURRENT_DASHBOARD', payload: dashboard });
      }

      // Load widgets for this dashboard
      const { data: widgets, error: widgetsError } = await supabase
        .from('widget_configs')
        .select('*')
        .eq('dashboardId', id);

      if (widgetsError) throw widgetsError;
      dispatch({ type: 'SET_WIDGETS', payload: widgets || [] });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error setting current dashboard:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load dashboard' });
    }
  };

  const duplicateDashboard = async (id: string): Promise<string> => {
    const originalDashboard = state.dashboards.find(d => d.id === id);
    if (!originalDashboard) throw new Error('Dashboard not found');

    const duplicatedConfig = {
      ...originalDashboard,
      name: `${originalDashboard.name} (Copy)`,
      isDefault: false
    };

    delete (duplicatedConfig as Record<string, unknown>).id;
    delete (duplicatedConfig as Record<string, unknown>).createdAt;
    delete (duplicatedConfig as Record<string, unknown>).updatedAt;

    return await createDashboard(duplicatedConfig);
  };

  const addWidget = async (widget: Omit<WidgetConfig, 'id'>): Promise<string> => {
    if (!state.currentDashboard) throw new Error('No dashboard selected');

    try {
      const newWidget: WidgetConfig = {
        ...widget,
        id: crypto.randomUUID()
      };

      const { error } = await supabase
        .from('widget_configs')
        .insert({
          ...newWidget,
          dashboardId: state.currentDashboard.id
        });

      if (error) throw error;

      dispatch({ type: 'ADD_WIDGET', payload: newWidget });
      
      return newWidget.id;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error adding widget:', error);
      throw new Error('Failed to add widget');
    }
  };

  const updateWidget = async (id: string, updates: Partial<WidgetConfig>) => {
    try {
      const { error } = await supabase
        .from('widget_configs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_WIDGET', payload: { id, updates } });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error updating widget:', error);
      throw new Error('Failed to update widget');
    }
  };

  const removeWidget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('widget_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'REMOVE_WIDGET', payload: id });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error removing widget:', error);
      throw new Error('Failed to remove widget');
    }
  };

  const updateLayout = async (layout: WidgetLayout[]) => {
    if (!state.currentDashboard) return;

    dispatch({ type: 'UPDATE_LAYOUT', payload: layout });
    
    // Debounce the database update
    clearTimeout((updateLayout as typeof updateLayout & { timeoutId?: NodeJS.Timeout }).timeoutId);
    (updateLayout as typeof updateLayout & { timeoutId?: NodeJS.Timeout }).timeoutId = setTimeout(async () => {
      try {
        await updateDashboard({ layout });
      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Error updating layout:', error);
      }
    }, 1000);
  };

  const loadTemplates = async () => {
    try {
      // For now, load from a static file or API
      // In production, this would come from your database
      const templates: DashboardTemplate[] = [
        {
          id: 'executive-template',
          name: 'Executive Dashboard',
          description: 'High-level KPIs and strategic metrics',
          category: 'executive',
          roles: ['admin', 'executive'],
          preview: '/templates/executive-preview.png',
          widgets: [],
          layout: [],
          settings: {},
          tags: ['executive', 'kpi', 'strategic']
        },
        {
          id: 'finance-template',
          name: 'Finance Dashboard',
          description: 'Financial metrics and accounting overview',
          category: 'finance',
          roles: ['finance', 'accounting'],
          preview: '/templates/finance-preview.png',
          widgets: [],
          layout: [],
          settings: {},
          tags: ['finance', 'accounting', 'revenue']
        }
      ];

      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error loading templates:', error);
    }
  };

  const applyTemplate = async (templateId: string) => {
    const template = state.templates.find(t => t.id === templateId);
    if (!template || !state.currentDashboard) return;

    try {
      // Clear current widgets
      for (const widget of state.widgets) {
        await removeWidget(widget.id);
      }

      // Add template widgets
      for (const widget of template.widgets) {
        await addWidget(widget);
      }

      // Update layout and settings
      await updateDashboard({
        layout: template.layout,
        settings: { ...state.currentDashboard.settings, ...template.settings }
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error applying template:', error);
      throw new Error('Failed to apply template');
    }
  };

  const saveAsTemplate = async (template: Omit<DashboardTemplate, 'id'>): Promise<string> => {
    try {
      const newTemplate: DashboardTemplate = {
        ...template,
        id: crypto.randomUUID()
      };

      // In production, save to database
      dispatch({ type: 'SET_TEMPLATES', payload: [...state.templates, newTemplate] });
      
      return newTemplate.id;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error saving template:', error);
      throw new Error('Failed to save template');
    }
  };

  const startEditing = () => {
    dispatch({ type: 'SET_EDITING', payload: true });
  };

  const stopEditing = () => {
    dispatch({ type: 'SET_EDITING', payload: false });
    dispatch({ type: 'SET_SELECTED_WIDGET', payload: null });
  };

  const selectWidget = (widgetId: string | null) => {
    dispatch({ type: 'SET_SELECTED_WIDGET', payload: widgetId });
  };

  const subscribeToRealtime = () => {
    if (!state.currentDashboard) return;

    realtimeChannel.current = supabase
      .channel(`dashboard-${state.currentDashboard.id}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = realtimeChannel.current.presenceState();
        const collaborators = Object.entries(presenceState).map(([userId, presence]: [string, unknown[]]) => ({
          userId,
          userName: (presence[0] as Record<string, unknown>)?.userName as string || 'Anonymous',
          avatar: (presence[0] as Record<string, unknown>)?.avatar as string | undefined
        }));
        dispatch({ type: 'SET_COLLABORATORS', payload: collaborators });
      })
      .on('broadcast', { event: 'dashboard-update' }, (payload: { event: unknown }) => {
        if (payload.event && typeof payload.event === 'object') {
          dispatch({ type: 'ADD_REALTIME_EVENT', payload: payload.event as RealtimeEvent });
        }
      })
      .subscribe((status: string) => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: status === 'SUBSCRIBED' });
      });
  };

  const unsubscribeFromRealtime = () => {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
    }
  };

  const sendCollaborationUpdate = (collaborationState: Partial<CollaborationState>) => {
    if (!realtimeChannel.current) return;

    realtimeChannel.current.track(collaborationState);
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_NOTIFICATION_SETTINGS', payload: settings });
    localStorage.setItem('dashboard-notifications', JSON.stringify({
      ...state.notificationSettings,
      ...settings
    }));
  };

  const saveDashboardToStorage = () => {
    if (!state.currentDashboard) return;

    const storageData = {
      dashboard: state.currentDashboard,
      widgets: state.widgets,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(`dashboard-${state.currentDashboard.id}`, JSON.stringify(storageData));
  };

  const loadDashboardFromStorage = () => {
    try {
      const notificationSettings = localStorage.getItem('dashboard-notifications');
      if (notificationSettings) {
        dispatch({ 
          type: 'UPDATE_NOTIFICATION_SETTINGS', 
          payload: JSON.parse(notificationSettings) 
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error loading from storage:', error);
    }
  };

  const exportDashboard = (): string => {
    if (!state.currentDashboard) throw new Error('No dashboard to export');

    return JSON.stringify({
      dashboard: state.currentDashboard,
      widgets: state.widgets,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  };

  const importDashboard = async (data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      if (!parsed.dashboard || !parsed.widgets) {
        throw new Error('Invalid dashboard data');
      }

      const dashboardId = await createDashboard({
        ...parsed.dashboard,
        name: `${parsed.dashboard.name} (Imported)`,
        isDefault: false
      });

      for (const widget of parsed.widgets) {
        await addWidget(widget);
      }

      await setCurrentDashboard(dashboardId);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error importing dashboard:', error);
      throw new Error('Failed to import dashboard');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromRealtime();
    };
  }, []);

  const contextValue: DashboardContextType = {
    state,
    loadDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    setCurrentDashboard,
    duplicateDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    updateLayout,
    loadTemplates,
    applyTemplate,
    saveAsTemplate,
    startEditing,
    stopEditing,
    selectWidget,
    subscribeToRealtime,
    unsubscribeFromRealtime,
    sendCollaborationUpdate,
    updateNotificationSettings,
    saveDashboardToStorage,
    loadDashboardFromStorage,
    exportDashboard,
    importDashboard
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}