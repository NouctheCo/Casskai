import { z } from 'zod';

// Types pour les notifications
export interface AccountingNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  category: 'validation' | 'integrity' | 'business_rule' | 'compliance' | 'system';
  title: string;
  message: string;
  details?: any;
  timestamp: Date;
  companyId?: string;
  userId?: string;
  resolved?: boolean;
  resolvedAt?: Date;
  suggestedActions?: string[];
}

export interface NotificationChannel {
  type: 'email' | 'in_app' | 'sms' | 'webhook';
  enabled: boolean;
  config?: any;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
}

/**
 * Service de notifications pour le système comptable
 * Gère les alertes, notifications et suggestions de correction
 */
export class AccountingNotificationService {
  private static instance: AccountingNotificationService;
  private notifications: Map<string, AccountingNotification[]> = new Map();
  private channels: NotificationChannel[] = [];
  private templates: Map<string, NotificationTemplate> = new Map();

  private constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultChannels();
  }

  static getInstance(): AccountingNotificationService {
    if (!AccountingNotificationService.instance) {
      AccountingNotificationService.instance = new AccountingNotificationService();
    }
    return AccountingNotificationService.instance;
  }

  /**
   * Initialise les templates de notification par défaut
   */
  private initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'balance_error',
        type: 'error',
        subject: 'Erreur de balance comptable détectée',
        body: 'Une erreur de balance a été détectée dans votre comptabilité. Solde débiteur: {debit_balance}, Solde créditeur: {credit_balance}',
        variables: ['debit_balance', 'credit_balance', 'company_name', 'period']
      },
      {
        id: 'vat_inconsistency',
        type: 'warning',
        subject: 'Incohérence TVA détectée',
        body: 'Une incohérence TVA a été détectée pour la période {period}. Montant collecté: {collected_vat}, Montant déductible: {deductible_vat}',
        variables: ['collected_vat', 'deductible_vat', 'period', 'company_name']
      },
      {
        id: 'business_rule_violation',
        type: 'warning',
        subject: 'Violation de règle métier',
        body: 'Une violation de règle métier a été détectée: {rule_description}. Valeur concernée: {value}',
        variables: ['rule_description', 'value', 'company_name', 'sector']
      },
      {
        id: 'compliance_alert',
        type: 'error',
        subject: 'Alerte de conformité',
        body: 'Un problème de conformité a été détecté: {compliance_issue}. Action requise: {required_action}',
        variables: ['compliance_issue', 'required_action', 'company_name', 'deadline']
      },
      {
        id: 'integrity_check_failed',
        type: 'error',
        subject: 'Échec du contrôle d\'intégrité',
        body: 'Le contrôle d\'intégrité {check_name} a échoué. Sévérité: {severity}. Recommandation: {recommendation}',
        variables: ['check_name', 'severity', 'recommendation', 'company_name']
      },
      {
        id: 'audit_trail_incomplete',
        type: 'warning',
        subject: 'Piste d\'audit incomplète',
        body: 'La piste d\'audit est incomplète pour la transaction {transaction_id}. Champs manquants: {missing_fields}',
        variables: ['transaction_id', 'missing_fields', 'company_name']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Initialise les canaux de notification par défaut
   */
  private initializeDefaultChannels(): void {
    this.channels = [
      {
        type: 'in_app',
        enabled: true
      },
      {
        type: 'email',
        enabled: false,
        config: {
          smtpHost: null,
          smtpPort: null,
          username: null,
          password: null
        }
      },
      {
        type: 'webhook',
        enabled: false,
        config: {
          url: null,
          headers: {}
        }
      }
    ];
  }

  /**
   * Envoie une notification
   */
  async sendNotification(notification: Omit<AccountingNotification, 'id' | 'timestamp'>): Promise<string> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullNotification: AccountingNotification = {
      id: notificationId,
      timestamp: new Date(),
      ...notification
    };

    // Stocker la notification
    const companyNotifications = this.notifications.get(notification.companyId || 'global') || [];
    companyNotifications.push(fullNotification);
    this.notifications.set(notification.companyId || 'global', companyNotifications);

    // Envoyer via les canaux activés
    await this.dispatchToChannels(fullNotification);

    return notificationId;
  }

  /**
   * Envoie une notification d'erreur de validation
   */
  async sendValidationError(
    companyId: string,
    title: string,
    message: string,
    details?: any,
    suggestedActions?: string[]
  ): Promise<string> {
    return this.sendNotification({
      type: 'error',
      category: 'validation',
      title,
      message,
      details,
      companyId,
      suggestedActions
    });
  }

  /**
   * Envoie une notification d'avertissement de règle métier
   */
  async sendBusinessRuleWarning(
    companyId: string,
    ruleDescription: string,
    value: any,
    sector: string,
    suggestedActions?: string[]
  ): Promise<string> {
    const template = this.templates.get('business_rule_violation');
    if (template) {
      const message = template.body
        .replace('{rule_description}', ruleDescription)
        .replace('{value}', String(value))
        .replace('{sector}', sector);

      return this.sendNotification({
        type: 'warning',
        category: 'business_rule',
        title: template.subject,
        message,
        details: { ruleDescription, value, sector },
        companyId,
        suggestedActions
      });
    }

    return this.sendNotification({
      type: 'warning',
      category: 'business_rule',
      title: 'Violation de règle métier',
      message: `${ruleDescription} - Valeur: ${value}`,
      details: { ruleDescription, value, sector },
      companyId,
      suggestedActions
    });
  }

  /**
   * Envoie une notification d'échec d'intégrité
   */
  async sendIntegrityFailure(
    companyId: string,
    checkName: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    recommendation: string,
    details?: any
  ): Promise<string> {
    const template = this.templates.get('integrity_check_failed');
    if (template) {
      const message = template.body
        .replace('{check_name}', checkName)
        .replace('{severity}', severity)
        .replace('{recommendation}', recommendation);

      return this.sendNotification({
        type: severity === 'critical' || severity === 'high' ? 'error' : 'warning',
        category: 'integrity',
        title: template.subject,
        message,
        details: { checkName, severity, recommendation, ...details },
        companyId,
        suggestedActions: [recommendation]
      });
    }

    return this.sendNotification({
      type: severity === 'critical' || severity === 'high' ? 'error' : 'warning',
      category: 'integrity',
      title: 'Échec du contrôle d\'intégrité',
      message: `${checkName}: ${recommendation}`,
      details: { checkName, severity, recommendation, ...details },
      companyId,
      suggestedActions: [recommendation]
    });
  }

  /**
   * Envoie une notification d'alerte de conformité
   */
  async sendComplianceAlert(
    companyId: string,
    complianceIssue: string,
    requiredAction: string,
    deadline?: Date
  ): Promise<string> {
    const template = this.templates.get('compliance_alert');
    if (template) {
      const message = template.body
        .replace('{compliance_issue}', complianceIssue)
        .replace('{required_action}', requiredAction)
        .replace('{deadline}', deadline ? deadline.toISOString() : 'Dès que possible');

      return this.sendNotification({
        type: 'error',
        category: 'compliance',
        title: template.subject,
        message,
        details: { complianceIssue, requiredAction, deadline },
        companyId,
        suggestedActions: [requiredAction]
      });
    }

    return this.sendNotification({
      type: 'error',
      category: 'compliance',
      title: 'Alerte de conformité',
      message: `${complianceIssue}. Action requise: ${requiredAction}`,
      details: { complianceIssue, requiredAction, deadline },
      companyId,
      suggestedActions: [requiredAction]
    });
  }

  /**
   * Récupère les notifications pour une entreprise
   */
  getNotifications(companyId?: string, filter?: {
    type?: AccountingNotification['type'];
    category?: AccountingNotification['category'];
    resolved?: boolean;
    limit?: number;
  }): AccountingNotification[] {
    const companyNotifications = this.notifications.get(companyId || 'global') || [];

    let filtered = companyNotifications;

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(n => n.type === filter.type);
      }
      if (filter.category) {
        filtered = filtered.filter(n => n.category === filter.category);
      }
      if (filter.resolved !== undefined) {
        filtered = filtered.filter(n => n.resolved === filter.resolved);
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Marque une notification comme résolue
   */
  async resolveNotification(notificationId: string, companyId?: string): Promise<boolean> {
    const companyNotifications = this.notifications.get(companyId || 'global') || [];
    const notification = companyNotifications.find(n => n.id === notificationId);

    if (notification) {
      notification.resolved = true;
      notification.resolvedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * Configure un canal de notification
   */
  configureChannel(channelType: NotificationChannel['type'], config: Partial<NotificationChannel>): void {
    const channel = this.channels.find(c => c.type === channelType);
    if (channel) {
      Object.assign(channel, config);
    }
  }

  /**
   * Dispatch une notification vers tous les canaux activés
   */
  private async dispatchToChannels(notification: AccountingNotification): Promise<void> {
    const enabledChannels = this.channels.filter(c => c.enabled);

    for (const channel of enabledChannels) {
      try {
        await this.sendToChannel(channel, notification);
      } catch (error) {
        console.error(`Erreur lors de l'envoi vers le canal ${channel.type}:`, error);
      }
    }
  }

  /**
   * Envoie une notification vers un canal spécifique
   */
  private async sendToChannel(channel: NotificationChannel, notification: AccountingNotification): Promise<void> {
    switch (channel.type) {
      case 'in_app':
        // Pour l'instant, on log simplement
        console.log('Notification in-app:', notification);
        break;

      case 'email':
        if (channel.config) {
          await this.sendEmailNotification(channel.config, notification);
        }
        break;

      case 'webhook':
        if (channel.config?.url) {
          await this.sendWebhookNotification(channel.config, notification);
        }
        break;

      case 'sms':
        // Implémentation SMS à ajouter si nécessaire
        console.log('SMS notification:', notification);
        break;
    }
  }

  /**
   * Envoie une notification par email
   */
  private async sendEmailNotification(config: any, notification: AccountingNotification): Promise<void> {
    // Implémentation SMTP à ajouter
    console.log('Envoi email:', notification, config);
  }

  /**
   * Envoie une notification via webhook
   */
  private async sendWebhookNotification(config: any, notification: AccountingNotification): Promise<void> {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(notification)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }
  }

  /**
   * Nettoie les anciennes notifications
   */
  cleanupOldNotifications(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    for (const [companyId, notifications] of this.notifications.entries()) {
      const filtered = notifications.filter(n => n.timestamp > cutoffDate);
      if (filtered.length > 0) {
        this.notifications.set(companyId, filtered);
      } else {
        this.notifications.delete(companyId);
      }
    }
  }

  /**
   * Obtient les statistiques des notifications
   */
  getNotificationStats(companyId?: string): {
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    unresolved: number;
  } {
    const notifications = this.getNotifications(companyId);

    const stats = {
      total: notifications.length,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      unresolved: notifications.filter(n => !n.resolved).length
    };

    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
    });

    return stats;
  }
}