// Module RH Light - Gestion simplifiée des ressources humaines avec OCR

import { Module, ModuleDefinition, ModuleContext } from '@/types/modules.types';
import { ModulePermissionService } from '@/services/moduleManager';

// Définition du module RH Light
export const HR_MODULE_DEFINITION: ModuleDefinition = {
  id: 'hr-light',
  name: 'RH Light',
  description: 'Gestion simplifiée RH : congés, notes de frais avec OCR, fiches de paie et déclarations sociales',
  version: '1.0.0',
  category: 'hr',
  icon: 'users-cog',
  status: 'available',
  isCore: false,
  isPremium: true,
  
  permissions: [
    ModulePermissionService.PERMISSIONS.HR_VIEW,
    ModulePermissionService.PERMISSIONS.HR_MANAGE_EMPLOYEES,
    ModulePermissionService.PERMISSIONS.HR_APPROVE_LEAVES,
    ModulePermissionService.PERMISSIONS.HR_VIEW_PAYROLL,
  ],
  
  dependencies: ['accounting-core'], // Dépend du module comptabilité pour les écritures
  conflicts: [],
  
  pricing: {
    type: 'subscription',
    price: 19,
    currency: 'EUR',
    billingPeriod: 'monthly',
    trialDays: 14,
    features: [
      'Gestion des employés illimitée',
      'Demandes de congés et validation',
      'Notes de frais avec OCR automatique',
      'Fiches de paie simplifiées',
      'DSN et déclarations sociales',
      'Tableaux de bord RH',
      'Export comptable automatique',
      'Notifications automatiques',
    ],
  },
  
  config: {
    settings: {
      approvalWorkflow: {
        type: 'boolean',
        label: 'Workflow d\'approbation',
        description: 'Activer le workflow de validation des demandes',
        required: false,
      },
      ocrProvider: {
        type: 'select',
        label: 'Service OCR',
        description: 'Fournisseur de reconnaissance optique',
        required: false,
        options: [
          { value: 'google-vision', label: 'Google Vision API' },
          { value: 'aws-textract', label: 'AWS Textract' },
          { value: 'azure-ocr', label: 'Azure Computer Vision' },
          { value: 'internal', label: 'OCR interne' },
        ],
      },
      payrollIntegration: {
        type: 'select',
        label: 'Intégration paie',
        description: 'Service de paie externe',
        required: false,
        options: [
          { value: 'none', label: 'Aucune' },
          { value: 'silae', label: 'Silae' },
          { value: 'payfit', label: 'PayFit' },
          { value: 'sage', label: 'Sage Paie' },
        ],
      },
      dsnProvider: {
        type: 'select',
        label: 'Fournisseur DSN',
        description: 'Service de déclarations sociales',
        required: false,
        options: [
          { value: 'net-entreprises', label: 'Net-entreprises' },
          { value: 'msa', label: 'MSA' },
          { value: 'jedeclare', label: 'JeDeclare.com' },
        ],
      },
      leaveTypes: {
        type: 'json',
        label: 'Types de congés',
        description: 'Configuration des types de congés disponibles',
        required: false,
      },
    },
    defaultValues: {
      approvalWorkflow: true,
      ocrProvider: 'internal',
      payrollIntegration: 'none',
      dsnProvider: 'net-entreprises',
      leaveTypes: [
        { id: 'vacation', name: 'Congés payés', maxDays: 25, color: '#10b981' },
        { id: 'sick', name: 'Arrêt maladie', maxDays: 365, color: '#ef4444' },
        { id: 'personal', name: 'Congés sans solde', maxDays: 30, color: '#6366f1' },
        { id: 'parental', name: 'Congé parental', maxDays: 730, color: '#f59e0b' },
      ],
    },
  },
  
  author: 'CassKai Team',
  documentation: '/docs/modules/hr',
  supportUrl: '/support/hr',
  
  changelog: [
    {
      version: '1.0.0',
      date: '2024-08-07',
      type: 'feature',
      description: 'Version initiale avec gestion employés, congés, notes de frais OCR et fiches de paie',
    },
  ],
};

// Implémentation du module RH Light
export class HRModule implements Module {
  definition = HR_MODULE_DEFINITION;

