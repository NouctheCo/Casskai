/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Service de gestion des communications RFA
 * Permet d'envoyer des emails aux tiers-parties concernant les calculs RFA
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { emailService } from '@/services/emailService';

// =====================================================
// TYPES
// =====================================================

export type CommunicationType = 'rfa_notification' | 'rfa_reminder' | 'rfa_summary' | 'rfa_statement' | 'custom';
export type CommunicationStatus = 'draft' | 'pending' | 'sent' | 'failed' | 'cancelled';
export type RecipientType = 'third_party_contact' | 'manual_email' | 'employee';

export interface RFACommunication {
  id: string;
  company_id: string;
  rfa_calculation_id?: string;
  contract_id?: string;
  third_party_id?: string;
  communication_type: CommunicationType;
  recipient_type: RecipientType;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  attachments?: CommunicationAttachment[];
  status: CommunicationStatus;
  sent_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CommunicationAttachment {
  filename: string;
  content: string; // Base64
  content_type: string;
}

export interface CreateCommunicationParams {
  company_id: string;
  rfa_calculation_id?: string;
  contract_id?: string;
  third_party_id?: string;
  communication_type: CommunicationType;
  recipient_type: RecipientType;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  attachments?: CommunicationAttachment[];
  metadata?: Record<string, unknown>;
  created_by?: string;
}

export interface RFACommunicationWithRelations extends RFACommunication {
  third_party?: {
    id: string;
    name: string;
    email?: string;
  };
  contract?: {
    id: string;
    name: string;
  };
  rfa_calculation?: {
    id: string;
    calculation_period: string;
    rfa_amount: number;
  };
}

export interface RFAEmailTemplateData {
  company_name: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  third_party_name: string;
  contract_name?: string;
  calculation_period?: string;
  period_start?: string;
  period_end?: string;
  turnover_amount?: number;
  rfa_percentage?: number;
  rfa_amount?: number;
  currency?: string;
  custom_message?: string;
}

// =====================================================
// SERVICE
// =====================================================

class RFACommunicationsService {
  /**
   * Crée une nouvelle communication RFA (en brouillon)
   */
  async createCommunication(params: CreateCommunicationParams): Promise<RFACommunication> {
    const { data, error } = await supabase
      .from('rfa_communications')
      .insert({
        ...params,
        status: 'draft',
        attachments: params.attachments ? JSON.stringify(params.attachments) : null
      })
      .select()
      .single();

    if (error) {
      logger.error('RFACommunications', 'Erreur création communication:', error);
      throw error;
    }

    return data;
  }

