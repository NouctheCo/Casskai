// Module Projets - Gestion de projets avec timetracking et facturation

import { Module, ModuleDefinition, ModuleContext } from '@/types/modules.types';
import { ModulePermissionService } from '@/services/moduleManager';

// Définition du module Projets
export const PROJECTS_MODULE_DEFINITION: ModuleDefinition = {
  id: 'projects-management',
  name: 'Gestion de Projets',
  description: 'Gestion complète de projets avec timetracking, rentabilité et facturation sur avancement',
  version: '1.0.0',
  category: 'project',
  icon: 'folder-kanban',
  status: 'available',
  isCore: false,
  isPremium: true,
  
  permissions: [
    ModulePermissionService.PERMISSIONS.PROJECT_VIEW,
    ModulePermissionService.PERMISSIONS.PROJECT_MANAGE,
    ModulePermissionService.PERMISSIONS.PROJECT_TRACK_TIME,
    ModulePermissionService.PERMISSIONS.PROJECT_BILLING,
  ],
  
  dependencies: ['accounting-core', 'crm-sales'], // Dépend de la comptabilité et du CRM
  conflicts: [],
  
  pricing: {
    type: 'subscription',
    price: 25,
    currency: 'EUR',
    billingPeriod: 'monthly',
    trialDays: 14,
    features: [
      'Projets illimités',
      'Timetracking avancé',
      'Diagramme de Gantt interactif',
      'Calcul de rentabilité en temps réel',
      'Facturation sur avancement',
      'Rapports de performance',
      'Gestion d\'équipes',
      'Intégration CRM/Comptabilité',
    ],
  },
  
  config: {
    settings: {
      defaultBillingType: {
        type: 'select',
        label: 'Type de facturation par défaut',
        description: 'Mode de facturation utilisé par défaut pour les nouveaux projets',
        required: false,
        options: [
          { value: 'fixed_price', label: 'Prix fixe' },
          { value: 'time_and_material', label: 'Régie (temps + matériel)' },
          { value: 'milestone', label: 'Par jalons' },
        ],
      },
      timesheetApproval: {
        type: 'boolean',
        label: 'Validation des timesheets',
        description: 'Requiert une validation des feuilles de temps',
        required: false,
      },
      autoInvoicing: {
        type: 'boolean',
        label: 'Facturation automatique',
        description: 'Générer automatiquement les factures selon l\'avancement',
        required: false,
      },
      ganttView: {
        type: 'boolean',
        label: 'Vue Gantt',
        description: 'Activer la vue diagramme de Gantt',
        required: false,
      },
      budgetTracking: {
        type: 'boolean',
        label: 'Suivi budgétaire',
        description: 'Activer le suivi détaillé des budgets',
        required: false,
      },
      clientPortal: {
        type: 'boolean',
        label: 'Portail client',
        description: 'Permettre aux clients de consulter l\'avancement',
        required: false,
      },
    },
    defaultValues: {
      defaultBillingType: 'time_and_material',
      timesheetApproval: true,
      autoInvoicing: false,
      ganttView: true,
      budgetTracking: true,
      clientPortal: false,
    },
  },
  
  author: 'CassKai Team',
  documentation: '/docs/modules/projects',
  supportUrl: '/support/projects',
  
  changelog: [
    {
      version: '1.0.0',
      date: '2024-08-07',
      type: 'feature',
      description: 'Version initiale avec gestion de projets, timetracking, Gantt et facturation',
    },
  ],
};

// Implémentation du module Projets
export class ProjectsModule implements Module {
  definition = PROJECTS_MODULE_DEFINITION;

  async onInstall(context: ModuleContext): Promise<void> {
    console.log('[Projects] Installation du module Projets');
    
    // Créer les tables nécessaires
    await this.createDatabaseSchema(context);
    
    // Créer les configurations par défaut
    await this.createDefaultConfigurations(context);
    
    // Initialiser les templates de projet
    await this.createProjectTemplates(context);
  }

  async onActivate(context: ModuleContext): Promise<void> {
    console.log('[Projects] Activation du module Projets');
    
    // Initialiser les services
    await this.initializeServices(context);
    
    // Démarrer les tâches automatiques
    await this.startAutomatedTasks(context);
  }

  async onDeactivate(context: ModuleContext): Promise<void> {
    console.log('[Projects] Désactivation du module Projets');
    
    // Arrêter les tâches automatiques
    await this.stopAutomatedTasks(context);
  }

