// services/tenantService.ts - Version corrigée
// import { supabase } from '../lib/supabase'; // Commenté pour la compatibilité de build
import { TenantConfig, TenantFeatures, TenantBranding } from '../types/tenant'; // ✅ CORRECTION: Import ajouté

export class TenantService {
  private static instance: TenantService;
  private currentTenant: TenantConfig | null = null;
  private supabaseClient: any = null;

  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  async initializeTenant(tenantId: string): Promise<boolean> {
    try {
      // 1. Charger la configuration du tenant depuis un service central
      const tenantConfig = await this.loadTenantConfig(tenantId);
      
      if (!tenantConfig || !tenantConfig.isActive) {
        throw new Error('Tenant non trouvé ou inactif');
      }

      // 2. Vérifier la validité de la licence
      if (tenantConfig.expiresAt && tenantConfig.expiresAt < new Date()) {
        throw new Error('Licence expirée');
      }

      // 3. Utiliser l'instance Supabase unique (CORRECTION CRITIQUE)
      const supabaseModule = await import('@/lib/supabase');
      this.supabaseClient = (supabaseModule as any).getSupabaseClient();

      // 4. Vérifier la connexion à la base de données
      const { error } = await this.supabaseClient.from('companies').select('count').single();
      if (error && error.code !== 'PGRST116') { // PGRST116 = table vide, OK
        throw new Error('Impossible de se connecter à la base de données');
      }

      // 5. Configurer l'environnement
      this.currentTenant = tenantConfig;
      await this.setupEnvironment(tenantConfig);

      return true;
    } catch (error) {
      console.error('Erreur d\'initialisation du tenant:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  private async loadTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    try {
      // Dans un environnement de production, ceci serait un appel API
      // vers un service central de gestion des tenants
      const response = await fetch(`/api/tenants/${tenantId}`);
      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      // Fallback : configuration locale pour le développement
      return this.getLocalTenantConfig(tenantId);
    }
  }

  private getLocalTenantConfig(tenantId: string): TenantConfig | null {
    // Configuration locale pour le développement/démo
    const localConfigs: { [key: string]: TenantConfig } = {
      'demo-benin': {
        id: 'demo-benin',
        name: 'Demo Bénin',
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '', // ✅ CORRECTION: import.meta.env
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '', // ✅ CORRECTION: import.meta.env
        country: 'BJ',
        currency: 'XOF',
        accountingStandard: 'SYSCOHADA',
        timezone: 'Africa/Porto-Novo',
        language: 'fr',
        isActive: true,
        createdAt: new Date(),
        features: {
          maxUsers: 10,
          maxCompanies: 3,
          multiCurrency: true,
          advancedReporting: true,
          apiAccess: false,
          customBranding: false,
          ssoEnabled: false,
          auditLogs: true
        }
      },
      'demo-ci': {
        id: 'demo-ci',
        name: 'Demo Côte d\'Ivoire',
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '', // ✅ CORRECTION: import.meta.env
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '', // ✅ CORRECTION: import.meta.env
        country: 'CI',
        currency: 'XOF',
        accountingStandard: 'SYSCOHADA',
        timezone: 'Africa/Abidjan',
        language: 'fr',
        isActive: true,
        createdAt: new Date(),
        features: {
          maxUsers: 5,
          maxCompanies: 1,
          multiCurrency: false,
          advancedReporting: false,
          apiAccess: false,
          customBranding: false,
          ssoEnabled: false,
          auditLogs: false
        }
      }
    };

    return localConfigs[tenantId] || null;
  }

  private async setupEnvironment(config: TenantConfig): Promise<void> {
    // 1. Configurer les devises
    const currencyService = (await import('./currencyService')).CurrencyService.getInstance();
    currencyService.setDefaultCurrency(config.currency);

    // 2. Configurer le plan comptable
    const accountingService = (await import('./accountingService')).AccountingService.getInstance();
    if (config.accountingStandard === 'SYSCOHADA') {
      const { SYSCOHADA_PLAN } = await import('../data/syscohada');
      accountingService.setAccountPlan(SYSCOHADA_PLAN);
    }

    // 3. Configurer la localisation
    document.documentElement.lang = config.language;
    
    // 4. Appliquer le branding si disponible
    if (config.branding) {
      this.applyBranding(config.branding);
    }
  }

  private applyBranding(branding: TenantBranding): void {
    // Appliquer les couleurs personnalisées
    const root = document.documentElement;
    root.style.setProperty('--primary-color', branding.primaryColor);
    root.style.setProperty('--secondary-color', branding.secondaryColor);

    // Mettre à jour le titre et favicon
    document.title = `Casskai - ${branding.companyName}`;
    if (branding.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) favicon.href = branding.favicon;
    }
  }

