# ConfigService - Configuration Centralisée et Migrations

## Vue d'ensemble

Le `ConfigService` est le service central de configuration de CassKai. Il gère la configuration de l'application, l'initialisation de Supabase, les migrations de base de données et la création des entreprises avec leurs paramètres par défaut.

## Architecture

```typescript
ConfigService (Singleton)
├── Configuration Management
│   ├── App Configuration (localStorage)
│   ├── Supabase Configuration  
│   └── Company Configuration
├── Database Management
│   ├── Migration Service
│   ├── Schema Validation
│   └── Health Monitoring
└── Localization Support
    ├── Chart of Accounts (FR, BE, SYSCOHADA)
    ├── Default Journals
    └── Country-specific Settings
```

## Configuration de l'Application

### Structure de Configuration

```typescript
interface AppConfig {
  supabase: SupabaseConfig;
  company: CompanyConfig;
  setupCompleted: boolean;
  setupDate: string;
  version: string;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
  validated: boolean;
}

interface CompanyConfig {
  name: string;
  country: string;
  currency: string;
  timezone: string;
  accountingStandard: string;
}
```

### Initialisation et Validation

```typescript
const configService = ConfigService.getInstance();

// Vérifier si l'application est configurée
if (!configService.isConfigured()) {
  console.log('Configuration requise');
  // Rediriger vers le wizard de setup
}

// Valider la configuration Supabase
const isValid = await configService.validateSupabaseConfig();
if (!isValid) {
  console.error('Configuration Supabase invalide');
}

// Sauvegarder une nouvelle configuration
const newConfig: AppConfig = {
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
    validated: true
  },
  company: {
    name: 'Mon Entreprise',
    country: 'FR',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    accountingStandard: 'PCG'
  },
  setupCompleted: true,
  setupDate: new Date().toISOString(),
  version: '1.0.0'
};

await configService.saveConfig(newConfig);
```

## Gestion de Base de Données

### Initialisation Automatique

```typescript
// Initialiser la base avec migrations automatiques
const result = await configService.initializeDatabase();

if (result.success) {
  console.log('Base initialisée:', result.details);
} else {
  console.error('Erreur initialisation:', result.error);
}

/* Résultat typique:
{
  success: true,
  details: "Applied 12 migrations successfully. Schema up to date."
}
*/
```

### Monitoring de Santé

```typescript
// Vérifier la santé de la base
const health = await configService.getDatabaseHealth();

console.log(`Status: ${health.status}`);
console.log('Details:', health.details);

/* Exemples de résultats:
// Healthy
{
  status: 'healthy',
  details: {
    connectivity: 'ok',
    migrations: 'applied', 
    migrationsCount: 23
  }
}

// Warning
{
  status: 'warning',
  details: {
    connectivity: 'ok',
    migrations: 'pending',
    pendingMigrations: ['add_audit_triggers', 'update_user_roles']
  }
}

// Error  
{
  status: 'error',
  details: {
    error: 'Connection timeout after 5000ms'
  }
}
*/
```

## Création d'Entreprises

### Création avec Paramètres par Défaut

```typescript
// Créer une entreprise complète avec tous les éléments
const companyResult = await configService.createCompanyWithDefaults(
  'user-123',
  {
    name: 'SARL Exemple',
    country: 'FR',
    currency: 'EUR', 
    accountingStandard: 'PCG'
  }
);

if (companyResult.success) {
  console.log('Entreprise créée:', companyResult.companyId);
  
  // Finaliser la configuration
  const setupResult = await configService.finalizeCompanySetup(companyResult.companyId);
  
  if (setupResult.success) {
    console.log('Configuration finalisée avec succès');
  }
}
```

### Processus de Création Détaillé

Le processus de création d'entreprise inclut automatiquement:

1. **Création de l'entreprise** dans la table `companies`
2. **Plan comptable par défaut** selon le pays/standard
3. **Journaux comptables** standards
4. **Paramètres régionaux** (devise, fuseau horaire)
5. **Permissions par défaut** pour l'utilisateur créateur
6. **Configuration initiale** des modules

```typescript
// Le service gère automatiquement:
// ✅ Plan comptable français (PCG) pour country: 'FR'
// ✅ Plan comptable SYSCOHADA pour country: 'BJ', 'CI', 'BF', etc.
// ✅ Plan comptable belge pour country: 'BE'
// ✅ Plan comptable générique pour autres pays
```

