// Service de test pour valider le système modulaire
import { ModuleDefinition } from '@/types/modules.types';

export class ModuleTestService {
  // Mock de modules pour les tests
  static getMockModules(): ModuleDefinition[] {
    return [
      // Module CRM
      {
        id: 'crm-sales',
        name: 'CRM & Ventes',
        description: 'Pipeline commercial intégré avec devis, factures et signature électronique',
        version: '1.2.0',
        category: 'business',
        icon: 'target',
        key: 'crm',
        path: '/crm',
        status: 'available',
        isCore: false,
        isPremium: true,
        permissions: ['crm:view', 'crm:manage_contacts', 'crm:manage_deals'],
        dependencies: ['accounting-core'],
        conflicts: [],
        pricing: {
          type: 'subscription',
          price: 29,
          currency: 'EUR',
          billingPeriod: 'monthly',
          trialDays: 14,
          features: [
            'Pipeline commercial illimité',
            'Devis et factures automatisés',
            'Signature électronique',
            'Suivi des affaires en temps réel',
            'Rapports CRM avancés',
          ],
        },
        author: 'CassKai Team',
        documentation: '/docs/modules/crm',
        supportUrl: '/support/crm',
        changelog: [
          {
            version: '1.2.0',
            date: '2024-08-07',
            type: 'feature',
            description: 'Ajout de la signature électronique et amélioration des templates'
          },
          {
            version: '1.1.0',
            date: '2024-07-15',
            type: 'feature',
            description: 'Pipeline personnalisable et rapports avancés'
          },
          {
            version: '1.0.0',
            date: '2024-06-01',
            type: 'feature',
            description: 'Version initiale avec gestion des contacts et des affaires'
          }
        ],
      },

      // Module RH
      {
        id: 'hr-light',
        name: 'RH Light',
        description: 'Gestion simplifiée des ressources humaines : congés, notes de frais avec OCR, fiches de paie',
        version: '1.1.0',
        category: 'hr',
        icon: 'user-cog',
        key: 'humanResources',
        path: '/hr',
        status: 'available',
        isCore: false,
        isPremium: true,
        permissions: ['hr:view', 'hr:manage_employees', 'hr:approve_leaves'],
        dependencies: ['accounting-core'],
        conflicts: [],
        pricing: {
          type: 'subscription',
          price: 19,
          currency: 'EUR',
          billingPeriod: 'monthly',
          trialDays: 14,
          features: [
            'Gestion des employés',
            'Congés et absences',
            'Notes de frais avec OCR',
            'Fiches de paie simplifiées',
            'Déclarations sociales automatisées',
          ],
        },
        author: 'CassKai Team',
        documentation: '/docs/modules/hr',
        supportUrl: '/support/hr',
        changelog: [
          {
            version: '1.1.0',
            date: '2024-07-28',
            type: 'feature',
            description: 'OCR pour les notes de frais et intégration PayFit'
          },
          {
            version: '1.0.0',
            date: '2024-05-15',
            type: 'feature',
            description: 'Version initiale avec gestion des congés et employés'
          }
        ],
      },

      // Module Projets
      {
        id: 'projects-management',
        name: 'Gestion de Projets',
        description: 'Timetracking, rentabilité par projet, Gantt et facturation sur avancement',
        version: '1.0.0',
        category: 'project',
        icon: 'briefcase',
        key: 'projects',
        path: '/projects',
        status: 'available',
        isCore: false,
        isPremium: true,
        permissions: ['project:view', 'project:manage', 'project:track_time'],
        dependencies: ['accounting-core', 'crm-sales'],
        conflicts: [],
        pricing: {
          type: 'subscription',
          price: 25,
          currency: 'EUR',
          billingPeriod: 'monthly',
          trialDays: 14,
          features: [
            'Gestion de projets illimitée',
            'Timetracking intégré',
            'Calcul de rentabilité automatique',
            'Diagrammes de Gantt',
            'Facturation par jalons',
          ],
        },
        author: 'CassKai Team',
        documentation: '/docs/modules/projects',
        supportUrl: '/support/projects',
        changelog: [
          {
            version: '1.0.0',
            date: '2024-08-05',
            type: 'feature',
            description: 'Version initiale avec timetracking et Gantt'
          }
        ],
      },

      // Marketplace
      {
        id: 'marketplace',
        name: 'Marketplace',
        description: 'Écosystème d\'extensions : templates sectoriels, connecteurs tiers et plugins communautaires',
        version: '1.0.0',
        category: 'marketplace',
        icon: 'store',
        key: 'marketplace',
        path: '/marketplace',
        status: 'available',
        isCore: true,
        isPremium: false,
        permissions: ['marketplace:browse', 'marketplace:install'],
        dependencies: [],
        conflicts: [],
        pricing: {
          type: 'free',
          price: 0,
          currency: 'EUR',
          features: [
            'Navigateur d\'extensions',
            'Templates sectoriels',
            'Connecteurs tiers',
            'Installation automatique',
            'Évaluations communautaires',
          ],
        },
        author: 'CassKai Team',
        documentation: '/docs/modules/marketplace',
        supportUrl: '/support/marketplace',
        changelog: [
          {
            version: '1.0.0',
            date: '2024-08-07',
            type: 'feature',
            description: 'Version initiale avec templates et connecteurs'
          }
        ],
      },

      // Module Advanced Analytics (Beta)
      {
        id: 'advanced-analytics',
        name: 'Analytics Avancés',
        description: 'Tableaux de bord IA, prédictions et analyses business intelligentes',
        version: '0.9.0',
        category: 'business',
        icon: 'chart-bar',
        key: 'analytics',
        path: '/analytics',
        status: 'beta',
        isCore: false,
        isPremium: true,
        permissions: ['analytics:view', 'analytics:create_dashboards'],
        dependencies: ['accounting-core'],
        conflicts: [],
        pricing: {
          type: 'subscription',
          price: 39,
          currency: 'EUR',
          billingPeriod: 'monthly',
          features: [
            'Dashboards IA personnalisés',
            'Prédictions de trésorerie',
            'Analyses de rentabilité',
            'Alertes intelligentes',
            'Exports avancés',
          ],
        },
        author: 'CassKai Labs',
        documentation: '/docs/modules/analytics',
        supportUrl: '/support/analytics',
        changelog: [
          {
            version: '0.9.0',
            date: '2024-08-03',
            type: 'feature',
            description: 'Version bêta avec IA prédictive'
          }
        ],
      },

      // Module AI Assistant (Coming Soon)
      {
        id: 'ai-assistant',
        name: 'Assistant IA',
        description: 'Assistant intelligent pour catégorisation automatique et conseils personnalisés',
        version: '0.1.0',
        category: 'integration',
        icon: 'brain',
        key: 'ai',
        path: '/ai',
        status: 'coming_soon',
        isCore: false,
        isPremium: true,
        permissions: ['ai:use', 'ai:train'],
        dependencies: [],
        conflicts: [],
        pricing: {
          type: 'subscription',
          price: 49,
          currency: 'EUR',
          billingPeriod: 'monthly',
          features: [
            'Catégorisation automatique',
            'Conseils personnalisés',
            'Détection d\'anomalies',
            'Chat intelligent',
            'Apprentissage continu',
          ],
        },
        author: 'CassKai AI',
        documentation: '/docs/modules/ai',
        supportUrl: '/support/ai',
        changelog: [
          {
            version: '0.1.0',
            date: '2024-08-15',
            type: 'feature',
            description: 'Version de développement avec IA de base'
          }
        ],
      },
    ];
  }

