import React, { useState } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DragDropItem {
  id: string;
  content: React.ReactNode;
  className?: string;
  dragHandle?: boolean;
}

interface DragDropGridProps {
  items: DragDropItem[];
  onReorder: (newItems: DragDropItem[]) => void;
  className?: string;
  columns?: number;
  gap?: string;
  animateLayoutChanges?: boolean;
}

export const DragDropGrid: React.FC<DragDropGridProps> = ({
  items,
  onReorder,
  className,
  columns = 3,
  gap = "1rem",
  animateLayoutChanges = true
}) => {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn(
        "grid gap-4",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap
      }}
    >
      {items.map((item) => (
        <DragDropCard
          key={item.id}
          item={item}
          animateLayoutChanges={animateLayoutChanges}
        />
      ))}
    </Reorder.Group>
  );
};

interface DragDropCardProps {
  item: DragDropItem;
  animateLayoutChanges: boolean;
}

const DragDropCard: React.FC<DragDropCardProps> = ({ 
  item, 
  animateLayoutChanges 
}) => {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "relative group cursor-pointer",
        item.className
      )}
      whileDrag={{ 
        scale: 1.05,
        zIndex: 1000,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      layout={animateLayoutChanges as any}
      layoutId={item.id}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      animate={{
        opacity: isDragging ? 0.8 : 1
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      {/* Drag handle */}
      {item.dragHandle && (
        <motion.div
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          onPointerDown={(e) => dragControls.start(e)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </motion.div>
      )}
      
      {/* Content */}
      <motion.div
        className="w-full h-full"
        onPointerDown={!item.dragHandle ? (e) => dragControls.start(e) : undefined}
        whileHover={!isDragging ? { 
          scale: 1.02,
          transition: { duration: 0.2 }
        } : {}}
      >
        {item.content}
      </motion.div>
    </Reorder.Item>
  );
};

// Dashboard draggable avec persistence
export const DraggableDashboard: React.FC<{
  widgets: DragDropItem[];
  onWidgetReorder: (widgets: DragDropItem[]) => void;
  className?: string;
}> = ({ widgets, onWidgetReorder, className }) => {
  const [localWidgets, setLocalWidgets] = useState(widgets);

  const handleReorder = (newWidgets: DragDropItem[]) => {
    setLocalWidgets(newWidgets);
    onWidgetReorder(newWidgets);
    
    // Optionnel: persister dans localStorage
    localStorage.setItem('dashboard-layout', JSON.stringify(newWidgets.map(w => w.id)));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">
          Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Glissez-déposez pour réorganiser
        </p>
      </div>
      
      <DragDropGrid
        items={localWidgets}
        onReorder={handleReorder}
        columns={3}
        gap="1.5rem"
        className="min-h-[400px]"
      />
    </div>
  );
};

// Sortable list simple
export const SortableList: React.FC<{
  items: Array<{ id: string; label: string; description?: string; icon?: React.ReactNode }>;
  onReorder: (items: Array<{ id: string; label: string; description?: string; icon?: React.ReactNode }>) => void;
  className?: string;
}> = ({ items, onReorder, className }) => {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn("space-y-2", className)}
    >
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item}
          className="group"
          whileDrag={{ 
            scale: 1.02,
            zIndex: 1000,
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
          }}
          layout
        >
          <motion.div
            className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="opacity-50 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4" />
            </div>
            
            {item.icon && (
              <div className="text-gray-400 dark:text-gray-500">
                {item.icon}
              </div>
            )}
            
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">
                {item.label}
              </p>
              {item.description && (
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {item.description}
                </p>
              )}
            </div>
          </motion.div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
};

// Zone de drop avec feedback visuel
export const DropZone: React.FC<{
  onDrop: (files: FileList) => void;
  className?: string;
  children?: React.ReactNode;
  acceptedTypes?: string[];
}> = ({ onDrop, className, children, acceptedTypes = [] }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onDrop(files);
    }
  };

  return (
    <motion.div
      className={cn(
        "relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200",
        isDragOver && "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        scale: isDragOver ? 1.02 : 1,
        borderColor: isDragOver ? "#60a5fa" : "#d1d5db"
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-0 bg-blue-400 rounded-lg opacity-0"
        animate={{
          opacity: isDragOver ? 0.1 : 0
        }}
        transition={{ duration: 0.2 }}
      />
      
      <div className="relative z-10">
        {children}
      </div>
      
      {isDragOver && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-400 z-20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📁</div>
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              Déposez vos fichiers ici
            </p>
            {acceptedTypes.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-300 mt-1">
                Types acceptés: {acceptedTypes.join(', ')}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
