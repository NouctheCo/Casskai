import { supabase } from '@/lib/supabase';

export interface EmailConfig {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  variables?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  path?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  variables: string[];
  category: string;
}

export interface EmailServiceResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Templates d'emails intégrés
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  overdue_invoice_reminder: {
    id: 'overdue_invoice_reminder',
    name: 'Rappel facture impayée',
    subject: 'Rappel: Facture {{invoice_number}} en retard de paiement',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #dc3545; margin-bottom: 20px;">Rappel de paiement</h2>

        <p>Bonjour {{client_name}},</p>

        <p>Nous vous informons que la facture <strong>{{invoice_number}}</strong> d'un montant de <strong>{{invoice_amount}}</strong> est en retard de paiement.</p>

        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>Détails de la facture :</h4>
          <ul>
            <li>Numéro : {{invoice_number}}</li>
            <li>Date d'émission : {{invoice_date}}</li>
            <li>Date d'échéance : {{due_date}}</li>
            <li>Montant : {{invoice_amount}}</li>
            <li>Jours de retard : {{days_overdue}}</li>
          </ul>
        </div>

        <p>Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.</p>

        <p>Pour toute question, n'hésitez pas à nous contacter.</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px;">
            Cordialement,<br>
            {{company_name}}<br>
            {{company_email}}<br>
            {{company_phone}}
          </p>
        </div>
      </div>
    </div>`,
    variables: ['client_name', 'invoice_number', 'invoice_amount', 'invoice_date', 'due_date', 'days_overdue', 'company_name', 'company_email', 'company_phone'],
    category: 'invoicing'
  },

  monthly_report: {
    id: 'monthly_report',
    name: 'Rapport mensuel automatique',
    subject: 'Rapport mensuel {{month}} {{year}} - {{company_name}}',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #28a745; margin-bottom: 20px;">📊 Rapport mensuel {{month}} {{year}}</h2>

        <p>Bonjour,</p>

        <p>Veuillez trouver ci-joint votre rapport financier mensuel pour {{month}} {{year}}.</p>

        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>Résumé des indicateurs :</h4>
          <ul>
            <li>Chiffre d'affaires : {{revenue}}</li>
            <li>Charges : {{expenses}}</li>
            <li>Résultat net : {{net_result}}</li>
            <li>Trésorerie : {{cash_flow}}</li>
          </ul>
        </div>

        <p>Les rapports détaillés sont disponibles en pièces jointes.</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px;">
            Rapport généré automatiquement par CassKai<br>
            {{company_name}}
          </p>
        </div>
      </div>
    </div>`,
    variables: ['month', 'year', 'company_name', 'revenue', 'expenses', 'net_result', 'cash_flow'],
    category: 'reports'
  },

  workflow_notification: {
    id: 'workflow_notification',
    name: 'Notification de workflow',
    subject: 'CassKai: {{workflow_name}} - {{status}}',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #007bff; margin-bottom: 20px;">🤖 Notification d'automatisation</h2>

        <p>Bonjour,</p>

        <p>Le workflow "<strong>{{workflow_name}}</strong>" s'est exécuté avec le statut : <strong>{{status}}</strong></p>

        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>Détails de l'exécution :</h4>
          <ul>
            <li>Workflow : {{workflow_name}}</li>
            <li>Statut : {{status}}</li>
            <li>Date d'exécution : {{execution_date}}</li>
            <li>Durée : {{duration}}</li>
            {{#if error_message}}
            <li style="color: #dc3545;">Erreur : {{error_message}}</li>
            {{/if}}
          </ul>
        </div>

        {{#if results}}
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>Résultats :</h4>
          <p>{{results}}</p>
        </div>
        {{/if}}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px;">
            Notification automatique CassKai<br>
            {{company_name}}
          </p>
        </div>
      </div>
    </div>`,
    variables: ['workflow_name', 'status', 'execution_date', 'duration', 'error_message', 'results', 'company_name'],
    category: 'automation'
  }
};

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!this.instance) {
      this.instance = new EmailService();
    }
    return this.instance;
  }

  /**
   * Remplace les variables dans un template HTML
   */
  private replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    }

    // Gestion des conditionnels simples {{#if variable}} ... {{/if}}
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return variables[varName] ? content : '';
    });

    return result;
  }

  /**
   * Envoie un email via Supabase Edge Functions
   */
  async sendEmail(config: EmailConfig, companyId: string): Promise<EmailServiceResponse> {
    try {
      let html = config.html || '';
      let subject = config.subject;

      // Si un template est spécifié, l'utiliser
      if (config.template && EMAIL_TEMPLATES[config.template]) {
        const template = EMAIL_TEMPLATES[config.template];
        html = template.html;
        subject = config.subject || template.subject;

        // Remplacer les variables si fournies
        if (config.variables) {
          html = this.replaceTemplateVariables(html, config.variables);
          subject = this.replaceTemplateVariables(subject, config.variables);
        }
      } else if (config.variables && html) {
        // Remplacer les variables dans le HTML fourni
        html = this.replaceTemplateVariables(html, config.variables);
        subject = this.replaceTemplateVariables(subject, config.variables);
      }

      // Appeler la Edge Function Supabase pour l'envoi d'email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: config.to,
          cc: config.cc,
          bcc: config.bcc,
          subject,
          html,
          text: config.text,
          attachments: config.attachments,
          companyId
        }
      });

      if (error) {
        console.error('Erreur envoi email:', error);
        return {
          success: false,
          error: error.message || 'Erreur lors de l\'envoi de l\'email'
        };
      }

      // Log de l'envoi en base pour audit
      await this.logEmailSent({
        company_id: companyId,
        to: config.to,
        subject,
        template_id: config.template,
        status: 'sent',
        message_id: data?.messageId
      });

      return {
        success: true,
        messageId: data?.messageId
      };

    } catch (error) {
      console.error('Erreur EmailService:', error instanceof Error ? error.message : String(error));

      // En cas d'erreur, on peut fallback sur un faux envoi pour le développement
      if (process.env.NODE_ENV === 'development') {
        console.warn('📧 [DEV MODE] Email simulé:', {
          to: config.to,
          subject: config.subject,
          template: config.template
        });

        return {
          success: true,
          messageId: `dev_${Date.now()}`
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Log les emails envoyés pour audit
   */
  private async logEmailSent(logData: {
    company_id: string;
    to: string[];
    subject: string;
    template_id?: string;
    status: string;
    message_id?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('email_logs')
        .insert({
          ...logData,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Impossible de logger l\'email:', error);
    }
  }

  /**
   * Récupère les templates disponibles
   */
  getAvailableTemplates(): EmailTemplate[] {
    return Object.values(EMAIL_TEMPLATES);
  }

  /**
   * Test de connectivité email
   */
  async testEmailConfiguration(companyId: string): Promise<EmailServiceResponse> {
    return this.sendEmail({
      to: ['test@example.com'],
      subject: 'Test de configuration CassKai',
      html: '<p>Ceci est un test de configuration email pour CassKai.</p>'
    }, companyId);
  }

  /**
   * Envoie un email avec template prédéfini
   */
  async sendTemplateEmail(
    templateId: string,
    to: string[],
    variables: Record<string, any>,
    companyId: string
  ): Promise<EmailServiceResponse> {
    const template = EMAIL_TEMPLATES[templateId];
    if (!template) {
      return {
        success: false,
        error: `Template ${templateId} non trouvé`
      };
    }

    return this.sendEmail({
      to,
      template: templateId,
      subject: template.subject,
      variables
    }, companyId);
  }
}

export const emailService = EmailService.getInstance();