## Standards Comptables Supportés

### Plan Comptable Français (PCG)

```typescript
const frenchAccounts = configService.getDefaultChartOfAccounts('FR');

/* Exemples d'entrées générées:
[
  { code: '101000', name: 'Capital', type: 'equity' },
  { code: '411000', name: 'Clients', type: 'asset' },
  { code: '401000', name: 'Fournisseurs', type: 'liability' },
  { code: '512000', name: 'Banques', type: 'asset' },
  { code: '701000', name: 'Ventes de produits finis', type: 'revenue' },
  { code: '607000', name: 'Achats de marchandises', type: 'expense' },
  // ... 20+ comptes standards
]
*/
```

### Plan SYSCOHADA (Afrique de l'Ouest)

```typescript
const syscohadaAccounts = configService.getDefaultChartOfAccounts('BJ'); // Bénin
const ivoireAccounts = configService.getDefaultChartOfAccounts('CI'); // Côte d'Ivoire

/* Spécificités SYSCOHADA:
[
  { code: '101', name: 'Capital social', type: 'equity' },
  { code: '411', name: 'Clients', type: 'asset' },
  { code: '401', name: 'Fournisseurs, dettes en compte', type: 'liability' },
  { code: '512', name: 'Banques', type: 'asset' },
  { code: '701', name: 'Ventes de produits finis', type: 'revenue' },
  // Codes spécifiques au système OHADA
]
*/
```

### Plan Comptable Belge

```typescript
const belgianAccounts = configService.getDefaultChartOfAccounts('BE');

/* Plan belge simplifié:
[
  { code: '100', name: 'Capital', type: 'equity' },
  { code: '411', name: 'Clients', type: 'asset' },
  { code: '400', name: 'Fournisseurs', type: 'liability' },
  { code: '550', name: 'Banques', type: 'asset' },
  { code: '700', name: 'Chiffre d\'affaires', type: 'revenue' },
  // Numérotation spécifique belge
]
*/
```

## Journaux Comptables par Défaut

```typescript
// Journaux standards (PCG/Belge)
const standardJournals = configService.getDefaultJournals('PCG');

/* Résultat:
[
  { code: 'VTE', name: 'Journal des ventes', type: 'VENTE' },
  { code: 'ACH', name: 'Journal des achats', type: 'ACHAT' },
  { code: 'BAN', name: 'Journal de banque', type: 'BANQUE' },
  { code: 'CAI', name: 'Journal de caisse', type: 'CAISSE' },
  { code: 'OD', name: 'Journal des opérations diverses', type: 'OD' }
]
*/

// Journaux SYSCOHADA (codes plus courts)
const syscohadaJournals = configService.getDefaultJournals('SYSCOHADA');

/* Résultat:
[
  { code: 'VE', name: 'Journal des ventes', type: 'VENTE' },
  { code: 'AC', name: 'Journal des achats', type: 'ACHAT' },
  { code: 'BQ', name: 'Journal de banque', type: 'BANQUE' },
  { code: 'CA', name: 'Journal de caisse', type: 'CAISSE' },
  { code: 'OD', name: 'Journal des opérations diverses', type: 'OD' }
]
*/
```

## Client Supabase

### Initialisation Sécurisée

```typescript
// Le service utilise l'instance unique de Supabase
await configService.initializeSupabaseClient();

// Récupération du client pour utilisation
const supabaseClient = configService.getSupabaseClient();

// Test de connectivité
const { data, error } = await supabaseClient
  .from('companies')
  .select('id')
  .limit(1);

if (error && error.code !== 'PGRST116') {
  console.error('Problème de connexion Supabase');
}
```

### Validation de Configuration

```typescript
// Validation automatique de la config Supabase
const isValid = await configService.validateSupabaseConfig();

if (isValid) {
  console.log('✅ Configuration Supabase valide');
} else {
  console.log('❌ Configuration Supabase invalide');
  // Vérifier les variables d'environnement
  // VITE_SUPABASE_URL et VITE_SUPABASE_KEY
}
```

## Migration Service Intégré

Le ConfigService intègre le MigrationService pour gérer automatiquement les évolutions de schema:

### Vérification des Migrations

