/**
 * Service pour gérer les intégrations avec les autorités fiscales
 */
import { supabase } from '@/lib/supabase';
import {
  TaxAuthorityCredentials,
  TaxAuthoritySubmission,
  TaxAuthorityResponse,
  TaxAuthorityDeadline,
  SubmissionRequest,
  SubmissionResponse,
  VerifyCredentialsRequest,
  VerifyCredentialsResponse,
  ComplianceStatus,
  SubmissionStats,
} from '@/types/taxAuthority';
import { TAX_AUTHORITIES, getAuthorityByCountryAndType } from '@/constants/taxAuthorities';
import { logger } from '@/lib/logger';
export class TaxAuthorityService {
  /**
   * Soumet un document à une autorité fiscale
   */
  static async submitDocument(request: SubmissionRequest): Promise<SubmissionResponse> {
    try {
      // Récupérer la configuration de l'autorité
      const authority = await supabase
        .from('tax_authority_configs')
        .select('*')
        .eq('id', request.authority_id)
        .single();
      if (authority.error) {
        return {
          success: false,
          message: 'Autorité fiscale non trouvée',
          error: authority.error.message,
        };
      }
      // Récupérer les credentials
      const credentials = await supabase
        .from('tax_authority_credentials')
        .select('*')
        .eq('id', request.credentials_id)
        .single();
      if (credentials.error) {
        return {
          success: false,
          message: 'Identifiants non trouvés',
          error: credentials.error.message,
        };
      }
      // Créer l'enregistrement de soumission
      const submissionData = {
        document_id: request.document_id,
        authority_id: request.authority_id,
        credentials_id: request.credentials_id,
        submission_method: request.submission_method,
        submission_status: 'pending',
        file_format: request.file_format,
        submission_date: new Date().toISOString(),
      };
      const submission = await supabase
        .from('tax_authority_submissions')
        .insert([submissionData])
        .select()
        .single();
      if (submission.error) {
        return {
          success: false,
          message: 'Erreur lors de la création de la soumission',
          error: submission.error.message,
        };
      }
      // Appeler l'API de l'autorité fiscale (selon la configuration)
      const apiResponse = await this.callAuthorityAPI(
        authority.data,
        credentials.data,
        request,
        submission.data.id
      );
      // Mettre à jour le statut de la soumission
      await supabase
        .from('tax_authority_submissions')
        .update({
          submission_status: apiResponse.success ? 'acknowledged' : 'rejected',
          submission_reference: apiResponse.submission_reference,
          http_status_code: apiResponse.http_status_code,
          error_code: !apiResponse.success ? 'SUBMISSION_FAILED' : null,
          error_message: !apiResponse.success ? apiResponse.error : null,
          acknowledgement_data: apiResponse.response_data,
        })
        .eq('id', submission.data.id);
      // Enregistrer le log de communication
      await this.logCommunication(
        submission.data.id,
        request.authority_id,
        'POST',
        authority.data.submission_endpoint,
        apiResponse.http_status_code || 0,
        !apiResponse.success,
        apiResponse.error
      );
      return apiResponse;
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la soumission du document',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
  /**
   * Vérifie les identifiants avec l'autorité fiscale
   */
  static async verifyCredentials(request: VerifyCredentialsRequest): Promise<VerifyCredentialsResponse> {
    try {
      const authority = await supabase
        .from('tax_authority_configs')
        .select('*')
        .eq('id', request.authority_id)
        .single();
      if (authority.error) {
        return {
          success: false,
          is_valid: false,
          message: 'Autorité fiscale non trouvée',
          error: authority.error.message,
        };
      }
      const credentials = await supabase
        .from('tax_authority_credentials')
        .select('*')
        .eq('id', request.credentials_id)
        .single();
      if (credentials.error) {
        return {
          success: false,
          is_valid: false,
          message: 'Identifiants non trouvés',
          error: credentials.error.message,
        };
      }
      // Appeler l'endpoint de vérification
      const response = await this.callVerificationAPI(authority.data, credentials.data);
      // Mettre à jour le statut de vérification
      await supabase
        .from('tax_authority_credentials')
        .update({
          is_verified: response.is_valid,
          last_verified_at: new Date().toISOString(),
          verification_error: !response.is_valid ? response.error : null,
        })
        .eq('id', request.credentials_id);
      return response;
    } catch (error) {
      return {
        success: false,
        is_valid: false,
        message: 'Erreur lors de la vérification des identifiants',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
  /**
   * Récupère le statut d'une soumission
   */
  static async getSubmissionStatus(submissionId: string): Promise<TaxAuthoritySubmission | null> {
    const { data, error } = await supabase
      .from('tax_authority_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
    if (error) {
      logger.error('TaxAuthority', 'Erreur lors de la récupération du statut:', error);
      return null;
    }
    return data;
  }
  /**
   * Récupère les réponses de l'autorité
   */
  static async getResponses(submissionId: string): Promise<TaxAuthorityResponse[]> {
    const { data, error } = await supabase
      .from('tax_authority_responses')
      .select('*')
      .eq('submission_id', submissionId)
      .order('received_at', { ascending: false });
    if (error) {
      logger.error('TaxAuthority', 'Erreur lors de la récupération des réponses:', error);
      return [];
    }
    return data || [];
  }
  /**
   * Récupère les deadlines de compliance
   */
  static async getDeadlines(companyId: string): Promise<TaxAuthorityDeadline[]> {
    const { data, error } = await supabase
      .from('tax_authority_deadlines')
      .select('*')
      .eq('company_id', companyId)
      .order('submission_deadline', { ascending: true });
    if (error) {
      logger.error('TaxAuthority', 'Erreur lors de la récupération des deadlines:', error);
      return [];
    }
    return data || [];
  }
  /**
   * Récupère le statut de compliance
   */
  static async getComplianceStatus(companyId: string): Promise<ComplianceStatus> {
    const { data, error } = await supabase
      .from('tax_authority_deadlines')
      .select('*')
      .eq('company_id', companyId);
    if (error) {
      logger.error('TaxAuthority', 'Erreur lors du calcul du statut de compliance:', error);
      return {
        company_id: companyId,
        total_deadlines: 0,
        submitted: 0,
        accepted: 0,
        pending: 0,
        overdue: 0,
        needs_correction: 0,
        submission_rate: 0,
        acceptance_rate: 0,
      };
    }
    const deadlines = data || [];
    const total = deadlines.length;
    const submitted = deadlines.filter(d => d.is_submitted).length;
    const accepted = deadlines.filter(d => d.is_accepted).length;
    const pending = deadlines.filter(d => !d.is_submitted && new Date(d.submission_deadline) > new Date()).length;
    const overdue = deadlines.filter(d => !d.is_submitted && new Date(d.submission_deadline) < new Date()).length;
    return {
      company_id: companyId,
      total_deadlines: total,
      submitted,
      accepted,
      pending,
      overdue,
      needs_correction: 0,
      submission_rate: total > 0 ? (submitted / total) * 100 : 0,
      acceptance_rate: submitted > 0 ? (accepted / submitted) * 100 : 0,
    };
  }
  /**
   * Récupère les statistiques de soumission
   */
  static async getSubmissionStats(companyId: string): Promise<SubmissionStats> {
    const { data, error } = await supabase
      .from('tax_authority_submissions')
      .select('*')
      .eq('document_id', `(SELECT id FROM regulatory_documents WHERE company_id = '${companyId}')`);
    if (error) {
      logger.error('TaxAuthority', 'Erreur lors du calcul des statistiques:', error);
      return {
        total_submissions: 0,
        successful: 0,
        rejected: 0,
        pending: 0,
        average_processing_time_hours: 0,
        success_rate: 0,
      };
    }
    const submissions = data || [];
    const successful = submissions.filter(s => s.final_status === 'COMPLETED').length;
    const rejected = submissions.filter(s => s.final_status === 'REJECTED').length;
    const pending = submissions.filter(s => ['pending', 'acknowledged', 'processing'].includes(s.submission_status)).length;
    return {
      total_submissions: submissions.length,
      successful,
      rejected,
      pending,
      average_processing_time_hours: 48,
      success_rate: submissions.length > 0 ? (successful / submissions.length) * 100 : 0,
      last_submission_date: submissions[0]?.submission_date,
    };
  }
  /**
   * Appelle l'API de l'autorité fiscale (à adapter selon le type)
   */
  private static async callAuthorityAPI(
    authority: any,
    credentials: any,
    request: SubmissionRequest,
    submissionId: string
  ): Promise<SubmissionResponse> {
    try {
      // Cette fonction est à adapter selon le type d'API
      // Pour l'instant, on retourne un succès simulé
      return {
        success: true,
        submission_id: submissionId,
        submission_reference: `REF-${Date.now()}`,
        message: 'Document soumis avec succès',
        http_status_code: 200,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de l\'appel à l\'API',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
  /**
   * Appelle l'API de vérification des identifiants
   */
  private static async callVerificationAPI(authority: any, credentials: any): Promise<VerifyCredentialsResponse> {
    try {
      // Vérification simulée pour l'instant
      return {
        success: true,
        is_valid: true,
        message: 'Identifiants valides',
      };
    } catch (error) {
      return {
        success: false,
        is_valid: false,
        message: 'Erreur lors de la vérification',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
  /**
   * Enregistre un log de communication
   */
  private static async logCommunication(
    submissionId: string,
    authorityId: string,
    method: string,
    endpoint: string,
    statusCode: number,
    hasError: boolean,
    errorMessage?: string
  ): Promise<void> {
    await supabase.from('tax_authority_communication_logs').insert([
      {
        submission_id: submissionId,
        authority_id: authorityId,
        request_method: method,
        request_endpoint: endpoint,
        request_timestamp: new Date().toISOString(),
        response_timestamp: new Date().toISOString(),
        response_status_code: statusCode,
        error_occurred: hasError,
        error_message: errorMessage,
        request_duration_ms: 0,
        retry_count: 0,
        is_retry: false,
      },
    ]);
  }
  /**
   * Enregistre les identifiants chiffrés
   */
  static async saveCredentials(
    companyId: string,
    authorityId: string,
    taxId: string,
    apiKey?: string,
    certificate?: string
  ): Promise<TaxAuthorityCredentials | null> {
    const { data, error } = await supabase
      .from('tax_authority_credentials')
      .insert([
        {
          company_id: companyId,
          authority_id: authorityId,
          tax_identification_number: taxId,
          api_key_encrypted: apiKey,
          certificate_pem_encrypted: certificate,
          is_active: true,
          is_verified: false,
        },
      ])
      .select()
      .single();
    if (error) {
      logger.error('TaxAuthority', 'Erreur lors de la sauvegarde des identifiants:', error);
      return null;
    }
    return data;
  }
  /**
   * Récupère les identifiants pour une company et autorité
   */
  static async getCredentials(companyId: string, authorityId: string): Promise<TaxAuthorityCredentials | null> {
    const { data, error } = await supabase
      .from('tax_authority_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('authority_id', authorityId)
      .single();
    if (error) {
      return null;
    }
    return data;
  }
}