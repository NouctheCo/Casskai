import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { DashboardWidget } from '@/types/dashboard-widget.types';

import { useDashboardWidget } from '@/contexts/DashboardWidgetContext';

import {

  Eye,

  EyeOff,

  Maximize2,

  Minimize2,

  X,

  Move,

  TrendingUp,

  FileText,

  BarChart3,

  Zap,

  AlertTriangle,

  RefreshCw,

  AlertCircle,

  DollarSign,

  Users,

  CreditCard,

  Package

} from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';



const WIDGET_ICONS = {

  metric: TrendingUp,

  table: FileText,

  chart: BarChart3,

  'quick-action': Zap,

  alert: AlertTriangle,

};



interface MetricData {

  value: string | number;

  trend?: string;

}



interface Invoice {

  invoice_number: string;

  total_amount?: number;

  status: 'Payée' | 'En retard' | 'En cours' | string;

}



interface TableData {

  invoices?: Invoice[];

}



interface ChartDataPoint {

  name: string;

  value: number;

}



interface ChartData {

  chartData?: ChartDataPoint[];

}



interface Alert {

  type: 'error' | 'warning' | 'info';

  message: string;

}



interface AlertData {

  alerts?: Alert[];

}



type WidgetData = MetricData | TableData | ChartData | AlertData | Record<string, unknown>;



interface DashboardWidgetRendererProps {

  widget: DashboardWidget;

  data?: WidgetData;

  isLoading?: boolean;

  error?: string;

  onRefresh?: () => void;

  quickActions?: Array<{ label: string; action: () => void; icon?: React.ComponentType<{ className?: string }> }>;

}



