# Fix: Subscription Plan Change Updates Modules

## Problème identifié

Lorsqu'un utilisateur changeait de forfait (plan d'abonnement), les paramètres de l'application et les modules ne se mettaient pas à jour automatiquement.

### Cause

Le `ModulesContext` n'écoutait pas l'événement `subscription-changed` émis par le `subscriptionService` et le `SubscriptionContext` lors du changement de plan.

## Solution implémentée

### 1. Ajout de l'écouteur d'événement dans `ModulesContext`

**Fichier**: `src/contexts/ModulesContext.tsx`

Ajout d'un nouveau gestionnaire d'événement `handleSubscriptionChange` qui :
- Recharge les modules pour mettre à jour `allowedModuleKeys`
- Désactive automatiquement les modules qui ne sont plus disponibles dans le nouveau plan
- Préserve les modules core (dashboard, settings, security, users)
- Met à jour le localStorage et synchronise l'état

```typescript
const handleSubscriptionChange = async (event: Event) => {
  const customEvent = event as CustomEvent;
  const detail = customEvent.detail as { userId?: string; newPlanId?: string } | undefined;
  
  console.log('[ModulesProvider] Subscription changed:', detail);
  
  // Recharger les modules pour mettre à jour allowedModuleKeys
  await loadModules();
  
  // Désactiver les modules qui ne sont plus disponibles dans le nouveau plan
  if (detail?.newPlanId) {
    const newPlanModules = getModulesForPlan(detail.newPlanId) || [];
    const newAllowedModules = Array.from(new Set([...CORE_MODULES, ...newPlanModules]));
    
    const currentStates = localStorage.getItem('casskai-module-states');
    const states = currentStates ? JSON.parse(currentStates) : {};
    
    // Désactiver les modules non autorisés
    Object.keys(states).forEach(moduleKey => {
      if (!newAllowedModules.includes(moduleKey)) {
        console.log(`[ModulesProvider] Deactivating module ${moduleKey} (not in new plan)`);
        states[moduleKey] = false;
      }
    });
    
    localStorage.setItem('casskai-module-states', JSON.stringify(states));
    syncFromStateMap(states);
  }
};
```

Enregistrement de l'écouteur :
```typescript
window.addEventListener('subscription-changed', handleSubscriptionChange as EventListener);
```

### 2. Émission de l'événement dans `SubscriptionContext`

**Fichier**: `src/contexts/SubscriptionContext.tsx`

Ajout de l'émission d'événement `subscription-changed` après la mise à jour ou la création d'un abonnement :

```typescript
// Émettre l'événement de changement d'abonnement
window.dispatchEvent(new CustomEvent('subscription-changed', {
  detail: { userId: user.id, newPlanId: planId }
}));
```

### 3. Émission déjà existante dans `subscriptionService`

**Fichier**: `src/services/subscriptionService.ts`

Le service émettait déjà l'événement (ligne 513), donc pas de modification nécessaire :

```typescript
// Émettre un événement pour que les composants se mettent à jour
window.dispatchEvent(new CustomEvent('subscription-changed', { 
  detail: { userId, newPlanId } 
}));
```

## Flux de données

```
User changes plan
     ↓
SubscriptionService.changePlan() OR SubscriptionContext.setSubscriptionPlan()
     ↓
Update database + localStorage
     ↓
Emit 'subscription-changed' event
     ↓
ModulesContext listens to event
     ↓
1. Reload modules (update allowedModuleKeys)
2. Deactivate unauthorized modules
3. Update localStorage
4. Sync UI state
     ↓
UI refreshes with new plan and modules
```

## Architecture des événements

### Événements disponibles

1. **`subscription-changed`** (NOUVEAU)
   - Émis par: `subscriptionService`, `SubscriptionContext`
   - Écouté par: `ModulesContext`
   - Payload: `{ userId: string, newPlanId: string }`
   - Action: Mise à jour des modules disponibles

2. **`module-state-changed`**
   - Émis par: Composants de gestion des modules
   - Écouté par: `ModulesContext`
   - Payload: `{ moduleKey: string, isActive: boolean, allStates?: Record<string, boolean> }`
   - Action: Persistence et synchronisation d'un module