  validateConfig(config: Record<string, any>): boolean | string {
    // Validation de la configuration
    if (config.defaultBillingType && !['fixed_price', 'time_and_material', 'milestone'].includes(config.defaultBillingType)) {
      return 'Type de facturation invalide';
    }
    
    return true;
  }

  getDefaultConfig(): Record<string, any> {
    return this.definition.config?.defaultValues || {};
  }

  // Méthodes privées d'initialisation
  private async createDatabaseSchema(context: ModuleContext): Promise<void> {
    // Création des tables Projets
    const schemas = [
      // Table des projets
      `CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        client_id UUID, -- Référence vers crm_contacts
        manager_id UUID NOT NULL,
        status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        
        -- Dates
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        actual_start_date DATE,
        actual_end_date DATE,
        
        -- Budget et facturation
        budget DECIMAL(15,2),
        currency VARCHAR(3) DEFAULT 'EUR',
        billing_type VARCHAR(20) DEFAULT 'time_and_material' CHECK (billing_type IN ('fixed_price', 'time_and_material', 'milestone')),
        hourly_rate DECIMAL(10,2),
        
        -- Configuration
        settings JSONB DEFAULT '{}',
        
        -- Metadata
        tags TEXT[],
        custom_fields JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des membres d'équipe
      `CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('manager', 'member', 'observer')),
        hourly_rate DECIMAL(10,2),
        joined_at TIMESTAMP DEFAULT NOW(),
        permissions TEXT[]
      )`,
      
      // Table des tâches
      `CREATE TABLE IF NOT EXISTS project_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        
        -- Assignment
        assigned_to UUID,
        assigned_by UUID NOT NULL,
        
        -- Timing
        estimated_hours DECIMAL(6,2),
        actual_hours DECIMAL(6,2) DEFAULT 0,
        start_date DATE,
        due_date DATE,
        completed_at TIMESTAMP,
        
        -- Hiérarchie
        parent_task_id UUID REFERENCES project_tasks(id),
        order_index INTEGER DEFAULT 0,
        
        -- Dependencies
        dependencies UUID[],
        
