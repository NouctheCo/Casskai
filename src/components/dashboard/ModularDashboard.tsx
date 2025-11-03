import React, { useState, useCallback, useRef } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Settings, 
  Move,
  // Maximize2,
  // Minimize2,
  MoreVertical,
  Trash2,
  Copy,
  RefreshCw
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { WidgetLibrary } from '../widgets/WidgetLibrary';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { cn } from '../../lib/utils';
import { WidgetConfig, WidgetLayout, WidgetLibraryItem, WIDGET_SIZE_MAP, DEFAULT_BREAKPOINTS, DEFAULT_COLS } from '../../types/dashboard.types';

// Import CSS pour react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ModularDashboardProps {
  className?: string;
  onEditModeChange?: (isEditing: boolean) => void;
}

export const ModularDashboard: React.FC<ModularDashboardProps> = ({
  className,
  onEditModeChange
}) => {
  const {
    state: { 
      currentDashboard, 
      widgets, 
      isEditing, 
      isLoading,
      collaborators,
      isConnected 
    },
    updateLayout,
    addWidget,
    updateWidget: _updateWidget,
    removeWidget,
    startEditing,
    stopEditing,
    selectWidget: _selectWidget,
    subscribeToRealtime,
    unsubscribeFromRealtime
  } = useDashboard();

  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const gridRef = useRef<typeof ResponsiveGridLayout | null>(null);

  // Configuration responsive pour react-grid-layout
  const breakpoints = DEFAULT_BREAKPOINTS;
  const cols = DEFAULT_COLS;

  // Convertir les widgets en layout pour react-grid-layout
  const layouts = currentDashboard?.layout.reduce((acc, item) => {
    Object.keys(breakpoints).forEach(breakpoint => {
      if (!acc[breakpoint]) acc[breakpoint] = [];
      acc[breakpoint].push({
        i: item.i ? String(item.i) : `widget-${Date.now()}`, // ✅ Sécurise la conversion en string
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        w: Number(item.w) || 1,
        h: Number(item.h) || 1,
        minW: Number(item.minW) || 1,
        minH: Number(item.minH) || 1,
        maxW: item.maxW ? Number(item.maxW) : undefined,
        maxH: item.maxH ? Number(item.maxH) : undefined,
        static: Boolean(item.static),
        isDraggable: !item.static && isEditing,
        isResizable: !item.static && isEditing
      });
    });
    return acc;
  }, {} as { [key: string]: Layout[] }) || {};

  // Fonction pour compacter le layout et éviter les espaces vides
  const compactLayout = useCallback((layout: WidgetLayout[]): WidgetLayout[] => {
    if (layout.length === 0) return layout;

    // Trier par position Y puis X
    const sorted = [...layout].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    const compacted: WidgetLayout[] = [];
    const occupiedSpaces: boolean[][] = [];

    // Initialiser la grille d'occupation
    const maxRows = Math.max(...sorted.map(l => l.y + l.h)) + 10;
    for (let row = 0; row < maxRows; row++) {
      occupiedSpaces[row] = new Array(12).fill(false);
    }

    for (const item of sorted) {
      let placed = false;
      let bestY = item.y;
      let bestX = item.x;

      // Chercher la meilleure position (plus haute possible)
      for (let row = 0; row < maxRows - item.h + 1 && !placed; row++) {
        for (let col = 0; col <= 12 - item.w && !placed; col++) {
          // Vérifier si l'espace est libre
          let spaceFree = true;
          for (let dy = 0; dy < item.h && spaceFree; dy++) {
            for (let dx = 0; dx < item.w && spaceFree; dx++) {
              if (occupiedSpaces[row + dy][col + dx]) {
                spaceFree = false;
              }
            }
          }

          if (spaceFree) {
            bestY = row;
            bestX = col;
            placed = true;
          }
        }
      }

      // Marquer l'espace comme occupé
      for (let dy = 0; dy < item.h; dy++) {
        for (let dx = 0; dx < item.w; dx++) {
          occupiedSpaces[bestY + dy][bestX + dx] = true;
        }
      }

      compacted.push({
        ...item,
        x: bestX,
        y: bestY
      });
    }

    return compacted;
  }, []);

  // Gestionnaire de changement de layout
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    if (!isEditing || !currentDashboard) return;

    const newLayout: WidgetLayout[] = currentLayout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
      static: item.static,
      isDraggable: item.isDraggable,
      isResizable: item.isResizable
    }));

    // Compacter automatiquement le layout pour éviter les espaces vides
    const compactedLayout = compactLayout(newLayout);
    updateLayout(compactedLayout);
  }, [isEditing, currentDashboard, updateLayout, compactLayout]);

  // Gestionnaire d'ajout de widget depuis la bibliothèque
  const handleAddWidget = useCallback(async (libraryItem: WidgetLibraryItem) => {
    if (!currentDashboard) return;

    const size = WIDGET_SIZE_MAP[libraryItem.defaultSize] || WIDGET_SIZE_MAP.medium;
    
    // Trouver la première position disponible
    const existingLayouts = currentDashboard.layout;
    let foundPosition = false;
    let x = 0, y = 0;
    
    // Recherche systématique d'une position libre
    for (let row = 0; row < 50 && !foundPosition; row++) { // Augmenter la limite de recherche
      for (let col = 0; col <= 12 - size.w && !foundPosition; col++) {
        // Vérifier si cette position est libre
        const isOccupied = existingLayouts.some(layout => {
          const layoutRight = layout.x + layout.w;
          const layoutBottom = layout.y + layout.h;
          const newRight = col + size.w;
          const newBottom = row + size.h;
          
          // Vérifier le chevauchement
          return !(layout.x >= newRight || layoutRight <= col || 
                   layout.y >= newBottom || layoutBottom <= row);
        });
        
        if (!isOccupied) {
          x = col;
          y = row;
          foundPosition = true;
        }
      }
    }
    
    // Si aucune position trouvée, ajouter à la fin
    if (!foundPosition) {
      const maxY = existingLayouts.length > 0 
        ? Math.max(...existingLayouts.map(l => l.y + l.h))
        : 0;
      x = 0;
      y = maxY;
    }

    const newWidget: Omit<WidgetConfig, 'id'> = {
      type: libraryItem.type,
      title: libraryItem.name,
      description: libraryItem.description,
      category: libraryItem.category,
      size: libraryItem.defaultSize,
      config: {},
      refreshInterval: 30
    };

    const widgetId = await addWidget(newWidget);
    
    // Ajouter à la layout
    const newLayout: WidgetLayout = {
      i: widgetId,
      x,
      y,
      w: size.w,
      h: size.h,
      minW: 1,
      minH: 1,
      isDraggable: true,
      isResizable: true
    };

    const updatedLayout = [...currentDashboard.layout, newLayout];
    
    // Compacter le layout après ajout pour éviter les superpositions
    const compactedLayout = compactLayout(updatedLayout);
    updateLayout(compactedLayout);

    setShowWidgetLibrary(false);
  }, [currentDashboard, addWidget, updateLayout, compactLayout]);

  // Gestionnaire de suppression de widget
  const handleRemoveWidget = useCallback((widgetId: string) => {
    removeWidget(widgetId);
  }, [removeWidget]);

  // Gestionnaire d'édition
  const handleStartEditing = useCallback(() => {
    startEditing();
    onEditModeChange?.(true);
    subscribeToRealtime();
  }, [startEditing, onEditModeChange, subscribeToRealtime]);

  const handleStopEditing = useCallback(() => {
    stopEditing();
    setSelectedWidget(null);
    onEditModeChange?.(false);
    unsubscribeFromRealtime();
  }, [stopEditing, onEditModeChange, unsubscribeFromRealtime]);

  // Gestionnaire de drag start/stop pour les effets visuels
  const handleDragStart = useCallback((_layout: Layout[], _oldItem: Layout, newItem: Layout, _placeholder: Layout, _e: MouseEvent) => {
    setDraggedItem(newItem.i);
  }, []);

  const handleDragStop = useCallback((_layout: Layout[], _oldItem: Layout, _newItem: Layout, _placeholder: Layout, _e: MouseEvent) => {
    setDraggedItem(null);
    handleLayoutChange(_layout, {});
  }, [handleLayoutChange]);

  // Rendu des widgets avec wrapper animé
  const renderWidget = (widget: WidgetConfig, layout: WidgetLayout) => {
    // Validation et sécurisation des données
    if (!widget || !widget.id || !widget.type) {
      console.warn('Widget invalide:', widget);
      return null;
    }

    const widgetId = String(widget.id);
    const isSelected = selectedWidget === widgetId;
    const isDragged = draggedItem === widgetId;
    const collaborator = collaborators.find(c => c.selection === widgetId);

    return (
      <motion.div
        key={widgetId}
        className={cn(
          "relative group",
          isDragged && "z-50",
          isSelected && "ring-2 ring-blue-500 ring-opacity-50"
        )}
        whileHover={isEditing ? { scale: 1.02 } : {}}
        animate={isDragged ? { scale: 1.05, rotate: 2 } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setSelectedWidget(isSelected ? null : widgetId)}
      >
        <Card className={cn(
          "h-full border-2 transition-all duration-200",
          isSelected && "border-blue-500 shadow-lg",
          collaborator && collaborator.color && `border-${collaborator.color}-400`,
          !isEditing && "hover:shadow-md"
        )}>
          {/* Barre d'outils widget en mode édition */}
          {isEditing && (
            <motion.div
              className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-white shadow-sm"
                  onClick={() => handleRemoveWidget(widgetId)}
                >
                  <X className="w-3 h-3" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 bg-white shadow-sm"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Configurer
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Actualiser
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleRemoveWidget(widgetId)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )}

          {/* Indicateur de collaboration */}
          {collaborator && collaborator.color && (
            <motion.div
              className={`absolute top-2 left-2 w-3 h-3 rounded-full bg-${collaborator.color}-400 z-10`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              title={`${collaborator.userName || 'Utilisateur'} édite ce widget`}
            />
          )}

          {/* Contenu du widget */}
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {widget.title}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {widget.category}
              </Badge>
            </div>
            {widget.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {widget.description}
              </p>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            <WidgetRenderer widget={widget} />
          </CardContent>

          {/* Poignée de drag en mode édition */}
          {isEditing && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
              <Move className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!currentDashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Aucun dashboard sélectionné
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Barre d'outils principale */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDashboard.name}
          </h2>
          
          {currentDashboard.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentDashboard.description}
            </p>
          )}

          {/* Indicateurs de statut */}
          <div className="flex items-center space-x-2">
            {isConnected && (
              <Badge className="bg-green-100 text-green-800">
                Connecté
              </Badge>
            )}
            
            {collaborators.length > 0 && (
              <Badge variant="outline">
                {collaborators.length} collaborateur(s)
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button
                onClick={() => setShowWidgetLibrary(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter Widget</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleStopEditing}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Terminer</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={handleStartEditing}
              className="flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Éditer</span>
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard grid */}
      <motion.div
        className={cn(
          "relative",
          isEditing && "bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4"
        )}
        animate={{
          backgroundColor: isEditing ? "rgba(249, 250, 251, 0.5)" : "transparent"
        }}
        transition={{ duration: 0.3 }}
      >
        <ResponsiveGridLayout
          ref={gridRef}
          className="layout"
          layouts={layouts}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={60}
          margin={[12, 12]}
          containerPadding={[0, 0]}
          isDraggable={isEditing}
          isResizable={isEditing}
          compactType={currentDashboard.settings.compactType}
          preventCollision={false}
          useCSSTransforms
          onLayoutChange={handleLayoutChange}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          onResizeStop={handleLayoutChange}
        >
          {widgets.filter(widget => widget && widget.id).map(widget => {
            const layout = currentDashboard.layout.find(l => l.i && widget.id && String(l.i) === String(widget.id));
            return layout ? renderWidget(widget, layout) : null;
          })}
        </ResponsiveGridLayout>

        {/* État vide */}
        {widgets.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Dashboard vide
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
              Commencez par ajouter des widgets à votre dashboard pour visualiser vos données.
            </p>
            <Button onClick={() => setShowWidgetLibrary(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter votre premier widget
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Dialog bibliothèque de widgets */}
      <Dialog open={showWidgetLibrary} onOpenChange={setShowWidgetLibrary}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Bibliothèque de Widgets</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[70vh]">
            <WidgetLibrary onAddWidget={handleAddWidget} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Effets de collaboration en temps réel */}
      <AnimatePresence>
        {collaborators.map(collaborator => 
          collaborator.cursor && collaborator.color && (
            <motion.div
              key={collaborator.userId}
              className="fixed pointer-events-none z-50"
              style={{
                left: collaborator.cursor.x,
                top: collaborator.cursor.y
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <div className={`w-4 h-4 bg-${collaborator.color}-500 rounded-full`} />
              <div className={`bg-${collaborator.color}-500 text-white text-xs px-2 py-1 rounded ml-2 whitespace-nowrap`}>
                {collaborator.userName || 'Utilisateur'}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};