3. **`module-states-reset`**
   - Émis par: Composants de réinitialisation
   - Écouté par: `ModulesContext`
   - Payload: Aucun
   - Action: Recharge tous les états depuis localStorage

## Test de la fonctionnalité

### Prérequis
- Utilisateur connecté avec une entreprise active
- Au moins un module non-core activé

### Scénarios de test

#### 1. Downgrade (Pro → Starter)

1. S'assurer d'être sur un plan Pro avec modules supplémentaires activés (ex: CRM, Projets)
2. Changer pour un plan Starter
3. **Résultat attendu**:
   - Les modules non inclus dans Starter sont automatiquement désactivés
   - Les modules core restent actifs
   - L'UI se rafraîchit automatiquement
   - Un log apparaît dans la console : `[ModulesProvider] Deactivating module crm (not in new plan)`

#### 2. Upgrade (Starter → Pro)

1. S'assurer d'être sur un plan Starter
2. Changer pour un plan Pro
3. **Résultat attendu**:
   - Les nouveaux modules deviennent disponibles
   - Les modules actuellement activés restent actifs
   - L'UI affiche les nouveaux modules disponibles
   - Un log apparaît : `[ModulesProvider] Subscription changed: { userId: '...', newPlanId: 'pro' }`

#### 3. Trial → Paid

1. S'assurer d'être en mode trial (tous les modules disponibles)
2. Changer pour un plan payant (Starter ou Pro)
3. **Résultat attendu**:
   - Les modules non inclus dans le plan payant sont désactivés
   - Les modules du plan restent actifs
   - La période d'essai se termine

### Commandes de test

```bash
# En développement
npm run dev

# Ouvrir la console du navigateur pour voir les logs
# Logs attendus:
# - [ModulesProvider] Subscription changed: { userId: '...', newPlanId: '...' }
# - [ModulesProvider] Deactivating module <module> (not in new plan)
```

### Vérifications manuelles

1. **LocalStorage**: 
   - Clé `casskai-module-states` doit refléter l'état actuel
   - Les modules désactivés doivent avoir `false`

2. **Interface utilisateur**:
   - Le menu de navigation ne doit plus afficher les modules désactivés
   - La page de gestion des modules doit afficher les bons états

3. **Base de données**:
   - La table `company_modules` doit refléter les changements
   - Le `tenant_id` doit correspondre à l'entreprise active

## Cas limites gérés

1. **Modules core**: Jamais désactivés, même en downgrade
2. **Trial users**: Tous les modules disponibles pendant la période d'essai
3. **Fallback localStorage**: Si la DB est indisponible, localStorage prend le relais
4. **Événements multiples**: Les événements sont dédupliqués et synchronisés

## Améliorations futures possibles

1. **Auto-activation**: Activer automatiquement les nouveaux modules lors d'un upgrade
2. **Notifications**: Afficher un toast/notification lors du changement de plan
3. **Historique**: Conserver un historique des changements de modules
4. **Rollback**: Permettre d'annuler un changement de plan
5. **Preview**: Montrer un aperçu des modules avant de changer de plan

## Fichiers modifiés

- ✅ `src/contexts/ModulesContext.tsx` (ajout écouteur subscription-changed)
- ✅ `src/contexts/SubscriptionContext.tsx` (émission événement)
- ℹ️ `src/services/subscriptionService.ts` (déjà OK, pas de modification)

## Logs de débogage

Pour activer les logs détaillés pendant le développement :

```typescript
// Dans ModulesContext.tsx, le log est déjà présent
console.log('[ModulesProvider] Subscription changed:', detail);
console.log(`[ModulesProvider] Deactivating module ${moduleKey} (not in new plan)`);
```

Pour vérifier les événements émis :

```javascript
// Dans la console du navigateur
window.addEventListener('subscription-changed', (e) => {
  console.log('Subscription changed event:', e.detail);
});
```

## Résumé

✅ **Problème résolu**: Les changements de forfait mettent maintenant à jour les modules automatiquement  
✅ **Architecture**: Event-driven avec CustomEvents  
✅ **Persistence**: LocalStorage + Supabase  
✅ **Testable**: Logs de débogage et scénarios de test définis  
✅ **Robuste**: Gestion des cas limites et fallback  

---

**Date**: 2025-01-11  
**Version**: 1.0.0  
**Status**: ✅ Implémenté et compilé avec succès
