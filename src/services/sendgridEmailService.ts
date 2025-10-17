/**
 * SendGrid Email Service
 * Handles transactional emails via SendGrid
 *
 * NOTE: This service should run on the BACKEND (Supabase Edge Function or Node.js server)
 * SendGrid API key must NEVER be exposed in frontend code
 *
 * Usage: Import this in your Edge Functions or backend API
 */

import sgMail from '@sendgrid/mail';
import { logger } from '@/utils/logger';

// Types
export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    content: string; // Base64 encoded
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
}

export interface WelcomeEmailData {
  userName: string;
  companyName?: string;
  activationLink?: string;
}

export interface InvoiceEmailData {
  invoiceNumber: string;
  clientName: string;
  amount: number;
  currency: string;
  dueDate: string;
  invoiceUrl: string;
  pdfAttachment?: {
    content: string;
    filename: string;
  };
}

export interface PasswordResetData {
  userName: string;
  resetLink: string;
  expiresIn: string;
}

export interface PaymentConfirmationData {
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  receiptUrl?: string;
}

/**
 * Initialize SendGrid with API key
 * Should be called once at server startup
 */
export function initializeSendGrid(apiKey: string) {
  if (!apiKey) {
    logger.warn('⚠️  SendGrid API key not provided. Email sending disabled.');
    return false;
  }

  sgMail.setApiKey(apiKey);
  logger.info('✅ SendGrid initialized');
  return true;
}

