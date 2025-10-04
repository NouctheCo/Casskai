# 🔧 Guide de Configuration et Dépannage Supabase

## Vue d'Ensemble

Ce guide couvre la configuration initiale, le diagnostic et le dépannage de l'intégration Supabase pour CassKai.

## Configuration Initiale

### 1. Créer un Projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter :
   - **Project URL**: `https://[project-id].supabase.co`
   - **Anon Key**: Clé publique (frontend)
   - **Service Role Key**: Clé privée (backend/Edge Functions)

### 2. Configurer les Variables d'Environnement

Dans `.env` et `.env.local` :

```bash
# URL du projet Supabase
VITE_SUPABASE_URL=https://smtdtgrymuzwvctattmx.supabase.co

# Clé publique (anon)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clé service (backend only - NE PAS exposer au frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important** : Ne JAMAIS committer la `SERVICE_ROLE_KEY` dans Git.

### 3. Appliquer les Migrations

#### Option A: Via Supabase CLI (Recommandé)

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Lier le projet
supabase link --project-ref [project-id]

# Appliquer les migrations
supabase db push
```

#### Option B: Via SQL Editor (Manuel)

1. Aller dans **Supabase Dashboard** → **SQL Editor**
2. Exécuter les scripts dans l'ordre :
   - `supabase/migrations/01_create_tables.sql`
   - `supabase/migrations/02_create_rls_policies.sql`
   - `supabase/migrations/03_create_rpc_functions.sql`

## Structure de la Base de Données

### Tables Principales

```
companies           # Entreprises clientes
├── user_profiles   # Profils utilisateurs
├── accounts        # Plan comptable
├── journals        # Journaux comptables
├── journal_entries # Écritures comptables
├── invoices        # Factures
├── clients         # Clients/Tiers
├── subscriptions   # Abonnements Stripe
└── subscription_plans  # Plans d'abonnement
```

### Vérification des Tables

```sql
-- Lister toutes les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Résultat attendu (10 tables minimum):
-- accounts, companies, clients, invoices, journal_entries,
-- journals, subscription_plans, subscriptions, user_profiles, etc.
```

## Diagnostic et Dépannage

### ✅ Test de Connexion

```bash
# Créer un script de test
node scripts/dev/check-supabase-setup.mjs
```

Ou tester manuellement :

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Test de connexion
const { data, error } = await supabase.from('companies').select('count')
console.log(data ? '✅ Connexion OK' : '❌ Erreur:', error)
```

### 🔍 Vérifier les Tables

```sql
-- Vérifier qu'une table existe et a la bonne structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- Colonnes attendues pour 'companies':
-- id (uuid), name (text), tax_number (text), country (text),
-- created_at (timestamptz), etc.
```

### 🔐 Vérifier les Politiques RLS

```sql
-- Lister les politiques actives
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Vérifier que RLS est activé sur les tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 📊 Vérifier les Fonctions RPC

```sql
-- Lister les fonctions RPC
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'generate_%'
ORDER BY routine_name;

-- Fonctions attendues:
-- generate_balance_sheet, generate_income_statement,
-- generate_cash_flow_statement, generate_trial_balance
```

## Problèmes Courants

### Problème 1: "relation does not exist"

**Cause**: Tables non créées ou migrations non appliquées

**Solution**:
```bash
# Vérifier quelles tables existent
supabase db remote list

# Appliquer les migrations manquantes
supabase db push

# Ou manuellement via SQL Editor
```

### Problème 2: "RLS policy violation" ou "new row violates row-level security"

**Cause**: Politiques RLS trop restrictives ou utilisateur non authentifié

**Solution**:

```sql
-- Vérifier les politiques de la table
SELECT * FROM pg_policies WHERE tablename = '[table_name]';

-- Créer une politique pour permettre les insertions (exemple)
CREATE POLICY "Allow authenticated users to insert"
ON companies FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ou temporairement désactiver RLS (DÉVELOPPEMENT UNIQUEMENT!)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
```

⚠️ **Ne JAMAIS désactiver RLS en production**

### Problème 3: Service Role Key ne fonctionne pas

**Cause**: Clé incorrecte ou non configurée

**Solution**:

1. **Obtenir la bonne clé** :
   - Dashboard → Settings → API
   - Copier la clé `service_role` (pas `anon`)

