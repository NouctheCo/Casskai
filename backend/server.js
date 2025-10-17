import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@casskai.app';

const EMAIL_TEMPLATES = {
  overdue_invoice_reminder: {
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
    </div>`
  },
  monthly_report: {
    subject: 'Rapport mensuel {{month}} {{year}} - {{company_name}}',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #28a745; margin-bottom: 20px;">Rapport mensuel {{month}} {{year}}</h2>

        <p>Bonjour,</p>

        <p>Veuillez trouver ci-joint votre rapport financier mensuel pour {{month}} {{year}}.</p>

        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0%;">
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
    </div>`
  },
  workflow_notification: {
    subject: 'CassKai: {{workflow_name}} - {{status}}',
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #007bff; margin-bottom: 20px;">Notification d'automatisation</h2>

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
    </div>`
  }
};

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const replaceTemplateVariables = (content, variables = {}) => {
  if (!content) return content;
  let result = content;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  });

  result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (_, varName, section) => {
    return variables[varName] ? section : '';
  });

  return result;
};

const resolveEmailTemplate = ({ template, variables, subject, html }) => {
  if (template && EMAIL_TEMPLATES[template]) {
    const templateDef = EMAIL_TEMPLATES[template];
    const resolvedSubject = replaceTemplateVariables(subject || templateDef.subject, variables);
    const resolvedHtml = replaceTemplateVariables(html || templateDef.html, variables);
    return { subject: resolvedSubject, html: resolvedHtml };
  }

  return {
    subject: replaceTemplateVariables(subject || '', variables),
    html: replaceTemplateVariables(html || '', variables)
  };
};

const sendTransactionalEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  text,
  from,
  attachments = [],
}) => {
  if (!SENDGRID_API_KEY) {
    throw new Error('Email service not configured');
  }

  const recipients = toArray(to);
  if (!recipients.length) {
    throw new Error('At least one recipient (to) is required');
  }

  const personalizations = [
    {
      to: recipients.map((email) => ({ email })),
      ...(toArray(cc).length ? { cc: toArray(cc).map((email) => ({ email })) } : {}),
      ...(toArray(bcc).length ? { bcc: toArray(bcc).map((email) => ({ email })) } : {}),
    },
  ];

  const payload = {
    personalizations,
    from: {
      email: from || SENDGRID_FROM_EMAIL,
      name: 'CassKai',
    },
    subject,
    content: [
      ...(html ? [{ type: 'text/html', value: html }] : []),
      ...(text ? [{ type: 'text/plain', value: text }] : []),
    ],
    ...(attachments.length
      ? {
          attachments: attachments.map((att) => ({
            content: att.content,
            filename: att.filename,
            type: att.type || att.contentType || 'application/octet-stream',
            disposition: 'attachment',
          })),
        }
      : {}),
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to send email');
  }

  return {
    messageId: response.headers.get('x-message-id') || null,
  };
};

const sendEmailInternal = async (body) => {
  const { template, variables, subject, html } = body;
  const { subject: resolvedSubject, html: resolvedHtml } = resolveEmailTemplate({
    template,
    variables,
    subject,
    html,
  });

  return sendTransactionalEmail({
    to: body.to,
    cc: body.cc,
    bcc: body.bcc,
    subject: resolvedSubject || 'CassKai',
    html: resolvedHtml,
    text: body.text,
    from: body.from,
    attachments: (body.attachments || []).map((att) => ({
      filename: att.filename,
      content: att.content,
      type: att.type || att.contentType,
    })),
  });
};

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for reverse proxy setups (Traefik, Nginx, etc.)
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Webhook endpoint (before JSON parsing)
app.use('/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for other routes
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    stripe: !!process.env.STRIPE_SECRET_KEY,
    supabase: !!process.env.SUPABASE_URL
  });
});

const configuredRedirectUrls = (process.env.ALLOWED_REDIRECT_URLS || "")
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

const defaultFrontendUrl = process.env.FRONTEND_URL || allowedOrigins[0] || "http://localhost:5173";
const redirectOrigins = [...allowedOrigins, defaultFrontendUrl, ...configuredRedirectUrls].filter(Boolean);
const allowedRedirectHosts = new Set();
redirectOrigins.forEach(origin => {
  try {
    const normalized = new URL(origin);
    allowedRedirectHosts.add(normalized.host);
  } catch {
    console.warn('Ignoring invalid redirect origin:', origin);
  }
});

const ALLOWED_METADATA_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'ref'
]);

const resolveDefaultCurrency = (country, requestedCurrency) => {
  if (requestedCurrency) {
    return requestedCurrency;
  }

  switch (country) {
    case 'FR':
      return 'EUR';
    case 'SN':
    case 'CI':
    case 'ML':
    case 'BF':
      return 'XOF';
    case 'MA':
      return 'MAD';
    case 'TN':
      return 'TND';
    case 'CM':
      return 'XAF';
    default:
      return 'EUR';
  }
};

const toIsoDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split('T')[0];
};

const parseNumeric = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Extract company name with fallbacks
 */
const extractCompanyName = (companyInput) => {
  if (typeof companyInput.name === 'string' && companyInput.name.trim()) {
    return companyInput.name.trim();
  }
  if (typeof companyInput?.generalInfo?.name === 'string' && companyInput.generalInfo.name.trim()) {
    return companyInput.generalInfo.name.trim();
  }
  return 'Entreprise CassKai';
};

/**
 * Extract company country with fallbacks
 */
const extractCountry = (companyInput) => {
  return companyInput.country || companyInput?.contact?.address?.country || 'FR';
};

/**
 * Extract currency with fallbacks
 */
const extractCurrency = (companyInput) => {
  return companyInput.default_currency || companyInput.currency || companyInput?.business?.currency || null;
};

/**
 * Extract contact information
 */
const extractContactInfo = (companyInput) => ({
  phone: companyInput.phone || companyInput?.contact?.phone || null,
  email: companyInput.email || companyInput?.contact?.email || null,
  website: companyInput.website || companyInput?.contact?.website || null
});

/**
 * Extract business information
 */
const extractBusinessInfo = (companyInput) => ({
  timezone: companyInput.timezone || companyInput?.business?.timezone || 'Europe/Paris',
  sector: companyInput.sector || companyInput?.business?.sector || null,
  industry_type: companyInput.industry_type || companyInput.industryType || null,
  company_size: companyInput.company_size || companyInput.companySize || null
});

/**
 * Extract CEO information
 */
const extractCeoInfo = (companyInput) => ({
  ceo_name: companyInput.ceo_name || companyInput.ceoName || companyInput?.generalInfo?.ceoName || null,
  ceo_title: companyInput.ceo_title || companyInput.ceoTitle || 'CEO'
});

const buildCompanyPayload = (companyInput = {}, ownerId, timestamp, fallbackId) => {
  const country = extractCountry(companyInput);
  const desiredCurrency = extractCurrency(companyInput);
  const contactInfo = extractContactInfo(companyInput);
  const businessInfo = extractBusinessInfo(companyInput);
  const ceoInfo = extractCeoInfo(companyInput);

  const shareCapital = parseNumeric(
    companyInput.share_capital ??
    companyInput.shareCapital ??
    companyInput?.generalInfo?.shareCapital
  );

  const registrationDate = toIsoDate(
    companyInput.registration_date ||
    companyInput.registrationDate ||
    companyInput?.generalInfo?.registrationDate
  );

  return {
    id: companyInput.id || fallbackId,
    name: extractCompanyName(companyInput),
    country,
    default_currency: resolveDefaultCurrency(country, desiredCurrency),
    share_capital: shareCapital,
    registration_date: registrationDate,
    ...businessInfo,
    ...ceoInfo,
    ...contactInfo,
    owner_id: ownerId,
    created_at: companyInput.created_at || companyInput.createdAt || timestamp,
    updated_at: timestamp,
    status: companyInput.status || 'active',
    is_active: companyInput.is_active ?? true
  };
};

function buildAllowedUrl(candidateUrl, fallbackUrl) {
  const safeFallback = new URL(fallbackUrl);

  if (!candidateUrl) {
    return safeFallback.toString();
  }

  let parsed;
  try {
    parsed = new URL(candidateUrl);
  } catch {
    throw new Error('Invalid redirect URL');
  }

  if (!allowedRedirectHosts.has(parsed.host)) {
    throw new Error('Redirect URL host is not allowed');
  }

  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && !parsed.hostname.startsWith('localhost:')) {
    throw new Error('Redirect URL must use HTTPS');
  }

  return parsed.toString();
}

function sanitizeMetadata(rawMetadata) {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return {};
  }

  return Object.entries(rawMetadata).reduce((acc, [key, value]) => {
    if (!ALLOWED_METADATA_KEYS.has(key) || value === undefined || value === null) {
      return acc;
    }

    acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
    return acc;
  }, {});
}

/**
 * Build module records for database insertion
 * @param {string} companyId - The company ID
 * @param {Array<string>} moduleKeys - Array of module keys to enable
 * @param {string} timestamp - ISO timestamp for created_at/updated_at
 * @returns {Array<object>} Module records ready for upsert
 */
function buildModuleRecords(companyId, moduleKeys, timestamp) {
  if (!Array.isArray(moduleKeys) || moduleKeys.length === 0) {
    return [];
  }
  
  return moduleKeys.map(moduleKey => ({
    company_id: companyId,
    module_key: moduleKey,
    is_enabled: true,
    created_at: timestamp,
    updated_at: timestamp
  }));
}

/**
 * Create or retrieve company record
 * @param {object} companyPayload - Company data to insert
 * @param {string} companyId - Company ID for duplicate check
 * @returns {Promise<object>} Company record
 */
async function createOrRetrieveCompany(companyPayload, companyId) {
  const { data: insertedCompany, error: companyInsertError } = await supabase
    .from('companies')
    .insert([companyPayload])
    .select()
    .single();

  if (companyInsertError) {
    if (companyInsertError.code === '23505' || companyInsertError.message?.toLowerCase().includes('duplicate')) {
      const { data: existingCompany, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (fetchError || !existingCompany) {
        throw new Error(fetchError?.message || 'Company already exists but could not be retrieved');
      }
      return existingCompany;
    } else {
      throw new Error(companyInsertError.message || 'Failed to create company');
    }
  }
  
  return insertedCompany;
}

/**
 * Upsert company modules
 * @param {string} companyId - Company ID
 * @param {Array<string>} modulePayload - Array of module keys
 * @param {string} timestamp - ISO timestamp
 * @returns {Promise<number>} Number of modules upserted
 */
async function upsertCompanyModules(companyId, modulePayload, timestamp) {
  const moduleRecords = buildModuleRecords(companyId, modulePayload, timestamp);
  
  if (moduleRecords.length === 0) {
    return 0;
  }

  const { data: moduleData, error: modulesError } = await supabase
    .from('company_modules')
    .upsert(moduleRecords, { onConflict: 'company_id,module_key' })
    .select('module_key');

  if (modulesError) {
    throw new Error(modulesError.message || 'Failed to persist company modules');
  }

  return Array.isArray(moduleData) ? moduleData.length : moduleRecords.length;
}

/**
 * Create or update user-company link
 * @param {object} params - Parameters for user-company link
 * @returns {Promise<object>} User-company record
 */
async function linkUserToCompany({ userId, companyId, timestamp, payload = {} }) {
  const userCompanyPayload = {
    id: payload.userCompanyId || crypto.randomUUID(),
    user_id: userId,
    company_id: companyId,
    role: payload.role || 'owner',
    permissions: payload.permissions || {
      admin: true,
      read: true,
      write: true,
      delete: true
    },
    is_active: payload.is_active ?? true,
    is_default: payload.is_default ?? true,
    created_at: timestamp,
    updated_at: timestamp
  };

  const { data: userCompany, error: userCompanyError } = await supabase
    .from('user_companies')
    .upsert(userCompanyPayload, { onConflict: 'user_id,company_id' })
    .select()
    .single();

  if (userCompanyError) {
    throw new Error(userCompanyError.message || 'Failed to link user to company');
  }

  return userCompany;
}

/**
 * Initialize company accounting data (chart of accounts + journals)
 * @param {string} companyId - Company ID
 * @param {string} countryCode - Country code (e.g., 'FR')
 * @returns {Promise<object>} Initialization results
 */
async function initializeCompanyAccounting(companyId, countryCode) {
  const results = { chartInit: null, journalsInit: null };

  // Initialize chart of accounts
  try {
    const { data: chartData, error: chartError } = await supabase.rpc('initialize_company_chart_of_accounts', {
      p_company_id: companyId,
      p_country_code: countryCode || 'FR'
    });

    if (chartError) {
      console.warn('Chart of accounts initialization warning:', chartError);
    } else {
      results.chartInit = chartData;
    }
  } catch (chartError) {
    console.warn('Chart of accounts initialization failed:', chartError);
  }

  // Initialize default journals
  try {
    const { data: journalsData, error: journalsError } = await supabase.rpc('create_default_journals', {
      p_company_id: companyId
    });

    if (journalsError) {
      console.warn('Default journals creation warning:', journalsError);
    } else {
      results.journalsInit = journalsData;
    }
  } catch (journalsError) {
    console.warn('Default journals creation failed:', journalsError);
  }

  return results;
}

/**
 * Log onboarding step completion
 * @param {object} params - Logging parameters
 * @returns {Promise<string|null>} Log step ID
 */
async function logOnboardingStep({ companyId, userId, payload, modulePayload }) {
  if (payload.logStep === false) {
    return null;
  }

  try {
    const { data: logResult, error: logError } = await supabase.rpc('log_onboarding_step', {
      p_company_id: companyId,
      p_user_id: userId,
      p_step_name: payload.stepName || 'company',
      p_step_order: payload.stepOrder ?? 3,
      p_step_data: {
        company_id: companyId,
        company_name: payload.company?.name || payload.companyData?.name,
        selected_modules: modulePayload
      },
      p_completion_status: 'completed',
      p_time_spent_seconds: payload.timeSpentSeconds ?? 0,
      p_session_id: payload.sessionToken || null,
      p_validation_errors: []
    });

    if (logError) {
      console.warn('Failed to log onboarding step:', logError);
      return null;
    }

    if (Array.isArray(logResult) && logResult.length > 0) {
      return logResult[0];
    } else if (typeof logResult === 'string') {
      return logResult;
    }
  } catch (logError) {
    console.warn('Failed to log onboarding step:', logError);
  }

  return null;
}

async function resolveStripeCustomerId(user) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to lookup Stripe customer: ${error.message}`);
  }

  if (data && data.length > 0 && data[0].stripe_customer_id) {
    return data[0].stripe_customer_id;
  }

  if (!user.email) {
    throw new Error('User email is required to create Stripe customer');
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { user_id: user.id }
  });

  return customer.id;
}

