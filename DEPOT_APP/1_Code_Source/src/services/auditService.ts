/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

/**
 * Types d'actions pour l'audit trail
 * Correspond au champ event_type de la table audit_logs
 */
export type AuditAction =
  // Authentification
  | 'LOGIN'
  | 'LOGOUT'
  | 'SIGNUP'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_VERIFICATION'
  // CRUD
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  // Import/Export
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'EXPORT_PDF'
  | 'EXPORT_EXCEL'
  // RGPD
  | 'RGPD_EXPORT'
  | 'RGPD_DELETE_ACCOUNT'
  | 'CONSENT_GIVEN'
  | 'CONSENT_REVOKED'
  // Gestion utilisateurs
  | 'INVITE_USER'
  | 'REMOVE_USER'
  | 'CHANGE_ROLE'
  // Autres actions sensibles
  | 'CONFIG_CHANGE'
  | 'SECURITY_ALERT'
  | 'API_ACCESS';

/**
 * Niveaux de sécurité pour le logging
 */
export type SecurityLevel = 'low' | 'standard' | 'high' | 'critical';

/**
 * Tags de conformité (RGPD, SOC2, etc.)
 */
export type ComplianceTag = 'RGPD' | 'SOC2' | 'ISO27001' | 'HIPAA' | 'PCI-DSS';

/**
 * Structure d'une entrée d'audit
 */
export interface AuditLogEntry {
  // Champs obligatoires
  event_type?: AuditAction;
  
  // Alias pour event_type (backward compatibility)
  action?: string;
  
  // Entity information (backward compatibility)
  entityType?: string;
  entityId?: string;

  // Contexte de l'action
  table_name?: string;           // Table affectée (ex: 'invoices', 'users')
  record_id?: string;             // ID de l'enregistrement affecté
  company_id?: string;            // ID de l'entreprise

  // Données de l'action
  old_values?: Record<string, any>;  // Valeurs avant modification
  new_values?: Record<string, any>;  // Valeurs après modification
  changed_fields?: string[];         // Champs modifiés
  
  // Metadata (backward compatibility)
  metadata?: Record<string, any>;

  // Métadonnées de sécurité
  security_level?: SecurityLevel;
  compliance_tags?: ComplianceTag[];
  is_sensitive?: boolean;

  // Métadonnées techniques
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
}

/**
 * Options pour la recherche de logs
 */
export interface AuditLogsQueryOptions {
  limit?: number;
  offset?: number;
  event_type?: AuditAction;
  table_name?: string;
  start_date?: string;
  end_date?: string;
  security_level?: SecurityLevel;
  user_id?: string;
}

/**
 * Service d'audit trail pour la traçabilité et la conformité
 *
 * ✅ Conforme RGPD Article 5 (Intégrité et confidentialité)
 * ✅ Conforme RGPD Article 30 (Registre des activités de traitement)
 * ✅ Rétention : 2 ans minimum (défaut: 7 ans = 2555 jours)
 *
 * @example
 * ```typescript
 * // Logger une création de facture
 * auditService.logAsync({
 *   event_type: 'CREATE',
 *   table_name: 'invoices',
 *   record_id: invoice.id,
 *   company_id: companyId,
 *   new_values: { invoice_number: 'INV-001', amount: 1000 }
 * });
 * ```
 */
class AuditService {
  /**
   * Log une action dans l'audit trail
   *
   * ⚠️ Cette fonction est asynchrone et peut échouer silencieusement
   * pour ne jamais bloquer l'opération principale.
   *
   * @param entry - Entrée d'audit à logger
   * @returns Promise<void>
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();

      // Enrichir l'entrée avec les métadonnées
      const enrichedEntry = {
        // Champs obligatoires
        event_type: entry.event_type,
        user_id: user?.id || null,
        user_email: user?.email || null,

        // Contexte
        company_id: entry.company_id || null,
        table_name: entry.table_name || null,
        record_id: entry.record_id || null,

        // Données
        old_values: entry.old_values || null,
        new_values: entry.new_values || null,
        changed_fields: entry.changed_fields || null,

        // Sécurité
        security_level: entry.security_level || 'standard',
        compliance_tags: entry.compliance_tags || [],
        is_sensitive: entry.is_sensitive || false,

        // Métadonnées techniques
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || (typeof window !== 'undefined' ? window.navigator.userAgent : null),
        session_id: entry.session_id || null,
        request_id: entry.request_id || null,

        // Timestamp
        event_timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(enrichedEntry);

      if (error) {
        logger.error('AuditService: Failed to log audit entry', error, { enrichedEntry });
      }
    } catch (error) {
      // Ne jamais bloquer l'opération principale
      logger.error('AuditService: Exception during audit logging', error);
    }
  }

  /**
   * Log une action de manière asynchrone (fire-and-forget)
   *
   * Utiliser cette méthode pour les opérations non critiques
   * où l'échec du logging ne doit pas bloquer l'application.
   *
   * @param entry - Entrée d'audit à logger
   */
  logAsync(entry: AuditLogEntry): void {
    this.log(entry).catch(() => {
      // Silencieux - déjà loggé dans log()
    });
  }

