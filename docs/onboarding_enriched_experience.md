# 📚 Documentation - Expérience Enrichie de l'Onboarding

## Vue d'ensemble

L'étape "Expérience enrichie" de l'onboarding CassKai permet aux nouveaux utilisateurs de découvrir la plateforme à travers trois scénarios interactifs :

1. **Parcours guidé interactif** - Tutoriel react-joyride
2. **Toasts dynamiques** - Astuces pédagogiques
3. **Scénario Supabase** - Sauvegarde et tracking

---

## 🎯 Objectifs

- Familiariser l'utilisateur avec l'interface CassKai
- Démontrer les fonctionnalités clés
- Collecter des données d'usage pour améliorer l'UX
- Historiser la progression dans Supabase

---

## 🏗️ Architecture

### Composants

#### `ExperienceStep.tsx`
Composant React principal qui orchestre les trois scénarios.

**Props**: Aucune (utilise les hooks de contexte)

**État local**:
```typescript
- completionStatus: CompletionStatus // État de complétion des scénarios
- isSending: string | null // ID du scénario en cours d'exécution
```

---

### Hooks Personnalisés

#### `useGuidedTour`
Gère le parcours guidé avec react-joyride.

**API**:
```typescript
{
  run: boolean;              // État d'exécution du tour
  steps: Step[];             // Étapes du tour
  stepIndex: number;         // Index de l'étape actuelle
  tourActive: boolean;       // Tour actif ou non
  startTour: () => void;     // Démarre le tour
  endTour: () => void;       // Termine le tour
  handleJoyrideCallback: (data: CallBackProps) => void;
}
```

**Étapes du tour**:
1. Message de bienvenue
2. Navigation header
3. Dashboard
4. Comptabilité
5. Facturation
6. Paramètres

**Tracking**:
- `modules-tour.started` - Début du tour
- `modules-tour.step-completed` - Étape complétée
- `modules-tour.completed` - Tour terminé

**Sauvegarde Supabase**:
```sql
UPDATE onboarding_sessions
SET session_data = {
  featuresExploration: {
    guided_tour_completed: true,
    completed_at: '2025-01-17T10:30:00Z'
  }
}
```

---

#### `useOnboardingToasts`
Gère l'affichage des toasts pédagogiques.

**API**:
```typescript
{
  previewGuidedToasts: () => Promise<{
    success: boolean;
    toastsDisplayed: number;
  }>;
  showToastById: (toastId: string) => void;
  availableToasts: PedagogicalToast[];
}
```

**Toasts disponibles**:
1. **Navigation** (success) - Raccourci Ctrl+K
2. **Raccourcis** (info) - Touche "?"
3. **Modules** (warning) - Activation des modules

**Tracking**:
- `toast_preview.triggered` - Déclenchement de la prévisualisation
- `toast_preview.displayed` - Toast affiché

**Sauvegarde Supabase**:
```sql
UPDATE onboarding_sessions
SET session_data = {
  featuresExploration: {
    toastPreview: {
      displayed: true,
      toasts: [{id, type}, ...],
      completed_at: '2025-01-17T10:30:00Z'
    }
  }
}
```

---

### Fonction RPC Supabase

#### `save_onboarding_scenario`

Fonction SQL qui enregistre les scénarios d'onboarding.

**Signature**:
```sql
save_onboarding_scenario(
  p_scenario VARCHAR,    -- ID du scénario ('guided-tour', 'toast-hints', 'supabase-sync')
  p_status VARCHAR,      -- Statut ('started', 'completed', 'failed')
  p_payload JSONB        -- Données additionnelles
) RETURNS JSONB
```

**Retour**:
```json
{
  "success": true,
  "sessionId": "uuid",
  "scenario": "guided-tour",
  "status": "completed",
  "savedAt": "2025-01-17T10:30:00Z"
}
```

**Logique**:
1. Récupère l'utilisateur authentifié
2. Trouve ou crée une session d'onboarding
3. Ajoute le scénario à `session_data.scenarioRuns[]`
4. Met à jour les flags spécifiques selon le scénario
5. Incrémente `progress`
6. Met à jour `last_saved_at`

---

## 📡 API et Endpoints

### Appels Supabase

#### Charger l'état de complétion
```typescript
const { data } = await supabase
  .from('onboarding_sessions')
  .select('session_data')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

#### Enregistrer un scénario
```typescript
const { data, error } = await supabase.rpc('save_onboarding_scenario', {
  p_scenario: 'guided-tour',
  p_status: 'completed',
  p_payload: { type: 'guided_tour', intensity: 'full' }
});
```

---

## 🔒 Sécurité

### Authentification
Tous les appels Supabase nécessitent une session authentifiée :
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session?.user) throw new Error('Non authentifié');
```

### RLS (Row Level Security)
La fonction RPC `save_onboarding_scenario` utilise `SECURITY DEFINER` et vérifie `auth.uid()`.

### Permissions
```sql
GRANT EXECUTE ON FUNCTION save_onboarding_scenario TO authenticated;
```

---

## 📊 Tracking Analytics

### Événements trackés

| Événement | Type | Données |
|-----------|------|---------|
| `modules-tour.started` | action | `{ timestamp, stepsCount }` |
| `modules-tour.step-completed` | action | `{ stepIndex, stepTarget, timestamp }` |
| `modules-tour.completed` | action | `{ timestamp, completedSteps }` |
| `toast_preview.triggered` | action | `{ timestamp, toastCount }` |
| `toast_preview.displayed` | action | `{ toastId, toastType, index, timestamp }` |
| `onboarding.guided-tour.started` | action | `{ scenarioId, timestamp }` |
| `onboarding.supabase-scenario.completed` | action | `{ scenarioId, sessionId, timestamp }` |