  /**
   * Récupère les communications pour une entreprise
   * Note: Les relations sont chargées séparément car third_parties est une vue
   */
  async getCommunications(
    companyId: string,
    options?: {
      contract_id?: string;
      third_party_id?: string;
      status?: CommunicationStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: RFACommunicationWithRelations[]; count: number }> {
    // Requête simple sans joins (third_parties est une vue, pas de FK possible)
    let query = supabase
      .from('rfa_communications')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (options?.contract_id) {
      query = query.eq('contract_id', options.contract_id);
    }
    if (options?.third_party_id) {
      query = query.eq('third_party_id', options.third_party_id);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('RFACommunications', 'Erreur récupération communications:', error);
      throw error;
    }

    // Parse les pièces jointes JSON et retourne les données sans enrichissement
    // Les infos third_party sont déjà stockées dans recipient_name/recipient_email
    const parsedData = (data || []).map(comm => ({
      ...comm,
      attachments: comm.attachments ? (typeof comm.attachments === 'string' ? JSON.parse(comm.attachments) : comm.attachments) : [],
      // Les relations seront undefined - on utilise recipient_name/recipient_email à la place
      third_party: undefined,
      contract: undefined,
      rfa_calculation: undefined
    })) as RFACommunicationWithRelations[];

    return { data: parsedData, count: count || 0 };
  }

  /**
   * Récupère une communication par ID
   */
  async getCommunicationById(id: string): Promise<RFACommunicationWithRelations | null> {
    const { data, error } = await supabase
      .from('rfa_communications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('RFACommunications', 'Erreur récupération communication:', error);
      return null;
    }

    return {
      ...data,
      attachments: data.attachments ? (typeof data.attachments === 'string' ? JSON.parse(data.attachments) : data.attachments) : [],
      third_party: undefined,
      contract: undefined,
      rfa_calculation: undefined
    } as RFACommunicationWithRelations;
  }

  /**
   * Met à jour une communication
   */
  async updateCommunication(
    id: string,
    updates: Partial<CreateCommunicationParams>
  ): Promise<RFACommunication> {
    const { data, error } = await supabase
      .from('rfa_communications')
      .update({
        ...updates,
        attachments: updates.attachments ? JSON.stringify(updates.attachments) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('RFACommunications', 'Erreur mise à jour communication:', error);
      throw error;
    }

    return data;
  }

  /**
   * Supprime une communication (uniquement si draft ou failed)
   */
  async deleteCommunication(id: string): Promise<void> {
    const { error } = await supabase
      .from('rfa_communications')
      .delete()
      .eq('id', id)
      .in('status', ['draft', 'failed']);

    if (error) {
      logger.error('RFACommunications', 'Erreur suppression communication:', error);
      throw error;
    }
  }

  /**
   * Envoie une communication par email
   */
  async sendCommunication(communicationId: string): Promise<boolean> {
    // 1. Récupérer la communication
    const communication = await this.getCommunicationById(communicationId);
    if (!communication) {
      throw new Error('Communication non trouvée');
    }

    if (communication.status === 'sent') {
      throw new Error('Cette communication a déjà été envoyée');
    }

    // 2. Marquer comme pending
    await supabase
      .from('rfa_communications')
      .update({ status: 'pending' })
      .eq('id', communicationId);

    try {
      // 3. Envoyer l'email via le service email
      const success = await emailService.sendEmail(communication.company_id, {
        to: communication.recipient_email,
        subject: communication.subject,
        html: communication.body_html,
        text: communication.body_text,
        attachments: communication.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.content_type
        }))
      });

      if (success) {
        // 4. Marquer comme envoyé
        await supabase
          .from('rfa_communications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            error_message: null
          })
          .eq('id', communicationId);

        logger.info('RFACommunications', `Communication ${communicationId} envoyée avec succès`);
        return true;
      } else {
        throw new Error('Échec de l\'envoi de l\'email');
      }
    } catch (error: any) {
      // 5. Marquer comme échoué
      await supabase
        .from('rfa_communications')
        .update({
          status: 'failed',
          error_message: error.message || 'Erreur inconnue'
        })
        .eq('id', communicationId);

      logger.error('RFACommunications', `Erreur envoi communication ${communicationId}:`, error);
      throw error;
    }
  }

  /**
   * Envoie plusieurs communications en lot
   */
  async sendBulkCommunications(communicationIds: string[]): Promise<{
    sent: string[];
    failed: { id: string; error: string }[];
  }> {
    const results = {
      sent: [] as string[],
      failed: [] as { id: string; error: string }[]
    };

    for (const id of communicationIds) {
      try {
        await this.sendCommunication(id);
        results.sent.push(id);
      } catch (error: any) {
        results.failed.push({ id, error: error.message });
      }
    }

    return results;
  }

  /**
   * Génère le HTML d'un email RFA à partir d'un template
   */
  generateRFAEmailHtml(data: RFAEmailTemplateData): string {
    const formatCurrency = (amount: number, currency: string = 'EUR') => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency
      }).format(amount);
    };

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('fr-FR');
    };

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Communication RFA</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                      ${data.company_name}
                    </h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">
                      Relevé de Remises de Fin d'Année (RFA)
                    </p>
                  </td>
                </tr>
                
                <!-- Contenu principal -->
                <tr>
                  <td style="padding: 30px;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                      Cher/Chère <strong>${data.third_party_name}</strong>,
                    </p>
                    
                    ${data.custom_message ? `
                    <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      ${data.custom_message}
                    </p>
                    ` : ''}
                    
                    ${data.contract_name ? `
                    <!-- Informations du contrat -->
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">
                        📄 Contrat: ${data.contract_name}
                      </h3>
                      
                      ${data.calculation_period ? `
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                        <strong>Période:</strong> ${data.calculation_period}
                        ${data.period_start && data.period_end ? 
                          `(${formatDate(data.period_start)} - ${formatDate(data.period_end)})` : ''}
                      </p>
                      ` : ''}
                      
                      ${data.turnover_amount !== undefined ? `
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                        <strong>Chiffre d'affaires réalisé:</strong> 
                        ${formatCurrency(data.turnover_amount, data.currency)}
                      </p>
                      ` : ''}
                      
                      ${data.rfa_percentage !== undefined ? `
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                        <strong>Taux de remise appliqué:</strong> ${data.rfa_percentage}%
                      </p>
                      ` : ''}
                    </div>
                    ` : ''}
                    
                    ${data.rfa_amount !== undefined ? `
                    <!-- Montant RFA -->
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center;">
                      <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 5px 0;">
                        Montant de votre RFA
                      </p>
                      <p style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">
                        ${formatCurrency(data.rfa_amount, data.currency)}
                      </p>
                    </div>
                    ` : ''}
                    
                    <p style="color: #6b7280; font-size: 13px; margin: 20px 0 0 0;">
                      Pour toute question concernant ce relevé, n'hésitez pas à nous contacter.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                      ${data.company_name}
                      ${data.company_address ? `<br>${data.company_address}` : ''}
                      ${data.company_email ? `<br>Email: ${data.company_email}` : ''}
                      ${data.company_phone ? ` | Tél: ${data.company_phone}` : ''}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #9ca3af; font-size: 11px; margin: 20px 0 0 0; text-align: center;">
                Cet email a été généré automatiquement par CassKai.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Génère le texte brut d'un email RFA
   */
  generateRFAEmailText(data: RFAEmailTemplateData): string {
    const formatCurrency = (amount: number, currency: string = 'EUR') => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency
      }).format(amount);
    };

    let text = `${data.company_name}\n`;
    text += `Relevé de Remises de Fin d'Année (RFA)\n\n`;
    text += `Cher/Chère ${data.third_party_name},\n\n`;
    
    if (data.custom_message) {
      text += `${data.custom_message}\n\n`;
    }
    
    if (data.contract_name) {
      text += `Contrat: ${data.contract_name}\n`;
      if (data.calculation_period) {
        text += `Période: ${data.calculation_period}\n`;
      }
      if (data.turnover_amount !== undefined) {
        text += `Chiffre d'affaires: ${formatCurrency(data.turnover_amount, data.currency)}\n`;
      }
      if (data.rfa_percentage !== undefined) {
        text += `Taux de remise: ${data.rfa_percentage}%\n`;
      }
      text += `\n`;
    }
    
    if (data.rfa_amount !== undefined) {
      text += `Montant de votre RFA: ${formatCurrency(data.rfa_amount, data.currency)}\n\n`;
    }
    
    text += `Pour toute question, n'hésitez pas à nous contacter.\n\n`;
    text += `Cordialement,\n${data.company_name}`;
    
    if (data.company_email) {
      text += `\nEmail: ${data.company_email}`;
    }
    if (data.company_phone) {
      text += `\nTél: ${data.company_phone}`;
    }
    
    return text;
  }

  /**
   * Récupère les statistiques des communications
   */
  async getCommunicationStats(companyId: string): Promise<{
    total: number;
    sent: number;
    pending: number;
    failed: number;
    draft: number;
  }> {
    const { data, error } = await supabase
      .from('rfa_communications')
      .select('status')
      .eq('company_id', companyId);

    if (error) {
      logger.error('RFACommunications', 'Erreur récupération stats:', error);
      throw error;
    }

    const stats = {
      total: data?.length || 0,
      sent: 0,
      pending: 0,
      failed: 0,
      draft: 0
    };

    data?.forEach(comm => {
      if (comm.status === 'sent') stats.sent++;
      else if (comm.status === 'pending') stats.pending++;
      else if (comm.status === 'failed') stats.failed++;
      else if (comm.status === 'draft') stats.draft++;
    });

    return stats;
  }
}

export const rfaCommunicationsService = new RFACommunicationsService();
