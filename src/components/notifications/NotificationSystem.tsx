import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

export interface SmartNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  priority: 1 | 2 | 3 | 4 | 5;
  context?: 'accounting' | 'invoicing' | 'crm' | 'global';
  autoHide?: boolean;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: SmartNotification[];
  addNotification: (notification: Omit<SmartNotification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  error: AlertCircle,
};

const NOTIFICATION_STYLES = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-300',
    message: 'text-green-700 dark:text-green-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-300',
    message: 'text-yellow-700 dark:text-yellow-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    message: 'text-blue-700 dark:text-blue-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    message: 'text-red-700 dark:text-red-400',
  },
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);

  const addNotification = useCallback((notificationData: Omit<SmartNotification, 'id' | 'createdAt'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: SmartNotification = {
      ...notificationData,
      id,
      createdAt: new Date(),
      duration: notificationData.duration || (notificationData.autoHide !== false ? 5000 : undefined),
    };

    setNotifications(prev => {
      // Limite à 5 notifications maximum, supprime les plus anciennes
      const newNotifications = [notification, ...prev].slice(0, 5);
      return newNotifications.sort((a, b) => b.priority - a.priority);
    });

    // Auto-hide si défini
    if (notification.autoHide !== false && notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    // For future implementation with read status
    logger.info('Mark as read:', id)
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationStack />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

function NotificationStack() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            index={index}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface NotificationToastProps {
  notification: SmartNotification;
  index: number;
  onClose: () => void;
}

function NotificationToast({ notification, index, onClose }: NotificationToastProps) {
  const IconComponent = NOTIFICATION_ICONS[notification.type];
  const styles = NOTIFICATION_STYLES[notification.type];

  const [progress, setProgress] = useState(100);

  // Progress bar pour l'auto-hide
  useEffect(() => {
    if (!notification.duration || notification.autoHide === false) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (notification.duration! / 100));
        return Math.max(0, newProgress);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [notification.duration, notification.autoHide]);

  return (
    <motion.div
      layout
      initial={{ 
        opacity: 0, 
        x: 300, 
        scale: 0.8,
        rotateY: 45
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1,
        rotateY: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: index * 0.05
        }
      }}
      exit={{ 
        opacity: 0, 
        x: 300, 
        scale: 0.8,
        rotateY: -45,
        transition: { 
          duration: 0.2 
        }
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.1 }
      }}
      className={cn(
        "relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-lg",
        "max-w-sm w-full p-4",
        styles.bg,
        styles.border,
        // Priority-based styling
        notification.priority >= 4 && "ring-2 ring-current ring-opacity-20",
        notification.priority === 5 && "shadow-2xl"
      )}
    >
      {/* Priority indicator */}
      {notification.priority >= 4 && (
        <div className="absolute top-2 right-2">
          <Star className={cn("h-3 w-3", styles.icon)} />
        </div>
      )}

      {/* Progress bar */}
      {notification.duration && notification.autoHide !== false && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "linear" }}
        />
      )}

      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", styles.icon)}>
          <IconComponent className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={cn("text-sm font-semibold", styles.title)}>
              {notification.title}
            </h4>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 -mt-1 -mr-1 hover:bg-current hover:bg-opacity-10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <p className={cn("text-sm mt-1", styles.message)}>
            {notification.message}
          </p>
          
          {/* Context badge */}
          {notification.context && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-current bg-opacity-10 rounded-full capitalize">
              {notification.context}
            </span>
          )}
          
          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {notification.actions.map((action, actionIndex) => (
                <Button
                  key={actionIndex}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => {
                    action.action();
                    onClose();
                  }}
                  className="text-xs h-7"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Hook helper pour des notifications courantes
export function useCommonNotifications() {
  const { addNotification } = useNotifications();

  const success = useCallback((title: string, message: string, actions?: SmartNotification['actions']) => {
    return addNotification({
      type: 'success',
      title,
      message,
      priority: 3,
      actions,
    });
  }, [addNotification]);

  const error = useCallback((title: string, message: string, actions?: SmartNotification['actions']) => {
    return addNotification({
      type: 'error',
      title,
      message,
      priority: 5,
      autoHide: false,
      actions,
    });
  }, [addNotification]);

  const warning = useCallback((title: string, message: string, actions?: SmartNotification['actions']) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      priority: 4,
      duration: 8000,
      actions,
    });
  }, [addNotification]);

  const info = useCallback((title: string, message: string, actions?: SmartNotification['actions']) => {
    return addNotification({
      type: 'info',
      title,
      message,
      priority: 2,
      actions,
    });
  }, [addNotification]);

  const contextual = useCallback((context: SmartNotification['context'], type: SmartNotification['type'], title: string, message: string) => {
    return addNotification({
      type,
      title,
      message,
      context,
      priority: type === 'error' ? 5 : 3,
    });
  }, [addNotification]);

  return {
    success,
    error,
    warning,
    info,
    contextual,
  };
}