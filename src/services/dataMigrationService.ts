import { supabase } from '@/lib/supabase';

/**
 * Service pour migrer et synchroniser les données entre localStorage et Supabase
 */
class DataMigrationService {

  /**
   * Migrer les données d'une entreprise depuis localStorage vers Supabase
   */
  async migrateCompanyData(userId: string, companyData: any): Promise<{ success: boolean; companyId?: string; error?: string }> {
    try {
      // 1. Créer l'entreprise
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.name || 'Mon Entreprise',
          legal_name: companyData.legalName || companyData.name,
          siret: companyData.siret,
          siren: companyData.siren,
          vat_number: companyData.vatNumber,
          address: companyData.address,
          city: companyData.city,
          postal_code: companyData.postalCode,
          country: companyData.country || 'FR',
          phone: companyData.phone,
          email: companyData.email,
          default_currency: companyData.currency || 'EUR',
          fiscal_year_start: companyData.fiscalYearStart || 1
        })
        .select()
        .single();

      if (companyError) {
        console.error('Erreur création entreprise:', companyError);
        return { success: false, error: companyError.message };
      }

      const companyId = company.id;

      // 2. Associer l'utilisateur à l'entreprise
      const { error: userCompanyError } = await supabase
        .from('user_companies')
        .insert({
          user_id: userId,
          company_id: companyId,
          role: 'owner'
        });

      if (userCompanyError) {
        console.error('Erreur association utilisateur-entreprise:', userCompanyError);
        return { success: false, error: userCompanyError.message };
      }

      // 3. Créer un abonnement d'essai
      const { data: trialResult, error: trialError } = await supabase
        .rpc('create_trial_subscription', {
          p_user_id: userId,
          p_company_id: companyId
        });

      if (trialError) {
        console.warn('Erreur création essai:', trialError);
        // Non bloquant
      }

      // 4. Migrer les modules activés
      await this.migrateModules(companyId);

