/**
 * Workflow Validation Service
 *
 * Gestion du workflow de validation multi-niveaux pour écritures comptables.
 *
 * Workflow:
 * draft (brouillon) -> review (révision) -> validated (validé) -> posted (comptabilisé)
 *
 * Rôles typiques:
 * - Saisie: Crée draft, peut soumettre pour review
 * - Réviseur: Peut approuver (review -> validated) ou rejeter (review -> draft)
 * - Validateur: Peut valider (validated)
 * - Comptable: Peut poster (posted)
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
// ============================================================================
// TYPES
// ============================================================================
export type JournalEntryStatus = 'draft' | 'review' | 'validated' | 'posted' | 'cancelled';
export interface WorkflowTransition {
  action: string;
  from_status: string;
  to_status: string;
  performed_at: string;
  performed_by_email: string;
  comment: string | null;
}
export interface WorkflowState {
  current_status: JournalEntryStatus;
  can_submit_for_review: boolean;
  can_approve: boolean;
  can_reject: boolean;
  can_post: boolean;
  can_cancel: boolean;
  can_edit: boolean;
  requires_validation: boolean;
  is_locked: boolean;
}
// ============================================================================
// SUBMIT FOR REVIEW
// ============================================================================
/**
 * Soumet une écriture pour révision
 * Transition: draft -> review
 */
export async function submitEntryForReview(
  entryId: string,
  companyId: string,
  comment?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('submit_entry_for_review', {
      p_entry_id: entryId,
      p_company_id: companyId,
      p_comment: comment || null,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('WorkflowValidation', 'Error submitting for review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
// ============================================================================
// APPROVE ENTRY
// ============================================================================
/**
 * Approuve une écriture en révision
 * Transition: review -> validated
 */
export async function approveEntry(
  entryId: string,
  companyId: string,
  comment?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('approve_entry', {
      p_entry_id: entryId,
      p_company_id: companyId,
      p_comment: comment || null,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('WorkflowValidation', 'Error approving entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
// ============================================================================
// REJECT ENTRY
// ============================================================================
/**
 * Rejette une écriture et la remet en brouillon
 * Transition: review/validated -> draft
 */
export async function rejectEntry(
  entryId: string,
  companyId: string,
  reason: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('reject_entry', {
      p_entry_id: entryId,
      p_company_id: companyId,
      p_reason: reason,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('WorkflowValidation', 'Error rejecting entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
// ============================================================================
// POST ENTRY
// ============================================================================
/**
 * Comptabilise une écriture validée
 * Transition: validated -> posted
 */
export async function postJournalEntry(
  entryId: string,
  companyId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('post_journal_entry', {
      p_entry_id: entryId,
      p_company_id: companyId,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('WorkflowValidation', 'Error posting entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
// ============================================================================
// GET WORKFLOW HISTORY
// ============================================================================
/**
 * Récupère l'historique complet du workflow pour une écriture
 */
export async function getWorkflowHistory(
  entryId: string,
  companyId: string
): Promise<WorkflowTransition[]> {
  try {
    const { data, error } = await supabase.rpc('get_entry_workflow_history', {
      p_entry_id: entryId,
      p_company_id: companyId,
    });
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('WorkflowValidation', 'Error fetching workflow history:', error);
    return [];
  }
}
// ============================================================================
// GET WORKFLOW STATE
// ============================================================================
/**
 * Détermine l'état du workflow et les actions possibles
 */
export function getWorkflowState(
  status: JournalEntryStatus,
  isLocked: boolean,
  requiresValidation: boolean,
  _userRole?: string
): WorkflowState {
  const state: WorkflowState = {
    current_status: status,
    can_submit_for_review: false,
    can_approve: false,
    can_reject: false,
    can_post: false,
    can_cancel: false,
    can_edit: false,
    requires_validation: requiresValidation,
    is_locked: isLocked,
  };
  // Cannot do anything if locked
  if (isLocked) {
    return state;
  }
  // Actions based on status
  switch (status) {
    case 'draft':
      state.can_submit_for_review = true;
      state.can_edit = true;
      state.can_cancel = true;
      // Can post directly if validation not required
      if (!requiresValidation) {
        state.can_post = true;
      }
      break;
    case 'review':
      state.can_approve = true;
      state.can_reject = true;
      break;
    case 'validated':
      state.can_post = true;
      state.can_reject = true;
      break;
    case 'posted':
      // Nothing can be done once posted and locked
      break;
    case 'cancelled':
      // Nothing can be done on cancelled entries
      break;
  }
  return state;
}
// ============================================================================
// GET ENTRIES BY STATUS
// ============================================================================
/**
 * Récupère les écritures par statut (utile pour dashboards)
 */
export async function getEntriesByStatus(
  companyId: string,
  status: JournalEntryStatus,
  limit = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        id,
        entry_number,
        entry_date,
        description,
        status,
        created_by,
        reviewed_by,
        validated_by,
        posted_by,
        rejection_reason,
        review_comment,
        requires_validation,
        is_locked,
        created_at,
        updated_at
      `)
      .eq('company_id', companyId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('WorkflowValidation', 'Error fetching entries by status:', error);
    return [];
  }
}
// ============================================================================
// WORKFLOW STATISTICS
// ============================================================================
/**
 * Statistiques du workflow pour dashboard
 */
export async function getWorkflowStats(companyId: string): Promise<{
  draft: number;
  review: number;
  validated: number;
  posted: number;
  cancelled: number;
  total: number;
}> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('status')
      .eq('company_id', companyId);
    if (error) throw error;
    const stats = {
      draft: 0,
      review: 0,
      validated: 0,
      posted: 0,
      cancelled: 0,
      total: data?.length || 0,
    };
    data?.forEach(entry => {
      stats[entry.status as JournalEntryStatus]++;
    });
    return stats;
  } catch (error) {
    logger.error('WorkflowValidation', 'Error fetching workflow stats:', error);
    return {
      draft: 0,
      review: 0,
      validated: 0,
      posted: 0,
      cancelled: 0,
      total: 0,
    };
  }
}
// ============================================================================
// BATCH OPERATIONS
// ============================================================================
/**
 * Soumet plusieurs écritures pour révision en lot
 */
export async function batchSubmitForReview(
  entryIds: string[],
  companyId: string,
  comment?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const entryId of entryIds) {
    const result = await submitEntryForReview(entryId, companyId, comment);
    if (result.success) {
      success++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`${entryId}: ${result.error}`);
      }
    }
  }
  return { success, failed, errors };
}
/**
 * Approuve plusieurs écritures en lot
 */
export async function batchApproveEntries(
  entryIds: string[],
  companyId: string,
  comment?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const entryId of entryIds) {
    const result = await approveEntry(entryId, companyId, comment);
    if (result.success) {
      success++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`${entryId}: ${result.error}`);
      }
    }
  }
  return { success, failed, errors };
}
/**
 * Comptabilise plusieurs écritures en lot
 */
export async function batchPostEntries(
  entryIds: string[],
  companyId: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const entryId of entryIds) {
    const result = await postJournalEntry(entryId, companyId);
    if (result.success) {
      success++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`${entryId}: ${result.error}`);
      }
    }
  }
  return { success, failed, errors };
}