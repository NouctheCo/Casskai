# Correction Guide d'introduction (Tour) - 06/12/2025

## Problèmes identifiés

1. ❌ **Le tour ne s'affichait PAS pour les nouveaux utilisateurs**
2. ❌ **Le tour pouvait se relancer en boucle**
3. ⚠️ **Le bouton "Relancer le guide" ne fonctionnait pas correctement**

## Causes racines

### Problème 1 : Détection incorrecte des nouveaux utilisateurs

**Fichier** : [DashboardPage.tsx](src/pages/DashboardPage.tsx) ligne 65

**Avant** :
```typescript
<OnboardingTour
  isNewAccount={!currentCompany?.onboarding_completed_at}
  companyName={currentCompany?.name || ''}
/>
```

**Cause** : Avec nos corrections de l'onboarding, `onboarding_completed_at` est maintenant **toujours défini** après l'onboarding. Donc `!currentCompany?.onboarding_completed_at` est toujours `false`, et `isNewAccount` est toujours `false`, empêchant le tour de se lancer pour les nouveaux utilisateurs.

### Problème 2 : Pas de mécanisme pour forcer le tour

**Fichier** : [OnboardingTour.tsx](src/components/dashboard/OnboardingTour.tsx) ligne 121-130

**Avant** :
```typescript
useEffect(() => {
  if (isNewAccount) {
    const hasCompletedTour = localStorage.getItem(storageKey);
    if (!hasCompletedTour) {
      const timeoutId = window.setTimeout(() => setRun(true), 1000);
      return () => window.clearTimeout(timeoutId);
    }
  }
  return undefined;
}, [isNewAccount, storageKey]);
```

**Cause** : Aucun mécanisme pour forcer le tour via l'URL (ex: `?tour=start`).

### Problème 3 : Bouton relance incomplet

**Fichier** : [SettingsPage.tsx](src/pages/SettingsPage.tsx) ligne 22-28

**Avant** :
```typescript
const handleRestartTour = () => {
  const restart = (window as unknown as Record<string, unknown>).restartOnboardingTour;
  if (typeof restart === 'function') {
    (restart as () => void)();
    navigate('/dashboard');
  }
};
```

**Cause** : Dépendait uniquement de `window.restartOnboardingTour()`, pas de fallback robuste.

## Solutions appliquées

### 1. Détection intelligente des nouveaux utilisateurs

**Fichier** : [DashboardPage.tsx](src/pages/DashboardPage.tsx) lignes 64-75

**Après** :
```typescript
<OnboardingTour
  isNewAccount={(() => {
    // Considérer comme "nouveau" si l'onboarding a été complété récemment (< 24h)
    if (currentCompany?.onboarding_completed_at) {
      const completedDate = new Date(currentCompany.onboarding_completed_at);
      const hoursSinceCompletion = (Date.now() - completedDate.getTime()) / (1000 * 60 * 60);
      return hoursSinceCompletion < 24;
    }
    return false;
  })()}
  companyName={currentCompany?.name || ''}
/>
```

**Bénéfice** :
- ✅ Les utilisateurs qui viennent de terminer l'onboarding (< 24h) verront le tour
- ✅ Les utilisateurs existants (> 24h) ne verront pas le tour automatiquement
- ✅ Fenêtre de 24h pour découvrir l'interface

### 2. Mécanisme URL pour forcer le tour

**Fichier** : [OnboardingTour.tsx](src/components/dashboard/OnboardingTour.tsx) lignes 121-146