  async onInstall(context: ModuleContext): Promise<void> {
    console.log('[HR] Installation du module RH Light');
    
    // Créer les tables nécessaires
    await this.createDatabaseSchema(context);
    
    // Créer les configurations par défaut
    await this.createDefaultConfigurations(context);
    
    // Initialiser les services OCR
    await this.initializeOCRService(context);
  }

  async onActivate(context: ModuleContext): Promise<void> {
    console.log('[HR] Activation du module RH Light');
    
    // Initialiser les services
    await this.initializeServices(context);
    
    // Démarrer les tâches automatiques
    await this.startAutomatedTasks(context);
  }

  async onDeactivate(context: ModuleContext): Promise<void> {
    console.log('[HR] Désactivation du module RH Light');
    
    // Arrêter les tâches automatiques
    await this.stopAutomatedTasks(context);
  }

  validateConfig(config: Record<string, any>): boolean | string {
    // Validation de la configuration
    if (config.ocrProvider && !['google-vision', 'aws-textract', 'azure-ocr', 'internal'].includes(config.ocrProvider)) {
      return 'Fournisseur OCR invalide';
    }
    
    if (config.leaveTypes && !Array.isArray(config.leaveTypes)) {
      return 'Types de congés doivent être un tableau';
    }
    
    return true;
  }

  getDefaultConfig(): Record<string, any> {
    return this.definition.config?.defaultValues || {};
  }

