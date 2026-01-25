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

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import { invoicingService, type InvoiceWithDetails } from '@/services/invoicingService';
import { InvoicePdfService } from '@/services/invoicePdfService';
import CompanySettingsService from '@/services/companySettingsService';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import type { CompanySettings } from '@/types/company-settings.types';

interface EmailAttachment {
  content: string;
  filename: string;
  type: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments: EmailAttachment[];
}

export function useInvoiceEmail() {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<Date | null>(null);

  /**
   * Récupère les paramètres de l'entreprise
   */
  const getCompanySettings = useCallback(async (): Promise<CompanySettings | null> => {
    try {
      if (!currentCompany?.id) {
        logger.warn('useInvoiceEmail', 'No current company available');
        return null;
      }
      return await CompanySettingsService.getCompanySettings(currentCompany.id);
    } catch (error) {
      logger.error('useInvoiceEmail', 'Failed to load company settings:', error);
      return null;
    }
  }, [currentCompany]);

  /**
   * Vérifie si la configuration email est active
   * ✅ Vérifie Gmail OAuth ET les configurations SMTP/SendGrid
   */
  const isEmailConfigActive = useCallback(async (): Promise<boolean> => {
    try {
      if (!currentCompany?.id) return false;

      // 1. Vérifier Gmail OAuth en premier (prioritaire)
      const { data: gmailToken } = await supabase
        .from('email_oauth_tokens')
        .select('id, is_active')
        .eq('company_id', currentCompany.id)
        .eq('provider', 'gmail')
        .eq('is_active', true)
        .maybeSingle();

      if (gmailToken) {
        logger.info('useInvoiceEmail', 'Gmail OAuth is configured and active');
        return true;
      }

      // 2. Sinon vérifier les configurations SMTP/SendGrid/etc
      const { data, error } = await supabase
        .from('email_configurations')
        .select('id, is_active')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        logger.warn('useInvoiceEmail', 'No email configuration found:', error);
        return false;
      }

      return data?.is_active === true;
    } catch (error) {
      logger.error('useInvoiceEmail', 'Error checking email config:', error);
      return false;
    }
  }, [currentCompany]);

  /**
   * Génère le HTML de l'email
   */
  const generateEmailHtml = (
    invoice: InvoiceWithDetails,
    companySettings: CompanySettings | null
  ): string => {
    const companyName = companySettings?.generalInfo?.name || 'Votre Entreprise';
    const companyEmail = companySettings?.contact?.email || '';
    const companyPhone = companySettings?.contact?.phone || '';
    const companyAddress = companySettings?.contact?.address?.street || '';
    const companyCity = companySettings?.contact?.address?.city || '';
    const companyPostalCode = companySettings?.contact?.address?.postalCode || '';
    const iban = companySettings?.accounting?.mainBank?.iban || '';
    const bic = companySettings?.accounting?.mainBank?.bic || '';
    const bankName = companySettings?.accounting?.mainBank?.name || '';

    const clientName = invoice.third_party?.name || 'Cher client';
    const invoiceNumber = invoice.invoice_number;
    const issueDate = new Date(invoice.invoice_date as string).toLocaleDateString('fr-FR');
    const dueDate = invoice.due_date
      ? new Date(invoice.due_date as string).toLocaleDateString('fr-FR')
      : 'Non spécifiée';
    const totalTtc = Number(invoice.total_incl_tax ?? 0);
    const currency = invoice.currency || getCurrentCompanyCurrency();

    const formatCurrency = (amount: number) => {
      // ✅ Fix: S'assurer que amount est un nombre valide
      const validAmount = isNaN(amount) ? 0 : amount;
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency
      }).format(validAmount);
    };

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facture ${invoiceNumber}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
          <tr>
            <td align="center">
              <!-- Container principal -->
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header avec gradient bleu -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2962ff 0%, #1e88e5 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${companyName}</h1>
                    <p style="color: #e3f2fd; margin: 10px 0 0 0; font-size: 16px;">Nouvelle facture disponible</p>
                  </td>
                </tr>

                <!-- Contenu -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Bonjour ${clientName},
                    </p>
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                      Veuillez trouver ci-joint votre facture. Merci de nous faire parvenir votre règlement avant la date d'échéance.
                    </p>

                    <!-- Box détails facture -->
                    <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                      <tr>
                        <td>
                          <table width="100%" cellpadding="5" cellspacing="0">
                            <tr>
                              <td style="color: #666666; font-size: 14px; padding: 5px 0;">
                                <strong style="color: #333333;">Facture N°:</strong>
                              </td>
                              <td style="color: #333333; font-size: 14px; text-align: right; padding: 5px 0;">
                                ${invoiceNumber}
                              </td>
                            </tr>
                            <tr>
                              <td style="color: #666666; font-size: 14px; padding: 5px 0;">
                                <strong style="color: #333333;">Date d'émission:</strong>
                              </td>
                              <td style="color: #333333; font-size: 14px; text-align: right; padding: 5px 0;">
                                ${issueDate}
                              </td>
                            </tr>
                            <tr>
                              <td style="color: #666666; font-size: 14px; padding: 5px 0;">
                                <strong style="color: #333333;">Date d'échéance:</strong>
                              </td>
                              <td style="color: #333333; font-size: 14px; text-align: right; padding: 5px 0;">
                                ${dueDate}
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding-top: 15px; border-top: 2px solid #dee2e6;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="color: #2962ff; font-size: 18px; font-weight: bold; padding: 10px 0;">
                                      Montant total:
                                    </td>
                                    <td style="color: #2962ff; font-size: 24px; font-weight: bold; text-align: right; padding: 10px 0;">
                                      ${formatCurrency(totalTtc)}
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${iban ? `
                    <!-- Coordonnées bancaires -->
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
                      <p style="color: #856404; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">
                        Coordonnées bancaires pour le paiement :
                      </p>
                      ${bankName ? `<p style="color: #856404; font-size: 13px; margin: 5px 0;"><strong>Banque:</strong> ${bankName}</p>` : ''}
                      <p style="color: #856404; font-size: 13px; margin: 5px 0;"><strong>IBAN:</strong> ${iban}</p>
                      ${bic ? `<p style="color: #856404; font-size: 13px; margin: 5px 0;"><strong>BIC:</strong> ${bic}</p>` : ''}
                    </div>
                    ` : ''}

                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                      Pour toute question concernant cette facture, n'hésitez pas à nous contacter.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">
                      ${companyName}
                    </p>
                    ${companyAddress ? `<p style="color: #666666; font-size: 12px; margin: 5px 0;">${companyAddress}</p>` : ''}
                    ${companyCity && companyPostalCode ? `<p style="color: #666666; font-size: 12px; margin: 5px 0;">${companyPostalCode} ${companyCity}</p>` : ''}
                    ${companyEmail ? `<p style="color: #666666; font-size: 12px; margin: 5px 0;">Email: <a href="mailto:${companyEmail}" style="color: #2962ff; text-decoration: none;">${companyEmail}</a></p>` : ''}
                    ${companyPhone ? `<p style="color: #666666; font-size: 12px; margin: 5px 0;">Tél: ${companyPhone}</p>` : ''}
                    <p style="color: #999999; font-size: 11px; margin: 15px 0 0 0;">
                      Email envoyé via <a href="https://casskai.app" style="color: #2962ff; text-decoration: none;">CassKai</a> - Gestion financière intelligente
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };

  /**
   * Génère le texte brut de l'email (fallback)
   */
  const generateEmailText = (
    invoice: InvoiceWithDetails,
    companySettings: CompanySettings | null
  ): string => {
    const companyName = companySettings?.generalInfo?.name || 'Votre Entreprise';
    const clientName = invoice.third_party?.name || 'Cher client';
    const invoiceNumber = invoice.invoice_number;
    const issueDate = new Date(invoice.invoice_date as string).toLocaleDateString('fr-FR');
    const dueDate = invoice.due_date
      ? new Date(invoice.due_date as string).toLocaleDateString('fr-FR')
      : 'Non spécifiée';
    const totalTtc = Number(invoice.total_incl_tax ?? 0);
    const currency = invoice.currency || getCurrentCompanyCurrency();

    const formatCurrency = (amount: number) => {
      // ✅ Fix: S'assurer que amount est un nombre valide
      const validAmount = isNaN(amount) ? 0 : amount;
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency
      }).format(validAmount);
    };

    return `
${companyName}
Nouvelle facture disponible

Bonjour ${clientName},

Veuillez trouver ci-joint votre facture. Merci de nous faire parvenir votre règlement avant la date d'échéance.

Détails de la facture :
- Facture N°: ${invoiceNumber}
- Date d'émission: ${issueDate}
- Date d'échéance: ${dueDate}
- Montant total: ${formatCurrency(totalTtc)}

Pour toute question concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,
${companyName}
    `.trim();
  };

  /**
   * Envoie une facture par email
   */
  const sendInvoiceByEmail = useCallback(async (invoiceId: string): Promise<boolean> => {
    // Empêcher les envois multiples
    if (isSending) {
      logger.warn('useInvoiceEmail', 'Email sending already in progress, ignoring duplicate call');
      return false;
    }

    setIsSending(true);

    try {
      // 1. Récupérer la facture complète avec les relations
      const invoice = await invoicingService.getInvoiceById(invoiceId);
      if (!invoice) {
        toast({
          title: 'Erreur',
          description: 'Facture introuvable',
          variant: 'destructive'
        });
        return false;
      }

      // 2. Vérifier que l'email du client existe
      const clientEmail = invoice.third_party?.email;
      if (!clientEmail) {
        toast({
          title: 'Erreur',
          description: 'Aucun email trouvé pour ce client',
          variant: 'destructive'
        });
        return false;
      }

      // 3. Vérifier la configuration email
      const isConfigActive = await isEmailConfigActive();
      if (!isConfigActive) {
        toast({
          title: 'Configuration requise',
          description: 'Veuillez configurer vos paramètres d\'email dans les réglages',
          variant: 'destructive'
        });
        return false;
      }

      // 4. Récupérer les paramètres de l'entreprise
      const companySettings = await getCompanySettings();

      // 5. Générer le PDF
      const companyData = {
        name: companySettings?.generalInfo?.name || 'Votre Entreprise',
        address: companySettings?.contact?.address?.street || '',
        city: companySettings?.contact?.address?.city || '',
        postalCode: companySettings?.contact?.address?.postalCode || '',
        phone: companySettings?.contact?.phone || '',
        email: companySettings?.contact?.email || '',
        website: companySettings?.contact?.website || '',
        siret: companySettings?.generalInfo?.siret || '',
        vatNumber: companySettings?.generalInfo?.vatNumber || '',
        logo: companySettings?.branding?.logoUrl || '',
        legalMentions: companySettings?.branding?.legalMentions || '',
        defaultTerms: companySettings?.branding?.defaultTermsConditions || '',
        shareCapital: companySettings?.generalInfo?.shareCapital || '',
        mainBankName: companySettings?.accounting?.mainBank?.name || '',
        mainBankIban: companySettings?.accounting?.mainBank?.iban || '',
        mainBankBic: companySettings?.accounting?.mainBank?.bic || '',
        currency: companySettings?.business?.currency || 'EUR'
      };

      const pdfDoc = InvoicePdfService.generateInvoicePDF(invoice, companyData);
      const pdfDataUri = pdfDoc.output('datauristring');
      const pdfBase64 = pdfDataUri.split(',')[1];

      // 6. Préparer le payload email
      const emailPayload: EmailPayload = {
        to: clientEmail,
        subject: `Facture ${invoice.invoice_number} - ${companyData.name}`,
        html: generateEmailHtml(invoice, companySettings),
        text: generateEmailText(invoice, companySettings),
        attachments: [
          {
            content: pdfBase64,
            filename: `Facture_${invoice.invoice_number}.pdf`,
            type: 'application/pdf'
          }
        ]
      };

      // 7. Vérifier si Gmail OAuth est configuré
      const { data: gmailToken } = await supabase
        .from('email_oauth_tokens')
        .select('id')
        .eq('company_id', currentCompany!.id)
        .eq('provider', 'gmail')
        .eq('is_active', true)
        .maybeSingle();

      let data, error;

      if (gmailToken) {
        // ✅ Utiliser gmail-send pour Gmail OAuth
        logger.info('useInvoiceEmail', 'Sending via Gmail OAuth');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('No active session for Gmail OAuth');
        }

        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gmail-send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            companyId: currentCompany!.id,
            to: emailPayload.to,
            subject: emailPayload.subject,
            html: emailPayload.html,
            attachments: emailPayload.attachments
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          error = errorData;
          data = null;
        } else {
          data = await response.json();
          error = null;
        }
      } else {
        // ✅ Utiliser send-email pour SMTP/SendGrid/etc
        logger.info('useInvoiceEmail', 'Sending via SMTP/SendGrid');
        const result = await supabase.functions.invoke('send-email', {
          body: emailPayload
        });
        data = result.data;
        error = result.error;
      }

      if (error) {
        logger.error('useInvoiceEmail', 'Failed to send email:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'envoyer l\'email. Vérifiez votre configuration.',
          variant: 'destructive'
        });
        return false;
      }

      // 8. Si la facture est en brouillon, la passer à "envoyée"
      if (invoice.status === 'draft') {
        await invoicingService.updateInvoiceStatus(invoiceId, 'sent');
      }

      // 9. Enregistrer la date d'envoi
      setLastSent(new Date());

      // 10. Afficher le message de succès
      toast({
        title: 'Email envoyé',
        description: `La facture ${invoice.invoice_number} a été envoyée à ${clientEmail}`,
        variant: 'default'
      });

      logger.info('useInvoiceEmail', 'Invoice email sent successfully:', {
        invoiceId,
        clientEmail,
        response: data
      });

      return true;
    } catch (error) {
      logger.error('useInvoiceEmail', 'Unexpected error sending invoice email:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite lors de l\'envoi',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSending(false);
    }
  }, [currentCompany, toast, getCompanySettings, isEmailConfigActive]);

  return {
    sendInvoiceByEmail,
    isSending,
    lastSent
  };
}
