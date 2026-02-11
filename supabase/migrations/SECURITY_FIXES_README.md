# Corrections des Alertes de Sécurité Supabase

## ✅ Corrections Automatiques (Migration SQL)

La migration `20260208000003_fix_security_warnings.sql` corrige automatiquement :

### 1. **Functions avec search_path mutable** ⚠️ → ✅
- `get_ai_account_suggestion` : Ajout de `SET search_path = ''`
- `record_categorization_feedback` : Ajout de `SET search_path = ''`
- `get_categorization_stats` : Ajout de `SET search_path = ''`  
- `update_ai_categorization_timestamp` : Ajout de `SET search_path = ''`

**Impact** : Protège contre les attaques par injection de schéma en forçant les références explicites (ex: `public.table_name`).

### 2. **RLS désactivé sur `ifrs15_revenue_contracts`** 🔴 → ✅
- ✅ RLS activé sur la table
- ✅ 4 policies créées (SELECT, INSERT, UPDATE, DELETE)
- ✅ Filtrage basé sur `company_id` via `user_companies`

**Impact** : Les utilisateurs ne peuvent plus accéder aux données d'autres entreprises.

---

## 🔧 Action Manuelle Requise

### **Leaked Password Protection** ⚠️

Cette fonctionnalité doit être activée manuellement dans le Dashboard Supabase :

#### Étapes :
1. Aller sur **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Sélectionner votre projet
3. Aller dans **Authentication** → **Policies** (ou **Settings**)
4. Activer **"Leaked password protection"**

#### Avantages :
- Vérifie automatiquement les mots de passe contre la base de données **HaveIBeenPwned.org**
- Empêche l'utilisation de mots de passe compromis connus
- Améliore la sécurité des comptes utilisateurs

#### Documentation :
📖 [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

## 🚀 Déploiement

Pour appliquer la migration en production :

```bash
# 1. Pousser la migration vers Supabase
supabase db push

# OU via le CLI Supabase
supabase migration up
```

---

## ✅ Vérification Post-Déploiement

Après déploiement, vérifier dans le Dashboard Supabase :

### Database Linter
1. Aller dans **Database** → **Reports** (ou Linter)
2. Vérifier que les alertes suivantes ont disparu :
   - ✅ `rls_disabled_in_public` (ifrs15_revenue_contracts)
   - ✅ `function_search_path_mutable` (4 fonctions)  
3. Seule l'alerte `auth_leaked_password_protection` devrait rester jusqu'à activation manuelle

### Test RLS
```sql
-- Tester les policies RLS (en tant qu'utilisateur authentifié)
SELECT * FROM ifrs15_revenue_contracts;
-- Devrait retourner uniquement les contrats de l'entreprise de l'utilisateur

-- Tester l'insertion
INSERT INTO ifrs15_revenue_contracts (company_id, ...) VALUES (...);
-- Devrait réussir seulement si company_id appartient à l'utilisateur
```

---

## 📚 Références

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Function Security Best Practices](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security)
