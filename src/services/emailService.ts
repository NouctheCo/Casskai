/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface EmailConfiguration {
  id: string;
  company_id: string;
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'aws_ses' | 'custom_api';
  is_active: boolean;
  is_verified: boolean;
  
  // SMTP
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_username?: string;
  smtp_password?: string;
  
  // API
  api_key?: string;
  api_endpoint?: string;
  
  // Sender info
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  email_signature?: string;
  
  // Limits
  daily_limit: number;
  monthly_limit: number;
  emails_sent_today: number;
  emails_sent_month: number;
  
  // Monitoring
  last_test_date?: string;
  last_test_status?: string;
  last_error?: string;
  total_emails_sent?: number;
  total_errors?: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  available_variables: string[];
  is_system: boolean;
  usage_count: number;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template_id?: string;
  variables?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
  workflow_id?: string;
  workflow_execution_id?: string;
}

export interface EmailLog {
  id: string;
  company_id: string;
  recipient_email: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

// =====================================================
// EMAIL SERVICE
// =====================================================

class EmailService {
  /**
   * Get active email configuration for company
   */
  async getActiveConfiguration(companyId: string): Promise<EmailConfiguration | null> {
    const { data, error } = await supabase
      .from('email_configurations')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .eq('is_verified', true)
      .single();

    if (error) {
      console.error('Error fetching email configuration:', error);
      return null;
    }

    return data;
  }

