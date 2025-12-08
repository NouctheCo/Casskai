# AUDIT COMPLET - PARAMÈTRES & INTÉGRATION SUPABASE

## 🔴 PROBLÈMES IDENTIFIÉS

### 1. **PROFIL UTILISATEUR (UserProfileSettings.tsx)**

#### Problème Principal
- ❌ **Code commenté** : Toutes les intégrations Supabase sont en commentaire (lignes 62-67, 105-108, 134-143)
- ❌ **Pas de table** : Aucune table `user_profiles` n'existe dans Supabase
- ❌ **Données simulées** : Le composant charge uniquement depuis `user.user_metadata`
- ❌ **Sauvegarde factice** : La sauvegarde fait juste `setTimeout(1000)` sans rien sauvegarder

#### Actions Requises
1. Créer la table `user_profiles` dans Supabase
2. Activer les appels Supabase pour le chargement et la sauvegarde
3. Créer les politiques RLS appropriées
4. Implémenter l'upload d'avatar vers Supabase Storage

#### Structure de table nécessaire
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',
  language TEXT DEFAULT 'fr',
  job_title TEXT,
  department TEXT,
  bio TEXT,
  website TEXT,
  linkedin TEXT,
  twitter TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 2. **ABONNEMENT (SubscriptionSettings.tsx)**

#### Problèmes Identifiés
- ⚠️ **Changement de plan** : Redirige vers `/pricing` au lieu de gérer le changement (ligne 54-56)
- ⚠️ **Annulation** : Aucun bouton ou fonction pour annuler l'abonnement
- ⚠️ **Facturation** : Section vide "Aucune facture disponible" (ligne 275-279)
- ⚠️ **Stripe Portal** : Pas d'accès au portail client Stripe pour gérer l'abonnement

#### Actions Requises
1. Ajouter une fonction `handleCancelSubscription()` qui appelle Stripe
2. Ajouter un bouton "Gérer mon abonnement" → Stripe Customer Portal
3. Implémenter la récupération des factures depuis Stripe
4. Ajouter une option de changement de plan direct (upgrade/downgrade)

---

### 3. **NOTIFICATIONS (Système manquant)**

#### Problème Principal
- ❌ **Pas de composant** : Aucun composant de paramètres de notifications trouvé
- ❌ **Pas de service** : Aucun `notificationService` actif
- ❌ **Pas de table** : Tables de notifications potentiellement manquantes

#### Actions Requises
1. Vérifier si les tables `notifications` et `notification_preferences` existent
2. Créer un composant `NotificationSettings.tsx`
3. Implémenter les préférences : email, push, in-app
4. Créer les politiques RLS pour les notifications

---

### 4. **SERVICES SUPABASE**

#### subscriptionService.ts - Problèmes
- ⚠️ Utilise des RPC qui peuvent ne pas exister :
  - `can_access_feature` (ligne 33)
  - `increment_feature_usage` (ligne 59)
  - `get_user_usage_limits` (ligne 84)
  - `create_trial_subscription` (ligne 185)

#### Actions Requises
1. Vérifier l'existence de ces fonctions RPC dans Supabase
2. Créer les fonctions manquantes
3. Implémenter `cancelSubscription()` et `updatePlan()` avec Stripe

---

### 5. **POLITIQUES RLS (Row Level Security)**

#### Tables à Vérifier
- `user_profiles` - Doit permettre à l'utilisateur de lire/modifier son propre profil
- `subscriptions` - Lecture seule par l'utilisateur
- `notifications` - CRUD par l'utilisateur pour ses propres notifications
- `notification_preferences` - CRUD par l'utilisateur

#### Exemple de RLS pour user_profiles
```sql
-- Lecture : utilisateur peut lire son profil
CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Écriture : utilisateur peut créer/modifier son profil
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 📋 PLAN D'ACTION PRIORITAIRE

### PHASE 1 : PROFIL UTILISATEUR (Critique)
1. ✅ Créer migration pour table `user_profiles`
2. ✅ Créer politiques RLS
3. ✅ Activer le code Supabase dans `UserProfileSettings.tsx`
4. ✅ Créer bucket Storage `avatars` avec RLS
5. ✅ Implémenter l'upload d'avatar

### PHASE 2 : ABONNEMENT (Critique)
1. ✅ Vérifier les fonctions RPC nécessaires
2. ✅ Créer les fonctions RPC manquantes
3. ✅ Implémenter la gestion Stripe complète :
   - Annulation d'abonnement
   - Changement de plan
   - Accès au Customer Portal
4. ✅ Implémenter la récupération des factures

### PHASE 3 : NOTIFICATIONS (Important)
1. ✅ Vérifier/créer tables notifications
2. ✅ Créer composant NotificationSettings
3. ✅ Implémenter les préférences
4. ✅ Créer les politiques RLS

### PHASE 4 : TESTS & VALIDATION (Essentiel)
1. ✅ Tester toutes les opérations CRUD
2. ✅ Valider les politiques RLS
3. ✅ Tester les webhooks Stripe
4. ✅ Vérifier les logs d'erreurs

---

## 🔧 SCRIPTS SQL À CRÉER

1. `20251001000001_create_user_profiles.sql`
2. `20251001000002_create_user_profiles_rls.sql`
3. `20251001000003_verify_subscription_rpc.sql`
4. `20251001000004_create_notifications_system.sql`
5. `20251001000005_create_avatars_storage.sql`

---

## ⚠️ ATTENTION - PRODUCTION

**Base de données en PRODUCTION** :
- Tester chaque migration dans un environnement de test d'abord
- Faire un backup avant chaque modification
- Appliquer les migrations une par une
- Vérifier les logs après chaque migration
- Tester immédiatement après chaque déploiement

**Commandes recommandées** :
```bash
# Vérifier la connexion
supabase status

# Appliquer une migration spécifique
supabase db push --dry-run  # Test d'abord
supabase db push             # Application réelle

# Vérifier les politiques RLS
supabase db inspect rls
```

---

## 📊 ESTIMATION

- **Temps total** : 4-6 heures
- **Phase 1** : 1.5h
- **Phase 2** : 2h
- **Phase 3** : 1.5h
- **Phase 4** : 1h

**Risques** :
- 🔴 Haute complexité : Stripe webhooks
- 🟡 Moyenne complexité : RLS et permissions
- 🟢 Faible complexité : Tables et migrations basiques