async function getUserSubscriptionByStripeId(userId, stripeSubscriptionId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('id, stripe_customer_id')
    .eq('user_id', userId)
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to validate subscription ownership: ${error.message}`);
  }

  return data;
}

const ensureAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    req.user = data.user;
    return next();
  } catch (error) {
    console.error('ensureAuthenticated error:', error);
    return res.status(500).json({ error: 'Authentication verification failed' });
  }
};

app.post('/api/email/send', ensureAuthenticated, async (req, res) => {
  try {
    const {
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      template,
      variables,
      attachments = [],
      from,
    } = req.body || {};

    if (!to || (!template && !html && !text && !subject)) {
      return res.status(400).json({
        error: 'Missing required fields: to and either template or html/subject',
      });
    }

    const normalizedAttachments = attachments.map((att) => ({
      filename: att.filename,
      content:
        typeof att.content === 'string'
          ? att.content
          : Buffer.from(att.content || '').toString('base64'),
      type: att.type || att.contentType,
    }));

    const result = await sendEmailInternal({
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      template,
      variables,
      attachments: normalizedAttachments,
      from,
    });

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send email',
    });
  }
});

app.post('/api/onboarding/company', ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const payload = req.body || {};
  const companyInput = payload.company || payload.companyData || {};
  const timestamp = new Date().toISOString();
  const companyId = companyInput.id || crypto.randomUUID();

  if (!companyInput.name || !companyInput.country) {
    return res.status(400).json({
      success: false,
      error: 'Missing required company fields: name and country'
    });
  }

  const companyPayload = buildCompanyPayload(companyInput, user.id, timestamp, companyId);

  try {
    // Create or retrieve company
    const companyRecord = await createOrRetrieveCompany(companyPayload, companyId);

    // Handle modules
    const modulePayload = Array.isArray(payload.selectedModules) ? payload.selectedModules : [];
    const modulesUpserted = await upsertCompanyModules(companyRecord.id, modulePayload, timestamp);

    // Link user to company
    const userCompany = await linkUserToCompany({
      userId: user.id,
      companyId: companyRecord.id,
      timestamp,
      payload
    });

    // Initialize accounting data
    const { chartInit, journalsInit } = await initializeCompanyAccounting(
      companyRecord.id,
      companyRecord.country
    );

    // Log onboarding step
    const logStepId = await logOnboardingStep({
      companyId: companyRecord.id,
      userId: user.id,
      payload,
      modulePayload
    });

    return res.status(200).json({
      success: true,
      data: {
        company: companyRecord,
        userCompany,
        chartInit,
        journalsInit,
        modulesUpserted,
        logReference: logStepId
      }
    });
  } catch (error) {
    console.error('Onboarding company creation failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to finalize onboarding company setup'
    });
  }
});

app.all('/api/workflows/scheduler', ensureAuthenticated, async (req, res) => {
  const action = (req.body?.action || req.query?.action || 'schedule').toString();
  const workflowId = req.body?.workflowId || req.query?.workflowId;

  try {
    switch (action) {
      case 'schedule': {
        const result = await handleScheduleWorkflows();
        return res.status(200).json(result);
      }
      case 'execute': {
        if (!workflowId) {
          return res.status(400).json({ error: 'workflowId is required' });
        }
        const result = await handleExecuteWorkflow(String(workflowId));
        return res.status(result.success ? 200 : 500).json(result);
      }
      case 'cleanup': {
        const result = await handleCleanupExecutions();
        return res.status(200).json(result);
      }
      default:
        return res.status(400).json({ error: `Unsupported action: ${action}` });
    }
  } catch (error) {
    console.error('Workflow scheduler error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Workflow scheduler failure',
    });
  }
});
// =================
// STRIPE PRODUCTS & PRICES
// =================

// Create checkout session
app.post('/api/stripe/create-checkout-session', ensureAuthenticated, async (req, res) => {
  try {
    const { priceId, planId, successUrl, cancelUrl, metadata } = req.body;
    const user = req.user;

    if (!priceId || !planId) {
      return res.status(400).json({ error: 'priceId and planId are required' });
    }

    const sanitizedMetadata = sanitizeMetadata(metadata);
    const successRedirect = buildAllowedUrl(successUrl, defaultFrontendUrl);
    const cancelRedirect = buildAllowedUrl(cancelUrl, defaultFrontendUrl);

    const customerId = await resolveStripeCustomerId(user);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successRedirect,
      cancel_url: cancelRedirect,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        ...sanitizedMetadata
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
          ...sanitizedMetadata
        }
      }
    });

    res.json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create billing portal session
app.post('/api/stripe/create-portal-session', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const customerId = await resolveStripeCustomerId(user);
    const returnUrl = buildAllowedUrl(req.body.returnUrl, defaultFrontendUrl);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update subscription
app.post('/api/stripe/update-subscription', ensureAuthenticated, async (req, res) => {
  try {
    const { subscriptionId, newPriceId } = req.body;
    const user = req.user;

    if (!subscriptionId || !newPriceId) {
      return res.status(400).json({ error: 'subscriptionId and newPriceId are required' });
    }

    const subscriptionRecord = await getUserSubscriptionByStripeId(user.id, subscriptionId);
    if (!subscriptionRecord) {
      return res.status(404).json({ error: 'Subscription not found for current user' });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (
      subscriptionRecord.stripe_customer_id &&
      subscription.customer !== subscriptionRecord.stripe_customer_id
    ) {
      return res.status(403).json({ error: 'Subscription does not belong to the authenticated user' });
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice'
    });

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
app.post('/api/stripe/cancel-subscription', ensureAuthenticated, async (req, res) => {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true } = req.body;
    const user = req.user;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId is required' });
    }

    const subscriptionRecord = await getUserSubscriptionByStripeId(user.id, subscriptionId);
    if (!subscriptionRecord) {
      return res.status(404).json({ error: 'Subscription not found for current user' });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (
      subscriptionRecord.stripe_customer_id &&
      subscription.customer !== subscriptionRecord.stripe_customer_id
    ) {
      return res.status(403).json({ error: 'Subscription does not belong to the authenticated user' });
    }

    const updatedSubscription = cancelAtPeriodEnd
      ? await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
      : await stripe.subscriptions.cancel(subscriptionId);

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Attach a payment method to a customer
app.post('/api/stripe/attach-payment-method', ensureAuthenticated, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const user = req.user;

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'paymentMethodId is required' });
    }

    const customerId = await resolveStripeCustomerId(user);

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    res.json(paymentMethod);
  } catch (error) {
    console.error('Error attaching payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Detach a payment method from a customer
app.post('/api/stripe/detach-payment-method', ensureAuthenticated, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const user = req.user;

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'paymentMethodId is required' });
    }

    const expectedCustomerId = await resolveStripeCustomerId(user);
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer && paymentMethod.customer !== expectedCustomerId) {
      return res.status(403).json({ error: 'Payment method does not belong to the authenticated user' });
    }

    const detached = await stripe.paymentMethods.detach(paymentMethodId);

    res.json(detached);
  } catch (error) {
    console.error('Error detaching payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// =================
// WEBHOOKS
// =================

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// =================
// WEBHOOK HANDLERS
// =================

async function handleSubscriptionChange(subscription) {
  const userId = subscription.metadata.user_id;
  const planId = subscription.metadata.plan_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  const subscriptionData = {
    user_id: userId,
    plan_id: planId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    metadata: subscription.metadata,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { 
      onConflict: 'stripe_subscription_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error updating subscription in Supabase:', error);
  } else {
    console.log('Subscription updated successfully:', subscription.id);
  }
}

async function handleSubscriptionDeleted(subscription) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error marking subscription as canceled:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  // Save invoice to database
  const invoiceData = {
    user_id: invoice.metadata?.user_id || null,
    stripe_invoice_id: invoice.id,
    subscription_id: invoice.subscription,
    amount: (invoice.total / 100).toString(),
    currency: invoice.currency.toUpperCase(),
    status: 'paid',
    invoice_url: invoice.hosted_invoice_url,
    pdf_url: invoice.invoice_pdf,
    due_date: new Date(invoice.due_date * 1000).toISOString(),
    paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
    created_at: new Date(invoice.created * 1000).toISOString()
  };

  const { error } = await supabase
    .from('invoices')
    .upsert(invoiceData, { onConflict: 'stripe_invoice_id' });

  if (error) {
    console.error('Error saving invoice:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'payment_failed',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_invoice_id', invoice.id);

  if (error) {
    console.error('Error updating invoice status:', error);
  }
}

async function handleScheduleWorkflows() {
  const nowIso = new Date().toISOString();
  const { data: workflows, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('is_active', true)
    .eq('trigger->>type', 'schedule')
    .or(`next_run.is.null,next_run.lte.${nowIso}`);

  if (error) {
    throw new Error(`Erreur récupération workflows: ${error.message}`);
  }

  const executed = [];
  const errors = [];

  for (const workflow of workflows || []) {
    try {
      const result = await runWorkflow(workflow);

      if (result.success) {
        const nextRun = calculateNextRun(workflow.trigger?.config?.schedule);
        await supabase
          .from('workflows')
          .update({
            next_run: nextRun,
            last_run: nowIso,
            run_count: (workflow.run_count || 0) + 1,
            success_count: result.hasFailures
              ? workflow.success_count || 0
              : (workflow.success_count || 0) + 1,
            error_count: result.hasFailures
              ? (workflow.error_count || 0) + 1
              : workflow.error_count || 0,
          })
          .eq('id', workflow.id);

        executed.push({
          id: workflow.id,
          name: workflow.name,
          status: result.hasFailures ? 'partial_success' : 'success',
          nextRun,
        });
      } else {
        errors.push({
          id: workflow.id,
          name: workflow.name,
          error: result.error,
        });
      }
    } catch (err) {
      errors.push({
        id: workflow.id,
        name: workflow.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    success: true,
    message: `Traité ${(workflows || []).length} workflow(s)`,
    executed,
    errors,
    timestamp: nowIso,
  };
}

async function handleExecuteWorkflow(workflowId) {
  const { data: workflow, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (error || !workflow) {
    return {
      success: false,
      error: 'Workflow non trouvé',
    };
  }

  if (!workflow.is_active) {
    return {
      success: false,
      error: 'Workflow inactif',
    };
  }

  const result = await runWorkflow(workflow);

  return {
    success: result.success,
    workflowId: workflow.id,
    workflowName: workflow.name,
    executionId: result.executionId,
    hasFailures: result.hasFailures,
    error: result.error,
    timestamp: new Date().toISOString(),
  };
}

async function handleCleanupExecutions() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const { data, error } = await supabase
    .from('workflow_executions')
    .delete()
    .lt('started_at', cutoff.toISOString())
    .select('id');

  if (error) {
    throw new Error(`Erreur nettoyage exécutions: ${error.message}`);
  }

  return {
    success: true,
    message: `Supprimé ${(data || []).length} ancienne(s) exécution(s)`,
    deletedCount: (data || []).length,
  };
}

async function runWorkflow(workflow) {
  const startTime = Date.now();

  try {
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflow.id,
        status: 'running',
        started_at: new Date().toISOString(),
        results: [],
      })
      .select()
      .single();

    if (executionError || !execution) {
      throw new Error(
        `Erreur création exécution: ${executionError?.message || 'inconnue'}`
      );
    }

    const results = [];
    let hasFailures = false;

    for (const action of workflow.actions || []) {
      try {
        const actionResult = await executeAction(action, workflow.company_id);
        results.push({
          action_id: action.id,
          status: 'success',
          result: actionResult,
        });
      } catch (actionError) {
        console.error(`Erreur action ${action.id}:`, actionError);
        hasFailures = true;
        results.push({
          action_id: action.id,
          status: 'failed',
          error: actionError instanceof Error ? actionError.message : String(actionError),
        });
      }
    }

    const duration = Date.now() - startTime;
    const { error: updateError } = await supabase
      .from('workflow_executions')
      .update({
        status: hasFailures ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        results,
      })
      .eq('id', execution.id);

    if (updateError) {
      console.warn('Erreur mise à jour exécution:', updateError);
    }

    await createWorkflowNotification(
      workflow.company_id,
      workflow.name,
      hasFailures ? 'failed' : 'success',
      {
        duration: `${Math.round(duration / 1000)}s`,
        results: results
          .map((r) => (r.result ? r.result : r.error))
          .filter(Boolean)
          .join(', '),
      }
    );

    return {
      success: true,
      executionId: execution.id,
      hasFailures,
      results,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';

    await createWorkflowNotification(
      workflow.company_id,
      workflow.name,
      'failed',
      { errorMessage: message }
    );

    return {
      success: false,
      error: message,
      hasFailures: true,
    };
  }
}

async function executeAction(action, companyId) {
  switch (action.type) {
    case 'email':
      return executeEmailAction(action.config?.email, companyId);
    case 'report_generation':
      return executeReportAction(action.config?.report, companyId);
    case 'data_update':
      return executeUpdateAction(action.config?.update);
    case 'notification':
      return executeNotificationAction(action.config?.notification, companyId);
    default:
      throw new Error(`Type d'action non supporté: ${action.type}`);
  }
}