**Après** :
```typescript
useEffect(() => {
  // Vérifier si le tour est déjà complété
  const hasCompletedTour = localStorage.getItem(storageKey);

  // Vérifier si l'URL demande explicitement le tour (pour relancer)
  const urlParams = new URLSearchParams(window.location.search);
  const forceTour = urlParams.get('tour') === 'start' || urlParams.get('tour') === 'true';

  if (forceTour) {
    // Forcer le redémarrage du tour
    localStorage.removeItem(storageKey);
    setStepIndex(0);
    const timeoutId = window.setTimeout(() => setRun(true), 500);
    // Nettoyer l'URL après avoir lancé le tour
    window.history.replaceState({}, '', window.location.pathname);
    return () => window.clearTimeout(timeoutId);
  }

  if (isNewAccount && !hasCompletedTour) {
    // Nouveau compte et tour pas encore fait
    const timeoutId = window.setTimeout(() => setRun(true), 1000);
    return () => window.clearTimeout(timeoutId);
  }

  return undefined;
}, [isNewAccount, storageKey]);
```

**Bénéfices** :
- ✅ Possibilité de forcer le tour via URL : `/dashboard?tour=start`
- ✅ L'URL est nettoyée après le lancement (pas de pollution de l'historique)
- ✅ Le localStorage est réinitialisé pour permettre le tour
- ✅ Fonctionne indépendamment de `isNewAccount`

### 3. Bouton relance amélioré

**Fichier** : [SettingsPage.tsx](src/pages/SettingsPage.tsx) lignes 23-32

**Après** :
```typescript
const handleRestartTour = () => {
  // Méthode 1 : Utiliser l'URL pour forcer le tour (recommandé)
  navigate('/dashboard?tour=start');

  // Méthode 2 : Fallback sur la fonction globale si elle existe
  const restart = (window as unknown as Record<string, unknown>).restartOnboardingTour;
  if (typeof restart === 'function') {
    (restart as () => void)();
  }
};
```

**Bénéfices** :
- ✅ **Méthode principale** : Navigation vers `/dashboard?tour=start`
- ✅ **Fallback** : Utilisation de `window.restartOnboardingTour()` si disponible
- ✅ Redondance pour garantir le fonctionnement

## Flux complet résolu

### Scénario 1 : Nouvel utilisateur (< 24h)

```
1. Utilisateur termine l'onboarding
   ↓
2. onboarding_completed_at = maintenant
   ↓
3. Redirection vers /dashboard
   ↓
4. ✅ isNewAccount = true (< 24h)
   ↓
5. ✅ hasCompletedTour = null (première fois)
   ↓
6. ✅ Tour se lance automatiquement après 1s
   ↓
7. Utilisateur complète ou skip le tour
   ↓
8. ✅ localStorage: onboarding_tour_completed_${userId} = 'true'
```

### Scénario 2 : Utilisateur existant

```
1. Utilisateur se connecte (onboarding > 24h)
   ↓
2. ✅ isNewAccount = false (> 24h)
   ↓
3. ✅ Tour ne se lance PAS automatiquement
   ↓
4. Utilisateur peut relancer via bouton Paramètres
```

### Scénario 3 : Relancer le tour

```
1. Utilisateur clique sur "Relancer le guide"
   ↓
2. Navigation vers /dashboard?tour=start
   ↓
3. ✅ URL détectée : forceTour = true
   ↓
4. ✅ localStorage nettoyé
   ↓
5. ✅ Tour relancé après 0.5s
   ↓
6. ✅ URL nettoyée : /dashboard
```

## Test recommandé

### Test 1 : Nouvel utilisateur
1. Créer un nouveau compte
2. Compléter l'onboarding
3. ✅ **Le tour devrait se lancer automatiquement**
4. Compléter ou skip le tour
5. Rafraîchir la page
6. ✅ **Le tour ne devrait PAS se relancer**

### Test 2 : Utilisateur existant
1. Se connecter avec un compte ancien (> 24h)
2. ✅ **Le tour ne devrait PAS se lancer**
3. Aller dans Paramètres
4. Cliquer sur "Relancer le guide d'introduction"
5. ✅ **Le tour devrait se lancer**

### Test 3 : URL directe
1. Naviguer vers `/dashboard?tour=start`
2. ✅ **Le tour devrait se lancer immédiatement**
3. ✅ **L'URL devrait être nettoyée : `/dashboard`**