```typescript
// Vérification automatique au démarrage
const migrationService = MigrationService.getInstance();
const status = await migrationService.checkMigrationsStatus();

console.log('Migrations status:', status);
/* Résultat:
[
  { name: 'initial_schema', applied: true, appliedAt: '2024-01-15T10:30:00Z' },
  { name: 'add_user_roles', applied: true, appliedAt: '2024-01-20T14:15:00Z' },
  { name: 'audit_triggers', applied: false, appliedAt: null },
  // Migration en attente
]
*/
```

### Application Automatique

```typescript
// Application automatique lors de l'initialisation
const result = await configService.initializeDatabase();

// Le service applique automatiquement:
// 1. Toutes les migrations en attente
// 2. Vérification de l'intégrité
// 3. Création des triggers d'audit
// 4. Initialisation des données de référence
```

## Utilitaires et Helpers

### Export/Import de Configuration

```typescript
// Exporter la configuration (sans clés sensibles)
const configExport = configService.exportConfig();
console.log('Configuration à sauvegarder:', configExport);

// Réinitialiser complètement
configService.resetConfig();
// ⚠️ Supprime localStorage + réinitialise les objets en mémoire
```

### Variables d'Environnement

```bash
# Configuration par défaut depuis .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key

# En développement
VITE_DEV_MODE=true
VITE_DEBUG_MIGRATIONS=true

# En production
VITE_PRODUCTION=true
VITE_SENTRY_DSN=https://your-sentry-dsn
```

```typescript
// Le service utilise automatiquement les variables d'environnement
const defaultConfig: AppConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_KEY || '',
    validated: false,
  },
  // ...
};
```

## Exemple d'Usage Complet

### Wizard de Configuration Initiale

```typescript
import { ConfigService } from '@/services/configService';
import { useState } from 'react';

const SetupWizard = () => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const configService = ConfigService.getInstance();

  // Étape 1: Configuration Supabase
  const handleSupabaseConfig = async (supabaseData) => {
    setIsLoading(true);
    
    try {
      // Test de la configuration
      const tempConfig = { 
        ...config, 
        supabase: { ...supabaseData, validated: false } 
      };
      
      await configService.saveConfig(tempConfig);
      const isValid = await configService.validateSupabaseConfig();
      
      if (isValid) {
        setConfig({ 
          ...config, 
          supabase: { ...supabaseData, validated: true } 
        });
        setStep(2);
      } else {
        alert('Configuration Supabase invalide');
      }
    } catch (error) {
      console.error('Erreur validation Supabase:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2: Configuration Entreprise
  const handleCompanyConfig = async (companyData) => {
    setIsLoading(true);
    
    try {
      // Initialiser la base de données
      const dbResult = await configService.initializeDatabase();
      
      if (!dbResult.success) {
        throw new Error(dbResult.error);
      }

      // Créer l'entreprise avec les données par défaut
      const companyResult = await configService.createCompanyWithDefaults(
        'current-user-id', // À récupérer depuis l'auth
        companyData
      );

      if (companyResult.success) {
        // Finaliser la configuration
        await configService.finalizeCompanySetup(companyResult.companyId);
        
        // Sauvegarder la config complète
        const finalConfig = {
          ...config,
          company: companyData,
          setupCompleted: true,
          setupDate: new Date().toISOString(),
          version: '1.0.0'
        };

        await configService.saveConfig(finalConfig);
        setStep(3); // Étape succès
      } else {
        throw new Error(companyResult.error);
      }
    } catch (error) {
      console.error('Erreur configuration entreprise:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Configuration en cours...</div>;
  }

  return (
    <div className="setup-wizard">
      {step === 1 && (
        <SupabaseConfigForm onSubmit={handleSupabaseConfig} />
      )}
      
      {step === 2 && (
        <CompanyConfigForm onSubmit={handleCompanyConfig} />
      )}
      
      {step === 3 && (
        <div>
          <h2>🎉 Configuration terminée !</h2>
          <p>Votre application CassKai est prête à être utilisée.</p>
          <button onClick={() => window.location.reload()}>
            Accéder à l'application
          </button>
        </div>
      )}
    </div>
  );
};

// Formulaire de configuration Supabase
const SupabaseConfigForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_KEY || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Configuration Supabase</h2>
      
      <div>
        <label>URL du projet Supabase:</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://your-project.supabase.co"
          required
        />
      </div>

      <div>
        <label>Clé publique (anon key):</label>
        <input
          type="password"
          value={formData.anonKey}
          onChange={(e) => setFormData({ ...formData, anonKey: e.target.value })}
          placeholder="eyJ..."
          required
        />
      </div>

      <button type="submit">Valider et continuer</button>
    </form>
  );
};

// Formulaire de configuration entreprise
const CompanyConfigForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    country: 'FR',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    accountingStandard: 'PCG'
  });

  const countries = [
    { code: 'FR', name: 'France', currency: 'EUR', standard: 'PCG' },
    { code: 'BE', name: 'Belgique', currency: 'EUR', standard: 'Belgian' },
    { code: 'BJ', name: 'Bénin', currency: 'XOF', standard: 'SYSCOHADA' },
    { code: 'CI', name: 'Côte d\'Ivoire', currency: 'XOF', standard: 'SYSCOHADA' },
    { code: 'BF', name: 'Burkina Faso', currency: 'XOF', standard: 'SYSCOHADA' }
  ];

  const handleCountryChange = (countryCode) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setFormData({
        ...formData,
        country: countryCode,
        currency: country.currency,
        accountingStandard: country.standard
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Configuration de votre entreprise</h2>
      
      <div>
        <label>Nom de l'entreprise:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="SARL Mon Entreprise"
          required
        />
      </div>

      <div>
        <label>Pays:</label>
        <select
          value={formData.country}
          onChange={(e) => handleCountryChange(e.target.value)}
          required
        >
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Devise:</label>
        <input
          type="text"
          value={formData.currency}
          disabled
          className="disabled"
        />
      </div>

      <div>
        <label>Standard comptable:</label>
        <input
          type="text"
          value={formData.accountingStandard}
          disabled
          className="disabled"
        />
      </div>

      <div className="info-box">
        <h4>Ce qui sera créé automatiquement:</h4>
        <ul>
          <li>Plan comptable adapté à votre pays</li>
          <li>Journaux comptables standards</li>
          <li>Configuration régionale (devise, fuseau horaire)</li>
          <li>Paramètres par défaut</li>
        </ul>
      </div>

      <button type="submit">Créer l'entreprise</button>
    </form>
  );
};

export default SetupWizard;
```

