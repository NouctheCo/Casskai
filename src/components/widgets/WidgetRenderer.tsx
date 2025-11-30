import React, { Suspense, lazy, useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import { createSafeHTML } from '@/utils/sanitize';

import { 

  TrendingUp, 

  TrendingDown,

  Activity as _Activity,

  AlertTriangle,

  Loader2 as _Loader2,

  Calendar as _Calendar,

  Table as _Table,

  BarChart3 as _BarChart3,

  PieChart as _PieChart,

  FileText as _FileText,

  Image as ImageIcon,

  ExternalLink as _ExternalLink,

  Users,

  Bell,

  Zap,

  Target as _Target,

  Gauge as _Gauge,

  MapPin as _MapPin,

  Clock as _Clock,

  CheckSquare as _CheckSquare,

  Settings,

  Thermometer

} from 'lucide-react';

import { WidgetConfig } from '../../types/dashboard.types';

import { Badge } from '../ui/badge';

import { Progress } from '../ui/progress';

import { Skeleton } from '../ui/skeleton';

import { cn } from '../../lib/utils';



// Lazy loading des composants de widgets complexes

const LazyChart = lazy(() =>

  import('../ui/AnimatedChart').then(m => ({ default: m.AnimatedChart }))

);

const LazyTable = lazy(() =>

  import('../ui/DataTable')

);

const LazyCalendar = lazy(() =>

  import('../ui/CalendarWidget')

);



interface WidgetRendererProps {

  widget: WidgetConfig;

  isPreview?: boolean;

}



// Types pour les configs de widgets

interface KPICardConfig {

  value?: string | number;

  change?: number;

  changeType?: 'percentage' | 'absolute';

  format?: 'number' | 'currency' | 'percentage';

  target?: number;

  color?: string;

}



interface GaugeWidgetConfig {

  value?: string | number;

  min?: number;

  max?: number;

  unit?: string;

  color?: string;

  label?: string;

}



interface StepItem {

  label?: string;

  name?: string;

  status?: 'completed' | 'current' | 'upcoming';

}



interface ProgressTrackerConfig {

  steps?: (StepItem | string)[];

  currentStep?: number;

}



interface ActionItem {

  label?: string;

  name?: string;

  icon?: string;

  onClick?: () => void;

}



interface QuickActionsConfig {

  actions?: (ActionItem | string)[];

}



interface ActivityItem {

  text?: string;

  user?: string;

  action?: string;

  time?: string;

  timestamp?: string;

  type?: string;

}



interface RecentActivitiesConfig {

  activities?: ActivityItem[];

}



interface NotificationItem {

  message?: string;

  title?: string;

  timestamp?: string;

  type?: 'info' | 'warning' | 'error' | 'success';

}



interface NotificationCenterConfig {

  notifications?: NotificationItem[];

  unreadCount?: number;

}



interface WeatherData {

  temperature?: number;

  location?: string;

  condition?: string;

  humidity?: number;

}



interface WeatherConfig {

  temperature?: number;

  location?: string;

  condition?: string;

  humidity?: number;

  weather?: WeatherData;

}



interface TextWidgetConfig {

  text?: string;

  fontSize?: string;

  fontWeight?: string;

  textAlign?: 'left' | 'center' | 'right';

  textWidget?: {

    content?: string;

    fontSize?: string | number;

    textAlign?: string;

  };

}



interface ImageWidgetConfig {

  imageUrl?: string;

  alt?: string;

  objectFit?: 'contain' | 'cover' | 'fill';

  link?: string;

  imageWidget?: {

    src?: string;

    alt?: string;

    fit?: 'contain' | 'cover' | 'fill';

  };

}



// Composant de fallback pour le loading

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

          {Array.from({ length: 3 }).map((_, i) => (

            <div key={i} className="flex space-x-2">

              <Skeleton className="h-4 flex-1" />

              <Skeleton className="h-4 w-16" />

              <Skeleton className="h-4 w-12" />

            </div>

          ))}

        </div>

      );

    default:

      return <Skeleton className="h-24 w-full" />;

  }

};



// Composant KPI Card

