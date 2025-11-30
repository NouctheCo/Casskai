import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface QuickActionProps {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  color?: string;
  badge?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  color = "blue", 
  badge 
}) => {
  const motionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
  } as const;

  return (
    <motion.div
      className="group bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
      {...motionProps}
      data-testid="quick-action"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl bg-gradient-to-r from-${color}-500 to-${color}-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
          <span role="img" aria-hidden="true">
            <Icon className="h-6 w-6 text-white" />
          </span>
        </div>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">{description}</p>
    </motion.div>
  );
};

export default QuickAction;
