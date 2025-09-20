import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const WIDGET_ICONS = {
  metric: TrendingUp,
  table: FileText,
  chart: BarChart3,
  'quick-action': Zap,
  alert: AlertTriangle,
};

interface DashboardWidgetRendererProps {
  widget: DashboardWidget;
  children?: React.ReactNode;
}

export function DashboardWidgetRenderer({ widget, children }: DashboardWidgetRendererProps) {
  const { focusMode, editMode, updateWidget, removeWidget } = useDashboardWidget();
  const IconComponent = WIDGET_ICONS[widget.type];

  // Hide low priority widgets in focus mode
  const shouldHide = focusMode && widget.priority === 'low';
  
  // Reduce size of medium priority widgets in focus mode
  const adjustedSize = focusMode && widget.priority === 'medium' ? 'small' : widget.size;

  const handleToggleVisibility = () => {
    updateWidget(widget.id, { isVisible: !widget.isVisible });
  };

  const handleToggleCollapse = () => {
    updateWidget(widget.id, { isCollapsed: !widget.isCollapsed });
  };

  const handleRemove = () => {
    removeWidget(widget.id);
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1 md:col-span-2 lg:col-span-3';
      case 'medium': return 'col-span-2 md:col-span-4 lg:col-span-6';
      case 'large': return 'col-span-2 md:col-span-6 lg:col-span-8 xl:col-span-12';
      default: return 'col-span-1 md:col-span-3 lg:col-span-4';
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

  if (shouldHide || !widget.isVisible) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={widget.id}
        layout
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: { 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            staggerChildren: 0.1 
          }
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.8, 
          y: -20,
          transition: { duration: 0.2 }
        }}
        whileHover={{ 
          scale: editMode ? 1.02 : 1,
          transition: { duration: 0.2 }
        }}
        className={cn(
          getSizeClasses(adjustedSize),
          "relative group"
        )}
      >
        <Card 
          className={cn(
            "h-full transition-all duration-300 card-modern",
            getPriorityClasses(widget.priority),
            widget.isCollapsed && "h-auto",
            editMode && "cursor-move hover:ring-2 hover:ring-blue-400/50",
            focusMode && widget.priority === 'high' && "ring-2 ring-blue-600/40 shadow-lg",
          )}
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
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
              )}
            </CardTitle>
            
            {/* Widget Controls */}
            <div className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              editMode && "opacity-100"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleToggleCollapse}
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
                    className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                    onClick={handleRemove}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  <div className="cursor-move p-1">
                    <Move className="h-3 w-3 text-muted-foreground" />
                  </div>
                </>
              )}
            </div>
          </CardHeader>

          <AnimatePresence>
            {!widget.isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <CardContent className="pt-0">
                  {children || (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <IconComponent className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Widget en construction...</p>
                      </div>
                    </div>
                  )}
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
export function MetricWidget({ title, value, change, icon: Icon }: {
  title: string;
  value: string;
  change?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground truncate">{title}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="flex-grow flex items-center">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl md:text-3xl font-bold">{value}</p>
          {change && (
            <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuickActionWidget({ actions }: { actions: Array<{ label: string; action: () => void; icon?: React.ComponentType<{ className?: string }> }> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-grow"
        >
          <Button 
            variant="outline" 
            size="sm" 
            onClick={action.action}
            className="w-full justify-start gap-2"
          >
            {action.icon && <action.icon className="h-4 w-4" />}
            <span>{action.label}</span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}