2. **Vérifier la clé** :
```bash
# La clé service_role commence par "eyJ" et est beaucoup plus longue
echo $SUPABASE_SERVICE_ROLE_KEY | wc -c
# Devrait afficher > 200 caractères
```

3. **Utiliser correctement** :
```javascript
// Backend/Edge Functions uniquement
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Service role, pas anon
)
```

### Problème 4: Edge Functions qui échouent

**Cause**: Secrets non configurés dans Supabase

**Solution**:

```bash
# Lister les secrets configurés
supabase secrets list

# Ajouter les secrets manquants
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redéployer la fonction
supabase functions deploy [function-name]
```

### Problème 5: Erreur "Invalid JWT"

**Cause**: Token expiré ou clé incorrecte

**Solution**:

```javascript
// Vérifier et rafraîchir la session
const { data: { session }, error } = await supabase.auth.getSession()

if (!session) {
  // Rediriger vers login
  window.location.href = '/login'
}

// Vérifier l'expiration du token
const exp = JSON.parse(atob(session.access_token.split('.')[1])).exp
console.log('Token expires at:', new Date(exp * 1000))
```

## Reconstruction Complète

### Quand utiliser cette méthode

- Base de données corrompue
- Tables manquantes ou mal configurées
- Reset complet nécessaire

### ⚠️ ATTENTION: Ceci supprime TOUTES les données

```sql
-- 1. Supprimer toutes les tables (DANGER!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2. Réappliquer toutes les migrations
-- Via CLI:
supabase db reset

-- Ou manuellement via SQL Editor:
-- Exécuter tous les fichiers dans supabase/migrations/
```

### Script de Reconstruction Automatique

```bash
# Backup d'abord!
supabase db dump -f backup.sql

# Reset et reconstruction
supabase db reset

# Vérifier
supabase db remote list
```

## Scripts de Test et Vérification

### Test Complet de la Configuration

Créer `scripts/dev/test-supabase-full.mjs` :

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testSupabase() {
  console.log('🧪 Testing Supabase Configuration...\n')

  // Test 1: Connexion
  const { error: connError } = await supabase.from('companies').select('count')
  console.log(connError ? '❌ Connection' : '✅ Connection')

  // Test 2: Authentification
  const { data: authData } = await supabase.auth.getSession()
  console.log(authData.session ? '✅ Auth Session' : '⚠️ Not authenticated')

  // Test 3: Tables
  const tables = ['companies', 'accounts', 'journals', 'invoices']
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true })
    console.log(error ? `❌ Table '${table}'` : `✅ Table '${table}'`)
  }

  // Test 4: RPC Functions
  const functions = ['generate_balance_sheet', 'generate_income_statement']
  for (const fn of functions) {
    const { error } = await supabase.rpc(fn, { company_id: '00000000-0000-0000-0000-000000000000' })
    // Error attendu (company inexistant) mais fonction doit exister
    console.log(error?.message?.includes('not found') ? `✅ RPC '${fn}'` : `❌ RPC '${fn}'`)
  }

  console.log('\n✅ Tests terminés')
}

testSupabase()
```

Exécuter :
```bash
node scripts/dev/test-supabase-full.mjs
```

## Maintenance et Monitoring

### Surveiller les Logs

```bash
# Logs en temps réel (requiert Supabase CLI)
supabase logs --follow

# Logs Edge Functions
supabase functions logs [function-name] --tail
```

### Nettoyer les Données de Test

```sql
-- Supprimer les données de test uniquement
DELETE FROM journal_entries WHERE company_id IN (
  SELECT id FROM companies WHERE name LIKE '%Test%'
);

DELETE FROM companies WHERE name LIKE '%Test%';

-- Remettre les compteurs à zéro (attention!)
TRUNCATE TABLE journal_entries CASCADE;
```

### Backup Réguliers

```bash
# Backup complet
supabase db dump -f backup-$(date +%Y%m%d).sql

# Restaurer un backup
supabase db reset
psql $DATABASE_URL < backup-20250104.sql
```

## Ressources

- **Supabase Documentation**: https://supabase.com/docs
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **CLI Reference**: https://supabase.com/docs/reference/cli

---

**Pour tout problème persistant, vérifier les logs Supabase Dashboard → Logs**
