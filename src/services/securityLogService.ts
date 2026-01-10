/**
 * Security Log Service
 *
 * Service centralisé pour l'enregistrement et la consultation des logs de sécurité.
 * Conformité RGPD, audit trail, détection d'intrusions.
 *
 * Utilisé pour logger:
 * - Authentification (login, logout, failed attempts)
 * - Exports de données (FEC, PDF, Excel)
 * - Modifications sensibles (suppression, modification comptabilité)
 * - Accès aux données sensibles
 * - Actions administratives
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
// ============================================================================
// TYPES
// ============================================================================
export type EventType =
  | 'login'
  | 'logout'
  | 'failed_login'
  | 'export'
  | 'delete'
  | 'modification'
  | 'access'
  | 'admin_action'
  | 'api_call';
export type EventCategory =
  | 'authentication'
  | 'data_access'
  | 'data_modification'
  | 'export'
  | 'admin';
export type Severity = 'info' | 'warning' | 'error' | 'critical';
export interface SecurityLog {
  id: string;
  company_id?: string;
  event_type: EventType;
  event_category: EventCategory;
  severity: Severity;
  user_email?: string;
  action: string;
  description: string;
  resource_type?: string;
  resource_id?: string;
  success: boolean;
  error_message?: string;
  ip_address?: string;
  metadata?: Record<string, any>;
  created_at: string;
}
export interface SecurityStats {
  total_events: number;
  by_severity: Record<Severity, number>;
  failed_actions: number;
  pending_reviews: number;
  unique_users: number;
  most_common_events: Array<{
    event_type: string;
    count: number;
  }>;
}
// ============================================================================
// LOG FUNCTIONS
// ============================================================================
/**
 * Enregistre un événement de sécurité
 */
export async function logSecurityEvent(
  companyId: string | null,
  eventType: EventType,
  eventCategory: EventCategory,
  severity: Severity,
  action: string,
  description: string,
  options?: {
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('log_security_event', {
      p_company_id: companyId,
      p_event_type: eventType,
      p_event_category: eventCategory,
      p_severity: severity,
      p_action: action,
      p_description: description,
      p_resource_type: options?.resourceType || null,
      p_resource_id: options?.resourceId || null,
      p_metadata: options?.metadata || {},
      p_success: options?.success !== undefined ? options.success : true,
      p_error_message: options?.errorMessage || null,
    });
    if (error) {
      logger.error('SecurityLog', 'Error logging security event:', error);
      return null;
    }
    return data;
  } catch (error) {
    logger.error('SecurityLog', 'Failed to log security event:', error);
    return null;
  }
}
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Log login attempt
 */
export async function logLogin(success: boolean, errorMessage?: string) {
  return logSecurityEvent(
    null,
    success ? 'login' : 'failed_login',
    'authentication',
    success ? 'info' : 'warning',
    success ? 'logged_in' : 'login_failed',
    success ? 'Utilisateur connecté' : 'Tentative de connexion échouée',
    {
      success,
      errorMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
    }
  );
}
/**
 * Log logout
 */
export async function logLogout() {
  return logSecurityEvent(
    null,
    'logout',
    'authentication',
    'info',
    'logged_out',
    'Utilisateur déconnecté',
    {
      metadata: {
        timestamp: new Date().toISOString(),
      },
    }
  );
}
/**
 * Log data export
 */
export async function logExport(
  companyId: string,
  exportType: string,
  description: string,
  metadata?: Record<string, any>
) {
  return logSecurityEvent(
    companyId,
    'export',
    'export',
    'info',
    'exported',
    description,
    {
      resourceType: 'export',
      metadata: {
        export_type: exportType,
        ...metadata,
      },
    }
  );
}
/**
 * Log FEC export (high sensitivity)
 */
export async function logFECExport(
  companyId: string,
  periodStart: string,
  periodEnd: string
) {
  return logSecurityEvent(
    companyId,
    'export',
    'export',
    'warning',
    'fec_exported',
    `Export FEC pour période ${periodStart} - ${periodEnd}`,
    {
      resourceType: 'fec_export',
      metadata: {
        period_start: periodStart,
        period_end: periodEnd,
        format: 'FEC',
      },
    }
  );
}
/**
 * Log deletion of sensitive data
 */
export async function logDeletion(
  companyId: string,
  resourceType: string,
  resourceId: string,
  description: string
) {
  return logSecurityEvent(
    companyId,
    'delete',
    'data_modification',
    'warning',
    'deleted',
    description,
    {
      resourceType,
      resourceId,
    }
  );
}
/**
 * Log modification of locked entry (should not happen, but log if it does)
 */