## Monitoring et Maintenance

### Surveillance de la Configuration

```typescript
// Surveillance périodique de la santé
setInterval(async () => {
  const health = await configService.getDatabaseHealth();
  
  if (health.status !== 'healthy') {
    console.warn('⚠️ Problème de base de données détecté:', health.details);
    
    // Notifier l'administrateur
    // Activer le mode dégradé si nécessaire
  }
}, 5 * 60 * 1000); // Toutes les 5 minutes
```

### Logs et Debug

```typescript
// En développement, logs détaillés activés
if (import.meta.env.DEV) {
  console.warn('🚀 Initialisation de la base de données...');
  console.warn('📋 Statut des migrations:', migrationsStatus);
  console.warn('✅ Base de données initialisée avec succès');
}

// En production, logs minimaux
if (import.meta.env.PROD) {
  // Seuls les erreurs et warnings critiques
}
```

## Sécurité et Bonnes Pratiques

### Protection des Données Sensibles

```typescript
// Les clés sensibles ne sont jamais exportées
const exportConfig = configService.exportConfig();
// ✅ supabase.anonKey sera masqué: "***MASKED***"

// Validation des entrées utilisateur
const isValidConfig = (config) => {
  if (!config.supabase?.url?.startsWith('https://')) {
    throw new Error('URL Supabase doit utiliser HTTPS');
  }
  
  if (!config.supabase?.anonKey?.startsWith('eyJ')) {
    throw new Error('Clé Supabase invalide');
  }
  
  return true;
};
```

### Gestion des Erreurs

```typescript
// Toutes les opérations critiques sont encapsulées
try {
  await configService.initializeDatabase();
} catch (error) {
  // Fallback gracieux
  console.error('Database init failed, using offline mode');
  // Continuer avec les fonctionnalités de base
}
```

Le ConfigService offre une base solide pour la configuration et l'initialisation de CassKai, avec une gestion automatique des migrations et une adaptation aux différents contextes régionaux.