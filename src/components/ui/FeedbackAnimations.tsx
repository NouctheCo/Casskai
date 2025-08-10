import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  description?: string;
  isVisible: boolean;
  onClose?: () => void;
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  className?: string;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2
};

const colorMap = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-500',
    text: 'text-green-800 dark:text-green-200'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    text: 'text-red-800 dark:text-red-200'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-500',
    text: 'text-yellow-800 dark:text-yellow-200'
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    text: 'text-blue-800 dark:text-blue-200'
  },
  loading: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'text-gray-500',
    text: 'text-gray-800 dark:text-gray-200'
  }
};

export const FeedbackToast: React.FC<FeedbackProps> = ({
  type,
  message,
  description,
  isVisible,
  onClose,
  duration = 5000,
  position = 'top',
  className
}) => {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    if (isVisible && duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const positionClasses = {
    top: 'top-4 right-4',
    bottom: 'bottom-4 right-4',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "fixed z-50 max-w-sm w-full",
            positionClasses[position],
            className
          )}
          initial={position === 'top' ? { 
            opacity: 0, 
            y: -100, 
            scale: 0.95 
          } : position === 'bottom' ? { 
            opacity: 0, 
            y: 100, 
            scale: 0.95 
          } : { 
            opacity: 0, 
            scale: 0.9 
          }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1 
          }}
          exit={position === 'top' ? { 
            opacity: 0, 
            y: -50, 
            scale: 0.95 
          } : position === 'bottom' ? { 
            opacity: 0, 
            y: 50, 
            scale: 0.95 
          } : { 
            opacity: 0, 
            scale: 0.9 
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          <div className={cn(
            "p-4 rounded-lg border shadow-lg backdrop-blur-sm",
            colors.bg,
            colors.border
          )}>
            <div className="flex items-start space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  rotate: type === 'loading' ? 360 : 0 
                }}
                transition={{ 
                  scale: { delay: 0.1, duration: 0.3 },
                  rotate: type === 'loading' ? {
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                  } : {}
                }}
                className={colors.icon}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              
              <div className="flex-1">
                <motion.h4
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn("font-medium", colors.text)}
                >
                  {message}
                </motion.h4>
                
                {description && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={cn("mt-1 text-sm", colors.text, "opacity-80")}
                  >
                    {description}
                  </motion.p>
                )}
              </div>
              
              {onClose && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={onClose}
                  className={cn(
                    "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <XCircle className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Feedback inline avec animations
export const InlineFeedback: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
  animate?: boolean;
}> = ({ type, message, className, animate = true }) => {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <motion.div
      className={cn(
        "flex items-center space-x-2 p-3 rounded-md",
        colors.bg,
        colors.border,
        "border",
        className
      )}
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={animate ? { scale: 0, rotate: -180 } : undefined}
        animate={animate ? { scale: 1, rotate: 0 } : undefined}
        transition={animate ? { delay: 0.1, duration: 0.4 } : undefined}
      >
        <Icon className={cn("w-4 h-4", colors.icon)} />
      </motion.div>
      <span className={cn("text-sm font-medium", colors.text)}>
        {message}
      </span>
    </motion.div>
  );
};

// Bouton avec états de chargement animés
export const AnimatedButton: React.FC<{
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  successText?: string;
  showSuccess?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({
  children,
  isLoading = false,
  loadingText = "Chargement...",
  successText = "Terminé !",
  showSuccess = false,
  onClick,
  className,
  disabled,
  ...props
}) => {
  const controls = useAnimation();

  useEffect(() => {
    if (showSuccess) {
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.3 }
      });
    }
  }, [showSuccess, controls]);

  return (
    <motion.button
      className={cn(
        "relative px-4 py-2 rounded-md font-medium transition-all duration-200",
        "bg-blue-600 hover:bg-blue-700 text-white",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        className
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
      animate={controls}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      {...props}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center space-x-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-4 h-4" />
            </motion.div>
            <span>{loadingText}</span>
          </motion.div>
        ) : showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center space-x-2"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <CheckCircle className="w-4 h-4" />
            </motion.div>
            <span>{successText}</span>
          </motion.div>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Système de notification global avec gestion de pile
export const NotificationManager: React.FC<{
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    description?: string;
  }>;
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}> = ({ notifications, onRemove, position = 'top-right' }) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={cn("fixed z-50 space-y-2", positionClasses[position])}>
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ 
              opacity: 0, 
              x: position.includes('right') ? 300 : -300,
              scale: 0.8
            }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              x: position.includes('right') ? 300 : -300,
              scale: 0.8,
              transition: { duration: 0.2 }
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.1
            }}
            layout
          >
            <FeedbackToast
              type={notification.type}
              message={notification.message}
              description={notification.description}
              isVisible={true}
              onClose={() => onRemove(notification.id)}
              position="center"
              className="relative"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};