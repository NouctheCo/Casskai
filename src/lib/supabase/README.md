# Supabase Module - Structure Modulaire

Ce répertoire contient la configuration Supabase organisée en modules logiques pour une meilleure maintenabilité.

## Structure

```
src/lib/supabase/
├── config.ts      # Configuration et initialisation du client Supabase
├── errors.ts      # Utilitaires de gestion d'erreurs
├── helpers.ts     # Fonctions helper pour les opérations courantes
├── index.ts       # Point d'entrée principal avec ré-exports
└── README.md      # Cette documentation
```

## Modules

### config.ts
Contient la configuration et l'initialisation du client Supabase.

```typescript
import { supabase } from '@/lib/supabase';
```

### errors.ts
Utilitaires pour gérer les erreurs Supabase de manière cohérente.

```typescript
import { handleSupabaseError, isRLSError } from '@/lib/supabase';

try {
  // opération Supabase
} catch (error) {
  const message = handleSupabaseError(error);
  console.error(message);
}
```

Fonctions disponibles :
- `handleSupabaseError(error)`: Convertit les erreurs en messages utilisateur
- `isRLSError(error)`: Détecte les erreurs RLS/Policy (utile pour l'onboarding)

### helpers.ts
Fonctions helper pour les opérations courantes de base de données.

```typescript
import { getUserCompanies, getCurrentCompany } from '@/lib/supabase';

// Récupérer les entreprises de l'utilisateur
const companies = await getUserCompanies();

// Récupérer l'entreprise par défaut
const company = await getCurrentCompany();
```

Fonctions disponibles :
- `getUserCompanies(userId?)`: Récupère les entreprises d'un utilisateur
- `getCurrentCompany(userId?)`: Récupère l'entreprise par défaut

### index.ts
Point d'entrée principal qui ré-exporte tous les modules.

## Migration depuis l'ancien fichier

L'ancien fichier [src/lib/supabase.ts](../supabase.ts) est maintenu pour la rétrocompatibilité et ré-exporte tous les modules.

### Imports recommandés

```typescript
// Client Supabase
import { supabase } from '@/lib/supabase';

// Gestion d'erreurs
import { handleSupabaseError, isRLSError } from '@/lib/supabase';

// Helpers
import { getUserCompanies, getCurrentCompany } from '@/lib/supabase';
```

### Imports modulaires (pour de nouveaux helpers)

Si vous souhaitez importer directement depuis un module spécifique :

```typescript
import { supabase } from '@/lib/supabase/config';
import { handleSupabaseError } from '@/lib/supabase/errors';
import { getUserCompanies } from '@/lib/supabase/helpers';
```

## Avantages de cette structure

1. **Séparation des préoccupations**: Chaque module a une responsabilité claire
2. **Maintenabilité**: Plus facile de trouver et modifier du code spécifique
3. **Testabilité**: Chaque module peut être testé indépendamment
4. **Extensibilité**: Facile d'ajouter de nouveaux modules (ex: auth, storage)
5. **Tree-shaking**: Les bundlers peuvent mieux optimiser le code

## Ajout de nouveaux modules

Pour ajouter un nouveau module (ex: auth.ts) :

1. Créer le fichier `src/lib/supabase/auth.ts`
2. Implémenter les fonctions d'authentification
3. Ajouter les exports dans `index.ts`:
   ```typescript
   export { login, logout, register } from './auth';
   ```

## Types

Les types de la base de données sont définis dans [src/types/supabase.ts](../../types/supabase.ts) et peuvent être utilisés avec le client Supabase :

```typescript
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

// Le client est typé automatiquement
const { data } = await supabase
  .from('companies')
  .select('*')
  .single();
```
