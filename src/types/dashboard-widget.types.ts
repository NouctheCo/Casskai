export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'alert' | 'quick-action';
  priority: 'high' | 'medium' | 'low';
  size: 'small' | 'medium' | 'large';
  category: 'financial' | 'operational' | 'alerts' | 'analytics';
  position: { x: number; y: number; w: number; h: number };
  isVisible: boolean;
  isCollapsed: boolean;
  permissions?: string[];
  refreshInterval?: number;
  data?: any;
}

export interface DashboardLayout {
  id: string;
  name: string;
  userId: string;
  widgets: DashboardWidget[];
  focusMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  canResize: boolean;
  canMove: boolean;
  canHide: boolean;
  canCollapse: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface DashboardContextType {
  currentLayout: DashboardLayout | null;
  focusMode: boolean;
  editMode: boolean;
  toggleFocusMode: () => void;
  toggleEditMode: () => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  addWidget: (widget: Omit<DashboardWidget, 'id'>) => void;
  removeWidget: (widgetId: string) => void;
  saveLayout: () => void;
  resetLayout: () => void;
  updateLayout: (layout: any) => void;
}
