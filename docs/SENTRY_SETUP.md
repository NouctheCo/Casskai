# Configuration Sentry - Monitoring d'Erreurs

## Vue d'ensemble

Sentry est intégré à CassKai pour le monitoring d'erreurs en temps réel, le tracking de performance, et les replays de sessions.

## Configuration Initiale

### 1. Créer un Projet Sentry

1. Allez sur [sentry.io](https://sentry.io)
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet **React**
4. Copiez votre **DSN** (Data Source Name)

### 2. Configurer les Variables d'Environnement

Ajoutez le DSN dans vos fichiers d'environnement :

**Production (.env.production)**
```env
VITE_SENTRY_DSN=https://your-sentry-dsn@o123456.ingest.sentry.io/7654321
```

**Staging (.env.staging)**
```env
VITE_SENTRY_DSN=https://your-staging-dsn@o123456.ingest.sentry.io/7654322
```

**Development (.env.local)**
```env
# Laissez vide pour désactiver Sentry en développement
VITE_SENTRY_DSN=
```

### 3. Initialiser Sentry dans l'Application

Sentry est automatiquement initialisé au démarrage de l'application via `src/main.tsx`.

**Fichier : src/main.tsx**
```typescript
import { initializeSentry } from '@/lib/sentry';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

// Initialize Sentry
initializeSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

## Fonctionnalités

### 1. Error Tracking

Toutes les erreurs React non gérées sont automatiquement capturées :

```typescript
// Erreur capturée automatiquement
throw new Error('Something went wrong');

// Capturer manuellement une erreur
import { captureException } from '@/lib/sentry';

try {
  riskyOperation();
} catch (error) {
  captureException(error as Error, {
    context: 'Payment processing',
    user_id: userId,
  });
}
```

### 2. Breadcrumbs

Ajouter du contexte pour déboguer :

```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb('User clicked payment button', 'user-action', {
  amount: 50000,
  currency: 'XOF',
});

addBreadcrumb('API request started', 'http', {
  url: '/api/invoices',
  method: 'POST',
});
```

### 3. User Context

Associer les erreurs aux utilisateurs :

```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry';

// À la connexion
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.full_name,
});

// À la déconnexion
clearSentryUser();
```

### 4. Custom Context

Ajouter des données métier :

```typescript
import { setSentryContext } from '@/lib/sentry';

setSentryContext('company', {
  id: company.id,
  name: company.name,
  plan: company.subscription_plan,
});

setSentryContext('invoice', {
  id: invoice.id,
  number: invoice.invoice_number,
  status: invoice.status,
});
```

### 5. Performance Monitoring

Mesurer les performances de sections critiques :

```typescript
import { startTransaction } from '@/lib/sentry';

const transaction = startTransaction('invoice-generation', 'task');

try {
  await generateInvoicePDF(invoiceId);
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('error');
  throw error;
} finally {
  transaction.finish();
}
```

### 6. Messages (Logs)

Capturer des messages informatifs :

```typescript
import { captureMessage } from '@/lib/sentry';

captureMessage('Payment webhook received', 'info');
captureMessage('Unusual activity detected', 'warning');
captureMessage('Critical system failure', 'error');
```

## Error Boundaries

### Global Error Boundary

Enveloppe toute l'application (déjà configuré) :

```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Page Error Boundary

Pour des pages individuelles :

```typescript
import { PageErrorBoundary } from '@/components/error/ErrorBoundary';

function InvoicingPage() {
  return (
    <PageErrorBoundary>
      <InvoiceList />
      <InvoiceForm />
    </PageErrorBoundary>
  );
}
```

### Custom Fallback

Créer un fallback personnalisé :

```typescript
function CustomFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div>
      <h1>Erreur dans le module facturation</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>Réessayer</button>
    </div>
  );
}

<ErrorBoundary fallback={CustomFallback}>
  <InvoicingModule />
</ErrorBoundary>
```

## Configuration Sentry Dashboard

### 1. Alertes Email

1. Allez dans **Project Settings** → **Alerts**
2. Créez une règle :
   - **Condition** : "An event is captured"
   - **Filter** : "level equals error"
   - **Action** : "Send an email to..."

### 2. Intégration Slack