      return { success: true, companyId };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur migration données entreprise:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  /**
   * Migrer les modules depuis localStorage
   */
  private async migrateModules(companyId: string): Promise<void> {
    try {
      // Récupérer les modules activés depuis localStorage
      const moduleStates = JSON.parse(localStorage.getItem('casskai-module-states') || '{}');
      const defaultModules = ['dashboard', 'settings', 'users', 'security'];

      // Modules à insérer
      const modulesToInsert = [];

      // Ajouter les modules par défaut
      defaultModules.forEach(moduleKey => {
        modulesToInsert.push({
          company_id: companyId,
          module_key: moduleKey,
          module_name: this.getModuleName(moduleKey),
          is_enabled: true
        });
      });

      // Ajouter les autres modules selon leur état
      Object.entries(moduleStates).forEach(([moduleKey, isEnabled]) => {
        if (!defaultModules.includes(moduleKey)) {
          modulesToInsert.push({
            company_id: companyId,
            module_key: moduleKey,
            module_name: this.getModuleName(moduleKey),
            is_enabled: isEnabled as boolean
          });
        }
      });

      if (modulesToInsert.length > 0) {
        const { error } = await supabase
          .from('company_modules')
          .insert(modulesToInsert);

        if (error) {
          console.error('Erreur migration modules:', error);
        } else {
          console.warn('Modules migrés avec succès:', modulesToInsert.length);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur migration modules:', error);
    }
  }

  /**
   * Obtenir le nom d'affichage d'un module
   */
  private getModuleName(moduleKey: string): string {
    const moduleNames: Record<string, string> = {
      dashboard: 'Tableau de bord',
      settings: 'Paramètres',
      users: 'Utilisateurs',
      security: 'Sécurité',
      accounting: 'Comptabilité',
      invoicing: 'Facturation',
      banking: 'Banque',
      purchases: 'Achats',
      thirdParties: 'Tiers',
      reports: 'Rapports',
      budget: 'Budget & Prévisions',
      humanResources: 'Ressources Humaines',
      tax: 'Fiscalité',
      salesCrm: 'CRM Ventes',
      inventory: 'Stock & Inventaire',
      projects: 'Projets',
      contracts: 'Contrats'
    };

    return moduleNames[moduleKey] || moduleKey;
  }

  /**
   * Synchroniser les données utilisateur avec Supabase
   */
  async syncUserData(userId: string): Promise<{ success: boolean; companies: any[]; error?: string }> {
    try {
      // Récupérer les entreprises de l'utilisateur
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          *,
          user_companies!inner(role, is_active)
        `)
        .eq('user_companies.user_id', userId)
        .eq('user_companies.is_active', true);

      if (error) {
        console.error('Erreur récupération entreprises:', error);
        return { success: false, companies: [], error: error.message };
      }

      return { success: true, companies: companies || [] };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur sync données utilisateur:', error);
      return {
        success: false,
        companies: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Vérifier si l'utilisateur a besoin de migrer ses données
   */
  async needsMigration(userId: string): Promise<boolean> {
    try {
      const { data: companies } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      // Si l'utilisateur n'a pas d'entreprises en DB, il a besoin de migration
      return !companies || companies.length === 0;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur vérification migration:', error);
      return true; // En cas d'erreur, forcer la migration
    }
  }

  /**
   * Nettoyer les données localStorage après migration réussie
   */
  clearLocalStorageAfterMigration(): void {
    try {
      // Conserver certaines données importantes
      const toKeep = [
        'casskai-theme',
        'casskai-language',
        'casskai-user-preferences'
      ];

      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('casskai') && !toKeep.includes(key)) {
          toRemove.push(key);
        }
      }

      toRemove.forEach(key => localStorage.removeItem(key));

      console.warn('localStorage nettoyé après migration:', toRemove.length, 'entrées supprimées');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn('Erreur nettoyage localStorage:', error);
    }
  }

  /**
   * Créer un plan comptable de base pour une entreprise
   */
  async createBasicChartOfAccounts(companyId: string): Promise<void> {
    try {
      const basicAccounts = [
        // Capitaux propres
        { number: '101000', name: 'Capital social', type: 'equity' },
        { number: '120000', name: 'Résultat de l\'exercice', type: 'equity' },

        // Actifs
        { number: '411000', name: 'Clients', type: 'asset' },
        { number: '512000', name: 'Banque', type: 'asset' },
        { number: '530000', name: 'Caisse', type: 'asset' },

        // Passifs
        { number: '401000', name: 'Fournisseurs', type: 'liability' },
        { number: '445711', name: 'TVA collectée', type: 'liability' },

        // Charges
        { number: '601000', name: 'Achats', type: 'expense' },
        { number: '613000', name: 'Locations', type: 'expense' },
        { number: '641000', name: 'Salaires', type: 'expense' },

        // Produits
        { number: '701000', name: 'Ventes de produits', type: 'revenue' },
        { number: '706000', name: 'Prestations de services', type: 'revenue' }
      ];

      const accountsToInsert = basicAccounts.map(account => ({
        company_id: companyId,
        account_number: account.number,
        account_name: account.name,
        account_type: account.type
      }));

      const { error } = await supabase
        .from('chart_of_accounts')
        .insert(accountsToInsert);

      if (error) {
        console.error('Erreur création plan comptable:', error);
      } else {
        console.warn('Plan comptable de base créé');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur création plan comptable:', error);
    }
  }

  /**
   * Forcer la synchronisation complète
   */
  async fullSync(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.warn('Début synchronisation complète...');

      // 1. Vérifier si migration nécessaire
      const needsMigration = await this.needsMigration(userId);

      if (needsMigration) {
        // 2. Récupérer données localStorage
        const onboardingData = localStorage.getItem('onboarding_company_data');

        if (onboardingData) {
          const companyData = JSON.parse(onboardingData);
          const migrationResult = await this.migrateCompanyData(userId, companyData);

          if (migrationResult.success && migrationResult.companyId) {
            // 3. Créer plan comptable de base
            await this.createBasicChartOfAccounts(migrationResult.companyId);

            // 4. Nettoyer localStorage
            this.clearLocalStorageAfterMigration();

            return {
              success: true,
              message: `Migration réussie ! Entreprise créée: ${migrationResult.companyId}`
            };
          } else {
            return {
              success: false,
              message: `Erreur migration: ${migrationResult.error}`
            };
          }
        }
      }

      // 3. Synchroniser données existantes
      const syncResult = await this.syncUserData(userId);

      if (syncResult.success) {
        return {
          success: true,
          message: `Synchronisation réussie ! ${syncResult.companies.length} entreprise(s) trouvée(s)`
        };
      } else {
        return {
          success: false,
          message: `Erreur synchronisation: ${syncResult.error}`
        };
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur synchronisation complète:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}

export const dataMigrationService = new DataMigrationService();
export default dataMigrationService;