  // Méthodes privées d'initialisation
  private async createDatabaseSchema(context: ModuleContext): Promise<void> {
    // Création des tables RH
    const schemas = [
      // Table des employés
      `CREATE TABLE IF NOT EXISTS hr_employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        employee_number VARCHAR(50) UNIQUE NOT NULL,
        personal_info JSONB NOT NULL,
        contract_info JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
        documents TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des demandes de congés
      `CREATE TABLE IF NOT EXISTS hr_leave_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        employee_id UUID REFERENCES hr_employees(id),
        type VARCHAR(20) NOT NULL CHECK (type IN ('vacation', 'sick', 'personal', 'parental', 'unpaid')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days DECIMAL(3,1) NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by UUID,
        approved_at TIMESTAMP,
        comments TEXT,
        documents TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des soldes de congés
      `CREATE TABLE IF NOT EXISTS hr_leave_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        employee_id UUID REFERENCES hr_employees(id),
        leave_type VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        allocated_days DECIMAL(4,1) DEFAULT 0,
        taken_days DECIMAL(4,1) DEFAULT 0,
        pending_days DECIMAL(4,1) DEFAULT 0,
        carried_over DECIMAL(4,1) DEFAULT 0,
        UNIQUE(employee_id, leave_type, year)
      )`,
      
      // Table des notes de frais
      `CREATE TABLE IF NOT EXISTS hr_expense_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        employee_id UUID REFERENCES hr_employees(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        total_amount DECIMAL(15,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'EUR',
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
        approved_by UUID,
        approved_at TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des lignes de frais
      `CREATE TABLE IF NOT EXISTS hr_expense_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        expense_report_id UUID REFERENCES hr_expense_reports(id),
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        date DATE NOT NULL,
        receipt_file VARCHAR(255),
        ocr_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des fiches de paie
      `CREATE TABLE IF NOT EXISTS hr_payslips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        employee_id UUID REFERENCES hr_employees(id),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        gross_salary DECIMAL(15,2) NOT NULL,
        net_salary DECIMAL(15,2) NOT NULL,
        social_charges DECIMAL(15,2) NOT NULL DEFAULT 0,
        income_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
        details JSONB NOT NULL,
        pdf_file VARCHAR(255),
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'archived')),
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Table des déclarations sociales
      `CREATE TABLE IF NOT EXISTS hr_social_declarations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('dsn', 'urssaf', 'msa', 'pole_emploi')),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'sent', 'acknowledged')),
        data JSONB NOT NULL,
        file_path VARCHAR(255),
        external_id VARCHAR(255),
        sent_at TIMESTAMP,
        acknowledged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    ];

    // Exécuter les schémas (simulation)
    console.log('[HR] Création du schéma de base de données', schemas.length, 'tables');
  }

  private async createDefaultConfigurations(context: ModuleContext): Promise<void> {
    const defaultConfigs = [
      // Catégories de notes de frais
      {
        type: 'expense_categories',
        data: [
          { id: 'transport', name: 'Transport', maxAmount: 500, requiresReceipt: true },
          { id: 'meals', name: 'Repas', maxAmount: 100, requiresReceipt: true },
          { id: 'accommodation', name: 'Hébergement', maxAmount: 200, requiresReceipt: true },
          { id: 'office', name: 'Fournitures bureau', maxAmount: 150, requiresReceipt: true },
          { id: 'phone', name: 'Téléphone', maxAmount: 80, requiresReceipt: false },
          { id: 'training', name: 'Formation', maxAmount: 1000, requiresReceipt: true },
        ],
      },
      
      // Templates de fiches de paie
      {
        type: 'payslip_templates',
        data: {
          standard: {
            name: 'Fiche de paie standard',
            sections: [
              { id: 'identity', name: 'Identification', fields: ['employee', 'employer', 'period'] },
              { id: 'salary', name: 'Salaire', fields: ['base_salary', 'overtime', 'bonuses'] },
              { id: 'deductions', name: 'Retenues', fields: ['social_security', 'income_tax', 'other'] },
              { id: 'totals', name: 'Totaux', fields: ['gross_salary', 'total_deductions', 'net_salary'] },
            ],
          },
        },
      },
      
      // Règles de validation OCR
      {
        type: 'ocr_rules',
        data: {
          patterns: {
            date: /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g,
            amount: /\d+[,\.]\d{2}|\d+/g,
            vendor: /^[A-Z].+$/m,
            tva: /T\.?V\.?A\.?/i,
          },
          categories: {
            restaurant: ['restaurant', 'café', 'brasserie', 'resto'],
            transport: ['sncf', 'uber', 'taxi', 'péage', 'essence'],
            hotel: ['hôtel', 'hotel', 'ibis', 'mercure', 'novotel'],
            bureau: ['staples', 'bureau vallée', 'papeterie'],
          },
        },
      },
    ];

    console.log('[HR] Création des configurations par défaut:', defaultConfigs.length);
  }

  private async initializeOCRService(context: ModuleContext): Promise<void> {
    const provider = context.config.ocrProvider || 'internal';
    console.log('[HR] Initialisation du service OCR:', provider);
    
    switch (provider) {
      case 'google-vision':
        await this.initializeGoogleVision(context);
        break;
      case 'aws-textract':
        await this.initializeAWSTextract(context);
        break;
      case 'azure-ocr':
        await this.initializeAzureOCR(context);
        break;
      default:
        await this.initializeInternalOCR(context);
        break;
    }
  }

  private async initializeServices(context: ModuleContext): Promise<void> {
    console.log('[HR] Initialisation des services RH');
    
    // Service de gestion des congés
    await this.initializeLeaveService(context);
    
    // Service de paie
    if (context.config.payrollIntegration !== 'none') {
      await this.initializePayrollService(context);
    }
    
    // Service de déclarations sociales
    await this.initializeSocialDeclarationsService(context);
  }

  private async initializeGoogleVision(context: ModuleContext): Promise<void> {
    // Configuration Google Vision API
    console.log('[HR] Configuration Google Vision API');
  }

  private async initializeAWSTextract(context: ModuleContext): Promise<void> {
    // Configuration AWS Textract
    console.log('[HR] Configuration AWS Textract');
  }

  private async initializeAzureOCR(context: ModuleContext): Promise<void> {
    // Configuration Azure Computer Vision
    console.log('[HR] Configuration Azure Computer Vision');
  }

  private async initializeInternalOCR(context: ModuleContext): Promise<void> {
    // Configuration OCR interne (Tesseract.js par exemple)
    console.log('[HR] Configuration OCR interne');
  }

  private async initializeLeaveService(context: ModuleContext): Promise<void> {
    console.log('[HR] Initialisation du service de gestion des congés');
    // Configuration des types de congés, règles de calcul, etc.
  }

  private async initializePayrollService(context: ModuleContext): Promise<void> {
    const integration = context.config.payrollIntegration;
    console.log('[HR] Initialisation de l\'intégration paie:', integration);
    
    switch (integration) {
      case 'silae':
        // Configuration Silae
        break;
      case 'payfit':
        // Configuration PayFit
        break;
      case 'sage':
        // Configuration Sage Paie
        break;
    }
  }

  private async initializeSocialDeclarationsService(context: ModuleContext): Promise<void> {
    const provider = context.config.dsnProvider;
    console.log('[HR] Initialisation des déclarations sociales:', provider);
    
    // Configuration du service de déclarations
  }

  private async startAutomatedTasks(context: ModuleContext): Promise<void> {
    console.log('[HR] Démarrage des tâches automatiques RH');
    
    // Calcul automatique des soldes de congés
    // Génération automatique des fiches de paie
    // Rappels d'échéances
  }

  private async stopAutomatedTasks(context: ModuleContext): Promise<void> {
    console.log('[HR] Arrêt des tâches automatiques RH');
  }

  // Routes et composants React
  getRoutes() {
    return [
      {
        path: '/hr',
        component: () => import('./components/HRDashboard'),
        permissions: [ModulePermissionService.PERMISSIONS.HR_VIEW],
      },
      {
        path: '/hr/employees',
        component: () => import('./components/EmployeesManagement'),
        permissions: [ModulePermissionService.PERMISSIONS.HR_MANAGE_EMPLOYEES],
      },
      {
        path: '/hr/leaves',
        component: () => import('./components/LeavesManagement'),
        permissions: [ModulePermissionService.PERMISSIONS.HR_VIEW],
      },
      {
        path: '/hr/expenses',
        component: () => import('./components/ExpensesManagement'),
        permissions: [ModulePermissionService.PERMISSIONS.HR_VIEW],
      },
      {
        path: '/hr/payroll',
        component: () => import('./components/PayrollManagement'),
        permissions: [ModulePermissionService.PERMISSIONS.HR_VIEW_PAYROLL],
      },
    ];
  }

  getComponents() {
    return {
      HRWidget: () => import('./components/HRWidget'),
      LeaveBalance: () => import('./components/LeaveBalance'),
      ExpensesSummary: () => import('./components/ExpensesSummary'),
      PayrollSummary: () => import('./components/PayrollSummary'),
    };
  }

  // API Endpoints
  getAPIEndpoints() {
    return [
      // Employés
      {
        method: 'GET',
        path: '/api/hr/employees',
        handler: this.getEmployees.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.HR_VIEW],
      },
      {
        method: 'POST',
        path: '/api/hr/employees',
        handler: this.createEmployee.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.HR_MANAGE_EMPLOYEES],
      },
      
      // Congés
      {
        method: 'POST',
        path: '/api/hr/leave-requests',
        handler: this.createLeaveRequest.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.HR_VIEW],
      },
      {
        method: 'PUT',
        path: '/api/hr/leave-requests/:id/approve',
        handler: this.approveLeaveRequest.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.HR_APPROVE_LEAVES],
      },
      
      // Notes de frais
      {
        method: 'POST',
        path: '/api/hr/expenses/ocr',
        handler: this.processReceiptOCR.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.HR_VIEW],
      },
      {
        method: 'POST',
        path: '/api/hr/expense-reports',
        handler: this.createExpenseReport.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.HR_VIEW],
      },
      
      // Paie
      {
        method: 'POST',
        path: '/api/hr/payslips/generate',
        handler: this.generatePayslips.bind(this),
        permissions: [ModulePermissionService.PERMISSIONS.HR_VIEW_PAYROLL],
      },
    ];
  }

  // Tâches programmées
  getScheduledTasks() {
    return [
      {
        name: 'leave-balance-update',
        schedule: '0 2 1 * *', // Premier du mois à 2h
        handler: this.updateLeaveBalances.bind(this),
      },
      {
        name: 'payslip-generation',
        schedule: '0 3 28 * *', // 28 de chaque mois à 3h
        handler: this.autoGeneratePayslips.bind(this),
      },
      {
        name: 'social-declaration-reminder',
        schedule: '0 9 5 * *', // 5 de chaque mois à 9h
        handler: this.sendSocialDeclarationReminders.bind(this),
      },
      {
        name: 'expense-approval-reminder',
        schedule: '0 10 * * 1', // Chaque lundi à 10h
        handler: this.sendExpenseApprovalReminders.bind(this),
      },
    ];
  }

  // Méthodes API
  private async getEmployees(req: any, res: any): Promise<void> {
    // Récupération des employés
  }

  private async createEmployee(req: any, res: any): Promise<void> {
    // Création d'employé
  }

  private async createLeaveRequest(req: any, res: any): Promise<void> {
    // Création de demande de congés
  }

  private async approveLeaveRequest(req: any, res: any): Promise<void> {
    // Approbation de demande de congés
  }

  private async processReceiptOCR(req: any, res: any): Promise<void> {
    // Traitement OCR des reçus
    console.log('[HR] Traitement OCR d\'un reçu');
    
    // Logique OCR selon le fournisseur configuré
    const ocrResult = await this.performOCR(req.file);
    
    // Analyse et extraction des données
    const extractedData = this.extractExpenseData(ocrResult);
    
    res.json(extractedData);
  }

  private async createExpenseReport(req: any, res: any): Promise<void> {
    // Création de note de frais
  }

  private async generatePayslips(req: any, res: any): Promise<void> {
    // Génération de fiches de paie
  }

  // Tâches automatisées
  private async updateLeaveBalances(): Promise<void> {
    console.log('[HR] Mise à jour des soldes de congés');
  }

  private async autoGeneratePayslips(): Promise<void> {
    console.log('[HR] Génération automatique des fiches de paie');
  }

  private async sendSocialDeclarationReminders(): Promise<void> {
    console.log('[HR] Envoi des rappels de déclarations sociales');
  }

  private async sendExpenseApprovalReminders(): Promise<void> {
    console.log('[HR] Envoi des rappels d\'approbation de frais');
  }

  // Méthodes utilitaires OCR
  private async performOCR(file: any): Promise<any> {
    // Implémentation OCR selon le fournisseur
    return {
      text: 'RESTAURANT ABC\n12/08/2024\nTotal: 45,60€\nTVA: 4,15€',
      confidence: 0.92,
      blocks: [
        { text: 'RESTAURANT ABC', bbox: [10, 10, 200, 30] },
        { text: '12/08/2024', bbox: [10, 40, 100, 60] },
        { text: 'Total: 45,60€', bbox: [10, 200, 150, 220] },
      ],
    };
  }

  private extractExpenseData(ocrResult: any): any {
    // Extraction des données pertinentes
    const extractedData = {
      vendor: this.extractVendor(ocrResult.text),
      date: this.extractDate(ocrResult.text),
      amount: this.extractAmount(ocrResult.text),
      category: this.categorizeExpense(ocrResult.text),
      confidence: ocrResult.confidence,
    };

    return extractedData;
  }

  private extractVendor(text: string): string | null {
    // Logique d'extraction du fournisseur
    const lines = text.split('\n');
    return lines[0]?.trim() || null;
  }

  private extractDate(text: string): Date | null {
    // Logique d'extraction de la date
    const dateRegex = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/;
    const match = text.match(dateRegex);
    if (match) {
      return new Date(match[0]);
    }
    return null;
  }

  private extractAmount(text: string): number | null {
    // Logique d'extraction du montant
    const amountRegex = /(\d+[,\.]\d{2})/g;
    const matches = text.match(amountRegex);
    if (matches) {
      const amounts = matches.map(m => parseFloat(m.replace(',', '.')));
      return Math.max(...amounts); // Prendre le montant le plus élevé
    }
    return null;
  }

  private categorizeExpense(text: string): string {
    // Logique de catégorisation automatique
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('restaurant') || lowerText.includes('café')) {
      return 'meals';
    }
    if (lowerText.includes('taxi') || lowerText.includes('uber') || lowerText.includes('sncf')) {
      return 'transport';
    }
    if (lowerText.includes('hôtel') || lowerText.includes('hotel')) {
      return 'accommodation';
    }
    
    return 'other';
  }
}

// Export du module
export const hrModule = new HRModule();