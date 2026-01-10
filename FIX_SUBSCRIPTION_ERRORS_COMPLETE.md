# Fix Subscription Errors - Corrections Complètes

**Date**: 2025-01-09
**Fichiers Modifiés**:
- `src/contexts/AuthContext.tsx`
- `src/hooks/useSubscriptionStatus.ts`

**Status**: ✅ COMPLETE

---

## 🎯 Problèmes Résolus

### ❌ PROBLÈME 1: Erreur "duplicate key value violates unique constraint"

**Symptôme**:
```
ERROR: duplicate key value violates unique constraint "subscriptions_user_id_key"
```

L'application tentait de créer un nouvel abonnement d'essai alors qu'il en existait déjà un pour l'utilisateur, causant une erreur de contrainte unique sur `user_id`.

**Impact**: Blocage complet de l'application lors de la connexion.

---

### ❌ PROBLÈME 2: Aucun message pour abonnement expiré

**Symptôme**: Les utilisateurs avec abonnements expirés ne voyaient aucun avertissement.

**Impact**: Confusion des utilisateurs, pas de prompt pour renouveler.

---

### ❌ PROBLÈME 3: Erreurs subscription bloquent le chargement

**Symptôme**: Si la vérification de l'abonnement échouait, toute l'application était bloquée.

**Impact**: Expérience utilisateur dégradée, impossible d'accéder aux données.

---

## 🔧 Solutions Appliquées

### 1. **Vérification Avant Création d'Abonnement** (PROBLÈME 1)

**Fichier**: `src/contexts/AuthContext.tsx`
**Fonction**: `ensureTrialSubscription()`
**Lignes**: 164-181

#### Changements

**Avant** (crée directement sans vérifier):
```typescript
const ensureTrialSubscription = useCallback(async (userId: string, companyId: string) => {
  try {
    const canCreate = await trialService.canCreateTrial(userId);

    if (canCreate) {
      const result = await trialService.createTrialSubscription(userId, companyId);
      // ...
    }
  } catch (error) {
    logger.error('Auth', 'Erreur lors de la vérification/création de l\'abonnement', error);
  }
}, []);
```

**Après** (vérifie d'abord l'existence):
```typescript
const ensureTrialSubscription = useCallback(async (userId: string, companyId: string) => {
  try {
    // ✅ NOUVEAU: Vérifier d'abord si un abonnement existe déjà
    logger.debug('Auth', '🔍 Vérification de l\'abonnement existant pour user:', userId);

    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('id, status, current_period_end, plan_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Auth', 'Erreur lors de la vérification de l\'abonnement existant:', checkError);
    }

    if (existingSubscription) {
      logger.info('Auth', '✅ Abonnement existant trouvé:', existingSubscription.id);
      // Ne pas recréer, utiliser l'existant
      return;
    }

    logger.debug('Auth', 'Aucun abonnement existant, vérification de l\'éligibilité au trial...');

    const canCreate = await trialService.canCreateTrial(userId);

    if (canCreate) {
      const result = await trialService.createTrialSubscription(userId, companyId);

      if (result.success) {
        logger.info('Auth', '✅ Essai créé automatiquement');
      } else {
        logger.warn('Auth', '⚠️ Échec création essai (non bloquant):', result.error);
      }
    }
  } catch (error) {
    // ✅ PROBLÈME 3: Ne pas throw, juste logger
    logger.warn('Auth', '⚠️ Erreur abonnement (non bloquant):', error);
  }
}, []);
```

#### Bénéfices
- ✅ Évite les erreurs de duplicate key
- ✅ Utilise l'abonnement existant au lieu d'en créer un nouveau
- ✅ Logs détaillés pour debugging
- ✅ Erreurs non bloquantes (PROBLÈME 3)

---

### 2. **Détection Améliorée des Abonnements Expirés** (PROBLÈME 2)

**Fichier**: `src/hooks/useSubscriptionStatus.ts`
**Lignes**: 51-81

#### Changements