1. **Settings** → **Integrations** → **Slack**
2. Installez l'intégration
3. Configurez le canal (#alerts)
4. Créez des alertes pour :
   - Nouvelles erreurs
   - Pics d'erreurs (> 10/min)
   - Erreurs critiques

### 3. Release Tracking

Associer les erreurs aux versions déployées :

```bash
# Dans votre script de déploiement
export SENTRY_AUTH_TOKEN=your-auth-token
export SENTRY_ORG=your-org
export SENTRY_PROJECT=casskai

# Créer une release
sentry-cli releases new "casskai@1.0.0"

# Uploader source maps
sentry-cli releases files "casskai@1.0.0" upload-sourcemaps ./dist

# Finaliser la release
sentry-cli releases finalize "casskai@1.0.0"

# Créer un deploy
sentry-cli releases deploys "casskai@1.0.0" new -e production
```

### 4. Session Replay

Les replays de session sont activés :
- **10%** des sessions normales
- **100%** des sessions avec erreur

Pour voir les replays :
1. **Issues** → Cliquez sur une erreur
2. Onglet **Replays**
3. Regardez ce que l'utilisateur a fait avant l'erreur

## Filtres d'Erreurs

Les erreurs suivantes sont ignorées automatiquement :

### Erreurs Réseau
- `network error`
- `fetch failed`
- `timeout`
- `aborted`

### Erreurs Navigateur
- `ResizeObserver loop limit exceeded`

### Configuration du Filtre

Voir `src/lib/sentry.ts` → `beforeSend()`

Pour ajouter un filtre :

```typescript
beforeSend(event, hint) {
  const error = hint.originalException;

  // Ignorer les erreurs de certains tiers
  if (event.exception?.values?.[0]?.stacktrace?.frames) {
    const frames = event.exception.values[0].stacktrace.frames;
    if (frames.some(frame => frame.filename?.includes('facebook'))) {
      return null; // Ignore
    }
  }

  return event;
}
```

## Sampling Rates

### Production
- **Traces** : 10% (performance)
- **Replays** : 10% (sessions normales), 100% (erreurs)

### Staging
- **Traces** : 100%
- **Replays** : 10% (sessions), 100% (erreurs)

### Ajuster le Sampling

Modifier `src/lib/sentry.ts` :

```typescript
tracesSampleRate: ENV === 'production' ? 0.1 : 1.0,
replaysSessionSampleRate: 0.1,
replaysOnErrorSampleRate: 1.0,
```

## Sécurité et Confidentialité

### Données Sensibles

Sentry **n'enregistre jamais** :
- Mots de passe
- Clés API
- Tokens d'authentification

Ces données sont filtrées automatiquement via `beforeBreadcrumb()`.

### RGPD

Pour respecter le RGPD :

1. **Anonymiser les IPs** (Settings → Security & Privacy)
2. **Activer Data Scrubbing** (retire les données sensibles)
3. **Configurer la rétention** (30 jours recommandé)

### Supprimer les Données Utilisateur

Pour supprimer toutes les données d'un utilisateur :

```bash
sentry-cli delete-user-data --org your-org --project casskai USER_ID
```

## Meilleures Pratiques

### 1. Ajouter du Contexte

Toujours fournir du contexte aux erreurs :

```typescript
try {
  await createInvoice(data);
} catch (error) {
  captureException(error as Error, {
    invoice_data: data,
    user_action: 'create_invoice',
    company_id: currentCompany.id,
  });
}
```

### 2. Catégoriser les Erreurs

Utiliser des tags pour filtrer :

```typescript
Sentry.setTag('module', 'invoicing');
Sentry.setTag('feature', 'pdf-generation');
```

### 3. Niveaux de Sévérité

```typescript
Sentry.captureMessage('Info message', 'info');
Sentry.captureMessage('Warning', 'warning');
Sentry.captureException(error); // Automatically 'error'
Sentry.captureMessage('Critical', 'fatal');
```

### 4. Groupement d'Erreurs

Pour éviter la duplication, utiliser des fingerprints :

```typescript
Sentry.captureException(error, {
  fingerprint: ['invoice-generation', invoiceType],
});
```

## Troubleshooting

### Erreurs non capturées

**Problème** : Certaines erreurs n'apparaissent pas.

**Solutions** :
1. Vérifier que `VITE_SENTRY_DSN` est défini
2. Vérifier que l'erreur n'est pas filtrée (`beforeSend`)
3. Vérifier les quotas Sentry (limite atteinte ?)

### Trop d'erreurs

**Problème** : Quota Sentry dépassé rapidement.

**Solutions** :
1. Augmenter les filtres (`beforeSend`)
2. Réduire le `tracesSampleRate`
3. Résoudre les erreurs fréquentes
4. Upgrade Sentry plan

### Source Maps manquantes

**Problème** : Stack traces incompréhensibles.

**Solutions** :
1. Uploader les source maps après build
2. Vérifier que `sourcemap: true` dans `vite.config.ts`
3. Configurer Sentry Vite Plugin

## Monitoring Dashboard

### Métriques Clés à Surveiller

1. **Error Rate** : < 1% des sessions
2. **Crash-Free Rate** : > 99.9%
3. **Response Time** : < 1s (P95)
4. **User Satisfaction** : Issues résolues < 24h

### Alertes Recommandées

1. **Nouvelle erreur jamais vue** → Email immédiat
2. **> 50 erreurs en 1h** → Slack + Email
3. **Crash-free rate < 99%** → Slack + Email + SMS
4. **Performance dégradée (> 3s)** → Slack

## Support

**Documentation Sentry** : https://docs.sentry.io/platforms/javascript/guides/react/

**Support CassKai** : support@casskai.app

---

**Configuration complétée** ✅
- Sentry SDK installé
- Error boundaries en place
- Filtres configurés
- Sampling optimisé

**Prochaines étapes** :
1. Créer un projet Sentry
2. Configurer le DSN
3. Tester les erreurs en staging
4. Configurer les alertes
5. Déployer en production