export function DashboardWidgetRenderer({ widget, data = {}, isLoading = false, error, onRefresh, quickActions }: DashboardWidgetRendererProps) {

  const { focusMode, editMode, updateWidget, removeWidget } = useDashboardWidget();

  const IconComponent = WIDGET_ICONS[widget.type];



  const shouldHide = focusMode && widget.priority === 'low';



  const handleToggleVisibility = (e: React.MouseEvent) => {

    e.preventDefault();

    e.stopPropagation();

    updateWidget(widget.id, { isVisible: !widget.isVisible });

  };



  const handleToggleCollapse = (e: React.MouseEvent) => {

    e.preventDefault();

    e.stopPropagation();

    updateWidget(widget.id, { isCollapsed: !widget.isCollapsed });

  };



  const handleRemove = (e: React.MouseEvent) => {

    e.preventDefault();

    e.stopPropagation();

    removeWidget(widget.id);

  };



  const handleRefresh = (e: React.MouseEvent) => {

    e.preventDefault();

    e.stopPropagation();

    onRefresh?.();

  };



  const renderWidgetContent = () => {

    if (error) {

      return (

        <div className="flex flex-col items-center justify-center h-32 text-center p-4">

          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-3">

            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />

          </div>

          <p className="text-sm font-medium text-foreground mb-1">Service temporairement indisponible</p>

          <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">{error}</p>

          {onRefresh && (

            <Button

              variant="outline"

              size="sm"

              onClick={onRefresh}

              className="gap-2 h-8"

            >

              <RefreshCw className="h-3 w-3" />

              Actualiser

            </Button>

          )}

        </div>

      );

    }



    if (isLoading) {

      return (

        <div className="flex items-center justify-center h-32">

          <div className="text-center">

            <div className="w-10 h-10 mx-auto mb-3 relative">

              <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>

              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>

            </div>

            <p className="text-sm font-medium text-foreground">Actualisation en cours</p>

            <p className="text-xs text-muted-foreground mt-1">Veuillez patienter...</p>

          </div>

        </div>

      );

    }



    switch (widget.type) {

      case 'metric':

        return <MetricWidget widget={widget} data={data as MetricData} />;

      case 'table':

        return <TableWidget widget={widget} data={data as TableData} />;

      case 'chart':

        return <ChartWidget widget={widget} data={data as ChartData} />;

      case 'quick-action':

        return <QuickActionWidget actions={quickActions || []} />;

      case 'alert':

        return <AlertWidget widget={widget} data={data as AlertData} />;

      default:

        return (

          <div className="flex items-center justify-center h-32 text-muted-foreground">

            <div className="text-center">

              <IconComponent className="h-8 w-8 mx-auto mb-2 opacity-50" />

              <p className="text-sm">Type de widget non supporté</p>

            </div>

          </div>

        );

    }

  };





  const getPriorityClasses = (priority: string) => {

    switch (priority) {

      case 'high': return 'ring-2 ring-blue-500/20 border-blue-500/30';

      case 'medium': return 'ring-1 ring-gray-300/50';

      case 'low': return 'opacity-80';

      default: return '';

    }

  };



  // Ne pas afficher le widget dans ces conditions

  if (shouldHide || !widget.isVisible) {

    return null;

  }



  return (

    <AnimatePresence mode="wait">

      <motion.div

        key={widget.id}

        layout="position"

        initial={{ opacity: 0, scale: 0.95 }}

        animate={{

          opacity: 1,

          scale: 1,

          transition: {

            duration: 0.2,

            ease: "easeOut"

          }

        }}

        exit={{

          opacity: 0,

          scale: 0.95,

          transition: { duration: 0.15 }

        }}

        className="relative group w-full h-full"

        style={{ willChange: 'transform, opacity' }}

      >

        <Card

          className={cn(

            "h-full transition-all duration-200 ease-out",

            "border border-border/50 shadow-sm hover:shadow-md",

            "bg-card text-card-foreground",

            getPriorityClasses(widget.priority),

            widget.isCollapsed && "h-auto",

            editMode && "hover:ring-2 hover:ring-primary/20 hover:border-primary/30",

            focusMode && widget.priority === 'high' && "ring-2 ring-primary/30 shadow-md border-primary/40",

          )}

          style={{ willChange: 'box-shadow, border-color' }}

        >

          <CardHeader 

            className={cn(

              "flex flex-row items-center justify-between space-y-0 pb-2",

              widget.isCollapsed && "pb-4"

            )}

          >

            <CardTitle className="text-sm font-medium flex items-center gap-2">

              <IconComponent className="h-4 w-4 text-muted-foreground" />

              <span>{widget.title}</span>

              {widget.priority === 'high' && (

                <motion.div

                  animate={{ scale: [1, 1.2, 1] }}

                  transition={{ repeat: Infinity, duration: 2 }}

                  className="w-2 h-2 bg-blue-500 rounded-full dark:bg-blue-900/20"

                />

              )}

            </CardTitle>

            

            {/* Widget Controls */}

            <div className={cn(

              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",

              editMode && "opacity-100"

            )}>

              {onRefresh && !widget.isCollapsed && (

                <Button

                  variant="ghost"

                  size="icon"

                  className="h-6 w-6"

                  onClick={handleRefresh}

                  title="Actualiser ce widget"

                >

                  <RefreshCw className="h-3 w-3" />

                </Button>

              )}



              <Button

                variant="ghost"

                size="icon"

                className="h-6 w-6"

                onClick={handleToggleCollapse}

                title={widget.isCollapsed ? "Développer" : "Réduire"}

              >

                {widget.isCollapsed ? (

                  <Maximize2 className="h-3 w-3" />

                ) : (

                  <Minimize2 className="h-3 w-3" />

                )}

              </Button>



              {editMode && (

                <>

                  <Button

                    variant="ghost"

                    size="icon"

                    className="h-6 w-6"

                    onClick={handleToggleVisibility}

                    title={widget.isVisible ? "Masquer" : "Afficher"}

                  >

                    {widget.isVisible ? (

                      <Eye className="h-3 w-3" />

                    ) : (

                      <EyeOff className="h-3 w-3" />

                    )}

                  </Button>



                  <Button

                    variant="ghost"

                    size="icon"

                    className="h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:text-red-400"

                    onClick={handleRemove}

                    title="Supprimer ce widget"

                  >

                    <X className="h-3 w-3" />

                  </Button>



                  <div

                    className="cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors dark:bg-gray-900/50"

                    title="Déplacer ce widget"

                    onMouseDown={(e) => e.stopPropagation()}

                  >

                    <Move className="h-3 w-3 text-muted-foreground" />

                  </div>

                </>

              )}

            </div>

          </CardHeader>



          <AnimatePresence initial={false}>

            {!widget.isCollapsed && (

              <motion.div

                initial={{ height: 0, opacity: 0 }}

                animate={{

                  height: "auto",

                  opacity: 1,

                  transition: {

                    height: { duration: 0.2, ease: "easeOut" },

                    opacity: { duration: 0.15, delay: 0.05 }

                  }

                }}

                exit={{

                  height: 0,

                  opacity: 0,

                  transition: {

                    opacity: { duration: 0.1 },

                    height: { duration: 0.2, delay: 0.05, ease: "easeIn" }

                  }

                }}

                style={{ overflow: 'hidden', willChange: 'height, opacity' }}

              >

                <CardContent className="pt-0">

                  {renderWidgetContent()}

                </CardContent>

              </motion.div>

            )}

          </AnimatePresence>

        </Card>

      </motion.div>

    </AnimatePresence>

  );

}



// Widget content components

export function MetricWidget({ widget, data }: { widget: DashboardWidget; data: MetricData }) {

  const value = data.value || 'N/A';

  const trend = data.trend;

  const Icon = widget.title.includes('Revenus') ? DollarSign : TrendingUp;



  return (

    <div className="flex flex-col h-full min-h-[120px]">

      <div className="flex items-center justify-between mb-2">

        <Icon className="h-5 w-5 text-muted-foreground" />

      </div>

      <div className="flex-grow flex flex-col justify-center">

        <div className="flex items-baseline gap-2 mb-1">

          <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>

          {trend && (

            <span className={cn(

              "text-sm px-2 py-1 rounded-full font-medium",

              trend.startsWith('+') ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"

            )}>

              {trend}

            </span>

          )}

        </div>

        <p className="text-sm text-muted-foreground">par rapport au mois dernier</p>

      </div>

    </div>

  );

}



