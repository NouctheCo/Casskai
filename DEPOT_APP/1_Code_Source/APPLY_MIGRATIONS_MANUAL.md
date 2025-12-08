# 🔧 APPLICATION MANUELLE DES MIGRATIONS SUPABASE

## ⚠️ IMPORTANT - Migrations à appliquer en production

Deux migrations SQL doivent être appliquées sur la base Supabase en production pour corriger le problème d'onboarding en boucle:

---

## Migration 1: Corriger les politiques RLS pour public.users

**Fichier:** `supabase/migrations/20251129000000_fix_users_rls_read.sql`

**Pourquoi:** Actuellement, les utilisateurs reçoivent une erreur 406 lors de la lecture de leur profil car les politiques RLS n'existent pas sur la table `public.users`.

**Ouvrir Supabase Studio:**
1. Aller sur https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx
2. Cliquer sur "SQL Editor" dans le menu de gauche
3. Cliquer sur "New query"
4. Copier-coller le contenu du fichier `supabase/migrations/20251129000000_fix_users_rls_read.sql`
5. Cliquer sur "Run" (ou Ctrl+Enter)

**Vérification:** Après l'application, la console ne devrait plus afficher l'erreur 406 sur `/rest/v1/users`

---

## Migration 2: Ajouter colonne onboarding_completed_at

**Fichier:** `supabase/migrations/20251129000001_add_onboarding_completed_at.sql`

**Pourquoi:** Cette colonne permet de tracker de manière fiable quand l'onboarding a été complété. Sans elle, l'application ne peut pas déterminer si un utilisateur a terminé l'onboarding.

**Ouvrir Supabase Studio:**
1. Même processus que la migration 1
2. Copier-coller le contenu du fichier `supabase/migrations/20251129000001_add_onboarding_completed_at.sql`
3. Cliquer sur "Run"

**Vérification:** Après l'application, la table `companies` devrait avoir une nouvelle colonne `onboarding_completed_at` de type `TIMESTAMP WITH TIME ZONE`

---

## ✅ Après application des migrations

1. **Vider le cache localStorage du navigateur du client:**
   ```javascript
   // Dans la console du navigateur:
   localStorage.clear();
   location.reload();
   ```

2. **Reconnecter le client:**
   - Le client devrait être redirigé vers l'onboarding UNE SEULE FOIS
   - Après complétion, `onboarding_completed_at` sera défini dans la BDD
   - Les connexions futures ne déclencheront plus l'onboarding

---

## 🐛 Problèmes résolus

1. ❌ **Erreur 406 sur public.users** → ✅ RLS configuré correctement
2. ❌ **Onboarding en boucle à chaque connexion** → ✅ Colonne `onboarding_completed_at` permet la persistence
3. ❌ **React Hooks warning dans OnboardingPage** → ✅ `useEffect` déplacé avant le return conditionnel

---

## 📝 Notes techniques

- Les anciennes entreprises (créées avant cette migration) auront `onboarding_completed_at = created_at` automatiquement
- La vérification de l'onboarding dans `AuthContext.tsx` (lignes 412-427) utilise maintenant 3 niveaux:
  1. Flag localStorage (pour UX immédiate)
  2. Colonne BDD `onboarding_completed_at` (source de vérité)
  3. Fallback `owner_id` (compatibilité rétroactive)
