import React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  striped?: boolean;
  indeterminate?: boolean;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  className,
  color = 'blue',
  showPercentage = false,
  size = 'md',
  animated = true,
  striped = false,
  indeterminate = false,
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30
  });

  const animatedWidth = useTransform(
    springValue,
    [0, 100],
    ['0%', '100%']
  );

  React.useEffect(() => {
    if (animated && !indeterminate) {
      springValue.set(percentage);
    }
  }, [percentage, springValue, animated, indeterminate]);

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const stripedPattern = striped ? 'bg-stripes' : '';

  return (
    <div className={cn("relative", className)} {...props}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={cn(
        "w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        {indeterminate ? (
          <motion.div
            className={cn(
              "h-full rounded-full",
              colorClasses[color],
              stripedPattern
            )}
            style={{ width: '40%' }}
            animate={{
              x: ['-100%', '250%'],
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        ) : (
          <motion.div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              colorClasses[color],
              stripedPattern,
              animated && 'shadow-sm'
            )}
            style={animated ? { width: animatedWidth } : { width: `${percentage}%` }}
            initial={animated ? { width: 0 } : undefined}
            animate={animated ? undefined : { width: `${percentage}%` }}
            transition={animated ? undefined : { duration: 1, ease: "easeOut" }}
          />
        )}
      </div>
    </div>
  );
};

// Progress circulaire animée
export const CircularProgress: React.FC<{
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  showValue?: boolean;
  animated?: boolean;
}> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  color = '#3b82f6',
  showValue = true,
  animated = true
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30
  });

  const strokeDashoffset = useTransform(
    springValue,
    [0, 100],
    [circumference, 0]
  );

  React.useEffect(() => {
    if (animated) {
      springValue.set(percentage);
    }
  }, [percentage, springValue, animated]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700 dark:text-gray-300"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={animated ? {
            strokeDashoffset
          } : {
            strokeDashoffset: circumference - (percentage / 100) * circumference
          }}
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={animated ? undefined : {
            strokeDashoffset: circumference - (percentage / 100) * circumference
          }}
          transition={animated ? undefined : { duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Progress avec étapes
export const SteppedProgress: React.FC<{
  steps: Array<{ label: string; completed: boolean }>;
  currentStep: number;
  className?: string;
}> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <motion.div
              className="flex flex-col items-center space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: index * 0.1 }
              }}
            >
              <motion.div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  index <= currentStep
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                )}
                animate={{
                  scale: index === currentStep ? 1.1 : 1,
                  boxShadow: index === currentStep 
                    ? "0 0 0 4px rgba(59, 130, 246, 0.2)"
                    : "0 0 0 0px rgba(59, 130, 246, 0.2)"
                }}
                transition={{ duration: 0.3 }}
              >
                {step.completed ? '✓' : index + 1}
              </motion.div>
              
              <span className={cn(
                "text-xs text-center max-w-16",
                index <= currentStep
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-gray-500 dark:text-gray-400"
              )}>
                {step.label}
              </span>
            </motion.div>
            
            {index < steps.length - 1 && (
              <motion.div
                className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700 relative overflow-hidden"
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: 1,
                  transition: { delay: index * 0.1 + 0.2 }
                }}
                style={{ originX: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-blue-500"
                  initial={{ scaleX: 0 }}
                  animate={{ 
                    scaleX: index < currentStep ? 1 : 0,
                    transition: { 
                      delay: index * 0.1 + 0.4,
                      duration: 0.5
                    }
                  }}
                  style={{ originX: 0 }}
                />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Progress avec animation de pulsation
export const PulsingProgress: React.FC<{
  isActive: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ isActive, className, children }) => {
  return (
    <motion.div
      className={cn("relative", className)}
      animate={isActive ? {
        scale: [1, 1.02, 1],
        opacity: [0.8, 1, 0.8]
      } : {}}
      transition={{
        duration: 2,
        ease: "easeInOut",
        repeat: isActive ? Infinity : 0
      }}
    >
      {children}
      
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-blue-500 rounded-lg opacity-20 blur-sm"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity
          }}
        />
      )}
    </motion.div>
  );
};