const KPICard: React.FC<{ config: KPICardConfig }> = ({ config }) => {

  const [animatedValue, setAnimatedValue] = useState(0);

  const value = typeof config.value === 'number' ? config.value : parseFloat(String(config.value)) || 0;

  const change = config.change || 0;

  const changeType = config.changeType || 'percentage';

  const format = config.format || 'number';

  const target = config.target;



  useEffect(() => {

    const timer = setTimeout(() => {

      setAnimatedValue(value);

    }, 100);

    return () => clearTimeout(timer);

  }, [value]);



  const formatValue = (val: number) => {

    switch (format) {

      case 'currency':

        return new Intl.NumberFormat('fr-FR', {

          style: 'currency',

          currency: 'EUR'

        }).format(val);

      case 'percentage':

        return `${val}%`;

      default:

        return new Intl.NumberFormat('fr-FR').format(val);

    }

  };



  const progressPercentage = target ? Math.min((value / target) * 100, 100) : null;



  return (

    <div className="space-y-3">

      <motion.div

        className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white"

        initial={{ scale: 0.5, opacity: 0 }}

        animate={{ scale: 1, opacity: 1 }}

        transition={{ type: 'spring', stiffness: 200, damping: 15 }}

      >

        {formatValue(animatedValue)}

      </motion.div>



      {change !== 0 && (

        <motion.div

          className={cn(

            "flex items-center space-x-1 text-sm",

            change > 0 ? 'text-green-600' : 'text-red-600'

          )}

          initial={{ x: -20, opacity: 0 }}

          animate={{ x: 0, opacity: 1 }}

          transition={{ delay: 0.2 }}

        >

          {change > 0 ? (

            <TrendingUp className="w-4 h-4" />

          ) : (

            <TrendingDown className="w-4 h-4" />

          )}

          <span>

            {Math.abs(change)}{changeType === 'percentage' ? '%' : ''}

          </span>

        </motion.div>

      )}



      {target && progressPercentage !== null && (

        <div className="space-y-1">

          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">

            <span>Objectif</span>

            <span>{formatValue(target)}</span>

          </div>

          <Progress 

            value={progressPercentage} 

            className="h-2"

          />

        </div>

      )}

    </div>

  );

};



// Composant Gauge

const GaugeWidget: React.FC<{ config: GaugeWidgetConfig }> = ({ config }) => {

  const value = typeof config.value === 'number' ? config.value : parseFloat(String(config.value)) || 0;

  const min = config.min || 0;

  const max = config.max || 100;

  const unit = config.unit || '';

  

  const percentage = ((value - min) / (max - min)) * 100;

  const strokeDasharray = 2 * Math.PI * 45; // rayon = 45

  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;



  return (

    <div className="flex flex-col items-center space-y-2">

      <div className="relative w-24 h-24">

        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">

          {/* Cercle de fond */}

          <circle

            cx="50"

            cy="50"

            r="45"

            stroke="currentColor"

            strokeWidth="6"

            fill="none"

            className="text-gray-200 dark:text-gray-700"

          />

          {/* Cercle de progression */}

          <motion.circle

            cx="50"

            cy="50"

            r="45"

            stroke="currentColor"

            strokeWidth="6"

            fill="none"

            strokeDasharray={strokeDasharray}

            strokeDashoffset={strokeDasharray}

            strokeLinecap="round"

            className="text-blue-500"

            animate={{ strokeDashoffset }}

            transition={{ duration: 1, ease: 'easeInOut' }}

          />

        </svg>

        <div className="absolute inset-0 flex items-center justify-center">

          <div className="text-center">

            <div className="text-lg font-bold">{value}</div>

            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{unit}</div>

          </div>

        </div>

      </div>

      

      <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center">

        {min} - {max} {unit}

      </div>

    </div>

  );

};



// Composant Progress Tracker

const ProgressTracker: React.FC<{ config: ProgressTrackerConfig }> = ({ config }) => {

  const steps = config.steps || [];

  const currentStep = config.currentStep || 0;



  return (

    <div className="space-y-3">

      <div className="flex items-center justify-between text-sm">

        <span className="font-medium">Progression</span>

        <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">

          {currentStep + 1} / {steps.length}

        </span>

      </div>

      

      <Progress 

        value={(currentStep + 1) / steps.length * 100} 

        className="h-2"

      />

      

      <div className="space-y-2">

        {steps.slice(0, 3).map((step, index: number) => (

          <motion.div

            key={index}

            className={cn(

              "flex items-center space-x-2 text-sm",

              index <= currentStep ? 'text-green-600' : 'text-gray-400'

            )}

            initial={{ opacity: 0, x: -10 }}

            animate={{ opacity: 1, x: 0 }}

            transition={{ delay: index * 0.1 }}

          >

            <div className={cn(

              "w-2 h-2 rounded-full",

              index <= currentStep ? 'bg-green-500' : 'bg-gray-300'

            )} />

            <span className="truncate">{typeof step === 'string' ? step : (step.name || step.label || '')}</span>

          </motion.div>

        ))}

      </div>

    </div>

  );

};



// Composant Quick Actions

