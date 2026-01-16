/**
 * CassKai - Regulatory Submission & Compliance Service
 * Handles submission tracking, deadlines, and compliance monitoring
 */
import { supabase } from '@/lib/supabase';
import type {
  RegulatorySubmission,
  UpcomingDeadline,
  DocumentStatistics,
} from '@/types/regulatory';
import { COUNTRIES } from '@/constants/regulatoryCountries';
import { logger } from '@/lib/logger';
/**
 * Track regulatory submission to tax authority
 */
export async function trackSubmission(
  documentId: string,
  submissionDate: string,
  method: 'online' | 'manual' | 'postal' | 'in-person',
  confirmationCode?: string,
  notes?: string
): Promise<{ success: boolean; submissionId?: string; error?: string }> {
  const { data: document, error: docError } = await supabase
    .from('regulatory_documents')
    .select('*')
    .eq('id', documentId)
    .single();
  if (docError || !document) {
    return { success: false, error: 'Document not found' };
  }
  const { data, error } = await supabase
    .from('regulatory_submissions')
    .insert({
      document_id: documentId,
      submission_date: submissionDate,
      submission_method: method,
      confirmation_code: confirmationCode,
      status: 'pending',
      notes,
    })
    .select()
    .single();
  if (error) {
    return { success: false, error: error.message };
  }
  // Update document status
  await supabase
    .from('regulatory_documents')
    .update({ status: 'submitted' })
    .eq('id', documentId);
  return { success: true, submissionId: data.id };
}
/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'needs_revision',
  responseData?: any,
  responseDate?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('regulatory_submissions')
    .update({
      status,
      response_data: responseData,
      response_date: responseDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
/**
 * Get upcoming filing deadlines for a company
 */
export async function getUpcomingDeadlines(
  companyId: string,
  daysAhead: number = 90
): Promise<UpcomingDeadline[]> {
  const { data: documents, error } = await supabase
    .from('regulatory_documents')
    .select('*')
    .eq('company_id', companyId)
    .neq('status', 'submitted');
  if (error || !documents) {
    logger.error('Compliance', 'Error fetching documents:', error);
    return [];
  }
  const deadlines: UpcomingDeadline[] = [];
  const today = new Date();
  const cutoffDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  for (const doc of documents) {
    const country = COUNTRIES[doc.country_code];
    if (!country) continue;
    // Check if document has filing deadline
    for (const deadline of country.taxFilingDeadlines || []) {
      if (deadline.documentType === doc.document_type) {
        // Parse deadline format (MM/DD or DD)
        let deadlineDate: Date;
        if (deadline.deadline.includes('/')) {
          // Format: MM/DD
          const [month, day] = deadline.deadline.split('/').map((x) => parseInt(x, 10));
          deadlineDate = new Date(today.getFullYear(), month - 1, day);
          // If deadline passed this year, set for next year
          if (deadlineDate < today) {
            deadlineDate = new Date(today.getFullYear() + 1, month - 1, day);
          }
        } else {
          // Format: DD (monthly)
          const day = parseInt(deadline.deadline, 10);
          deadlineDate = new Date(today.getFullYear(), today.getMonth(), day);
          // If deadline passed this month, set for next month
          if (deadlineDate < today) {
            deadlineDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
          }
        }
        if (deadlineDate >= today && deadlineDate <= cutoffDate) {
          const daysUntil = Math.floor((deadlineDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
          let priority: 'low' | 'medium' | 'high' | 'critical';
          if (daysUntil <= 7) priority = 'critical';
          else if (daysUntil <= 14) priority = 'high';
          else if (daysUntil <= 30) priority = 'medium';
          else priority = 'low';
          deadlines.push({
            documentId: doc.id,
            documentType: doc.document_type,
            documentName: doc.document_type,
            country: country.nameEn,
            deadline: deadlineDate.toISOString(),
            daysUntilDeadline: daysUntil,
            priority,
            description: deadline.description,
            fiscalYear: doc.fiscal_year,
            status: doc.status as any,
          });
        }
      }
    }
  }
  // Sort by days until deadline
  return deadlines.sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
}
/**
 * Get document filing status summary
 */
export async function getFilingStatusSummary(
  companyId: string
): Promise<{
  onTime: number;
  upcoming: number;
  overdue: number;
  nextDeadline?: UpcomingDeadline;
}> {
  const deadlines = await getUpcomingDeadlines(companyId, 365);
  const today = new Date();
  let onTime = 0;
  let upcoming = 0;
  let overdue = 0;
  for (const deadline of deadlines) {
    const deadlineDate = new Date(deadline.deadline);
    if (deadlineDate < today) {
      overdue++;
    } else if (deadline.daysUntilDeadline <= 7) {
      onTime++;
    } else {
      upcoming++;
    }
  }
  return {
    onTime,
    upcoming,
    overdue,
    nextDeadline: deadlines[0],
  };
}
/**
 * Get document statistics for a company
 */
export async function getDocumentStatistics(
  companyId: string
): Promise<DocumentStatistics> {
  const { data: documents, error } = await supabase
    .from('regulatory_documents')
    .select('*')
    .eq('company_id', companyId);
  if (error || !documents) {
    return {
      total: 0,
      totalDocuments: 0,
      byStatus: {} as Record<string, number>,
      byType: {},
      byCountry: {},
      byStandard: {},
      byCategory: {},
      upcomingDeadlines: [],
      recentActivity: [],
      draft: 0,
      completed: 0,
      submitted: 0,
      validated: 0,
      rejected: 0,
    };
  }
  const stats: DocumentStatistics = {
    total: documents.length,
    totalDocuments: documents.length,
    byStatus: {} as Record<string, number>,
    byType: {},
    byCountry: {},
    byStandard: {},
    byCategory: {},
    upcomingDeadlines: [],
    recentActivity: [],
    draft: 0,
    completed: 0,
    submitted: 0,
    validated: 0,
    rejected: 0,
  };
  for (const doc of documents) {
    // Count by status
    if (doc.status === 'draft' && stats.draft !== undefined) stats.draft++;
    else if (doc.status === 'completed' && stats.completed !== undefined) stats.completed++;
    else if (doc.status === 'submitted' && stats.submitted !== undefined) stats.submitted++;
    else if (doc.status === 'validated' && stats.validated !== undefined) stats.validated++;
    else if (doc.status === 'rejected' && stats.rejected !== undefined) stats.rejected++;
    // Count by standard
    if (stats.byStandard) {
      stats.byStandard[doc.accounting_standard] = (stats.byStandard[doc.accounting_standard] || 0) + 1;
    }
    // Count by country
    stats.byCountry[doc.country_code] = (stats.byCountry[doc.country_code] || 0) + 1;
    // Count by category (from document_type prefix)
    const category = doc.document_type.split('_')[0];
    if (stats.byCategory) {
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }
  }
  return stats;
}
/**
 * Get submission history for a document
 */
export async function getSubmissionHistory(
  documentId: string
): Promise<RegulatorySubmission[]> {
  const { data, error } = await supabase
    .from('regulatory_submissions')
    .select('*')
    .eq('document_id', documentId)
    .order('submission_date', { ascending: false });
  if (error) {
    logger.error('Compliance', 'Error fetching submissions:', error);
    return [];
  }
  return data || [];
}
/**
 * Generate compliance report for a company
 */
export async function generateComplianceReport(
  companyId: string
): Promise<{
  companyId: string;
  generatedAt: string;
  statistics: DocumentStatistics;
  filingStatus: {
    onTime: number;
    upcoming: number;
    overdue: number;
  };
  upcomingDeadlines: UpcomingDeadline[];
  riskLevel: 'low' | 'medium' | 'high';
}> {
  const stats = await getDocumentStatistics(companyId);
  const filingStatus = await getFilingStatusSummary(companyId);
  const upcomingDeadlines = await getUpcomingDeadlines(companyId, 30);
  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (filingStatus.overdue > 0) {
    riskLevel = 'high';
  } else if (upcomingDeadlines.filter((d) => d.daysUntilDeadline <= 7).length > 0) {
    riskLevel = 'medium';
  }
  return {
    companyId,
    generatedAt: new Date().toISOString(),
    statistics: stats,
    filingStatus,
    upcomingDeadlines,
    riskLevel,
  };
}
/**
 * Check if company is compliant with filing requirements
 */
export async function checkCompliance(companyId: string): Promise<{
  isCompliant: boolean;
  violations: Array<{
    type: 'missing_document' | 'overdue_filing' | 'validation_error';
    description: string;
    severity: 'warning' | 'critical';
    documentId?: string;
  }>;
}> {
  const violations: Array<{
    type: 'missing_document' | 'overdue_filing' | 'validation_error';
    description: string;
    severity: 'warning' | 'critical';
    documentId?: string;
  }> = [];
  // Check for overdue submissions
  const filingStatus = await getFilingStatusSummary(companyId);
  if (filingStatus.overdue > 0) {
    violations.push({
      type: 'overdue_filing',
      description: `${filingStatus.overdue} filing(s) are overdue`,
      severity: 'critical',
    });
  }
  // Check for documents in draft state that should be completed
  const { data: draftDocs } = await supabase
    .from('regulatory_documents')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'draft')
    .lte('fiscal_year', new Date().getFullYear() - 1);
  if (draftDocs && draftDocs.length > 0) {
    violations.push({
      type: 'missing_document',
      description: `${draftDocs.length} document(s) for prior years are still in draft`,
      severity: 'warning',
    });
  }
  return {
    isCompliant: violations.length === 0,
    violations,
  };
}
/**
 * Export submission data to CSV
 */
export async function exportSubmissionsToCSV(companyId: string): Promise<string> {
  const { data: submissions, error } = await supabase
    .from('regulatory_submissions')
    .select(
      `
      id,
      document_id,
      submission_date,
      submission_method,
      status,
      regulatory_documents(document_type, country_code, accounting_standard)
    `
    )
    .eq('regulatory_documents.company_id', companyId);
  if (error || !submissions) {
    return '';
  }
  const headers = ['Submission ID', 'Document Type', 'Country', 'Submitted Date', 'Method', 'Status'];
  const rows = (submissions as any[]).map((s) => [
    s.id,
    s.regulatory_documents?.document_type || '',
    s.regulatory_documents?.country_code || '',
    s.submission_date,
    s.submission_method,
    s.status,
  ]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');
  return csv;
}
export default {
  trackSubmission,
  updateSubmissionStatus,
  getUpcomingDeadlines,
  getFilingStatusSummary,
  getDocumentStatistics,
  getSubmissionHistory,
  generateComplianceReport,
  checkCompliance,
  exportSubmissionsToCSV,
};