  /**
   * Get all email configurations for company
   */
  async getConfigurations(companyId: string): Promise<EmailConfiguration[]> {
    const { data, error } = await supabase
      .from('email_configurations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create email configuration
   */
  async createConfiguration(
    companyId: string,
    config: Partial<EmailConfiguration>
  ): Promise<EmailConfiguration> {
    const { data, error} = await supabase
      .from('email_configurations')
      .insert({
        company_id: companyId,
        ...config
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update email configuration
   */
  async updateConfiguration(
    configId: string,
    updates: Partial<EmailConfiguration>
  ): Promise<EmailConfiguration> {
    const { data, error } = await supabase
      .from('email_configurations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Test email configuration
   */
  async testConfiguration(configId: string, testEmail: string): Promise<boolean> {
    try {
      const { data: config } = await supabase
        .from('email_configurations')
        .select('*')
        .eq('id', configId)
        .single();

      if (!config) throw new Error('Configuration non trouvée');

      const result = await this.sendEmailDirect(config, {
        to: testEmail,
        subject: '✅ Test de configuration email - CassKai',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Test de Configuration Email Réussi! ✅</h2>
                <p>Félicitations ! Votre configuration email fonctionne correctement.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Configuration testée:</strong></p>
                  <ul>
                    <li>Fournisseur: ${config.provider}</li>
                    <li>Email d'envoi: ${config.from_email}</li>
                    <li>Nom d'envoi: ${config.from_name}</li>
                  </ul>
                </div>
                <p>Vous pouvez maintenant utiliser cette configuration pour vos automatisations.</p>
                ${config.email_signature || ''}
              </div>
            </body>
          </html>
        `,
        text: 'Test de configuration email réussi! Votre configuration fonctionne correctement.'
      });

      // Update test status
      await supabase
        .from('email_configurations')
        .update({
          last_test_date: new Date().toISOString(),
          last_test_status: 'success',
          is_verified: true
        })
        .eq('id', configId);

      return result;
    } catch (error: any) {
      // Log error
      await supabase
        .from('email_configurations')
        .update({
          last_test_date: new Date().toISOString(),
          last_test_status: 'failed',
          last_error: error.message
        })
        .eq('id', configId);

      throw error;
    }
  }

  /**
   * Send email using company configuration
   */
  async sendEmail(
    companyId: string,
    params: SendEmailParams
  ): Promise<boolean> {
    const config = await this.getActiveConfiguration(companyId);
    
    if (!config) {
      throw new Error('Aucune configuration email active. Veuillez configurer votre email dans les paramètres.');
    }

    // Check limits
    if (config.emails_sent_today >= config.daily_limit) {
      throw new Error(`Limite quotidienne atteinte (${config.daily_limit} emails/jour)`);
    }

    if (config.emails_sent_month >= config.monthly_limit) {
      throw new Error(`Limite mensuelle atteinte (${config.monthly_limit} emails/mois)`);
    }

    // Get template if specified
    let html = params.html;
    let text = params.text;
    let subject = params.subject;

    if (params.template_id) {
      const template = await this.getTemplate(params.template_id);
      if (template) {
        subject = this.replaceVariables(template.subject, params.variables);
        html = this.replaceVariables(template.body_html, params.variables);
        text = this.replaceVariables(template.body_text || '', params.variables);
      }
    }

    // Add signature
    if (config.email_signature && html) {
      html += `<br><br>${config.email_signature}`;
    }

    // Send email
    const success = await this.sendEmailDirect(config, {
      to: params.to,
      subject,
      html,
      text,
      attachments: params.attachments
    });

    if (success) {
      // Increment counter
      await supabase.rpc('increment_email_counter', { config_id: config.id });

      // Log email
      const recipients = Array.isArray(params.to) ? params.to : [params.to];
      for (const recipient of recipients) {
        await this.logEmail(companyId, {
          email_config_id: config.id,
          workflow_id: params.workflow_id,
          workflow_execution_id: params.workflow_execution_id,
          recipient_email: recipient,
          subject,
          body_html: html,
          body_text: text,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
      }
    }

    return success;
  }

  /**
   * Send email directly with configuration
   */
  private async sendEmailDirect(
    config: EmailConfiguration,
    params: {
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
      attachments?: any[];
    }
  ): Promise<boolean> {
    switch (config.provider) {
      case 'smtp':
        return this.sendViaSMTP(config, params);
      
      case 'sendgrid':
        return this.sendViaSendGrid(config, params);
      
      case 'mailgun':
        return this.sendViaMailgun(config, params);
      
      case 'aws_ses':
        return this.sendViaAWSSES(config, params);
      
      default:
        throw new Error(`Provider ${config.provider} non supporté`);
    }
  }

  /**
   * Send via SMTP (requires server-side implementation)
   */
  private async sendViaSMTP(
    config: EmailConfiguration,
    params: {
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
      attachments?: any[];
    }
  ): Promise<boolean> {
    // Call backend API endpoint that handles SMTP
    const response = await fetch('/api/email/send-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          host: config.smtp_host,
          port: config.smtp_port,
          secure: config.smtp_secure,
          username: config.smtp_username,
          password: config.smtp_password,
          from_email: config.from_email,
          from_name: config.from_name,
          reply_to: config.reply_to_email
        },
        params
      })
    });

    return response.ok;
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(
    config: EmailConfiguration,
    params: {
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
    }
  ): Promise<boolean> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: recipients.map(email => ({ email }))
          }
        ],
        from: {
          email: config.from_email,
          name: config.from_name
        },
        reply_to: config.reply_to_email ? { email: config.reply_to_email } : undefined,
        subject: params.subject,
        content: [
          {
            type: 'text/plain',
            value: params.text || ''
          },
          {
            type: 'text/html',
            value: params.html || ''
          }
        ]
      })
    });

    return response.ok;
  }

  /**
   * Send via Mailgun
   */
  private async sendViaMailgun(
    config: EmailConfiguration,
    params: {
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
    }
  ): Promise<boolean> {
    const formData = new URLSearchParams();
    formData.append('from', `${config.from_name} <${config.from_email}>`);
    formData.append('to', Array.isArray(params.to) ? params.to.join(',') : params.to);
    formData.append('subject', params.subject);
    if (params.html) formData.append('html', params.html);
    if (params.text) formData.append('text', params.text);
    if (config.reply_to_email) formData.append('h:Reply-To', config.reply_to_email);

    const response = await fetch(config.api_endpoint || '', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${config.api_key}`)}`
      },
      body: formData
    });

    return response.ok;
  }

  /**
   * Send via AWS SES (requires server-side implementation)
   */
  private async sendViaAWSSES(
    config: EmailConfiguration,
    params: {
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
    }
  ): Promise<boolean> {
    // Call backend API endpoint that handles AWS SES
    const response = await fetch('/api/email/send-ses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config,
        params
      })
    });

    return response.ok;
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(
    template: string,
    variables?: Record<string, string>
  ): string {
    if (!variables) return template;

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Get email template
   */
  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get templates for company
   */
  async getTemplates(companyId: string): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Log email
   */
  private async logEmail(
    companyId: string,
    log: any
  ): Promise<void> {
    await supabase
      .from('email_logs')
      .insert({
        company_id: companyId,
        ...log
      });
  }

  /**
   * Get email logs
   */
  async getLogs(companyId: string, limit = 100): Promise<EmailLog[]> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const emailService = new EmailService();