const QuickActions: React.FC<{ config: QuickActionsConfig }> = ({ config }) => {

  const actions = config.actions || [];



  return (

    <div className="grid grid-cols-2 gap-2">

      {actions.slice(0, 4).map((action, index: number) => (

        <motion.button

          key={index}

          className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"

          whileHover={{ scale: 1.02 }}

          whileTap={{ scale: 0.98 }}

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: index * 0.1 }}

        >

          <div className="flex items-center space-x-2">

            <Zap className="w-4 h-4 text-blue-500" />

            <span className="truncate">{typeof action === 'string' ? action : (action.name || action.label || '')}</span>

          </div>

        </motion.button>

      ))}

    </div>

  );

};



// Composant Recent Activities

const RecentActivities: React.FC<{ config: RecentActivitiesConfig }> = ({ config }) => {

  const activities = config.activities || [

    { user: 'Jean Dupont', action: 'a créé une facture', time: '2min' },

    { user: 'Marie Martin', action: 'a modifié un client', time: '5min' },

    { user: 'Pierre Durand', action: 'a exporté un rapport', time: '10min' }

  ];



  return (

    <div className="space-y-3">

      {activities.slice(0, 3).map((activity, index: number) => (

        <motion.div

          key={index}

          className="flex items-start space-x-3 text-sm"

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: index * 0.1 }}

        >

          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">

            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />

          </div>

          <div className="flex-1 min-w-0">

            <p className="text-gray-900 dark:text-gray-100 dark:text-white">

              <span className="font-medium">{activity.user}</span> {activity.action}

            </p>

            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 text-xs">

              il y a {activity.time}

            </p>

          </div>

        </motion.div>

      ))}

    </div>

  );

};



// Composant Notifications

const NotificationCenter: React.FC<{ config: NotificationCenterConfig }> = ({ config }) => {

  const notifications = config.notifications || [

    { type: 'info', title: 'Nouveau client', message: 'Acme Corp ajouté' },

    { type: 'warning', title: 'Facture en retard', message: 'Facture #123 échue' },

    { type: 'success', title: 'Paiement reçu', message: '2,500€ reçus' }

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

      {notifications.slice(0, 3).map((notification, index: number) => (

        <motion.div

          key={index}

          className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"

          initial={{ opacity: 0, x: -10 }}

          animate={{ opacity: 1, x: 0 }}

          transition={{ delay: index * 0.1 }}

        >

          {getNotificationIcon(notification.type)}

          <div className="flex-1 min-w-0">

            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white truncate">

              {notification.title}

            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 truncate">

              {notification.message}

            </p>

          </div>

        </motion.div>

      ))}

    </div>

  );

};



// Composant Weather

const WeatherWidget: React.FC<{ config: WeatherConfig }> = ({ config }) => {

  const weather = config.weather || {

    location: 'Paris',

    temperature: 22,

    condition: 'Ensoleillé',

    humidity: 65

  };



  return (

    <div className="text-center space-y-2">

      <div className="flex items-center justify-center space-x-2">

        <Thermometer className="w-5 h-5 text-blue-500" />

        <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">

          {weather.location}

        </span>

      </div>

      

      <motion.div

        className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white"

        initial={{ scale: 0.5 }}

        animate={{ scale: 1 }}

        transition={{ type: 'spring', stiffness: 200 }}

      >

        {weather.temperature}°C

      </motion.div>

      

      <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">

        <p>{weather.condition}</p>

        <p>Humidité: {weather.humidity}%</p>

      </div>

    </div>

  );

};



// Composant Text Widget

const TextWidget: React.FC<{ config: TextWidgetConfig }> = ({ config }) => {

  const content = config.text || config.textWidget?.content || 'Contenu du widget texte';

  const fontSize = config.fontSize || config.textWidget?.fontSize || '14';

  const textAlign = config.textAlign || (config.textWidget?.textAlign as 'left' | 'center' | 'right') || 'left';



  return (

    <div

      className="prose prose-sm dark:prose-invert max-w-none"

      style={{

        fontSize: `${fontSize}px`,

        textAlign: textAlign

      }}

      dangerouslySetInnerHTML={createSafeHTML(content)}

    />

  );

};



// Composant Image Widget

const ImageWidget: React.FC<{ config: ImageWidgetConfig }> = ({ config }) => {

  const src = config.imageUrl || config.imageWidget?.src;

  const alt = config.alt || config.imageWidget?.alt || 'Widget image';

  const fit = config.objectFit || config.imageWidget?.fit || 'cover';



  if (!src) {

    return (

      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded">

        <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />

      </div>

    );

  }



  return (

    <img

      src={src}

      alt={alt}

      className={cn(

        "w-full h-full rounded",

        fit === 'cover' && 'object-cover',

        fit === 'contain' && 'object-contain',

        fit === 'fill' && 'object-fill'

      )}

    />

  );

};



