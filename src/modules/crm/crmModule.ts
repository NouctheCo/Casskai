// Module CRM/Ventes - Pipeline commercial intégré avec signature électronique

import { Module, ModuleDefinition, ModuleContext } from '@/types/modules.types';
import { ModulePermissionService } from '@/services/moduleManager';

// Définition du module CRM
export const CRM_MODULE_DEFINITION: ModuleDefinition = {
  id: 'crm-sales',
  name: 'CRM & Ventes',
  description: 'Pipeline commercial intégré avec devis, factures et signature électronique',
  version: '1.0.0',
  category: 'business',
  icon: 'users',
  status: 'available',
  isCore: false,
  isPremium: true,
  
  permissions: [
    ModulePermissionService.PERMISSIONS.CRM_VIEW,
    ModulePermissionService.PERMISSIONS.CRM_MANAGE_CONTACTS,
    ModulePermissionService.PERMISSIONS.CRM_MANAGE_DEALS,
    ModulePermissionService.PERMISSIONS.CRM_EXPORT_DATA,
  ],
  
  dependencies: ['accounting-core'], // Dépend du module comptabilité de base
  conflicts: [],
  
  pricing: {
    type: 'subscription',
    price: 29,
    currency: 'EUR',
    billingPeriod: 'monthly',
    trialDays: 14,
    features: [
      'Pipeline commercial illimité',
      'Gestion contacts/prospects',
      'Devis et factures avec templates',
      'Signature électronique',
      'Relances automatiques',
      'Rapports de vente',
      'Intégration email',
    ],
  },
  
  config: {
    settings: {
      defaultPipeline: {
        type: 'select',
        label: 'Pipeline par défaut',
        description: 'Pipeline utilisé par défaut pour les nouvelles affaires',
        required: true,
        options: [],
      },
      emailIntegration: {
        type: 'boolean',
        label: 'Intégration email',
        description: 'Activer la synchronisation des emails',
        required: false,
      },
      autoFollowUp: {
        type: 'boolean',
        label: 'Relances automatiques',
        description: 'Activer les relances automatiques',
        required: false,
      },
      signatureProvider: {
        type: 'select',
        label: 'Fournisseur de signature',
        description: 'Service de signature électronique',
        required: false,
        options: [
          { value: 'docusign', label: 'DocuSign' },
          { value: 'adobe', label: 'Adobe Sign' },
          { value: 'yousign', label: 'YouSign (France)' },
          { value: 'internal', label: 'Signature interne' },
        ],
      },
      defaultQuoteTemplate: {
        type: 'select',
        label: 'Template devis par défaut',
        description: 'Template utilisé par défaut pour les devis',
        required: false,
        options: [],
      },
    },
    defaultValues: {
      defaultPipeline: 'sales-standard',
      emailIntegration: true,
      autoFollowUp: true,
      signatureProvider: 'internal',
    },
  },
  
  author: 'CassKai Team',
  documentation: '/docs/modules/crm',
  supportUrl: '/support/crm',
  
  changelog: [
    {
      version: '1.0.0',
      date: '2024-08-07',
      type: 'feature',
      description: 'Version initiale avec pipeline commercial, devis/factures et signature électronique',
    },
  ],
};

// Implémentation du module CRM
export class CRMModule implements Module {
  definition = CRM_MODULE_DEFINITION;

  async onInstall(context: ModuleContext): Promise<void> {
    console.log('[CRM] Installation du module CRM');
    
    // Créer les tables nécessaires
    await this.createDatabaseSchema(context);
    
    // Créer les pipelines par défaut
    await this.createDefaultPipelines(context);
    
    // Créer les templates par défaut
    await this.createDefaultTemplates(context);
  }

  async onActivate(context: ModuleContext): Promise<void> {
    console.log('[CRM] Activation du module CRM');
    
    // Initialiser les services
    await this.initializeServices(context);
    
    // Démarrer les tâches automatiques
    await this.startAutomatedTasks(context);
  }