async function executeEmailAction(config = {}, companyId) {
  if (!config.to || !config.subject) {
    throw new Error('Configuration email invalide');
  }

  await sendEmailInternal({
    to: config.to,
    cc: config.cc,
    bcc: config.bcc,
    subject: config.subject,
    template: config.template,
    html: config.html,
    text: config.text,
    variables: {
      company_id: companyId,
      ...(config.variables || {}),
    },
    attachments: (config.attachments || []).map((att) => ({
      filename: att.filename,
      content: att.content,
      type: att.contentType,
    })),
  });

  return `Email envoyé à ${config.to.join(', ')}`;
}

async function executeReportAction(config = {}, companyId) {
  console.log('Génération rapport:', config.type, 'pour entreprise', companyId);
  return `Rapport ${config.type} généré (${config.format})`;
}

async function executeUpdateAction(config = {}) {
  if (!config.table || !config.data) {
    throw new Error('Configuration mise à jour invalide');
  }

  const { data, error } = await supabase
    .from(config.table)
    .update(config.data)
    .match(config.filters || {})
    .select('id');

  if (error) {
    throw new Error(`Erreur mise à jour: ${error.message}`);
  }

  return `Mis à jour ${(data || []).length} enregistrement(s) dans ${config.table}`;
}

async function executeNotificationAction(config = {}, companyId) {
  if (!config.title || !config.message) {
    throw new Error('Configuration notification invalide');
  }

  const { error } = await supabase
    .from('notifications')
    .insert({
      company_id: companyId,
      title: config.title,
      message: config.message,
      type: 'info',
      priority: config.priority || 'medium',
      category: 'automation',
      read: false,
    });

  if (error) {
    throw new Error(`Erreur création notification: ${error.message}`);
  }

  return `Notification créée: ${config.title}`;
}