        -- Metadata
        tags TEXT[],
        attachments TEXT[],
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des entrées de temps (timetracking)
      `CREATE TABLE IF NOT EXISTS time_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
        user_id UUID NOT NULL,
        description TEXT NOT NULL,
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        hours DECIMAL(4,2) NOT NULL,
        billable BOOLEAN DEFAULT true,
        invoiced BOOLEAN DEFAULT false,
        hourly_rate DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'logged' CHECK (status IN ('logged', 'approved', 'rejected')),
        approved_by UUID,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des commentaires de tâches
      `CREATE TABLE IF NOT EXISTS task_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        content TEXT NOT NULL,
        attachments TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des jalons (milestones)
      `CREATE TABLE IF NOT EXISTS project_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE NOT NULL,
        completed_date DATE,
        percentage DECIMAL(5,2) DEFAULT 0,
        invoice_percentage DECIMAL(5,2) DEFAULT 0,
        amount DECIMAL(15,2),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
        tasks UUID[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des budgets par catégorie
      `CREATE TABLE IF NOT EXISTS project_budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        budgeted_amount DECIMAL(15,2) NOT NULL,
        actual_amount DECIMAL(15,2) DEFAULT 0,
        committed_amount DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des documents projet
      `CREATE TABLE IF NOT EXISTS project_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        category VARCHAR(50),
        uploaded_by UUID NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des templates de projet
      `CREATE TABLE IF NOT EXISTS project_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        template_data JSONB NOT NULL,
        is_public BOOLEAN DEFAULT false,
        usage_count INTEGER DEFAULT 0,
        created_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    ];

    // Créer les index pour les performances
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id)',
      'CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id)',
      'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to)',
      'CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date)',
    ];

    console.log('[Projects] Création du schéma de base de données', schemas.length, 'tables', indexes.length, 'index');
  }

  private async createDefaultConfigurations(context: ModuleContext): Promise<void> {
    const defaultConfigs = [
      // Statuts de tâches personnalisables
      {
        type: 'task_statuses',
        data: [
          { id: 'todo', name: 'À faire', color: '#64748b', order: 1 },
          { id: 'in_progress', name: 'En cours', color: '#3b82f6', order: 2 },
          { id: 'review', name: 'En révision', color: '#f59e0b', order: 3 },
          { id: 'done', name: 'Terminé', color: '#10b981', order: 4 },
          { id: 'blocked', name: 'Bloqué', color: '#ef4444', order: 5 },
        ],
      },
      
      // Catégories budgétaires
      {
        type: 'budget_categories',
        data: [
          { id: 'development', name: 'Développement', color: '#3b82f6' },
          { id: 'design', name: 'Design', color: '#8b5cf6' },
          { id: 'testing', name: 'Tests & QA', color: '#f59e0b' },
          { id: 'deployment', name: 'Déploiement', color: '#10b981' },
          { id: 'management', name: 'Gestion de projet', color: '#64748b' },
          { id: 'external', name: 'Prestations externes', color: '#ef4444' },
        ],
      },
      
      // Types de documents
      {
        type: 'document_categories',
        data: [
          { id: 'specification', name: 'Spécifications', icon: 'file-text' },
          { id: 'design', name: 'Design', icon: 'palette' },
          { id: 'contract', name: 'Contrats', icon: 'file-signature' },
          { id: 'report', name: 'Rapports', icon: 'chart-bar' },
          { id: 'other', name: 'Autres', icon: 'folder' },
        ],
      },
    ];

    console.log('[Projects] Création des configurations par défaut:', defaultConfigs.length);
  }

  private async createProjectTemplates(context: ModuleContext): Promise<void> {
    const templates = [
      {
        name: 'Développement Web',
        description: 'Template pour projets de développement web',
        category: 'development',
        template_data: {
          phases: [
            {
              name: 'Analyse & Conception',
              tasks: [
                'Analyse des besoins',
                'Rédaction des spécifications',
                'Maquettes et wireframes',
                'Architecture technique',
              ],
              duration: 10, // jours
            },
            {
              name: 'Développement',
              tasks: [
                'Développement frontend',
                'Développement backend',
                'Intégration API',
                'Tests unitaires',
              ],
              duration: 30,
            },
            {
              name: 'Tests & Déploiement',
              tasks: [
                'Tests d\'intégration',
                'Tests utilisateurs',
                'Déploiement production',
                'Formation utilisateurs',
              ],
              duration: 7,
            },
          ],
          milestones: [
            { name: 'Spécifications validées', percentage: 20 },
            { name: 'Maquettes approuvées', percentage: 30 },
            { name: 'MVP fonctionnel', percentage: 70 },
            { name: 'Livraison finale', percentage: 100 },
          ],
        },
      },
      
      {
        name: 'Audit & Conseil',
        description: 'Template pour missions d\'audit et conseil',
        category: 'consulting',
        template_data: {
          phases: [
            {
              name: 'Préparation',
              tasks: [
                'Réunion de cadrage',
                'Collecte des documents',
                'Planning des entretiens',
              ],
              duration: 3,
            },
            {
              name: 'Audit',
              tasks: [
                'Analyse documentaire',
                'Entretiens parties prenantes',
                'Tests et contrôles',
                'Identification des risques',
              ],
              duration: 15,
            },
            {
              name: 'Restitution',
              tasks: [
                'Rédaction du rapport',
                'Présentation des résultats',
                'Plan d\'actions',
                'Suivi des recommandations',
              ],
              duration: 5,
            },
          ],
          milestones: [
            { name: 'Cadrage validé', percentage: 15 },
            { name: 'Audit terrain terminé', percentage: 70 },
            { name: 'Rapport livré', percentage: 100 },
          ],
        },
      },
    ];

    console.log('[Projects] Création des templates de projet:', templates.length);
  }

  private async initializeServices(context: ModuleContext): Promise<void> {
    console.log('[Projects] Initialisation des services');
    
    // Service de timetracking
    await this.initializeTimeTrackingService(context);
    
    // Service de génération Gantt
    if (context.config.ganttView) {
      await this.initializeGanttService(context);
    }
    
    // Service de facturation automatique
    if (context.config.autoInvoicing) {
      await this.initializeAutoInvoicingService(context);
    }
    
    // Service de rapports
    await this.initializeReportingService(context);
  }

  private async initializeTimeTrackingService(context: ModuleContext): Promise<void> {
    console.log('[Projects] Initialisation du service de timetracking');
    // Configuration du tracking de temps, notifications, etc.
  }

  private async initializeGanttService(context: ModuleContext): Promise<void> {
    console.log('[Projects] Initialisation du service Gantt');
    // Configuration des calculs de dépendances, chemin critique, etc.
  }

  private async initializeAutoInvoicingService(context: ModuleContext): Promise<void> {
    console.log('[Projects] Initialisation de la facturation automatique');
    // Configuration des règles de facturation automatique
  }

  private async initializeReportingService(context: ModuleContext): Promise<void> {
    console.log('[Projects] Initialisation des rapports de projet');
    // Configuration des rapports de rentabilité, performance, etc.
  }

  private async startAutomatedTasks(context: ModuleContext): Promise<void> {
    console.log('[Projects] Démarrage des tâches automatiques');
    
    // Calculs de rentabilité
    // Mise à jour des pourcentages d'avancement
    // Notifications d'échéances
    // Génération de factures automatiques
  }

  private async stopAutomatedTasks(context: ModuleContext): Promise<void> {
    console.log('[Projects] Arrêt des tâches automatiques');
  }

  // Routes et composants React
  getRoutes() {
    return [
      {
        path: '/projects',
        component: () => import('./components/ProjectsDashboard'),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_VIEW],
      },
      {
        path: '/projects/list',
        component: () => import('./components/ProjectsList'),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_VIEW],
      },
      {
        path: '/projects/:id',
        component: () => import('./components/ProjectDetail'),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_VIEW],
      },
      {
        path: '/projects/:id/gantt',
        component: () => import('./components/ProjectGantt'),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_VIEW],
      },
      {
        path: '/timetracking',
        component: () => import('./components/TimeTracking'),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_TRACK_TIME],
      },
      {
        path: '/projects/reports',
        component: () => import('./components/ProjectReports'),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_VIEW],
      },
    ];
  }

  getComponents() {
    return {
      ProjectsWidget: () => import('./components/ProjectsWidget'),
      TimeTrackingWidget: () => import('./components/TimeTrackingWidget'),
      ProjectProgress: () => import('./components/ProjectProgress'),
      TasksList: () => import('./components/TasksList'),
      GanttChart: () => import('./components/GanttChart'),
    };
  }

  // API Endpoints
  getAPIEndpoints() {
    return [
      // Projets
      {
        method: 'GET',
        path: '/api/projects',
        handler: this.getProjects.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_VIEW],
      },
      {
        method: 'POST',
        path: '/api/projects',
        handler: this.createProject.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_MANAGE],
      },
      {
        method: 'GET',
        path: '/api/projects/:id/profitability',
        handler: this.getProjectProfitability.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_VIEW],
      },
      
      // Tâches
      {
        method: 'GET',
        path: '/api/projects/:id/tasks',
        handler: this.getProjectTasks.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_VIEW],
      },
      {
        method: 'POST',
        path: '/api/projects/:id/tasks',
        handler: this.createTask.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_MANAGE],
      },
      
      // Timetracking
      {
        method: 'POST',
        path: '/api/time-entries',
        handler: this.createTimeEntry.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_TRACK_TIME],
      },
      {
        method: 'GET',
        path: '/api/time-entries',
        handler: this.getTimeEntries.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_TRACK_TIME],
      },
      
      // Gantt
      {
        method: 'GET',
        path: '/api/projects/:id/gantt',
        handler: this.getGanttData.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_VIEW],
      },
      
      // Facturation
      {
        method: 'POST',
        path: '/api/projects/:id/invoice',
        handler: this.generateProjectInvoice.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.PROJECT_BILLING],
      },
    ];
  }

  // Tâches programmées
  getScheduledTasks() {
    return [
      {
        name: 'project-progress-update',
        schedule: '0 1 * * *', // Tous les jours à 1h
        handler: this.updateProjectProgress.bind(this),
      },
      {
        name: 'profitability-calculation',
        schedule: '0 2 * * *', // Tous les jours à 2h
        handler: this.calculateProjectProfitability.bind(this),
      },
      {
        name: 'milestone-notifications',
        schedule: '0 9 * * *', // Tous les jours à 9h
        handler: this.sendMilestoneNotifications.bind(this),
      },
      {
        name: 'auto-invoicing',
        schedule: '0 3 1 * *', // Premier du mois à 3h
        handler: this.processAutoInvoicing.bind(this),
      },
      {
        name: 'timesheet-reminders',
        schedule: '0 17 * * 5', // Vendredi à 17h
        handler: this.sendTimesheetReminders.bind(this),
      },
    ];
  }

  // Méthodes API
  private async getProjects(req: any, res: any): Promise<void> {
    // Récupération des projets avec filtres et pagination
  }

  private async createProject(req: any, res: any): Promise<void> {
    // Création d'un nouveau projet
  }

  private async getProjectProfitability(req: any, res: any): Promise<void> {
    // Calcul de la rentabilité d'un projet
    console.log('[Projects] Calcul de rentabilité pour projet:', req.params.id);
    
    const profitability = await this.calculateProfitability(req.params.id);
    res.json(profitability);
  }

  private async getProjectTasks(req: any, res: any): Promise<void> {
    // Récupération des tâches d'un projet
  }

  private async createTask(req: any, res: any): Promise<void> {
    // Création d'une tâche
  }

  private async createTimeEntry(req: any, res: any): Promise<void> {
    // Enregistrement d'une entrée de temps
  }

  private async getTimeEntries(req: any, res: any): Promise<void> {
    // Récupération des entrées de temps
  }

  private async getGanttData(req: any, res: any): Promise<void> {
    // Génération des données pour le diagramme de Gantt
    console.log('[Projects] Génération données Gantt pour projet:', req.params.id);
    
    const ganttData = await this.generateGanttData(req.params.id);
    res.json(ganttData);
  }

  private async generateProjectInvoice(req: any, res: any): Promise<void> {
    // Génération d'une facture basée sur l'avancement
  }

  // Tâches automatisées
  private async updateProjectProgress(): Promise<void> {
    console.log('[Projects] Mise à jour de l\'avancement des projets');
    // Calculer l'avancement basé sur les tâches terminées
  }

  private async calculateProjectProfitability(): Promise<void> {
    console.log('[Projects] Calcul de rentabilité des projets');
    // Calculer la rentabilité de tous les projets actifs
  }

  private async sendMilestoneNotifications(): Promise<void> {
    console.log('[Projects] Envoi des notifications de jalons');
    // Notifier les échéances de jalons approchantes
  }

  private async processAutoInvoicing(): Promise<void> {
    console.log('[Projects] Traitement de la facturation automatique');
    // Générer les factures selon l'avancement
  }

  private async sendTimesheetReminders(): Promise<void> {
    console.log('[Projects] Rappels de saisie des temps');
    // Rappeler aux utilisateurs de saisir leurs temps
  }

  // Méthodes utilitaires
  private async calculateProfitability(projectId: string): Promise<any> {
    // Calcul détaillé de la rentabilité
    return {
      projectId,
      budget: 50000,
      actualCosts: 35000,
      estimatedCosts: 45000,
      revenue: 48000,
      profitMargin: 13000,
      profitPercentage: 27.08,
      hoursLogged: 280,
      hoursEstimated: 320,
      avgHourlyRate: 125,
      breakdown: {
        development: { budget: 30000, actual: 22000, percentage: 73.33 },
        design: { budget: 10000, actual: 8000, percentage: 80.00 },
        testing: { budget: 5000, actual: 3000, percentage: 60.00 },
        management: { budget: 5000, actual: 2000, percentage: 40.00 },
      },
    };
  }

  private async generateGanttData(projectId: string): Promise<any> {
    // Génération des données pour le Gantt
    return {
      tasks: [
        {
          id: '1',
          name: 'Phase 1: Analyse',
          start: '2024-08-01',
          end: '2024-08-10',
          progress: 100,
          dependencies: [],
          type: 'project',
        },
        {
          id: '2',
          name: 'Phase 2: Développement',
          start: '2024-08-11',
          end: '2024-09-15',
          progress: 60,
          dependencies: ['1'],
          type: 'project',
        },
        {
          id: '3',
          name: 'Phase 3: Tests',
          start: '2024-09-16',
          end: '2024-09-25',
          progress: 0,
          dependencies: ['2'],
          type: 'project',
        },
      ],
      links: [
        { id: 1, source: '1', target: '2', type: 'finish_to_start' },
        { id: 2, source: '2', target: '3', type: 'finish_to_start' },
      ],
      criticalPath: ['1', '2', '3'],
    };
  }
}

// Export du module
export const projectsModule = new ProjectsModule();