  async onDeactivate(context: ModuleContext): Promise<void> {
    console.log('[CRM] Désactivation du module CRM');
    
    // Arrêter les tâches automatiques
    await this.stopAutomatedTasks(context);
  }

  validateConfig(config: Record<string, any>): boolean | string {
    // Validation de la configuration
    if (config.signatureProvider && !['docusign', 'adobe', 'yousign', 'internal'].includes(config.signatureProvider)) {
      return 'Fournisseur de signature invalide';
    }
    
    return true;
  }

  getDefaultConfig(): Record<string, any> {
    return this.definition.config?.defaultValues || {};
  }

  // Méthodes privées d'initialisation
  private async createDatabaseSchema(context: ModuleContext): Promise<void> {
    // Création des tables CRM
    const schemas = [
      // Table des contacts/prospects
      `CREATE TABLE IF NOT EXISTS crm_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('prospect', 'client', 'partner')),
        company VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        address JSONB,
        tags TEXT[],
        custom_fields JSONB DEFAULT '{}',
        assigned_to UUID,
        source VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des pipelines
      `CREATE TABLE IF NOT EXISTS crm_pipelines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        stages JSONB NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des affaires/deals
      `CREATE TABLE IF NOT EXISTS crm_deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        contact_id UUID REFERENCES crm_contacts(id),
        pipeline_id UUID REFERENCES crm_pipelines(id),
        stage_id VARCHAR(100) NOT NULL,
        value DECIMAL(15,2) NOT NULL DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'EUR',
        probability INTEGER DEFAULT 0,
        expected_close_date DATE,
        actual_close_date DATE,
        assigned_to UUID NOT NULL,
        tags TEXT[],
        custom_fields JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des activités
      `CREATE TABLE IF NOT EXISTS crm_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'task', 'note')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        scheduled_at TIMESTAMP,
        completed_at TIMESTAMP,
        assigned_to UUID NOT NULL,
        related_to_type VARCHAR(20) NOT NULL CHECK (related_to_type IN ('contact', 'deal')),
        related_to_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des notes
      `CREATE TABLE IF NOT EXISTS crm_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        content TEXT NOT NULL,
        author UUID NOT NULL,
        is_private BOOLEAN DEFAULT false,
        related_to_type VARCHAR(20) NOT NULL CHECK (related_to_type IN ('contact', 'deal')),
        related_to_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des templates
      `CREATE TABLE IF NOT EXISTS crm_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('quote', 'invoice', 'email', 'contract')),
        name VARCHAR(255) NOT NULL,
        content JSONB NOT NULL,
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des signatures
      `CREATE TABLE IF NOT EXISTS crm_signatures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        document_id UUID NOT NULL,
        document_type VARCHAR(20) NOT NULL,
        signer_email VARCHAR(255) NOT NULL,
        signer_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        signature_provider VARCHAR(50),
        external_id VARCHAR(255),
        signed_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    ];

    // Exécuter les schémas (simulation)
    console.log('[CRM] Création du schéma de base de données', schemas.length, 'tables');
  }

  private async createDefaultPipelines(context: ModuleContext): Promise<void> {
    const defaultPipelines = [
      {
        id: 'sales-standard',
        name: 'Ventes Standard',
        stages: [
          { id: 'prospect', name: 'Prospect', order: 1, probability: 10, color: '#64748b' },
          { id: 'qualified', name: 'Qualifié', order: 2, probability: 25, color: '#3b82f6' },
          { id: 'proposal', name: 'Devis envoyé', order: 3, probability: 50, color: '#f59e0b' },
          { id: 'negotiation', name: 'Négociation', order: 4, probability: 75, color: '#f97316' },
          { id: 'closed-won', name: 'Gagné', order: 5, probability: 100, color: '#10b981', isClosedWon: true },
          { id: 'closed-lost', name: 'Perdu', order: 6, probability: 0, color: '#ef4444', isClosedLost: true },
        ],
        isDefault: true,
      },
      {
        id: 'enterprise-sales',
        name: 'Ventes Entreprise',
        stages: [
          { id: 'lead', name: 'Lead', order: 1, probability: 5, color: '#64748b' },
          { id: 'discovery', name: 'Découverte', order: 2, probability: 15, color: '#6366f1' },
          { id: 'demo', name: 'Démonstration', order: 3, probability: 30, color: '#3b82f6' },
          { id: 'poc', name: 'POC', order: 4, probability: 50, color: '#f59e0b' },
          { id: 'proposal', name: 'Proposition', order: 5, probability: 70, color: '#f97316' },
          { id: 'contract', name: 'Contrat', order: 6, probability: 85, color: '#eab308' },
          { id: 'closed-won', name: 'Gagné', order: 7, probability: 100, color: '#10b981', isClosedWon: true },
          { id: 'closed-lost', name: 'Perdu', order: 8, probability: 0, color: '#ef4444', isClosedLost: true },
        ],
        isDefault: false,
      },
    ];

    console.log('[CRM] Création des pipelines par défaut:', defaultPipelines.length);
  }

  private async createDefaultTemplates(context: ModuleContext): Promise<void> {
    const defaultTemplates = [
      {
        type: 'quote',
        name: 'Devis Standard',
        content: {
          header: {
            title: 'DEVIS',
            logo: '/assets/logo.png',
            company: {
              name: '{{company.name}}',
              address: '{{company.address}}',
              phone: '{{company.phone}}',
              email: '{{company.email}}',
            },
          },
          client: {
            title: 'Client',
            name: '{{client.name}}',
            address: '{{client.address}}',
            contact: '{{client.contact}}',
          },
          details: {
            quoteNumber: 'DEV-{{quote.number}}',
            date: '{{quote.date}}',
            validUntil: '{{quote.validUntil}}',
          },
          items: [
            {
              description: '{{item.description}}',
              quantity: '{{item.quantity}}',
              unitPrice: '{{item.unitPrice}}',
              total: '{{item.total}}',
            },
          ],
          totals: {
            subtotal: '{{totals.subtotal}}',
            tax: '{{totals.tax}}',
            total: '{{totals.total}}',
          },
          footer: {
            terms: 'Conditions de paiement : 30 jours net',
            signature: 'Signature électronique disponible',
          },
        },
        isDefault: true,
      },
      {
        type: 'email',
        name: 'Relance Devis',
        content: {
          subject: 'Relance - Devis {{quote.number}}',
          body: `Bonjour {{client.firstName}},

J'espère que vous allez bien.

Je me permets de revenir vers vous concernant le devis {{quote.number}} que nous vous avons transmis le {{quote.sentDate}}.

Ce devis d'un montant de {{quote.total}} est valable jusqu'au {{quote.validUntil}}.

Avez-vous eu l'occasion de l'examiner ? Souhaiteriez-vous programmer un échange pour discuter de vos éventuelles questions ?

Je reste à votre disposition.

Cordialement,
{{sender.name}}`,
        },
        isDefault: true,
      },
    ];

    console.log('[CRM] Création des templates par défaut:', defaultTemplates.length);
  }

  private async initializeServices(context: ModuleContext): Promise<void> {
    // Initialiser les services CRM
    console.log('[CRM] Initialisation des services');
    
    // Service de signature électronique
    await this.initializeSignatureService(context);
    
    // Service d'email
    await this.initializeEmailService(context);
    
    // Service de génération de documents
    await this.initializeDocumentService(context);
  }

  private async initializeSignatureService(context: ModuleContext): Promise<void> {
    const provider = context.config.signatureProvider || 'internal';
    console.log('[CRM] Initialisation du service de signature:', provider);
    
    // Configuration selon le fournisseur
    switch (provider) {
      case 'docusign':
        // Initialiser DocuSign
        break;
      case 'adobe':
        // Initialiser Adobe Sign
        break;
      case 'yousign':
        // Initialiser YouSign
        break;
      default:
        // Signature interne
        break;
    }
  }

  private async initializeEmailService(context: ModuleContext): Promise<void> {
    if (context.config.emailIntegration) {
      console.log('[CRM] Initialisation du service email');
      // Configurer l'intégration email
    }
  }

  private async initializeDocumentService(context: ModuleContext): Promise<void> {
    console.log('[CRM] Initialisation du service de génération de documents');
    // Service pour générer les PDF, devis, factures
  }

  private async startAutomatedTasks(context: ModuleContext): Promise<void> {
    if (context.config.autoFollowUp) {
      console.log('[CRM] Démarrage des tâches de relance automatique');
      // Démarrer les tâches cron pour les relances
    }
  }

  private async stopAutomatedTasks(context: ModuleContext): Promise<void> {
    console.log('[CRM] Arrêt des tâches automatiques');
    // Arrêter les tâches cron
  }

  // Routes et composants React
  getRoutes() {
    return [
      {
        path: '/crm',
        component: () => import('./components/CRMDashboard'),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_VIEW],
      },
      {
        path: '/crm/contacts',
        component: () => import('./components/ContactsManagement'),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_MANAGE_CONTACTS],
      },
      {
        path: '/crm/deals',
        component: () => import('./components/DealsManagement'),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_MANAGE_DEALS],
      },
      {
        path: '/crm/pipeline',
        component: () => import('./components/PipelineView'),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_VIEW],
      },
      {
        path: '/crm/quotes',
        component: () => import('./components/QuotesManagement'),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_MANAGE_DEALS],
      },
    ];
  }

  getComponents() {
    return {
      CRMWidget: () => import('./components/CRMWidget'),
      SalesChart: () => import('./components/SalesChart'),
      RecentDeals: () => import('./components/RecentDeals'),
    };
  }

  // API Endpoints
  getAPIEndpoints() {
    return [
      {
        method: 'GET',
        path: '/api/crm/contacts',
        handler: this.getContacts.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_VIEW],
      },
      {
        method: 'POST',
        path: '/api/crm/contacts',
        handler: this.createContact.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_MANAGE_CONTACTS],
      },
      {
        method: 'GET',
        path: '/api/crm/deals',
        handler: this.getDeals.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_VIEW],
      },
      {
        method: 'POST',
        path: '/api/crm/deals',
        handler: this.createDeal.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_MANAGE_DEALS],
      },
      {
        method: 'POST',
        path: '/api/crm/quotes/:id/sign',
        handler: this.initiateSignature.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.CRM_MANAGE_DEALS],
      },
    ];
  }

  // Tâches programmées
  getScheduledTasks() {
    return [
      {
        name: 'follow-up-reminders',
        schedule: '0 9 * * *', // Tous les jours à 9h
        handler: this.sendFollowUpReminders.bind(this),
      },
      {
        name: 'quote-expiration-check',
        schedule: '0 */4 * * *', // Toutes les 4 heures
        handler: this.checkQuoteExpirations.bind(this),
      },
      {
        name: 'pipeline-analytics',
        schedule: '0 1 * * *', // Tous les jours à 1h
        handler: this.generatePipelineAnalytics.bind(this),
      },
    ];
  }

  // Méthodes API
  private async getContacts(req: any, res: any): Promise<void> {
    // Implémentation de récupération des contacts
  }

  private async createContact(req: any, res: any): Promise<void> {
    // Implémentation de création de contact
  }

  private async getDeals(req: any, res: any): Promise<void> {
    // Implémentation de récupération des deals
  }

  private async createDeal(req: any, res: any): Promise<void> {
    // Implémentation de création de deal
  }

  private async initiateSignature(req: any, res: any): Promise<void> {
    // Implémentation de signature électronique
  }

  // Tâches automatisées
  private async sendFollowUpReminders(): Promise<void> {
    console.log('[CRM] Envoi des relances automatiques');
    // Logique de relance automatique
  }

  private async checkQuoteExpirations(): Promise<void> {
    console.log('[CRM] Vérification des expirations de devis');
    // Logique de vérification d'expiration
  }

  private async generatePipelineAnalytics(): Promise<void> {
    console.log('[CRM] Génération des analytics pipeline');
    // Logique d'analytics
  }
}

// Export du module
export const crmModule = new CRMModule();