async function createWorkflowNotification(companyId, workflowName, status, details = {}) {
  try {
    await supabase.from('notifications').insert({
      company_id: companyId,
      title: `Workflow: ${workflowName}`,
      message:
        status === 'success'
          ? `Workflow "${workflowName}" exécuté avec succès${
              details.duration ? ` en ${details.duration}` : ''
            }`
          : `Workflow "${workflowName}" a échoué${
              details.errorMessage ? `: ${details.errorMessage}` : ''
            }`,
      type: status === 'success' ? 'success' : 'error',
      priority: status === 'success' ? 'low' : 'high',
      category: 'automation',
      read: false,
      data: {
        workflow_name: workflowName,
        status,
        ...details,
      },
    });
  } catch (error) {
    console.warn('Impossible de créer la notification workflow:', error);
  }
}

function calculateNextRun(schedule) {
  if (!schedule?.frequency || !schedule?.time) {
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }

  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  const nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    case 'weekly': {
      const targetDay = schedule.dayOfWeek ?? 1;
      while (nextRun.getDay() !== targetDay || nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    }
    case 'monthly': {
      const targetDate = schedule.dayOfMonth ?? 1;
      nextRun.setDate(targetDate);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
    }
    case 'yearly':
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      break;
    default:
      nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.toISOString();
}

// =================
// ERROR HANDLING
// =================

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CassKai Stripe Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook`);
});

export default app;