  // Validation des modules
  static validateModule(module: ModuleDefinition): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation basique
    if (!module.id || module.id.length < 3) {
      errors.push('ID de module invalide');
    }
    
    if (!module.name || module.name.length < 3) {
      errors.push('Nom de module invalide');
    }

    if (!module.description || module.description.length < 10) {
      errors.push('Description de module trop courte');
    }

    if (!module.version || !/^\d+\.\d+\.\d+/.test(module.version)) {
      errors.push('Version de module invalide');
    }

    if (!['core', 'business', 'hr', 'project', 'integration', 'marketplace'].includes(module.category)) {
      errors.push('Catégorie de module invalide');
    }

    if (!['available', 'beta', 'coming_soon', 'deprecated'].includes(module.status)) {
      errors.push('Statut de module invalide');
    }

    // Validation du pricing
    if (module.pricing) {
      if (!['free', 'one_time', 'subscription'].includes(module.pricing.type)) {
        errors.push('Type de tarification invalide');
      }
      
      if (module.pricing.type !== 'free' && (!module.pricing.price || module.pricing.price < 0)) {
        errors.push('Prix invalide');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Test de performance pour l'activation
  static async simulateModuleActivation(moduleId: string): Promise<{
    success: boolean;
    duration: number;
    steps: Array<{ name: string; duration: number; success: boolean }>;
  }> {
    const startTime = Date.now();
    const steps = [
      { name: 'Vérification des permissions', duration: 200, success: true },
      { name: 'Validation des dépendances', duration: 300, success: true },
      { name: 'Téléchargement des ressources', duration: 800, success: true },
      { name: 'Installation', duration: 1200, success: true },
      { name: 'Configuration initiale', duration: 500, success: true },
      { name: 'Activation des services', duration: 400, success: true },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.duration));
      
      // Simuler parfois un échec (5% de chance)
      if (Math.random() < 0.05) {
        step.success = false;
        return {
          success: false,
          duration: Date.now() - startTime,
          steps: steps.slice(0, steps.indexOf(step) + 1)
        };
      }
    }

    return {
      success: true,
      duration: Date.now() - startTime,
      steps
    };
  }

