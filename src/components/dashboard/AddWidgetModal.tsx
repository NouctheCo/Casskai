import React from 'react';
import { availableWidgets } from './availableWidgets';
import { useDashboardWidget } from '@/contexts/DashboardWidgetContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardWidget } from '@/types/dashboard-widget.types';

export function AddWidgetModal() {
  const { addWidget } = useDashboardWidget();

  const handleAddWidget = (widget: Omit<DashboardWidget, 'id' | 'position'>) => {
    const newWidget = {
      ...widget,
      position: { x: 0, y: 0, w: 6, h: 4 }, // Default position
    };
    addWidget(newWidget);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
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
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un widget</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableWidgets.map((widget, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{widget.title}</h3>
              <p className="text-sm text-muted-foreground">{widget.category}</p>
              <Button onClick={() => handleAddWidget(widget)} className="mt-4">
                Ajouter
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