  getCurrentTenant(): TenantConfig | null {
    return this.currentTenant;
  }

  getSupabaseClient(): any {
    // return supabase; // Commenté pour la compatibilité de build
    return null;
  }

  canAccessFeature(feature: keyof TenantFeatures): boolean {
    if (!this.currentTenant) return false;
    return this.currentTenant.features[feature] as boolean;
  }

  getRemainingQuota(resource: 'users' | 'companies'): number {
    if (!this.currentTenant) return 0;
    
    // Dans un vrai environnement, ceci ferait un appel API
    // pour obtenir l'utilisation actuelle
    switch (resource) {
      case 'users':
        return this.currentTenant.features.maxUsers;
      case 'companies':
        return this.currentTenant.features.maxCompanies;
      default:
        return 0;
    }
  }

  async createTenant(config: Omit<TenantConfig, 'id' | 'createdAt'>): Promise<string> {
    const tenantId = `tenant-${Date.now()}`;
    const newTenant: TenantConfig = {
      ...config,
      id: tenantId,
      createdAt: new Date()
    };

    // 1. Créer le projet Supabase (simulation)
    const supabaseProject = await this.createSupabaseProject(newTenant);
    newTenant.supabaseUrl = supabaseProject.url;
    newTenant.supabaseKey = supabaseProject.anonKey;

    // 2. Initialiser le schéma de base de données
    await this.initializeDatabaseSchema(newTenant);

    // 3. Sauvegarder la configuration
    await this.saveTenantConfig(newTenant);

    return tenantId;
  }

  private async createSupabaseProject(tenant: TenantConfig): Promise<{url: string, anonKey: string}> {
    // Dans un environnement de production, ceci utiliserait l'API Supabase
    // pour créer automatiquement un nouveau projet
    
    console.warn('Création du projet Supabase pour:', tenant.name);
    
    // Simulation - en réalité, il faudrait :
    // 1. Appeler l'API Supabase Management
    // 2. Créer un nouveau projet
    // 3. Retourner les credentials
    
    return {
      url: `https://${tenant.id}.supabase.co`,
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Token généré
    };
  }

  private async initializeDatabaseSchema(tenant: TenantConfig): Promise<void> {
    // Exécuter les migrations SQL pour initialiser le schéma
    const migrations = await this.getMigrations(tenant.accountingStandard);
    
    for (const migration of migrations) {
      await this.executeMigration(tenant, migration);
    }
  }

  private async getMigrations(standard: string): Promise<string[]> {
    // Retourner les scripts SQL d'initialisation selon le standard comptable
    const baseMigrations = [
      'CREATE TABLE companies (...)',
      'CREATE TABLE users (...)',
      'CREATE TABLE accounts (...)',
      'CREATE TABLE transactions (...)'
    ];

    if (standard === 'SYSCOHADA') {
      baseMigrations.push(
        'INSERT INTO accounts (number, name, type) VALUES ...' // Insérer le plan SYSCOHADA
      );
    }

    return baseMigrations;
  }

  private async executeMigration(tenant: TenantConfig, sql: string): Promise<void> {
    // Exécuter la migration SQL sur la base du tenant
    console.warn(`Exécution migration pour ${tenant.id}:`, `${sql.substring(0, 50)  }...`);
  }

  private async saveTenantConfig(tenant: TenantConfig): Promise<void> {
    // Sauvegarder dans un service central ou fichier local
    console.warn('Sauvegarde config tenant:', tenant.id);
  }
}
