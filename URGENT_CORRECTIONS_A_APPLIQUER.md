# 🔴 CORRECTIONS URGENTES À APPLIQUER - CassKai

**Date**: 2025-11-07
**Statut**: CRITIQUE - Migrations SQL non appliquées

---

## ❌ PROBLÈME IDENTIFIÉ

**TOUTES les corrections de code ont été déployées MAIS les migrations SQL n'ont JAMAIS été appliquées sur Supabase.**

**Conséquence** : Le code frontend appelle des fonctions PostgreSQL qui n'existent pas → Tout utilise des données mockées en fallback.

---

## 📋 LISTE DES MIGRATIONS NON APPLIQUÉES

| # | Fichier | Corrige | Critique |
|---|---------|---------|----------|
| 1 | `20251107000001_populate_chart_templates_all_countries_v2.sql` | **Plan comptable vide** | 🔴 OUI |
| 2 | `20251107000002_auto_initialize_chart_of_accounts.sql` | **Auto-init plan comptable** | 🔴 OUI |
| 3 | `20251107100000_create_tax_module_tables.sql` | **Module fiscal non fonctionnel** | 🔴 OUI |
| 4 | `20251107110000_create_forecasts_tables.sql` | Prévisions mockées | 🟡 MOYEN |
| 5 | `20251107120000_create_purchases_tables.sql` | Achats mockés | 🟡 MOYEN |
| 6 | `20251107120001_fix_purchases_schema.sql` | Fix schema achats | 🟡 MOYEN |
| 7 | `20251107130000_create_onboarding_function.sql` | **Onboarding bloqué (403)** | 🔴 OUI |
| 8 | `20251107140000_fix_trial_to_30_days_enterprise.sql` | **Essai 14j au lieu de 30j** | 🔴 OUI |

---

## 🚨 IMPACT SUR LES MODULES

### 1. Module Comptabilité (CRITIQUE)
**Symptômes:**
- ❌ Plan comptable ne charge pas quand on l'initie
- ❌ Données mockées dans Vue d'ensemble
- ❌ Données mockées dans Rapports
- ❌ Données mockées dans Écritures
- ❌ Données mockées dans Journaux

**Cause:** Migrations #1 et #2 non appliquées
**Solution:** Appliquer les 2 premières migrations

### 2. Module Fiscal (CRITIQUE)
**Symptômes:**
- ❌ Impossible d'ajouter une déclaration
- ❌ Calendrier ne fonctionne pas
- ❌ Alertes ne fonctionnent pas

**Cause:** Migration #3 non appliquée (tables manquantes)
**Solution:** Appliquer migration `create_tax_module_tables.sql`

### 3. Onboarding (CRITIQUE)
**Symptômes:**
- ❌ Bloque à l'étape 4/4
- ❌ Erreur 403 sur /companies

**Cause:** Migration #7 non appliquée (fonction manquante)
**Solution:** Appliquer migration `create_onboarding_function.sql`

### 4. Période d'Essai (CRITIQUE)
**Symptômes:**
- ❌ Affiche 14 jours au lieu de 30 jours annoncés

**Cause:** Migration #8 non appliquée
**Solution:** Appliquer migration `fix_trial_to_30_days_enterprise.sql`

### 5. Module Banque (CACHE)
**Symptômes:**
- ❌ Erreur "Failed to fetch dynamically imported module"

**Cause:** Cache navigateur obsolète
**Solution:** Vider le cache et recharger (Ctrl+Shift+R)

---

## ✅ SOLUTION: APPLIQUER LES MIGRATIONS

### Option 1: Via l'Interface Supabase (RECOMMANDÉE)

1. **Ouvrez le SQL Editor:**
   ```
   https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/sql/new
   ```

2. **Appliquez les migrations dans l'ordre:**

#### MIGRATION 1/8: Plan Comptable - Templates
```bash
# Fichier: supabase/migrations/20251107000001_populate_chart_templates_all_countries_v2.sql
# Contenu: 518 comptes standards pour 14 pays
```
- Ouvrir le fichier
- Copier tout le contenu
- Coller dans SQL Editor
- Cliquer "Run"
- ✅ Vérifier: "Success. No rows returned"

#### MIGRATION 2/8: Plan Comptable - Auto-Init
```bash
# Fichier: supabase/migrations/20251107000002_auto_initialize_chart_of_accounts.sql
# Contenu: Fonction d'auto-initialisation + trigger
```
- Même procédure
- ✅ Vérifier: Fonction créée

#### MIGRATION 3/8: Module Fiscal
```bash
# Fichier: supabase/migrations/20251107100000_create_tax_module_tables.sql
# Contenu: 3 tables (tax_declarations, tax_filings, tax_alerts)
```
- Même procédure
- ✅ Vérifier: 3 tables créées

#### MIGRATION 4/8: Prévisions
```bash
# Fichier: supabase/migrations/20251107110000_create_forecasts_tables.sql
```

#### MIGRATION 5/8: Achats
```bash
# Fichier: supabase/migrations/20251107120000_create_purchases_tables.sql
```

