import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

const shimmer = {
  initial: { x: "-100%" },
  animate: { 
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut"
    }
  }
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = false,
  animate = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-200 dark:bg-gray-700",
        rounded ? "rounded-lg" : "rounded",
        className
      )}
      style={{ width, height }}
      {...props}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-gray-600/20"
          variants={shimmer}
          initial="initial"
          animate="animate"
        />
      )}
    </div>
  );
};

// Skeleton spécialisés
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-6 space-y-4", className)}>
    <div className="flex items-center space-x-3">
      <Skeleton width={40} height={40} rounded />
      <div className="space-y-2 flex-1">
        <Skeleton height={16} width="60%" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton height={12} width="100%" />
      <Skeleton height={12} width="80%" />
      <Skeleton height={12} width="90%" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  className?: string;
}> = ({ 
  rows = 5, 
  columns = 4,
  className 
}) => (
  <div className={cn("space-y-3", className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} height={14} className="flex-1" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={`cell-${rowIndex}-${colIndex}`} 
            height={12} 
            className="flex-1" 
          />
        ))}
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="container mx-auto p-4 md:p-8 space-y-8">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton height={32} width={300} />
        <Skeleton height={16} width={200} />
      </div>
      <Skeleton width={120} height={40} rounded />
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              delay: i * 0.1,
              duration: 0.4
            }
          }}
        >
          <CardSkeleton />
        </motion.div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          transition: { delay: 0.5, duration: 0.4 }
        }}
      >
        <div className="space-y-4">
          <Skeleton height={20} width={150} />
          <Skeleton height={300} width="100%" />
        </div>
      </motion.div>

      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          transition: { delay: 0.6, duration: 0.4 }
        }}
      >
        <div className="space-y-4">
          <Skeleton height={20} width={180} />
          <Skeleton height={300} width="100%" />
        </div>
      </motion.div>
    </div>

    {/* Table */}
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { delay: 0.7, duration: 0.4 }
      }}
    >
      <div className="space-y-4">
        <Skeleton height={20} width={200} />
        <TableSkeleton rows={8} columns={5} />
      </div>
    </motion.div>
  </div>
);

export const ChartSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("space-y-4", className)}>
    <div className="flex justify-between items-center">
      <Skeleton height={20} width={150} />
      <Skeleton height={12} width={80} />
    </div>
    <div className="relative">
      <Skeleton height={300} width="100%" />
      {/* Fake chart elements */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-8 bg-blue-200 dark:bg-blue-800 rounded-t"
            style={{ height: Math.random() * 200 + 50 }}
            initial={{ scaleY: 0 }}
            animate={{ 
              scaleY: 1,
              transition: {
                delay: i * 0.1,
                duration: 0.6,
                ease: "easeOut"
              }
            }}
            transformOrigin="bottom"
          />
        ))}
      </div>
    </div>
  </div>
);

// Loading states spécialisés pour différentes pages
export const AccountingSkeleton: React.FC = () => (
  <div className="container mx-auto p-4 md:p-8 space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton height={28} width={250} />
      <Skeleton width={140} height={36} rounded />
    </div>
    
    {/* Tabs skeleton */}
    <div className="flex space-x-4 border-b pb-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} height={32} width={100} />
      ))}
    </div>

    <TableSkeleton rows={10} columns={6} />
  </div>
);

export const ImportSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="text-center space-y-4">
      <Skeleton height={24} width={200} className="mx-auto" />
      <Skeleton height={16} width={300} className="mx-auto" />
    </div>
    
    {/* Upload area skeleton */}
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
      <div className="text-center space-y-4">
        <Skeleton width={48} height={48} className="mx-auto" rounded />
        <Skeleton height={16} width={180} className="mx-auto" />
        <Skeleton width={100} height={36} className="mx-auto" rounded />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);