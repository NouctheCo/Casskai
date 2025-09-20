import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDashboardWidget } from '@/contexts/DashboardWidgetContext';
import { DashboardWidgetRenderer, MetricWidget, QuickActionWidget } from './DashboardWidgetRenderer';
import { Button } from '@/components/ui/button';
import { 
  Focus, 
  Settings, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  DollarSign,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import { AddWidgetModal } from './AddWidgetModal';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

async function getWidgetData(widget) {
  switch (widget.type) {
    case 'metric': {
      if (widget.title === 'Revenus du mois') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const { data, error } = await supabase
          .from('invoices')
          .select('amount')
          .gte('created_at', oneMonthAgo.toISOString());

        if (error) {
          console.error('Error fetching revenue data:', error);
          return { value: 'N/A' };
        }

        const totalRevenue = data.reduce((acc, invoice) => acc + invoice.amount, 0);
        return { value: `€${totalRevenue.toLocaleString()}` };
      }
      return { value: 'N/A' };
    }
    case 'table': {
      const { data, error } = await supabase
        .from('invoices')
        .select('client_name, amount, status')
        .eq('status', 'En attente')
        .limit(5);

      if (error) {
        console.error('Error fetching pending invoices:', error);
        return { invoices: [] };
      }
      return { invoices: data };
    }
    case 'chart': {
      const { data, error } = await supabase
        .from('invoices')
        .select('created_at, amount')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chart data:', error);
        return { chartData: [] };
      }

      const monthlyData = data.reduce((acc, invoice) => {
        const month = new Date(invoice.created_at).toLocaleString('default', { month: 'short' });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += invoice.amount;
        return acc;
      }, {});

      const chartData = Object.keys(monthlyData).map(month => ({
        name: month,
        value: monthlyData[month],
      }));

      return { chartData };
    }
    case 'alert': {
      // Pour les produits en rupture de stock, nous utiliserons une requête simplifiée
      const { count: lowStockCount, error: _stockError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('stock_level', 10); // Seuil arbitraire de 10

      const { count: overdueInvoicesCount, error: _invoiceError } = await supabase
        .from('invoices')
        .select('* ', { count: 'exact', head: true })
        .eq('status', 'En retard');

      return {
        lowStock: lowStockCount || 0,
        overdueInvoices: overdueInvoicesCount || 0,
      };
    }
    default:
      return {};
  }
}

export function EnhancedDashboard() {
  const { 
    currentLayout, 
    focusMode, 
    editMode, 
    toggleFocusMode, 
    toggleEditMode, 
    resetLayout, 
    updateLayout
  } = useDashboardWidget();
  
  const navigate = useNavigate();
  const [widgetData, setWidgetData] = useState({});

  useEffect(() => {
    if (!currentLayout) return;

    const fetchAllWidgetData = async () => {
      const dataPromises = currentLayout.widgets.map(widget => getWidgetData(widget));
      const allData = await Promise.all(dataPromises);
      const dataMap = currentLayout.widgets.reduce((acc, widget, index) => {
        acc[widget.id] = allData[index];
        return acc;
      }, {});
      setWidgetData(dataMap);
    };

    fetchAllWidgetData();
  }, [currentLayout]);

  if (!currentLayout) {
    return <div>Chargement...</div>;
  }

  const visibleWidgets = currentLayout.widgets.filter(widget => 
    focusMode ? widget.priority !== 'low' : widget.isVisible
  );

  const quickActions = [
    { label: 'Nouvelle facture', action: () => navigate('/invoicing'), icon: FileText },
    { label: 'Ajouter client', action: () => navigate('/crm'), icon: Users },
    { label: 'Enregistrer paiement', action: () => navigate('/banking'), icon: CreditCard },
    { label: 'Voir rapports', action: () => navigate('/reports'), icon: TrendingUp }
  ];

  const onLayoutChange = (layout, _layouts) => {
    updateLayout(layout);
  };

  const generateLayouts = () => {
    const layouts = { lg: [], md: [], sm: [], xs: [], xxs: [] };
    currentLayout.widgets.forEach(w => {
      const layoutItem = { ...w.position, i: w.id };
      layouts.lg.push(layoutItem);
      layouts.md.push(layoutItem);
      layouts.sm.push(layoutItem);
      layouts.xs.push(layoutItem);
      layouts.xxs.push(layoutItem);
    });
    return layouts;
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg rounded-xl border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {focusMode && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Focus className="h-3 w-3 mr-1" />
                Mode Focus
              </Badge>
            )}
            {editMode && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Settings className="h-3 w-3 mr-1" />
                Édition
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={focusMode ? "default" : "outline"}
            size="sm"
            onClick={toggleFocusMode}
            className="gap-2"
          >
            {focusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {focusMode ? 'Quitter Focus' : 'Mode Focus'}
          </Button>
          
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={toggleEditMode}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {editMode ? 'Terminer' : 'Éditer'}
          </Button>
          
          {editMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetLayout}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>
      </motion.div>

      {/* Widgets Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={generateLayouts()}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        isDraggable={editMode}
        isResizable={editMode}
      >
        {visibleWidgets.map((widget) => (
          <div key={widget.id}>
            <DashboardWidgetRenderer widget={widget}>
              {widget.type === 'metric' && (
                <MetricWidget
                  title={widget.title}
                  value={widgetData[widget.id]?.value || 'Chargement...'}
                  change="+12.4%"
                  icon={DollarSign}
                />
              )}
              
              {widget.type === 'quick-action' && (
                <QuickActionWidget actions={quickActions} />
              )}
              
              {widget.type === 'table' && (
                <div className="space-y-3">
                  {(widgetData[widget.id]?.invoices || []).map((facture, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div>
                        <p className="font-medium text-sm">{facture.client_name}</p>
                        <p className="text-xs text-muted-foreground">€{facture.amount}</p>
                      </div>
                      <Badge 
                        variant={facture.status === 'Payée' ? 'default' : facture.status === 'En retard' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {facture.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              
              {widget.type === 'chart' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={widgetData[widget.id]?.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              
              {widget.type === 'alert' && (
                <div className="space-y-2">
                  {widgetData[widget.id]?.lowStock > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                      <Package className="h-4 w-4" />
                      <span className="text-sm">{widgetData[widget.id]?.lowStock} produit(s) en stock faible</span>
                    </div>
                  )}
                  {widgetData[widget.id]?.overdueInvoices > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">{widgetData[widget.id]?.overdueInvoices} facture(s) en retard</span>
                    </div>
                  )}
                </div>
              )}
            </DashboardWidgetRenderer>
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Add Widget Button */}
      {editMode && (
        <AddWidgetModal />
      )}
    </div>
  );
}