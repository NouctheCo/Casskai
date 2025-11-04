export interface DashboardConfig {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  role?: string;
  layout: WidgetLayout[];
  settings: DashboardSettings;
  createdAt: string;
  updatedAt: string;
  sharedWith?: string[];
}

export interface WidgetLayout {
  i: string; // widget id
  x: number;
  y: number;
  w: number; // width in grid units
  h: number; // height in grid units
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface DashboardSettings {
  gridCols: number;
  gridRows: number;
  margin: [number, number];
  containerPadding: [number, number];
  rowHeight: number;
  theme: 'light' | 'dark' | 'auto';
  autoRefreshInterval: number; // minutes
  showGridLines: boolean;
  compactType: 'vertical' | 'horizontal' | null;
  breakpoints: Record<string, number>;
  cols: Record<string, number>;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  icon?: string;
  category: WidgetCategory;
  size: WidgetSize;
  config: WidgetSpecificConfig;
  dataSource?: DataSource;
  refreshInterval?: number; // seconds
  permissions?: WidgetPermissions;
}

export type WidgetType = 
  | 'kpi-card'
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'area-chart'
  | 'table'
  | 'recent-activities'
  | 'quick-actions'
  | 'calendar'
  | 'weather'
  | 'notifications'
  | 'progress-tracker'
  | 'gauge'
  | 'heatmap'
  | 'timeline'
  | 'kanban'
  | 'metrics-grid'
  | 'text-widget'
  | 'image-widget'
  | 'iframe-widget';

export type WidgetCategory = 
  | 'analytics'
  | 'finance' 
  | 'productivity'
  | 'communication'
  | 'monitoring'
  | 'content'
  | 'external';

export type WidgetSize = 'small' | 'medium' | 'large' | 'xl';

export interface WidgetSpecificConfig {
  // KPI Card
  kpiCard?: {
    value: number | string;
    change?: number;
    changeType?: 'percentage' | 'absolute';
    format?: 'number' | 'currency' | 'percentage';
    color?: string;
    target?: number;
  };

  // Charts
  chart?: {
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'doughnut';
    dataKey: string;
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    animate?: boolean;
  };

  // Table
  table?: {
    columns: TableColumn[];
    pageSize?: number;
    showPagination?: boolean;
    sortable?: boolean;
    filterable?: boolean;
  };

  // Text Widget
  textWidget?: {
    content: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    textColor?: string;
  };

  // Image Widget
  imageWidget?: {
    src: string;
    alt: string;
    fit?: 'cover' | 'contain' | 'fill';
  };

  // Iframe Widget
  iframeWidget?: {
    src: string;
    allowFullscreen?: boolean;
    sandbox?: string;
  };
}

export interface TableColumn {
  key: string;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, record: Record<string, unknown>) => React.ReactNode;
}

export interface DataSource {
  type: 'api' | 'database' | 'static' | 'realtime';
  endpoint?: string;
  query?: string;
  table?: string;
  filters?: Record<string, unknown>;
  params?: Record<string, unknown>;
  transform?: (data: unknown) => unknown;
}

export interface WidgetPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canMove: boolean;
  canResize: boolean;
  roles?: string[];
}

export interface RealtimeEvent {
  id: string;
  type: 'data_update' | 'user_action' | 'system_alert' | 'collaboration';
  timestamp: string;
  userId?: string;
  data: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  widgetId?: string;
  dashboardId?: string;
}

export interface CollaborationState {
  userId: string;
  userName: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: string; // widget id
  action?: 'viewing' | 'editing' | 'moving' | 'resizing';
  timestamp: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'finance' | 'sales' | 'operations' | 'marketing' | 'custom';
  roles: string[];
  preview: string; // image URL
  widgets: WidgetConfig[];
  layout: WidgetLayout[];
  settings: Partial<DashboardSettings>;
  tags: string[];
}

export interface NotificationSettings {
  enabled: boolean;
  types: NotificationType[];
  sound: boolean;
  desktop: boolean;
  email: boolean;
  frequency: 'realtime' | 'batched' | 'daily';
  quietHours?: {
    start: string;
    end: string;
  };
}

export type NotificationType = 
  | 'data_alert'
  | 'system_alert'
  | 'user_mention'
  | 'milestone_reached'
  | 'threshold_exceeded'
  | 'report_ready'
  | 'collaboration_update';

export interface DashboardAnalytics {
  dashboardId: string;
  views: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  mostUsedWidgets: Array<{
    widgetId: string;
    interactions: number;
  }>;
  performanceMetrics: {
    loadTime: number;
    renderTime: number;
    errorRate: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export interface WidgetLibraryItem {
  id: string;
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: WidgetCategory;
  tags: string[];
  defaultSize: WidgetSize;
  configurable: boolean;
  premium?: boolean;
  version: string;
  author?: string;
  downloads?: number;
  rating?: number;
  screenshots?: string[];
}

// Utilitaires et helpers
export interface GridBreakpoints {
  [key: string]: number;
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

export interface GridCols {
  [key: string]: number;
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

export const DEFAULT_BREAKPOINTS: GridBreakpoints = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0
};

export const DEFAULT_COLS: GridCols = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
};

export const WIDGET_SIZE_MAP: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 2, h: 2 },
  medium: { w: 4, h: 3 },
  large: { w: 6, h: 4 },
  xl: { w: 8, h: 5 }
};