### Implémentation
Utilise `logger.action()` du système de logging centralisé :
```typescript
logger.action('event-name', { ...data });
```

---

## 🧪 Tests

### Tests Unitaires
Fichier : `src/pages/onboarding/ExperienceStep.test.tsx`

**Couverture** :
- ✅ Affichage des trois cartes
- ✅ Déclenchement du parcours guidé
- ✅ Affichage des toasts pédagogiques
- ✅ Enregistrement Supabase via RPC
- ✅ Désactivation des boutons après complétion
- ✅ Affichage de la progression
- ✅ Gestion des erreurs

### Exécution des tests
```bash
npm test -- ExperienceStep.test.tsx
```

---

## 🔧 Scripts de Vérification

### Vérifier les scénarios complétés
```sql
SELECT
  user_id,
  session_data->'scenarioRuns' as scenario_runs,
  session_data->'featuresExploration' as features,
  progress,
  last_saved_at
FROM onboarding_sessions
WHERE session_data->'scenarioRuns' IS NOT NULL
ORDER BY last_saved_at DESC;
```

### Compter les utilisateurs ayant complété chaque scénario
```sql
SELECT
  COUNT(*) FILTER (WHERE session_data->'featuresExploration'->>'guided_tour_completed' = 'true') as guided_tour,
  COUNT(*) FILTER (WHERE session_data->'featuresExploration'->'toastPreview'->>'displayed' = 'true') as toast_preview,
  COUNT(*) FILTER (WHERE session_data->'featuresExploration'->'supabaseScenario'->>'status' = 'completed') as supabase_scenario
FROM onboarding_sessions;
```

---

## 🚀 Déploiement

### Prérequis
1. react-joyride installé : `npm install react-joyride @types/react-joyride`
2. Migration SQL appliquée : `20251017000000_create_onboarding_scenario_rpc.sql`
3. Hooks disponibles : `useGuidedTour`, `useOnboardingToasts`

### Étapes de déploiement
```bash
# 1. Installer les dépendances
npm install

# 2. Appliquer la migration Supabase
supabase migration up --linked

# 3. Build production
npm run build

# 4. Déployer sur VPS
./deploy-vps.ps1
```

---

## 📦 Dépendances

```json
{
  "react-joyride": "^2.7.x",
  "@types/react-joyride": "^2.0.x"
}
```

---

## 🐛 Dépannage

### Le parcours guidé ne démarre pas
**Cause** : Les éléments DOM avec `data-tour` n'existent pas encore.

**Solution** : Ajouter les attributs `data-tour` aux éléments ciblés :
```tsx
<nav data-tour="header-nav">...</nav>
<div data-tour="dashboard">...</div>
```

### Les toasts ne s'affichent pas
**Cause** : Le système de toasts n'est pas initialisé.

**Solution** : Vérifier que `<Toaster />` est présent dans `App.tsx`.

### Erreur RPC Supabase
**Cause** : La fonction `save_onboarding_scenario` n'existe pas.

**Solution** : Appliquer la migration :
```bash
supabase migration up --linked
```

---

## 📝 Schéma des Données

### Structure `session_data`
```typescript
{
  scenarioRuns: [
    {
      scenario: 'guided-tour' | 'toast-hints' | 'supabase-sync',
      status: 'started' | 'completed' | 'failed',
      triggeredAt: string,
      payload: Record<string, unknown>
    }
  ],
  featuresExploration: {
    guided_tour_completed?: boolean,
    toastPreview?: {
      displayed: boolean,
      toasts: Array<{ id: string, type: string }>,
      completed_at: string
    },
    supabaseScenario?: {
      status: 'completed',
      completed_at: string,
      data: Record<string, unknown>
    }
  },
  completedSteps?: {
    'modules-tour'?: {
      completed: boolean,
      completedAt: string
    }
  }
}
```

---

## 🔄 Maintenance

### Ajouter une nouvelle étape au parcours guidé
1. Modifier `TOUR_STEPS` dans `useGuidedTour.ts`
2. Ajouter l'attribut `data-tour` sur l'élément cible
3. Tester localement

### Ajouter un nouveau toast pédagogique
1. Modifier `PEDAGOGICAL_TOASTS` dans `useOnboardingToasts.ts`
2. Mettre à jour la documentation
3. Tester l'affichage

### Ajouter un nouveau scénario
1. Créer un nouveau hook si nécessaire
2. Ajouter à `scenarios` dans `ExperienceStep.tsx`
3. Implémenter le handler `handle{ScenarioName}`
4. Ajouter le tracking analytics
5. Mettre à jour la fonction RPC si nécessaire

---

## 📞 Support

Pour toute question ou problème :
- **Documentation** : `docs/onboarding_enriched_experience.md`
- **Tests** : `src/pages/onboarding/ExperienceStep.test.tsx`
- **Hooks** : `src/hooks/useGuidedTour.ts`, `src/hooks/useOnboardingToasts.ts`
- **Migration SQL** : `supabase/migrations/20251017000000_create_onboarding_scenario_rpc.sql`

---

**Version** : 1.0
**Date** : 2025-01-17
**Auteur** : Claude (AI Assistant)
