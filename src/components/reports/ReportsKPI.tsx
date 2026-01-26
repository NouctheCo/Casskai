import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ReportsKPIProps {
  title: string;
  value: number;
  change?: number;
  icon: any;
  color?: string;
  trend?: string;
  format?: 'number' | 'currency' | 'percentage';
}

const ReportsKPI: React.FC<ReportsKPIProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = "blue",
  trend,
  format = "number"
}) => {
  const formatValue = (val: number) => {
    if (format === 'currency') return formatCurrency(val);
    if (format === 'number') return val.toLocaleString();
    if (format === 'percentage') return `${val}%`;
    return val;
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/50`}>
          <span role="img" aria-hidden="true">
            <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <motion.div 
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {formatValue(value)}
        </motion.div>
        
        {change !== undefined && (
          <motion.div
            className={`flex items-center space-x-1 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{Math.abs(change)}% vs période précédente</span>
          </motion.div>
        )}
        
        {trend && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{trend}</div>
        )}
      </div>
    </motion.div>
  );
};

export default ReportsKPI;
