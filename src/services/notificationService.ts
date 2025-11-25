import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  company_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  category?: 'system' | 'invoice' | 'payment' | 'expense' | 'approval' | 'reminder' | 'security' | 'billing' | 'feature' | 'general';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean; // Colonne en production
  is_read?: boolean; // Alias pour compatibilité
  read_at?: string;
  archived?: boolean;
  archived_at?: string;
  link?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
  scheduled_for?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateNotificationData {
  user_id: string;
  company_id?: string;
  title: string;
  message: string;
  type?: Notification['type'];
  category?: Notification['category'];
  priority?: Notification['priority'];
  link?: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
  scheduled_for?: string;
}

export interface NotificationServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  /**
   * Crée une nouvelle notification
   */
  async createNotification(notificationData: CreateNotificationData): Promise<NotificationServiceResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.user_id,
          company_id: notificationData.company_id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'info',
          category: notificationData.category || 'general',
          priority: notificationData.priority || 'normal',
          link: notificationData.link,
          action_url: notificationData.action_url,
          action_label: notificationData.action_label,
          metadata: notificationData.metadata || {},
          expires_at: notificationData.expires_at,
          scheduled_for: notificationData.scheduled_for,
          read: false,
          archived: false
        })
        .select()
        .single();

      if (error) throw error;

      this.emitNotificationEvent('new', data);

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création de la notification'
      };
    }
  }

  /**
   * Archive une notification
   */
  async archiveNotification(notificationId: string): Promise<NotificationServiceResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;

      this.emitNotificationEvent('archive', data);

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'archivage de la notification'
      };
    }
  }

  /**
   * Envoie une notification à tous les utilisateurs d'une entreprise
   */
  async notifyCompany(
    companyId: string,
    title: string,
    message: string,
    options?: {
      type?: Notification['type'];
      category?: Notification['category'];
      priority?: Notification['priority'];
      action_url?: string;
      action_label?: string;
    }
  ): Promise<NotificationServiceResponse<number>> {
    try {
      // Récupérer tous les utilisateurs de l'entreprise
      const { data: userCompanies, error: fetchError } = await supabase
        .from('user_companies')
        .select('user_id')
        .eq('company_id', companyId);

      if (fetchError) throw fetchError;

      if (!userCompanies || userCompanies.length === 0) {
        return {
          success: true,
          data: 0
        };
      }

      // Créer les notifications
      const notifications = userCompanies.map(uc => ({
        user_id: uc.user_id,
        company_id: companyId,
        title,
        message,
        type: options?.type || 'info',
        category: options?.category || 'system',
        priority: options?.priority || 'normal',
        action_url: options?.action_url,
        action_label: options?.action_label,
        read: false,
        archived: false,
        metadata: {}
      }));

      const { error: insertError, count } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (insertError) throw insertError;

      return {
        success: true,
        data: count || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi des notifications'
      };
    }
  }

  /**
   * Récupère les notifications d'un utilisateur
   */
  async getNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      category?: string;
      type?: string;
    }
  ): Promise<NotificationServiceResponse<Notification[]>> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      // Filtres optionnels
      if (options?.unreadOnly) {
        query = query.eq('read', false);
      }

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      // Exclure les notifications expirées (filtre manuel après récupération)
      // Note: Supabase OR syntax nécessite une syntaxe spécifique pour les filtres NULL

      // Pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset) + (options?.limit || 50) - 1);
      }

      // Tri par date de création (plus récent en premier)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des notifications'
      };
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<NotificationServiceResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;

      this.emitNotificationEvent('read', data);

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la notification'
      };
    }
  }

  /**
   * Marque toutes les notifications comme lues pour un utilisateur
   */
  async markAllAsRead(userId: string): Promise<NotificationServiceResponse<number>> {
    try {
      const { data, error, count } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('read', false)
        .select();

      if (error) throw error;

      this.emitNotificationEvent('mark_all_read', { userId, count });

      return {
        success: true,
        data: count || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour des notifications'
      };
    }
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(notificationId: string): Promise<NotificationServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      this.emitNotificationEvent('delete', { id: notificationId });

      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la notification'
      };
    }
  }

  /**
   * Compte les notifications non lues
   */
  async getUnreadCount(userId: string): Promise<NotificationServiceResponse<number>> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return {
        success: true,
        data: count || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du comptage des notifications'
      };
    }
  }

  /**
   * Nettoie les anciennes notifications expirées
   */
  async cleanupExpiredNotifications(): Promise<NotificationServiceResponse<number>> {
    try {
      const { data, error, count } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) throw error;

      return {
        success: true,
        data: count || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du nettoyage des notifications'
      };
    }
  }

  /**
   * Émet un événement temps réel pour les notifications
   */
  private emitNotificationEvent(event: string, data: any): void {
    console.warn(`📱 Notification event: ${event}`, data);
  }

  /**
   * S'abonne aux notifications en temps réel
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification = payload.new as Notification;
          callback(notification);
        }
      )
      .subscribe();

    // Retourner une fonction de cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const notificationService = NotificationService.getInstance();

