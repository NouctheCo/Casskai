import React from 'react';
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
  Plus,
  DollarSign,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export function EnhancedDashboard() {
  const { 
    currentLayout, 
    focusMode, 
    editMode, 
    toggleFocusMode, 
    toggleEditMode, 
    resetLayout 
  } = useDashboardWidget();
  
  const navigate = useNavigate();

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

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg rounded-xl border border-gray-200/50 dark:border-gray-700/50"
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        style={{
          gridAutoRows: 'minmax(200px, auto)',
        }}
      >
        {visibleWidgets.map((widget) => (
          <DashboardWidgetRenderer key={widget.id} widget={widget}>
            {widget.type === 'metric' && (
              <MetricWidget
                title={widget.title}
                value="€45,750"
                change="+12.4%"
                icon={DollarSign}
              />
            )}
            
            {widget.type === 'quick-action' && (
              <QuickActionWidget actions={quickActions} />
            )}
            
            {widget.type === 'table' && (
              <div className="space-y-3">
                {[
                  { client: 'ACME Corp', montant: '€2,500', statut: 'En attente' },
                  { client: 'Tech Solutions', montant: '€1,750', statut: 'Payée' },
                  { client: 'Global Industries', montant: '€3,200', statut: 'En retard' }
                ].map((facture, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div>
                      <p className="font-medium text-sm">{facture.client}</p>
                      <p className="text-xs text-muted-foreground">{facture.montant}</p>
                    </div>
                    <Badge 
                      variant={facture.statut === 'Payée' ? 'default' : facture.statut === 'En retard' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {facture.statut}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            
            {widget.type === 'chart' && (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Graphique de trésorerie</p>
                  <p className="text-xs opacity-75">Données en cours de chargement...</p>
                </div>
              </div>
            )}
            
            {widget.type === 'alert' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">Stock faible détecté</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">3 factures en retard</span>
                </div>
              </div>
            )}
          </DashboardWidgetRenderer>
        ))}
        
        {/* Add Widget Button */}
        {editMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-1 min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
          >
            <div className="text-center text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Ajouter un widget</p>
              <p className="text-xs">Cliquez pour personnaliser</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}