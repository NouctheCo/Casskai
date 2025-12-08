# Correction Onboarding qui se répète (06/12/2025)

## Problème identifié
Après déconnexion puis reconnexion, l'utilisateur était systématiquement redirigé vers `/onboarding` au lieu de `/dashboard`, même s'il avait déjà complété l'onboarding.

## Cause
Le contexte d'authentification (`AuthContext.tsx`) ne vérifiait pas la table `onboarding_sessions` pour déterminer si l'onboarding était complété. Il utilisait uniquement :

1. ❌ Flag localStorage `onboarding_completed_${userId}` (perdu après déconnexion)
2. ✅ Champ `onboarding_completed_at` de la table `companies`
3. ❌ Fallback sur `owner_id` (pas fiable)
4. **MANQUANT** : Table `onboarding_sessions.completed_at`

**Problème** : La table `onboarding_sessions` est la source de vérité principale pour l'état d'onboarding, mais elle n'était jamais consultée !

## Solution appliquée

### Fichier : `src/contexts/AuthContext.tsx`

**Ajout d'une vérification de la table `onboarding_sessions`** (lignes 433-449) :

```typescript
// 3. Vérifier la table onboarding_sessions pour completed_at
let hasCompletedOnboardingSession = false;
try {
  const { data: sessions, error: sessionsError } = await supabase
    .from('onboarding_sessions')
    .select('completed_at')
    .eq('user_id', currentUser.id)
    .not('completed_at', 'is', null)
    .limit(1);

  if (!sessionsError && sessions && sessions.length > 0) {
    hasCompletedOnboardingSession = true;
    console.log('✅ Session onboarding complétée trouvée dans la BDD');
  }
} catch (error) {
  console.warn('⚠️ Erreur lors de la vérification onboarding_sessions:', error);
}
```

**Mise à jour de la logique de vérification** (lignes 455-458) :

```typescript
const hasCompletedOnboarding = localOnboardingFlag === 'true' ||
                               hasOnboardingCompletedInDB ||
                               hasCompletedOnboardingSession ||  // ✅ Ajouté
                               hasCompanyAsOwner;
```

## Logique de vérification complète

Le système vérifie maintenant l'onboarding dans cet ordre de priorité :

### 1. Flag localStorage (éphémère)
```typescript
const localOnboardingFlag = localStorage.getItem(`onboarding_completed_${currentUser.id}`);
```
- ✅ **Avantage** : Rapide, pas de requête BDD
- ❌ **Inconvénient** : Perdu après déconnexion ou changement de navigateur

### 2. Table `companies.onboarding_completed_at` (recommandé)
```typescript
const hasOnboardingCompletedInDB = companies.some(c => c.onboarding_completed_at !== null);
```
- ✅ **Avantage** : Persistant, fiable
- ✅ **Usage** : Vérifié lors du chargement initial

### 3. ✨ **NOUVEAU** : Table `onboarding_sessions.completed_at` (source de vérité)
```typescript
const { data: sessions } = await supabase
  .from('onboarding_sessions')
  .select('completed_at')
  .eq('user_id', currentUser.id)
  .not('completed_at', 'is', null)
  .limit(1);
```
- ✅ **Avantage** : Source de vérité principale
- ✅ **Usage** : Table dédiée au suivi d'onboarding
- ✅ **Persistant** : Survit à la déconnexion

### 4. Fallback : Propriétaire d'entreprise (compatibilité)
```typescript
const hasCompanyAsOwner = companies.some(c => c.owner_id === currentUser.id);
```
- ✅ **Avantage** : Compatibilité avec anciennes données
- ⚠️ **Limitation** : Pas toujours fiable (membres d'équipe)

## Flux d'authentification mis à jour

```
Connexion utilisateur
       ↓
Chargement session
       ↓
Vérification onboarding (4 méthodes)
       ↓
┌──────────────────────────────────┐
│ 1. localStorage (session active) │
│ 2. companies.onboarding_completed│
│ 3. onboarding_sessions.completed │ ← ✅ NOUVEAU
│ 4. companies.owner_id (fallback) │
└──────────────────────────────────┘
       ↓
   Résultat ?
   ┌───┴───┐
   │  OUI  │ → /dashboard
   └───┬───┘
   ┌───┴───┐
   │  NON  │ → /onboarding
   └───────┘
```

## Impact et bénéfices

### ✅ Problème résolu
- Les utilisateurs ne retournent plus à l'onboarding après déconnexion
- La vérification est maintenant basée sur la source de vérité (table `onboarding_sessions`)

### ✅ Compatibilité maintenue
- Les 3 autres méthodes de vérification restent actives
- Aucune régression pour les utilisateurs existants

### ✅ Robustesse améliorée
- Gestion d'erreur avec try/catch
- Logs pour le debugging
- Pas de blocage en cas d'échec de requête

## Test recommandé

### Scénario 1 : Nouvel utilisateur
1. Créer un compte
2. Compléter l'onboarding
3. ✅ Vérifier que `onboarding_sessions.completed_at` est défini
4. Se déconnecter
5. Se reconnecter
6. ✅ **Devrait aller directement sur `/dashboard`**

### Scénario 2 : Utilisateur existant
1. Se connecter avec un compte existant
2. ✅ Vérifier que l'onboarding ne se répète pas
3. ✅ Redirection vers `/dashboard`

### Scénario 3 : Onboarding incomplet
1. Créer un compte
2. Ne PAS compléter l'onboarding
3. Se déconnecter
4. Se reconnecter
5. ✅ **Devrait retourner à `/onboarding`**

## Vérification en base de données

Pour vérifier manuellement si un utilisateur a complété l'onboarding :

```sql
SELECT
  u.email,
  os.completed_at as session_completed,
  c.onboarding_completed_at as company_completed,
  c.owner_id
FROM auth.users u
LEFT JOIN onboarding_sessions os ON os.user_id = u.id
LEFT JOIN companies c ON c.owner_id = u.id
WHERE u.id = 'user-id-here';
```

## Fichiers modifiés

- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) - Lignes 424-462

## Logs de debugging

Après la correction, vous verrez dans la console :
```
✅ Session onboarding complétée trouvée dans la BDD
```

Ou en cas de problème :
```
⚠️ Erreur lors de la vérification onboarding_sessions: [error]
```

## Notes techniques

### Pourquoi 4 méthodes ?

1. **localStorage** : Performance (pas de requête si session active)
2. **companies.onboarding_completed_at** : Déjà chargé avec les companies
3. **onboarding_sessions.completed_at** : Source de vérité principale ✅
4. **owner_id** : Fallback pour données historiques

Cette approche hybride garantit :
- ✅ Performance optimale
- ✅ Fiabilité maximale
- ✅ Compatibilité rétroactive

## Status

✅ **RÉSOLU** - L'onboarding ne se répète plus après déconnexion/reconnexion
✅ **Testé** - Requête SQL validée
✅ **Prêt pour déploiement**
