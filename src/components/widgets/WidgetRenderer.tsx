/* eslint-disable max-lines-per-function */
import React, { Suspense, lazy, useEffect, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Image as ImageIcon,
  Settings,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { WidgetConfig } from '../../types/dashboard.types';
import { Badge } from '../ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

// Lazy load heavy widgets
const LazyChart = lazy(() => import('../ui/AnimatedChart').then(m => ({ default: m.AnimatedChart })));
const LazyTable = lazy(() => import('../ui/DataTable'));
const LazyCalendar = lazy(() => import('../ui/CalendarWidget'));

interface WidgetRendererProps {
  widget: WidgetConfig;
  isPreview?: boolean;
}

// Types
type KPIConfig = {
  value?: number | string;
  change?: number;
  changeType?: 'percentage' | 'absolute';
  format?: 'number' | 'currency' | 'percentage';
  target?: number;
};

type GaugeConfig = { value?: number; min?: number; max?: number; unit?: string };
type ProgressTrackerConfig = { steps?: Array<{ name?: string } | string>; currentStep?: number };
type QuickActionsConfig = { actions?: Array<{ name?: string } | string> };
type RecentActivity = { user: string; action: string; time: string };
type RecentActivitiesConfig = { activities?: RecentActivity[] };
type NotificationItem = { type: string; title: string; message: string };
type NotificationsConfig = { notifications?: NotificationItem[] };
type WeatherInfo = { location: string; temperature: number; condition: string; humidity: number };
type WeatherConfig = { weather?: WeatherInfo };
type TextWidgetConfig = { textWidget?: { content?: string; fontSize?: number; textAlign?: 'left' | 'center' | 'right' } };
type ImageWidgetConfig = { imageWidget?: { src?: string; alt?: string; fit?: 'cover' | 'contain' | 'fill' } };
type ChartPoint = { name?: string; value?: number };
type ChartJsDataset = { label: string; data: number[]; backgroundColor?: string | string[]; borderColor?: string | string[] };
type ChartJsData = { labels: string[]; datasets: ChartJsDataset[] };

// Skeletons
const WidgetSkeleton: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'kpi-card':
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      );
    case 'table':
      return (
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    case 'chart':
      return <Skeleton className="h-40 w-full" />;
    case 'calendar':
      return <Skeleton className="h-48 w-full" />;
    default:
      return <Skeleton className="h-24 w-full" />;
  }
};

// KPI Card
const KPICard: React.FC<{ config: Partial<KPIConfig> }> = ({ config }) => {
  const value = Number(config.value ?? 0);
  const [animatedValue, setAnimatedValue] = useState(0);
  const change = config.change ?? 0;
  const changeType = config.changeType ?? 'percentage';
  const format = config.format ?? 'number';
  const target = config.target;

  useEffect(() => {
    const t = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return new Intl.NumberFormat('fr-FR').format(val);
    }
  };

  const progressPct = typeof target === 'number' && target > 0 ? Math.min((value / target) * 100, 100) : null;

  return (
    <div className="space-y-3">
      <motion.div className="text-2xl font-bold text-gray-900 dark:text-white" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
        {formatValue(animatedValue)}
      </motion.div>

      {change !== 0 && (
        <motion.div className={cn('flex items-center space-x-1 text-sm', change > 0 ? 'text-green-600' : 'text-red-600')} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change)}{changeType === 'percentage' ? '%' : ''}</span>
        </motion.div>
      )}

      {target && progressPct !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Objectif</span>
            <span>{formatValue(target)}</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      )}
    </div>
  );
};

// Gauge
const GaugeWidget: React.FC<{ config: Partial<GaugeConfig> | unknown }> = ({ config }) => {
  const c = (config as Partial<GaugeConfig>) || {};
  const value = c.value ?? 0;
  const min = c.min ?? 0;
  const max = c.max ?? 100;
  const unit = c.unit ?? '';
  const pct = ((value - min) / Math.max(1, max - min)) * 100;
  const strokeDasharray = 2 * Math.PI * 45;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * pct) / 100;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200 dark:text-gray-700" />
          <motion.circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDasharray} strokeLinecap="round" className="text-blue-500" animate={{ strokeDashoffset }} transition={{ duration: 1, ease: 'easeInOut' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold">{value}</div>
            <div className="text-xs text-gray-500">{unit}</div>
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500 text-center">{min} - {max} {unit}</div>
    </div>
  );
};