  /**
   * Récupérer les logs d'audit pour une entreprise
   *
   * @param companyId - ID de l'entreprise
   * @param options - Options de filtrage et pagination
   * @returns Liste des logs d'audit
   */
  async getCompanyLogs(
    companyId: string,
    options?: AuditLogsQueryOptions
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('event_timestamp', { ascending: false });

      // Filtres optionnels
      if (options?.event_type) {
        query = query.eq('event_type', options.event_type);
      }
      if (options?.table_name) {
        query = query.eq('table_name', options.table_name);
      }
      if (options?.security_level) {
        query = query.eq('security_level', options.security_level);
      }
      if (options?.user_id) {
        query = query.eq('user_id', options.user_id);
      }
      if (options?.start_date) {
        query = query.gte('event_timestamp', options.start_date);
      }
      if (options?.end_date) {
        query = query.lte('event_timestamp', options.end_date);
      }

      // Pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = options.limit || 50;
        query = query.range(options.offset, options.offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('AuditService: Error fetching company logs', error, { companyId, options });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('AuditService: Exception fetching company logs', error, { companyId });
      throw error;
    }
  }

  /**
   * Récupérer les logs d'un utilisateur spécifique
   *
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre maximum de logs à retourner
   * @returns Liste des logs de l'utilisateur
   */
  async getUserLogs(userId: string, limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('event_timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('AuditService: Error fetching user logs', error, { userId, limit });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('AuditService: Exception fetching user logs', error, { userId });
      throw error;
    }
  }

  /**
   * Récupérer les logs sensibles (sécurité critique)
   *
   * @param companyId - ID de l'entreprise
   * @param days - Nombre de jours à récupérer (défaut: 30)
   * @returns Logs sensibles récents
   */
  async getSensitiveLogs(companyId: string, days: number = 30): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_sensitive', true)
        .gte('event_timestamp', startDate.toISOString())
        .order('event_timestamp', { ascending: false });

      if (error) {
        logger.error('AuditService: Error fetching sensitive logs', error, { companyId, days });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('AuditService: Exception fetching sensitive logs', error, { companyId });
      throw error;
    }
  }

  /**
   * Récupérer les statistiques d'audit pour une entreprise
   *
   * @param companyId - ID de l'entreprise
   * @param days - Période en jours (défaut: 30)
   * @returns Statistiques d'audit
   */
  async getAuditStats(companyId: string, days: number = 30): Promise<{
    total: number;
    by_event_type: Record<string, number>;
    by_user: Record<string, number>;
    sensitive_count: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('event_type, user_email, is_sensitive')
        .eq('company_id', companyId)
        .gte('event_timestamp', startDate.toISOString());

      if (error) throw error;

      const logs = data || [];

      // Compter par type d'événement
      const byEventType: Record<string, number> = {};
      const byUser: Record<string, number> = {};
      let sensitiveCount = 0;

      logs.forEach(log => {
        // Par type
        byEventType[log.event_type] = (byEventType[log.event_type] || 0) + 1;

        // Par utilisateur
        const userEmail = log.user_email || 'anonymous';
        byUser[userEmail] = (byUser[userEmail] || 0) + 1;

        // Sensibles
        if (log.is_sensitive) {
          sensitiveCount++;
        }
      });

      return {
        total: logs.length,
        by_event_type: byEventType,
        by_user: byUser,
        sensitive_count: sensitiveCount
      };
    } catch (error) {
      logger.error('AuditService: Exception fetching audit stats', error, { companyId });
      throw error;
    }
  }

  /**
   * Logger une action d'authentification
   *
   * @param action - Type d'action (LOGIN, LOGOUT, etc.)
   * @param userId - ID de l'utilisateur
   * @param success - Succès ou échec de l'action
   */
  logAuth(action: Extract<AuditAction, 'LOGIN' | 'LOGOUT' | 'SIGNUP' | 'PASSWORD_CHANGE'>, userId?: string, success: boolean = true): void {
    this.logAsync({
      event_type: action,
      record_id: userId,
      security_level: 'high',
      compliance_tags: ['RGPD', 'SOC2'],
      new_values: { success }
    });
  }

  /**
   * Logger une action RGPD
   *
   * @param action - Type d'action RGPD
   * @param userId - ID de l'utilisateur
   * @param details - Détails supplémentaires
   */
  logRGPD(action: Extract<AuditAction, 'RGPD_EXPORT' | 'RGPD_DELETE_ACCOUNT' | 'CONSENT_GIVEN' | 'CONSENT_REVOKED'>, userId: string, details?: Record<string, any>): void {
    this.logAsync({
      event_type: action,
      record_id: userId,
      table_name: 'users',
      security_level: 'critical',
      compliance_tags: ['RGPD'],
      is_sensitive: true,
      new_values: details
    });
  }

  /**
   * Logger un changement de configuration
   *
   * @param companyId - ID de l'entreprise
   * @param configKey - Clé de configuration modifiée
   * @param oldValue - Ancienne valeur
   * @param newValue - Nouvelle valeur
   */
  logConfigChange(companyId: string, configKey: string, oldValue: any, newValue: any): void {
    this.logAsync({
      event_type: 'CONFIG_CHANGE',
      company_id: companyId,
      table_name: 'company_settings',
      security_level: 'high',
      old_values: { [configKey]: oldValue },
      new_values: { [configKey]: newValue },
      changed_fields: [configKey]
    });
  }
}

// Export d'une instance singleton
export const auditService = new AuditService();

// Export de la classe pour les tests
export default AuditService;