export function QuickActionWidget({ actions }: { actions: Array<{ label: string; action: () => void; icon?: React.ComponentType<{ className?: string }> }> }) {

  const actionIcons = {

    'Nouvelle facture': FileText,

    'Ajouter client': Users,

    'Enregistrer paiement': CreditCard,

    'Voir rapports': TrendingUp

  };



  return (

    <div className="grid grid-cols-1 gap-2">

      {actions.map((action, index) => {

        const Icon = actionIcons[action.label as keyof typeof actionIcons] || FileText;

        return (

          <motion.div

            key={index}

            whileHover={{ scale: 1.02 }}

            whileTap={{ scale: 0.98 }}

          >

            <Button

              variant="outline"

              size="sm"

              onClick={action.action}

              className="w-full justify-start gap-2 h-10"

            >

              <Icon className="h-4 w-4" />

              <span className="text-sm">{action.label}</span>

            </Button>

          </motion.div>

        );

      })}

    </div>

  );

}



export function TableWidget({ widget: _widget, data }: { widget: DashboardWidget; data: TableData }) {

  const invoices = data.invoices || [];



  if (invoices.length === 0) {

    return (

      <div className="flex items-center justify-center h-32 text-center p-4">

        <div>

          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">

            <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />

          </div>

          <p className="text-sm font-medium text-foreground mb-1">Tout est à jour</p>

          <p className="text-xs text-muted-foreground">Aucune facture en attente</p>

        </div>

      </div>

    );

  }



  return (

    <div className="space-y-3 max-h-64 overflow-y-auto">

      {invoices.map((facture, index: number) => (

        <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:bg-gray-900/50">

          <div className="flex-grow min-w-0">

            <p className="font-medium text-sm truncate">{facture.invoice_number || 'N/A'}</p>

            <p className="text-xs text-muted-foreground">{formatCurrency(facture.total_amount || 0)}</p>

          </div>

          <Badge

            variant={

              facture.status === 'Payée' ? 'default' :

              facture.status === 'En retard' ? 'destructive' : 'secondary'

            }

            className="text-xs ml-2 shrink-0"

          >

            {facture.status}

          </Badge>

        </div>

      ))}

    </div>

  );

}



export function ChartWidget({ widget: _widget, data }: { widget: DashboardWidget; data: ChartData }) {

  const chartData = data.chartData || [];



  if (chartData.length === 0) {

    return (

      <div className="flex items-center justify-center h-32 text-center p-4">

        <div>

          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">

            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />

          </div>

          <p className="text-sm font-medium text-foreground mb-1">Graphique en construction</p>

          <p className="text-xs text-muted-foreground">Données en cours de collecte</p>

        </div>

      </div>

    );

  }



  return (

    <div className="h-48">

      <ResponsiveContainer width="100%" height="100%">

        <LineChart data={chartData}>

          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

          <XAxis

            dataKey="name"

            fontSize={12}

            tick={{ fill: 'hsl(var(--muted-foreground))' }}

          />

          <YAxis

            fontSize={12}

            tick={{ fill: 'hsl(var(--muted-foreground))' }}

          />

          <Tooltip

            contentStyle={{

              backgroundColor: 'hsl(var(--card))',

              border: '1px solid hsl(var(--border))',

              borderRadius: '6px'

            }}

            formatter={(value: string | number) => [formatCurrency(Number(value)), 'Revenus']}

          />

          <Line

            type="monotone"

            dataKey="value"

            stroke="hsl(var(--primary))"

            strokeWidth={2}

            activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}

            dot={{ fill: 'hsl(var(--primary))', r: 4 }}

          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}



export function AlertWidget({ widget: _widget, data }: { widget: DashboardWidget; data: AlertData }) {

  const alerts = data.alerts || [];



  if (alerts.length === 0) {

    return (

      <div className="flex items-center justify-center h-32 text-center p-4">

        <div>

          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">

            <AlertTriangle className="h-6 w-6 text-green-600 dark:text-green-400" />

          </div>

          <p className="text-sm font-medium text-foreground mb-1">Système optimal</p>

          <p className="text-xs text-muted-foreground">Aucune alerte à signaler</p>

        </div>

      </div>

    );

  }



  return (

    <div className="space-y-2">

      {alerts.map((alert, index: number) => (

        <div

          key={index}

          className={cn(

            "flex items-center gap-2 p-3 rounded-lg",

            alert.type === 'error' ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300" :

            alert.type === 'warning' ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300" :

            "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"

          )}

        >

          {alert.type === 'error' ? <CreditCard className="h-4 w-4 shrink-0" /> :

           alert.type === 'warning' ? <Package className="h-4 w-4 shrink-0" /> :

           <AlertTriangle className="h-4 w-4 shrink-0" />}

          <span className="text-sm font-medium">{alert.message}</span>

        </div>

      ))}

    </div>

  );

}