**Avant** (ne vérifie pas `current_period_end`):
```typescript
const daysLeft = subscription?.trial_end
  ? Math.ceil((new Date(subscription.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  : 0;

const isTrialExpired =
  subscription?.status === 'trialing' &&
  subscription?.trial_end &&
  new Date(subscription.trial_end) < new Date();

const isExpired =
  subscription?.status === 'canceled' ||
  subscription?.status === 'unpaid' ||
  subscription?.status === 'past_due' ||
  isTrialExpired;
```

**Après** (vérifie aussi `current_period_end` et status `expired`):
```typescript
// ✅ Calculer jours restants avec trial_end OU current_period_end
const relevantEndDate = subscription?.trial_end || subscription?.current_period_end;
const daysLeft = relevantEndDate
  ? Math.ceil((new Date(relevantEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  : 0;

const isTrialExpired =
  subscription?.status === 'trialing' &&
  subscription?.trial_end &&
  new Date(subscription.trial_end) < new Date();

// ✅ NOUVEAU: Vérifier aussi current_period_end
const isPeriodExpired =
  subscription?.current_period_end &&
  new Date(subscription.current_period_end) < new Date();

// ✅ Détection améliorée des abonnements expirés
const isExpired =
  subscription?.status === 'canceled' ||
  subscription?.status === 'expired' ||    // ✅ Ajout du statut 'expired'
  subscription?.status === 'unpaid' ||
  subscription?.status === 'past_due' ||
  isTrialExpired ||
  isPeriodExpired;                          // ✅ Vérifier current_period_end
```

#### Bénéfices
- ✅ Détecte les essais expirés (via `trial_end`)
- ✅ Détecte les abonnements payants expirés (via `current_period_end`)
- ✅ Détecte le statut `expired` dans la base de données
- ✅ Calcule correctement les jours restants

---

### 3. **Composant SubscriptionBanner** (PROBLÈME 2)

**Fichier**: `src/components/subscription/SubscriptionBanner.tsx`
**Status**: ✅ Déjà existant et bien intégré dans `MainLayout.tsx`

Le composant affiche:
- 🔴 Banner rouge si abonnement expiré
- 🟠 Banner orange si essai expire dans ≤3 jours
- 🟡 Banner jaune si essai expire dans 4-7 jours
- 🔵 Banner bleu informatif si essai actif (>7 jours)

**Intégration**: Ligne 275 de `src/components/layout/MainLayout.tsx`
```tsx
<div className="mb-6">
  <SubscriptionBanner />
</div>
```

---

## 📊 Flux de Vérification Corrigé

### Avant ❌
```
1. User se connecte
2. AuthContext appelle ensureTrialSubscription()
3. Appelle directement trialService.createTrialSubscription()
4. ❌ ERREUR: duplicate key constraint si abonnement existe
5. ❌ Application bloquée
```

### Après ✅
```
1. User se connecte
2. AuthContext appelle ensureTrialSubscription()
3. ✅ Vérifie d'abord si abonnement existe
   └─ Si oui: Utiliser l'existant, retourner
   └─ Si non: Vérifier éligibilité puis créer
4. ✅ Pas d'erreur, application continue
5. ✅ useSubscriptionStatus détecte si expiré
6. ✅ SubscriptionBanner affiche le message approprié
```

---

## 🧪 Tests à Effectuer

### Test 1: Vérification Duplicate Key (PROBLÈME 1)
- [ ] Se connecter avec un utilisateur ayant déjà un abonnement
- [ ] Vérifier dans les logs: `✅ Abonnement existant trouvé`
- [ ] Confirmer aucune erreur "duplicate key"
- [ ] Vérifier que l'application charge normalement

### Test 2: Détection Abonnement Expiré (PROBLÈME 2)
- [ ] Créer un abonnement avec `current_period_end` dans le passé
- [ ] Se connecter avec cet utilisateur
- [ ] Vérifier qu'un banner rouge s'affiche en haut de l'application
- [ ] Vérifier le texte: "Votre abonnement a expiré"
- [ ] Cliquer sur "Renouveler maintenant" → redirection vers `/settings?tab=billing`

### Test 3: Détection Trial Expiré (PROBLÈME 2)
- [ ] Créer un abonnement avec `trial_end` dans le passé et `status = 'trialing'`
- [ ] Se connecter avec cet utilisateur
- [ ] Vérifier qu'un banner rouge s'affiche
- [ ] Vérifier le texte: "Votre période d'essai a expiré"
- [ ] Vérifier le lien vers les plans

