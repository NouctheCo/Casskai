/**
 * useNotifications Hook
 * React hook for managing real-time notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationService, type Notification } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseNotificationsOptions {
  autoSubscribe?: boolean;
  showToast?: boolean;
  limit?: number;
  unreadOnly?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    autoSubscribe = true,
    showToast = true,
    limit = 50,
    unreadOnly = false
  } = options;

  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.getNotifications(user.id, {
        limit,
        unreadOnly,
      });

      if (result.success && result.data) {
        setNotifications(result.data);
      } else {
        setError(result.error || 'Erreur de chargement');
      }
    } catch (err) {
      setError(err instanceof Error ? (error as Error).message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit, unreadOnly]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const result = await notificationService.getUnreadCount(user.id);
      if (result.success && result.data !== undefined) {
        setUnreadCount(result.data);
      }
    } catch (err) {
      console.error('...', error);
    }
  }, [user?.id]);

  // Handle new notification
  const handleNewNotification = useCallback((notification: Notification) => {
    // Add to list
    setNotifications(prev => [notification, ...prev].slice(0, limit));

    // Update unread count
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }

    // Show toast
    if (showToast) {
      const toastOptions = {
        duration: 5000,
        action: notification.action_url ? {
          label: notification.action_label || 'Voir',
          onClick: () => window.location.href = notification.action_url!
        } : undefined,
      };

      switch (notification.type) {
        case 'success':
          toast.success(notification.title, { description: notification.message, ...toastOptions });
          break;
        case 'error':
        case 'alert':
          toast.error(notification.title, { description: notification.message, ...toastOptions });
          break;
        case 'warning':
          toast.warning(notification.title, { description: notification.message, ...toastOptions });
          break;
        default:
          toast.info(notification.title, { description: notification.message, ...toastOptions });
      }
    }
  }, [limit, showToast]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id || !autoSubscribe) {
      return;
    }

    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      handleNewNotification
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id, autoSubscribe, handleNewNotification]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    const result = await notificationService.markAsRead(id);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    const result = await notificationService.markAllAsRead(user.id);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('Toutes les notifications ont été marquées comme lues');
    }
  }, [user?.id]);

  // Archive notification
  const archiveNotification = useCallback(async (id: string) => {
    const result = await notificationService.archiveNotification?.(id);
    if (result?.success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Update unread count if it was unread
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification archivée');
    }
  }, [notifications]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    const result = await notificationService.deleteNotification(id);
    if (result.success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Update unread count if it was unread
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification supprimée');
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
  };
}

// Export helper hook for unread count only
export function useUnreadNotificationsCount(): number {
  const { unreadCount } = useNotifications({ autoSubscribe: true, showToast: false, limit: 1 });
  return unreadCount;
}