// Progress Tracker
const ProgressTracker: React.FC<{ config: Partial<ProgressTrackerConfig> | unknown }> = ({ config }) => {
  const c = (config as ProgressTrackerConfig) || {};
  const steps = c.steps || [];
  const currentStep = c.currentStep || 0;
  const total = Math.max(1, steps.length);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Progression</span>
        <span className="text-gray-500">{Math.min(currentStep + 1, total)} / {total}</span>
      </div>
      <Progress value={((currentStep + 1) / total) * 100} className="h-2" />
      <div className="space-y-2">
        {steps.slice(0, 3).map((step, index) => (
          <motion.div key={index} className={cn('flex items-center space-x-2 text-sm', index <= currentStep ? 'text-green-600' : 'text-gray-400')} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
            <div className={cn('w-2 h-2 rounded-full', index <= currentStep ? 'bg-green-500' : 'bg-gray-300')} />
            <span className="truncate">{typeof step === 'string' ? step : (step?.name ?? '')}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Quick Actions
const QuickActions: React.FC<{ config: Partial<QuickActionsConfig> | unknown }> = ({ config }) => {
  const c = (config as QuickActionsConfig) || {};
  const actions = c.actions || [];
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.slice(0, 4).map((action, index) => (
        <motion.button key={index} className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="truncate">{typeof action === 'string' ? action : (action?.name ?? '')}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

// Recent Activities
const RecentActivities: React.FC<{ config: Partial<RecentActivitiesConfig> | unknown }> = ({ config }) => {
  const c = (config as RecentActivitiesConfig) || {};
  const activities: RecentActivity[] = c.activities || [
    { user: 'Jean Dupont', action: 'a créé une facture', time: '2min' },
    { user: 'Marie Martin', action: 'a modifié un client', time: '5min' },
    { user: 'Pierre Durand', action: 'a exporté un rapport', time: '10min' },
  ];
  return (
    <div className="space-y-3">
      {activities.slice(0, 3).map((activity, index) => (
        <motion.div key={index} className="flex items-start space-x-3 text-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white">
              <span className="font-medium">{activity.user}</span> {activity.action}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">il y a {activity.time}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Notifications
const NotificationCenter: React.FC<{ config: Partial<NotificationsConfig> | unknown }> = ({ config }) => {
  const c = (config as NotificationsConfig) || {};
  const notifications: NotificationItem[] = c.notifications || [
    { type: 'info', title: 'Nouveau client', message: 'Acme Corp ajouté' },
    { type: 'warning', title: 'Facture en retard', message: 'Facture #123 échue' },
    { type: 'success', title: 'Paiement reçu', message: '2,500€ reçus' },
  ];
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };
  return (
    <div className="space-y-2">
      {notifications.slice(0, 3).map((notification, index) => (
        <motion.div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
          {getNotificationIcon(notification.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{notification.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{notification.message}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Weather
const WeatherWidget: React.FC<{ config: Partial<WeatherConfig> | unknown }> = ({ config }) => {
  const c = (config as WeatherConfig) || {};
  const weather: WeatherInfo = c.weather || { location: 'Paris', temperature: 22, condition: 'Ensoleillé', humidity: 65 };
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center space-x-2">
        <Thermometer className="w-5 h-5 text-blue-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">{weather.location}</span>
      </div>
      <motion.div className="text-3xl font-bold text-gray-900 dark:text-white" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
        {weather.temperature}°C
      </motion.div>
      <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
        <p>{weather.condition}</p>
        <p>Humidité: {weather.humidity}%</p>
      </div>
    </div>
  );
};

// Text
const TextWidget: React.FC<{ config: Partial<TextWidgetConfig> | unknown }> = ({ config }) => {
  const c = (config as TextWidgetConfig) || {};
  const { content = 'Contenu du widget texte', fontSize = 14, textAlign = 'left' } = c.textWidget || {};
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none" style={{ fontSize: `${fontSize}px`, textAlign: textAlign as CSSProperties['textAlign'] }} dangerouslySetInnerHTML={{ __html: content }} />
  );
};

// Image
const ImageWidget: React.FC<{ config: Partial<ImageWidgetConfig> | unknown }> = ({ config }) => {
  const c = (config as ImageWidgetConfig) || {};
  const { src, alt = 'Widget image', fit = 'cover' } = c.imageWidget || {};
  if (!src) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }
  return (
    <img src={src} alt={alt} className={cn('w-full h-full rounded', fit === 'cover' && 'object-cover', fit === 'contain' && 'object-contain', fit === 'fill' && 'object-fill')} />
  );
};

// Main
export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget, isPreview: _isPreview = false }) => {
  if (!widget || !widget.type) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div className="space-y-2">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto" />
          <p className="text-sm text-yellow-600">Configuration de widget manquante</p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line complexity
  const renderWidgetContent = () => {
    try {
      switch (widget.type) {
        case 'kpi-card':
          return <KPICard config={widget.config?.kpiCard || {}} />;
        case 'gauge':
          return <GaugeWidget config={widget.config || {}} />;
        case 'progress-tracker':
          return <ProgressTracker config={widget.config || {}} />;
        case 'quick-actions':
          return <QuickActions config={widget.config || {}} />;
        case 'recent-activities':
          return <RecentActivities config={widget.config || {}} />;
        case 'notifications':
          return <NotificationCenter config={widget.config || {}} />;
        case 'weather':
          return <WeatherWidget config={widget.config || {}} />;
        case 'text-widget':
          return <TextWidget config={widget.config || {}} />;
        case 'image-widget':
          return <ImageWidget config={widget.config || {}} />;
        case 'line-chart':
        case 'bar-chart':
        case 'pie-chart':
        case 'area-chart': {
          const raw = (widget as unknown as { config?: { chart?: { data?: ChartJsData | ChartPoint[] } } }).config?.chart?.data;
          let safeData: ChartJsData = { labels: [], datasets: [] };
          if (raw && typeof raw === 'object') {
            if (Array.isArray((raw as ChartJsData).labels) && Array.isArray((raw as ChartJsData).datasets)) {
              safeData = raw as ChartJsData;
            } else if (Array.isArray(raw)) {
              const points = raw as ChartPoint[];
              const labels = points.map((d, i) => d?.name ?? `#${i + 1}`);
              const values = points.map(d => Number(d?.value ?? 0));
              safeData = { labels, datasets: [{ label: widget.title || 'Series', data: values, backgroundColor: '#3B82F6', borderColor: '#3B82F6' }] };
            }
          }
          const chartType: 'bar' | 'line' | 'pie' | 'doughnut' = widget.type === 'bar-chart' ? 'bar' : widget.type === 'line-chart' ? 'line' : widget.type === 'pie-chart' ? 'pie' : 'line';
          return (
            <Suspense fallback={<WidgetSkeleton type="chart" />}>
              <LazyChart type={chartType} data={safeData} options={widget.config?.chart || {}} />
            </Suspense>
          );
        }
        case 'table': {
          type TableRow = { id?: string | number } & Record<string, unknown>;
          type TableCol = { key: string; title: string; width?: number; sortable?: boolean; filterable?: boolean; render?: (value: unknown, record: TableRow) => React.ReactNode };
          type TableCfg = { table?: { columns?: TableCol[]; data?: TableRow[] } };
          const cfg = widget.config as unknown as TableCfg;
          const data: TableRow[] = Array.isArray(cfg.table?.data) ? (cfg.table?.data as TableRow[]) : [];
          const columns: TableCol[] = Array.isArray(cfg.table?.columns) ? (cfg.table?.columns as TableCol[]) : [];
          return (
            <Suspense fallback={<WidgetSkeleton type="table" />}>
              <LazyTable data={data} columns={columns} />
            </Suspense>
          );
        }
        case 'calendar': {
          type CalendarEvent = { id: string; title: string; date: Date; type?: 'meeting' | 'deadline' | 'event' };
          type CalendarCfg = { calendar?: { events?: unknown[] } };
          const cfg = widget.config as unknown as CalendarCfg;
          const raw = Array.isArray(cfg.calendar?.events) ? cfg.calendar?.events : [];
          const isAllowedType = (v: unknown): v is CalendarEvent['type'] => v === 'meeting' || v === 'deadline' || v === 'event';
          const events: CalendarEvent[] = raw.map((e, idx) => {
            if (typeof e === 'object' && e !== null) {
              const r = e as Record<string, unknown>;
              const idRaw = r.id;
              const titleRaw = r.title;
              const dateRaw = r.date;
              const typeRaw = r.type;
              const id = typeof idRaw === 'string' ? idRaw : String(idRaw ?? `evt-${idx}`);
              const title = typeof titleRaw === 'string' ? titleRaw : 'Événement';
              const date = dateRaw instanceof Date ? dateRaw : new Date(typeof dateRaw === 'string' || typeof dateRaw === 'number' ? dateRaw : Date.now());
              const type = isAllowedType(typeRaw) ? typeRaw : undefined;
              return { id, title, date, type };
            }
            return { id: `evt-${idx}`, title: 'Événement', date: new Date() };
          });
          return (
            <Suspense fallback={<WidgetSkeleton type="calendar" />}>
              <LazyCalendar events={events} />
            </Suspense>
          );
        }
        // Fallback
        case 'heatmap':
        case 'timeline':
        case 'kanban':
        case 'metrics-grid':
        case 'iframe-widget':
        default:
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Widget "{widget.type}"</div>
              <Badge variant="outline" className="text-xs">En développement</Badge>
            </div>
          );
      }
    } catch (error) {
      console.error(`Error rendering widget ${widget.id}:`, error);
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="space-y-2">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm text-red-600">Erreur de chargement du widget</p>
          </div>
        </div>
      );
    }
  };

  return (
    <motion.div className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Suspense fallback={<WidgetSkeleton type={widget.type} />}>{renderWidgetContent()}</Suspense>
    </motion.div>
  );
};