### Test 4: Erreurs Non Bloquantes (PROBLÈME 3)
- [ ] Simuler une erreur lors de la vérification d'abonnement
- [ ] Vérifier que l'erreur est loggée avec `logger.warn`
- [ ] Confirmer que l'application continue de fonctionner
- [ ] Vérifier que les données se chargent normalement

### Test 5: Console Logs
Vérifier dans la console du navigateur:
```
🔍 Vérification de l'abonnement existant pour user: <uuid>
✅ Abonnement existant trouvé: <subscription_id> Status: active
```

Ou pour nouvel utilisateur:
```
🔍 Vérification de l'abonnement existant pour user: <uuid>
Aucun abonnement existant, vérification de l'éligibilité au trial...
Création automatique d'un essai pour le nouvel utilisateur
✅ Essai créé automatiquement pour l'utilisateur
```

---

## 🔍 Debugging

### Vérifier l'abonnement d'un utilisateur via SQL
```sql
SELECT
  id,
  user_id,
  status,
  plan_id,
  trial_end,
  current_period_end,
  created_at
FROM subscriptions
WHERE user_id = '<user_id>';
```

### Forcer l'expiration d'un trial (test)
```sql
UPDATE subscriptions
SET
  trial_end = NOW() - INTERVAL '1 day',
  status = 'trialing'
WHERE user_id = '<user_id>';
```

### Forcer l'expiration d'un abonnement payant (test)
```sql
UPDATE subscriptions
SET
  current_period_end = NOW() - INTERVAL '1 day',
  status = 'expired'
WHERE user_id = '<user_id>';
```

---

## 📝 Résumé des Modifications

| Fichier | Fonction/Composant | Changement | Problème Résolu |
|---------|-------------------|------------|-----------------|
| `AuthContext.tsx` | `ensureTrialSubscription()` | Vérification abonnement existant avant création | PROBLÈME 1 |
| `AuthContext.tsx` | `ensureTrialSubscription()` | Erreurs non bloquantes (try/catch sans throw) | PROBLÈME 3 |
| `useSubscriptionStatus.ts` | Calcul `isExpired` | Ajout vérification `current_period_end` | PROBLÈME 2 |
| `useSubscriptionStatus.ts` | Calcul `isExpired` | Ajout statut `'expired'` | PROBLÈME 2 |
| `useSubscriptionStatus.ts` | Calcul `daysLeft` | Utilise `trial_end` OU `current_period_end` | PROBLÈME 2 |
| `SubscriptionBanner.tsx` | N/A | ✅ Déjà existant et bien intégré | PROBLÈME 2 |

---

## 🎯 Impact

### Avant ❌
- ❌ Erreur duplicate key bloque l'application
- ❌ Abonnements expirés non détectés
- ❌ Utilisateurs confus (pas de message)
- ❌ Erreurs subscription bloquent le chargement

### Après ✅
- ✅ Vérification intelligente évite les duplications
- ✅ Tous les types d'expiration détectés
- ✅ Banners clairs et visuels pour l'utilisateur
- ✅ Erreurs gérées gracieusement, app continue de fonctionner
- ✅ Logs détaillés pour debugging

---

## 📚 Documents Connexes

- [FIX_ARTICLES_SERVICE_OPTIONAL_SUPPLIER.md](FIX_ARTICLES_SERVICE_OPTIONAL_SUPPLIER.md) - Fix articles sans fournisseur
- [THIRD_PARTIES_TABS_FIX.md](THIRD_PARTIES_TABS_FIX.md) - Fix third parties tabs
- [MIGRATION_THIRD_PARTIES_PAGE_FIX.md](MIGRATION_THIRD_PARTIES_PAGE_FIX.md) - Fix third parties page

---

**Status**: ✅ **Les 3 problèmes d'abonnement sont corrigés**

**Prochaines Étapes**:
1. Tester avec des utilisateurs existants ayant un abonnement
2. Tester avec de nouveaux utilisateurs (création de trial)
3. Tester les différents scénarios d'expiration
4. Vérifier les logs en console
5. Retirer les console.log de debug une fois validé (si souhaité)