export async function logLockedEntryModification(
  companyId: string,
  entryId: string,
  entryNumber: string
) {
  return logSecurityEvent(
    companyId,
    'modification',
    'data_modification',
    'critical',
    'locked_entry_modified',
    `ALERTE: Tentative de modification d'écriture verrouillée ${entryNumber}`,
    {
      resourceType: 'journal_entry',
      resourceId: entryId,
      success: false,
      metadata: {
        entry_number: entryNumber,
        alert_type: 'security_violation',
      },
    }
  );
}
/**
 * Log admin action
 */
export async function logAdminAction(
  companyId: string | null,
  action: string,
  description: string,
  metadata?: Record<string, any>
) {
  return logSecurityEvent(
    companyId,
    'admin_action',
    'admin',
    'warning',
    action,
    description,
    {
      metadata,
    }
  );
}
// ============================================================================
// SEARCH & ANALYTICS
// ============================================================================
/**
 * Recherche dans les logs de sécurité
 */
export async function searchSecurityLogs(filters: {
  companyId?: string;
  eventType?: EventType;
  severity?: Severity;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<SecurityLog[]> {
  try {
    // ✅ DEBUG: Log RPC call
    logger.info('SecurityLogService', '>>> CALLING search_security_logs RPC <<<', {
      filters,
      params: {
        p_company_id: filters.companyId || null,
        p_event_type: filters.eventType || null,
        p_severity: filters.severity || null,
        p_user_id: filters.userId || null,
        p_start_date: filters.startDate || null,
        p_end_date: filters.endDate || null,
        p_limit: filters.limit || 100,
      }
    });

    const { data, error } = await supabase.rpc('search_security_logs', {
      p_company_id: filters.companyId || null,
      p_event_type: filters.eventType || null,
      p_severity: filters.severity || null,
      p_user_id: filters.userId || null,
      p_start_date: filters.startDate || null,
      p_end_date: filters.endDate || null,
      p_limit: filters.limit || 100,
    });

    if (error) {
      logger.error('SecurityLogService', '❌ RPC search_security_logs ERROR:', error);
      throw error;
    }

    // ✅ DEBUG: Log results
    logger.info('SecurityLogService', '✅ RPC search_security_logs SUCCESS:', {
      resultCount: data?.length || 0,
      firstResult: data?.[0]
    });

    return data || [];
  } catch (error) {
    logger.error('SecurityLog', '❌ Error searching security logs:', error);
    return [];
  }
}
/**
 * Récupère les statistiques de sécurité
 */
export async function getSecurityStats(
  companyId: string,
  days = 30
): Promise<SecurityStats | null> {
  try {
    // ✅ DEBUG: Log RPC call
    logger.info('SecurityLogService', '>>> CALLING get_security_stats RPC <<<', {
      companyId,
      days
    });

    const { data, error } = await supabase.rpc('get_security_stats', {
      p_company_id: companyId,
      p_days: days,
    });

    if (error) {
      logger.error('SecurityLogService', '❌ RPC get_security_stats ERROR:', error);
      throw error;
    }

    // ✅ DEBUG: Log results
    logger.info('SecurityLogService', '✅ RPC get_security_stats SUCCESS:', { data });

    return data;
  } catch (error) {
    logger.error('SecurityLog', '❌ Error getting security stats:', error);
    return null;
  }
}
/**
 * Récupère le dashboard de sécurité (agrégé)
 */
export async function getSecurityDashboard(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('v_security_dashboard')
      .select('*')
      .limit(30);
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('SecurityLog', 'Error getting security dashboard:', error);
    return [];
  }
}
/**
 * Récupère les logs nécessitant une review
 */
export async function getPendingReviewLogs(
  companyId?: string
): Promise<SecurityLog[]> {
  try {
    let query = supabase
      .from('security_logs')
      .select('*')
      .eq('requires_review', true)
      .is('reviewed_at', null)
      .order('created_at', { ascending: false });
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('SecurityLog', 'Error getting pending review logs:', error);
    return [];
  }
}
// ============================================================================
// ALERTING
// ============================================================================
/**
 * Détecte des patterns suspects dans les logs
 */
export async function detectSuspiciousActivity(
  companyId: string,
  hours = 24
): Promise<{
  failed_logins: number;
  unusual_exports: number;
  after_hours_access: number;
  suspicious: boolean;
}> {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);
  const logs = await searchSecurityLogs({
    companyId,
    startDate: startDate.toISOString().split('T')[0],
    limit: 1000,
  });
  const failedLogins = logs.filter(l => l.event_type === 'failed_login').length;
  const exports = logs.filter(l => l.event_type === 'export').length;
  // Check for after-hours access (20h-6h)
  const afterHoursAccess = logs.filter(log => {
    const hour = new Date(log.created_at).getHours();
    return hour >= 20 || hour < 6;
  }).length;
  return {
    failed_logins: failedLogins,
    unusual_exports: exports > 10 ? exports : 0,
    after_hours_access: afterHoursAccess,
    suspicious: failedLogins > 5 || exports > 10 || afterHoursAccess > 5,
  };
}