#### MIGRATION 6/8: Fix Achats
```bash
# Fichier: supabase/migrations/20251107120001_fix_purchases_schema.sql
```

#### MIGRATION 7/8: Onboarding (CRITIQUE)
```bash
# Fichier: supabase/migrations/20251107130000_create_onboarding_function.sql
# Contenu: Fonction create_company_with_user (bypass RLS)
```

#### MIGRATION 8/8: Essai 30 jours (CRITIQUE)
```bash
# Fichier: supabase/migrations/20251107140000_fix_trial_to_30_days_enterprise.sql
# Contenu: Mise à jour fonction + système de notification
```

---

## 🔍 VÉRIFICATIONS POST-MIGRATION

### 1. Vérifier le Plan Comptable
```sql
-- Doit retourner 518 lignes
SELECT COUNT(*) FROM chart_of_accounts_template;

-- Doit retourner la fonction
SELECT proname FROM pg_proc WHERE proname = 'auto_initialize_chart_of_accounts';
```

### 2. Vérifier le Module Fiscal
```sql
-- Doit retourner 3 tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'tax_%';
```

### 3. Vérifier l'Onboarding
```sql
-- Doit retourner la fonction
SELECT proname FROM pg_proc WHERE proname = 'create_company_with_user';
```

### 4. Vérifier l'Essai 30 jours
```sql
-- Créer un essai test et vérifier
SELECT trial_end - trial_start as duration
FROM subscriptions
WHERE plan_id = 'trial'
ORDER BY created_at DESC
LIMIT 1;
-- Doit retourner "30 days"
```

---

## 🔧 CORRECTION DU CACHE (Module Banque)

### Pour les Utilisateurs
1. Ouvrir https://casskai.app
2. Appuyer sur `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
3. Ou ouvrir DevTools (F12) → Application → Clear Storage → Clear site data

### Pour l'Admin (Forcer le cache)
```bash
# Mettre à jour le service worker
ssh root@89.116.111.88 "cat > /var/www/casskai.app/clear-cache.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv='Cache-Control' content='no-cache, no-store, must-revalidate'>
    <title>Cache Clear</title>
</head>
<body>
    <h1>Cache vidé - Retournez à l'application</h1>
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(reg => reg.unregister());
            });
        }
        caches.keys().then(keys => {
            keys.forEach(key => caches.delete(key));
        });
        setTimeout(() => window.location.href = '/', 2000);
    </script>
</body>
</html>
EOF"
```

---

## 📊 ORDRE DE PRIORITÉ

### URGENT (À faire maintenant)
1. ✅ Migration 1: Plan comptable templates
2. ✅ Migration 2: Auto-init plan comptable
3. ✅ Migration 3: Module fiscal
4. ✅ Migration 7: Onboarding
5. ✅ Migration 8: Essai 30 jours

### IMPORTANT (À faire dans les 24h)
6. ✅ Migration 4: Prévisions
7. ✅ Migration 5-6: Achats

### Cache
8. ✅ Informer les utilisateurs de vider le cache

---

## 🎯 RÉSULTAT ATTENDU

**Avant migrations:**
- ❌ Plan comptable vide
- ❌ Module fiscal non fonctionnel
- ❌ Onboarding bloqué
- ❌ Essai 14 jours
- ❌ Données mockées partout

**Après migrations:**
- ✅ Plan comptable avec 518 comptes
- ✅ Module fiscal opérationnel
- ✅ Onboarding fonctionnel
- ✅ Essai 30 jours
- ✅ Données réelles de Supabase

---

## 📞 EN CAS DE PROBLÈME

### Si une migration échoue:
1. Lire le message d'erreur
2. Vérifier que les tables/fonctions n'existent pas déjà
3. Si elles existent, passer à la migration suivante

### Si tout échoue:
1. Exporter les données utilisateurs existantes
2. Contacter le support Supabase
3. Ou me fournir les logs d'erreur pour debug

---

## ⏱️ TEMPS ESTIMÉ

- Lecture et compréhension: 10 min
- Application des 8 migrations: 15-20 min
- Vérifications: 5 min
- **Total: ~30-35 minutes**

---

## ✅ CHECKLIST

- [ ] Migration 1 appliquée (Plan comptable templates)
- [ ] Migration 2 appliquée (Auto-init)
- [ ] Migration 3 appliquée (Fiscal)
- [ ] Migration 4 appliquée (Prévisions)
- [ ] Migration 5 appliquée (Achats)
- [ ] Migration 6 appliquée (Fix achats)
- [ ] Migration 7 appliquée (Onboarding)
- [ ] Migration 8 appliquée (Essai 30j)
- [ ] Vérifications SQL passées
- [ ] Cache navigateur vidé
- [ ] Test création company
- [ ] Test plan comptable
- [ ] Test module fiscal
- [ ] Test essai 30 jours

---

**Une fois ces migrations appliquées, TOUT fonctionnera correctement!**

C'était le chaînon manquant entre le code frontend déployé et la base de données.