  // Test d'intégrité des modules
  static testModuleIntegrity(modules: ModuleDefinition[]): {
    validModules: string[];
    invalidModules: Array<{ id: string; errors: string[] }>;
    dependencyIssues: Array<{ id: string; missingDeps: string[] }>;
    conflicts: Array<{ module1: string; module2: string }>;
  } {
    const validModules: string[] = [];
    const invalidModules: Array<{ id: string; errors: string[] }> = [];
    const dependencyIssues: Array<{ id: string; missingDeps: string[] }> = [];
    const conflicts: Array<{ module1: string; module2: string }> = [];

    // Test de validité de chaque module
    modules.forEach(module => {
      const validation = this.validateModule(module);
      if (validation.isValid) {
        validModules.push(module.id);
      } else {
        invalidModules.push({
          id: module.id,
          errors: validation.errors
        });
      }
    });

    // Test des dépendances
    modules.forEach(module => {
      const missingDeps = module.dependencies.filter(depId => 
        !modules.find(m => m.id === depId)
      );
      
      if (missingDeps.length > 0) {
        dependencyIssues.push({
          id: module.id,
          missingDeps
        });
      }
    });

    // Test des conflits
    modules.forEach(module1 => {
      module1.conflicts.forEach(conflictId => {
        const conflictModule = modules.find(m => m.id === conflictId);
        if (conflictModule) {
          // Éviter les doublons
          if (!conflicts.find(c => 
            (c.module1 === module1.id && c.module2 === conflictId) ||
            (c.module1 === conflictId && c.module2 === module1.id)
          )) {
            conflicts.push({
              module1: module1.id,
              module2: conflictId
            });
          }
        }
      });
    });

    return {
      validModules,
      invalidModules,
      dependencyIssues,
      conflicts
    };
  }

  // Génération d'un rapport de statut du système modulaire
  static generateSystemReport(modules: ModuleDefinition[], activeModuleIds: string[]): {
    summary: {
      total: number;
      active: number;
      available: number;
      beta: number;
      comingSoon: number;
      premium: number;
      free: number;
    };
    categories: Record<string, number>;
    health: {
      score: number; // 0-100
      issues: string[];
      recommendations: string[];
    };
  } {
    const integrity = this.testModuleIntegrity(modules);
    const activeModules = modules.filter(m => activeModuleIds.includes(m.id));
    
    const summary = {
      total: modules.length,
      active: activeModules.length,
      available: modules.filter(m => m.status === 'available').length,
      beta: modules.filter(m => m.status === 'beta').length,
      comingSoon: modules.filter(m => m.status === 'coming_soon').length,
      premium: modules.filter(m => m.isPremium).length,
      free: modules.filter(m => !m.isPremium).length,
    };

    const categories = modules.reduce((acc, module) => {
      acc[module.category] = (acc[module.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcul du score de santé
    let healthScore = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Pénalités pour les problèmes
    if (integrity.invalidModules.length > 0) {
      healthScore -= integrity.invalidModules.length * 10;
      issues.push(`${integrity.invalidModules.length} module(s) invalide(s)`);
      recommendations.push('Corriger les modules invalides');
    }

    if (integrity.dependencyIssues.length > 0) {
      healthScore -= integrity.dependencyIssues.length * 15;
      issues.push(`${integrity.dependencyIssues.length} problème(s) de dépendances`);
      recommendations.push('Résoudre les dépendances manquantes');
    }

    if (integrity.conflicts.length > 0) {
      healthScore -= integrity.conflicts.length * 20;
      issues.push(`${integrity.conflicts.length} conflit(s) détecté(s)`);
      recommendations.push('Résoudre les conflits entre modules');
    }

    // Recommandations d'amélioration
    if (activeModules.length < 3) {
      recommendations.push('Considérer l\'activation de modules supplémentaires pour optimiser la productivité');
    }

    if (summary.beta > 0) {
      recommendations.push('Surveiller les modules bêta pour les mises à jour stables');
    }

    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      summary,
      categories,
      health: {
        score: healthScore,
        issues,
        recommendations
      }
    };
  }
}