/**
 * Send a generic email
 */
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    const msg = {
      to: template.to,
      from: template.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@casskai.app',
      replyTo: template.replyTo,
      subject: template.subject,
      text: template.text,
      html: template.html,
      attachments: template.attachments,
    };

    await sgMail.send(msg);
    logger.info(`📧 Email sent to ${template.to}`);
    return true;
  } catch (error) {
    logger.error('❌ Email sending failed:', error);
    return false;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, data: WelcomeEmailData): Promise<boolean> {
  const subject = `Bienvenue sur CassKai, ${data.userName} ! 🎉`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue sur CassKai ! 🎉</h1>
    </div>
    <div class="content">
      <p>Bonjour ${data.userName},</p>

      <p>Merci d'avoir rejoint <strong>CassKai</strong>, la plateforme de gestion financière tout-en-un pour les PME et indépendants en Afrique de l'Ouest.</p>

      ${data.companyName ? `<p>Votre entreprise <strong>${data.companyName}</strong> est maintenant configurée et prête à l'emploi !</p>` : ''}

      <p><strong>Que pouvez-vous faire avec CassKai ?</strong></p>
      <ul>
        <li>📊 Gérer votre comptabilité en toute simplicité</li>
        <li>💸 Créer et envoyer des factures professionnelles</li>
        <li>💰 Suivre vos paiements et relances automatiques</li>
        <li>📈 Analyser vos performances avec des rapports détaillés</li>
        <li>🏦 Synchroniser vos comptes bancaires</li>
      </ul>

      ${data.activationLink ? `
      <p style="text-align: center;">
        <a href="${data.activationLink}" class="button">Activer mon compte</a>
      </p>
      ` : ''}

      <p>Besoin d'aide pour démarrer ? Consultez notre <a href="https://docs.casskai.app">guide de démarrage</a> ou contactez notre support.</p>

      <p>À très bientôt,<br><strong>L'équipe CassKai</strong></p>
    </div>
    <div class="footer">
      <p>CassKai - Votre partenaire de gestion financière<br>
      📧 <a href="mailto:support@casskai.app">support@casskai.app</a> | 🌐 <a href="https://casskai.app">casskai.app</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Bienvenue sur CassKai, ${data.userName} !

Merci d'avoir rejoint CassKai, la plateforme de gestion financière tout-en-un pour les PME et indépendants en Afrique de l'Ouest.

${data.companyName ? `Votre entreprise ${data.companyName} est maintenant configurée !` : ''}

Que pouvez-vous faire avec CassKai ?
- Gérer votre comptabilité
- Créer et envoyer des factures
- Suivre vos paiements
- Analyser vos performances
- Synchroniser vos comptes bancaires

${data.activationLink ? `Activez votre compte : ${data.activationLink}` : ''}

Besoin d'aide ? https://docs.casskai.app

L'équipe CassKai
support@casskai.app | https://casskai.app
  `;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Send invoice email to client
 */
export async function sendInvoiceEmail(email: string, data: InvoiceEmailData): Promise<boolean> {
  const subject = `Facture ${data.invoiceNumber} - ${data.amount.toLocaleString()} ${data.currency}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .invoice-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Nouvelle Facture</h2>
    </div>
    <div class="content">
      <p>Bonjour ${data.clientName},</p>

      <p>Vous avez reçu une nouvelle facture :</p>

      <div class="invoice-details">
        <p><strong>Numéro :</strong> ${data.invoiceNumber}</p>
        <p><strong>Montant :</strong> ${data.amount.toLocaleString()} ${data.currency}</p>
        <p><strong>Date d'échéance :</strong> ${data.dueDate}</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.invoiceUrl}" class="button">Voir la facture</a>
      </p>

      <p>Merci de votre confiance !</p>
    </div>
    <div class="footer">
      <p>Cet email a été envoyé via CassKai</p>
    </div>
  </div>
</body>
</html>
  `;

  const attachments = data.pdfAttachment ? [data.pdfAttachment] : undefined;

  return sendEmail({ to: email, subject, html, attachments });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, data: PasswordResetData): Promise<boolean> {
  const subject = 'Réinitialisation de votre mot de passe CassKai';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Réinitialisation de mot de passe</h2>
    </div>
    <div class="content">
      <p>Bonjour ${data.userName},</p>

      <p>Vous avez demandé à réinitialiser votre mot de passe CassKai.</p>

      <p style="text-align: center;">
        <a href="${data.resetLink}" class="button">Réinitialiser mon mot de passe</a>
      </p>

      <div class="warning">
        <strong>⚠️ Important :</strong> Ce lien expire dans ${data.expiresIn}.
      </div>

      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe reste inchangé.</p>

      <p>Cordialement,<br>L'équipe CassKai</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(email: string, data: PaymentConfirmationData): Promise<boolean> {
  const subject = `Paiement reçu - Facture ${data.invoiceNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .payment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ Paiement Confirmé</h2>
    </div>
    <div class="content">
      <p>Nous avons bien reçu votre paiement !</p>

      <div class="payment-details">
        <p><strong>Facture :</strong> ${data.invoiceNumber}</p>
        <p><strong>Montant :</strong> ${data.amount.toLocaleString()} ${data.currency}</p>
        <p><strong>Date :</strong> ${data.paymentDate}</p>
        <p><strong>Méthode :</strong> ${data.paymentMethod}</p>
      </div>

      ${data.receiptUrl ? `
      <p style="text-align: center;">
        <a href="${data.receiptUrl}" class="button">Télécharger le reçu</a>
      </p>
      ` : ''}

      <p>Merci pour votre paiement !</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(
  email: string,
  invoiceNumber: string,
  amount: number,
  currency: string,
  daysOverdue: number
): Promise<boolean> {
  const subject = `Rappel - Facture ${invoiceNumber} en retard`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .reminder { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Rappel de Paiement</h2>
    </div>
    <div class="content">
      <p>Bonjour,</p>

      <p>Nous vous rappelons que la facture <strong>${invoiceNumber}</strong> est en retard de <strong>${daysOverdue} jour(s)</strong>.</p>

      <div class="reminder">
        <p><strong>Montant dû :</strong> ${amount.toLocaleString()} ${currency}</p>
      </div>

      <p>Merci de régulariser cette situation dans les meilleurs délais.</p>

      <p>Cordialement</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({ to: email, subject, html });
}

export default {
  initializeSendGrid,
  sendEmail,
  sendWelcomeEmail,
  sendInvoiceEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
  sendPaymentReminderEmail,
};