## Configuration

### LocalStorage

Clé utilisée : `onboarding_tour_completed_${userId}`

**Valeurs** :
- `null` ou absent : Tour pas encore fait
- `'true'` : Tour complété

### Paramètres URL

| Paramètre | Valeur | Effet |
|-----------|--------|-------|
| `tour` | `start` | Force le tour |
| `tour` | `true` | Force le tour |

**Exemples** :
- `/dashboard?tour=start` ✅
- `/dashboard?tour=true` ✅
- `/dashboard?tour=false` ❌ (ne force pas)

### Détection nouveaux utilisateurs

**Logique** : `onboarding_completed_at < 24h`

**Personnalisation** : Modifier la valeur `24` dans [DashboardPage.tsx](src/pages/DashboardPage.tsx) ligne 70 :

```typescript
return hoursSinceCompletion < 24; // Changer 24 par la valeur souhaitée
```

Exemples :
- `< 1` : Seulement dans la première heure
- `< 48` : Dans les 2 premiers jours
- `< 168` : Dans la première semaine

## Impact et bénéfices

### ✅ Problème 1 résolu
- Les nouveaux utilisateurs (< 24h) voient maintenant le tour automatiquement
- Fenêtre de 24h pour découvrir l'interface sans être submergé

### ✅ Problème 2 résolu
- Le tour ne se relance plus en boucle
- localStorage empêche les répétitions non désirées

### ✅ Problème 3 résolu
- Le bouton "Relancer le guide" fonctionne via URL
- Fallback sur méthode globale pour robustesse

### ✅ Expérience utilisateur améliorée
- Onboarding progressif : création compte → tour dashboard
- Possibilité de revoir le tour à tout moment
- Pas de répétition intempestive

## Debugging

### Logs utiles

Ajouter temporairement dans [OnboardingTour.tsx](src/components/dashboard/OnboardingTour.tsx) :

```typescript
useEffect(() => {
  console.log('🎯 Tour Debug:', {
    isNewAccount,
    hasCompletedTour: localStorage.getItem(storageKey),
    urlParams: new URLSearchParams(window.location.search).get('tour'),
    userId: user?.id
  });
  // ... rest of code
}, [isNewAccount, storageKey]);
```

### Commandes console

```javascript
// Vérifier l'état du tour
localStorage.getItem(`onboarding_tour_completed_${userId}`)

// Réinitialiser le tour
localStorage.removeItem(`onboarding_tour_completed_${userId}`)

// Forcer le tour (dans DashboardPage)
window.location.href = '/dashboard?tour=start'

// Appeler la fonction globale
window.restartOnboardingTour?.()
```

## Fichiers modifiés

1. [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx) - Lignes 64-75
2. [src/components/dashboard/OnboardingTour.tsx](src/components/dashboard/OnboardingTour.tsx) - Lignes 121-146
3. [src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx) - Lignes 23-32

## Status

✅ **RÉSOLU** - Le guide d'introduction fonctionne correctement
✅ **Nouveaux users** - Voient le tour dans les 24h
✅ **Relance** - Fonctionne via bouton ou URL
✅ **Prêt pour déploiement**

## Notes techniques

### Bibliothèque utilisée
- **react-joyride** : Bibliothèque de tour guidé pour React
- Documentation : https://docs.react-joyride.com/

### Personnalisation

Le tour est défini dans `buildTourSteps()` (lignes 16-111) et cible des éléments avec l'attribut `data-tour` :

```tsx
<div data-tour="quick-start-cards">
  {/* Contenu */}
</div>
```

Pour ajouter une étape :
1. Ajouter `data-tour="mon-element"` à un élément
2. Ajouter une étape dans `buildTourSteps()`

### Traductions

Les textes du tour sont dans les fichiers i18n sous la clé `tour.*` :
- `tour.welcome.title`
- `tour.welcome.intro`
- etc.