// Composant principal WidgetRenderer

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ 

  widget, 

  isPreview: _isPreview = false 

}) => {

  // Validation des données du widget

  if (!widget || !widget.type) {

    return (

      <div className="flex items-center justify-center h-full text-center">

        <div className="space-y-2">

          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto" />

          <p className="text-sm text-yellow-600">

            Configuration de widget manquante

          </p>

        </div>

      </div>

    );

  }



  const renderWidgetContent = () => {

    try {

      switch (widget.type) {

        case 'kpi-card':

          return <KPICard config={widget.config?.kpiCard || {}} />;

        

        case 'gauge':

          return <GaugeWidget config={widget.config as any || {}} />;

        

        case 'progress-tracker':

          return <ProgressTracker config={widget.config as any || {}} />;

        

        case 'quick-actions':

          return <QuickActions config={widget.config as any || {}} />;

        

        case 'recent-activities':

          return <RecentActivities config={widget.config as any || {}} />;

        

        case 'notifications':

          return <NotificationCenter config={widget.config as any || {}} />;

        

        case 'weather':

          return <WeatherWidget config={widget.config as any || {}} />;

        

        case 'text-widget':

          return <TextWidget config={widget.config || {}} />;

        

        case 'image-widget':

          return <ImageWidget config={widget.config || {}} />;

        

        case 'line-chart':

        case 'bar-chart':

        case 'pie-chart':

        case 'area-chart': {

          const chartConfig = widget.config?.chart as { data?: unknown[]; [key: string]: unknown } | undefined;

          const chartData = chartConfig?.data && Array.isArray(chartConfig.data)

            ? chartConfig.data

            : [];

          return (

            <Suspense fallback={<WidgetSkeleton type="chart" />}>

              <LazyChart

                type={(() => {
                  const chartType = widget.type.replace('-chart', '');
                  return chartType === 'area' ? 'line' : chartType as 'line' | 'bar' | 'pie' | 'doughnut';
                })()}

                data={chartData}

                options={widget.config?.chart || {}}

              />

            </Suspense>

          );

        }



        case 'table': {

          const tableConfig = widget.config?.table as { data?: unknown[]; columns?: unknown[]; [key: string]: unknown } | undefined;

          const tableData = tableConfig?.data && Array.isArray(tableConfig.data)

            ? tableConfig.data

            : [];

          const tableColumns = tableConfig?.columns && Array.isArray(tableConfig.columns)

            ? tableConfig.columns as Array<{ key: string; title: string }>

            : [];

          return (

            <Suspense fallback={<WidgetSkeleton type="table" />}>

              <LazyTable

                data={tableData}

                columns={tableColumns}

              />

            </Suspense>

          );

        }



        case 'calendar': {

          const calendarConfig = widget.config as { calendar?: { events?: unknown[] }; [key: string]: unknown } | undefined;

          const calendarEvents = calendarConfig?.calendar?.events && Array.isArray(calendarConfig.calendar.events)

            ? calendarConfig.calendar.events as Array<{ id: string; title: string; start: string; end: string }>

            : [];

          return (

            <Suspense fallback={<WidgetSkeleton type="calendar" />}>

              <LazyCalendar events={calendarEvents as any} />

            </Suspense>

          );

        }

        

        // Widgets non implémentés - placeholder

        case 'heatmap':

        case 'timeline':

        case 'kanban':

        case 'metrics-grid':

        case 'iframe-widget':

        default:

          return (

            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">

              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">

                <Settings className="w-6 h-6 text-gray-400 dark:text-gray-500" />

              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">

                Widget "{widget.type}"

              </div>

              <Badge variant="outline" className="text-xs">

                En développement

              </Badge>

            </div>

          );

      }

    } catch (error) {

      console.error(`Error rendering widget ${widget.id}:`, error);

      return (

        <div className="flex items-center justify-center h-full text-center">

          <div className="space-y-2">

            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />

            <p className="text-sm text-red-600">

              Erreur de chargement du widget

            </p>

          </div>

        </div>

      );

    }

  };



  return (

    <motion.div

      className="h-full"

      initial={{ opacity: 0 }}

      animate={{ opacity: 1 }}

      transition={{ duration: 0.3 }}

    >

      <Suspense fallback={<WidgetSkeleton type={widget.type} />}>

        {renderWidgetContent()}

      </Suspense>

    </motion.div>

  );

};
