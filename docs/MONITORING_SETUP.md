# 🔍 Configuration Monitoring Production - CassKai

Guide complet pour configurer le monitoring production avec Sentry et Plausible Analytics.

---

## 📋 Vue d'ensemble

Le monitoring CassKai utilise deux outils complémentaires :

1. **Sentry** : Suivi des erreurs, performances, et session replay
2. **Plausible Analytics** : Statistiques visiteurs respectueuses de la vie privée (RGPD-friendly)

---

## 🚨 Sentry - Error Tracking & Performance

### Étape 1 : Créer le compte Sentry

1. Aller sur [sentry.io](https://sentry.io)
2. Cliquer sur "Start Free" ou "Sign Up"
3. Créer un compte (email professionnel recommandé : tech@casskai.com)
4. Choisir le plan gratuit (40k events/mois suffisants pour la Beta)

### Étape 2 : Créer le projet

1. Dans le dashboard Sentry, cliquer sur "Create Project"
2. **Platform** : Sélectionner "React"
3. **Alert frequency** : Laisser "Alert me on every new issue"
4. **Project name** : `casskai-production`
5. Cliquer sur "Create Project"

### Étape 3 : Récupérer le DSN

Après création, Sentry affiche une page avec le **DSN** (Data Source Name).

**Format** : `https://abc123def456@o123456.ingest.sentry.io/789012`

⚠️ **IMPORTANT** : Copier ce DSN, il sera utilisé dans `.env`

### Étape 4 : Configurer les variables d'environnement

Créer/modifier le fichier `.env.production` :

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://votre-dsn@sentry.io/votre-project-id
VITE_APP_ENV=production
```

⚠️ **Sécurité** : 
- Le DSN peut être exposé côté client (il est préfixé par `VITE_`)
- Il permet uniquement d'envoyer des erreurs, pas de lire les données
- Ne jamais commiter les fichiers `.env.production` dans Git

### Étape 5 : Configuration avancée Sentry

#### Filtres d'erreurs personnalisés

Le code actuel filtre déjà :
- ✅ Erreurs des extensions Chrome (Dashlane, etc.)
- ✅ Erreurs `kwift` et `elementValues`

Pour ajouter d'autres filtres, modifier `src/main.tsx` :

```typescript
beforeSend(event, hint) {
  const error = hint.originalException;
  if (error && typeof error === 'object') {
    const errorStr = error.toString();
    // Ajouter vos filtres ici
    if (errorStr.includes('votre-filtre')) {
      return null; // Ignorer cette erreur
    }
  }
  return event;
}
```

#### Configuration des taux d'échantillonnage

Actuellement configuré :
- **Performance traces** : 10% (`tracesSampleRate: 0.1`)
- **Session replay normales** : 10% (`replaysSessionSampleRate: 0.1`)
- **Session replay avec erreurs** : 100% (`replaysOnErrorSampleRate: 1.0`)

Pour augmenter (attention aux coûts) :

```typescript
tracesSampleRate: 0.5, // 50% des transactions
replaysSessionSampleRate: 0.3, // 30% des sessions
```

### Étape 6 : Configurer les alertes Slack

#### A. Créer un webhook Slack

1. Aller sur [api.slack.com/apps](https://api.slack.com/apps)
2. Cliquer sur "Create New App" → "From scratch"
3. **App Name** : "Sentry CassKai"
4. **Workspace** : Votre workspace Slack
5. Dans "Incoming Webhooks" :
   - Activer "Activate Incoming Webhooks"
   - Cliquer "Add New Webhook to Workspace"
   - Choisir le canal `#tech-alerts` (ou créer le canal)
   - Copier l'URL du webhook (format : `https://hooks.slack.com/services/...`)

#### B. Connecter Sentry à Slack

1. Dans Sentry, aller dans **Settings** → **Integrations**
2. Chercher "Slack" et cliquer "Install"
3. Autoriser l'accès à votre workspace
4. Configurer le canal de notifications : `#tech-alerts`

#### C. Créer des règles d'alerte

1. Dans Sentry, aller dans **Alerts** → **Create Alert**
2. **Type** : "Issues"
3. **Conditions** :
   - When : "A new issue is created"
   - If : "The issue level is equal to Error"
4. **Actions** :
   - Send a notification to : Slack `#tech-alerts`
5. **Name** : "Critical Errors - Production"
6. Sauvegarder

**Règle additionnelle recommandée** :

- **When** : "An issue's frequency is more than X times in Y minutes"
- **Threshold** : 10 fois en 5 minutes
- **Action** : Slack + Email
- **Name** : "High Error Rate Alert"

### Étape 7 : Configurer les notifications email

1. Dans Sentry, aller dans **Settings** → **Account** → **Notifications**
2. Activer :
   - ✅ "Issue Alerts" : Pour chaque nouvelle erreur critique
   - ✅ "Weekly Reports" : Résumé hebdomadaire
   - ⬜ "Deploy Notifications" : Optionnel
3. Ajouter des emails additionnels :
   - tech@casskai.com
   - aldric.afannou@casskai.com

### Étape 8 : Tester l'intégration

Ajouter ce code temporaire dans `src/pages/DashboardPage.tsx` pour déclencher une erreur test :

```typescript
// ⚠️ CODE TEST - À SUPPRIMER APRÈS VÉRIFICATION
useEffect(() => {
  if (import.meta.env.VITE_TEST_SENTRY === 'true') {
    throw new Error('Test Sentry - Error tracking fonctionne ! ✅');
  }
}, []);
```

Puis dans `.env.local` :

```bash
VITE_TEST_SENTRY=true
```

Lancer `npm run dev`, ouvrir `/dashboard`, vérifier que l'erreur apparaît dans Sentry.

**⚠️ Supprimer le code test après vérification !**

---

## 📊 Plausible Analytics - Privacy-Friendly Analytics

### Étape 1 : Créer le compte Plausible

1. Aller sur [plausible.io](https://plausible.io)
2. Cliquer sur "Get Started" ou "Start your free trial"
3. Créer un compte (email : analytics@casskai.com)
4. **Plan recommandé** : Growth Plan (~9€/mois pour 10k pageviews/mois)

### Étape 2 : Ajouter le site

1. Dans le dashboard Plausible, cliquer "Add a website"
2. **Domain** : `casskai.fr` (sans https://)
3. **Timezone** : Europe/Paris
4. Cliquer "Add Site"

### Étape 3 : Vérifier l'installation

Le script Plausible est déjà installé dans `index.html` :

```html
<script defer data-domain="casskai.fr" src="https://plausible.io/js/script.js"></script>
```

Pour tester :

1. Déployer sur production
2. Visiter le site (https://casskai.fr)
3. Attendre 5-10 minutes
4. Vérifier dans le dashboard Plausible que la visite apparaît

### Étape 4 : Configurer les objectifs (Goals)

Dans Plausible, aller dans **Settings** → **Goals** :

#### Goals recommandés :

1. **Inscription Beta**
   - Type : Pageview
   - Path : `/register`

2. **Connexion réussie**
   - Type : Custom Event
   - Event name : `Login`

3. **Activation abonnement**
   - Type : Pageview
   - Path : `/subscription/success`

4. **Création facture**
   - Type : Custom Event
   - Event name : `Invoice Created`

5. **Export FEC**
   - Type : Custom Event
   - Event name : `FEC Exported`

### Étape 5 : Implémenter les events personnalisés

Installer le package Plausible (optionnel pour events) :

```bash
npm install plausible-tracker
```

Créer `src/lib/analytics.ts` :

```typescript
import Plausible from 'plausible-tracker';

const plausible = Plausible({
  domain: 'casskai.fr',
  apiHost: 'https://plausible.io',
});

export const trackEvent = (eventName: string, props?: Record<string, string | number>) => {
  if (import.meta.env.PROD) {
    plausible.trackEvent(eventName, { props });
  }
};

export const trackPageview = () => {
  if (import.meta.env.PROD) {
    plausible.trackPageview();
  }
};
```

Utiliser dans les composants :

```typescript
import { trackEvent } from '@/lib/analytics';

// Dans AuthPage après signup
trackEvent('Signup', { plan: 'starter' });

// Dans InvoicePage après création
trackEvent('Invoice Created', { amount: invoice.total });

// Dans ReportExportService après export FEC
trackEvent('FEC Exported', { year: year });
```

### Étape 6 : Configurer les rapports email

1. Dans Plausible, aller dans **Settings** → **Email Reports**
2. Activer "Weekly report"
3. Emails destinataires :
   - aldric.afannou@casskai.com
   - analytics@casskai.com
4. Fréquence : Tous les lundis matin
5. Sauvegarder

### Étape 7 : Whitelist le domaine

Si vous utilisez un Content Security Policy (CSP), ajouter dans `index.html` :

```html
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' https://plausible.io;
  connect-src 'self' https://plausible.io;
">
```

⚠️ CassKai n'utilise pas de CSP strict actuellement, cette étape est optionnelle.

---

## 🔔 Configuration Uptime Monitoring (Bonus)

Pour monitorer la disponibilité du site (uptime), utiliser **UptimeRobot** (gratuit) :

### Étape 1 : Créer le compte

1. Aller sur [uptimerobot.com](https://uptimerobot.com)
2. Créer un compte gratuit (50 monitors inclus)

### Étape 2 : Ajouter le monitor

1. Cliquer "Add New Monitor"
2. **Monitor Type** : HTTP(s)
3. **Friendly Name** : CassKai Production
4. **URL** : `https://casskai.fr`
5. **Monitoring Interval** : 5 minutes (gratuit)
6. **Monitor Timeout** : 30 seconds
7. **Alert Contacts** : Ajouter email tech@casskai.com

### Étape 3 : Configurer les alertes

1. Activer "Alert When Down"
2. **Alert After** : 1 vérification (immédiat)
3. **Alert Contacts** :
   - Email : tech@casskai.com
   - SMS (optionnel, payant)
   - Slack webhook (même que Sentry)

---

## 📈 Dashboard de Monitoring Recommandé

### Sentry (Erreurs & Performance)

**Vues à surveiller quotidiennement** :

1. **Issues** → Trier par "Last Seen" : Nouvelles erreurs
2. **Performance** → "Web Vitals" : LCP, FID, CLS
3. **Releases** → Comparer les versions : Régression ?

**KPIs à suivre** :

- **Error Rate** : < 0.1% (cible : 1 erreur pour 1000 vues)
- **Response Time (p95)** : < 2s
- **Crash-Free Sessions** : > 99.5%

### Plausible (Traffic & Conversions)

**Métriques à suivre** :

1. **Unique Visitors** : Croissance hebdomadaire
2. **Pageviews** : Pages les plus visitées
3. **Bounce Rate** : < 60% (cible)
4. **Time on Site** : > 2 minutes (cible)
5. **Goals** :
   - Inscriptions : X/semaine (cible : 15 pendant Beta)
   - Activations : Y/semaine (cible : 5 pendant Beta)

---

## ✅ Checklist de Validation

Avant le lancement Beta (Dec 10) :

- [ ] Compte Sentry créé et projet `casskai-production` configuré
- [ ] DSN Sentry ajouté à `.env.production`
- [ ] Erreur test capturée avec succès dans Sentry
- [ ] Alertes Slack configurées pour erreurs critiques
- [ ] Notifications email activées (tech@casskai.com)
- [ ] Compte Plausible créé et domaine `casskai.fr` ajouté
- [ ] Script Plausible vérifié dans index.html
- [ ] Première pageview capturée dans Plausible
- [ ] Goals configurés (Inscription, Login, Activation)
- [ ] Rapport email hebdomadaire activé
- [ ] UptimeRobot configuré avec monitoring 5min
- [ ] Alertes downtime testées

---

## 🚀 Commandes de Déploiement

### Build production avec Sentry

```bash
# Build avec sourcemaps pour Sentry (meilleur debug)
npm run build:production

# Vérifier que VITE_SENTRY_DSN est chargé
echo $env:VITE_SENTRY_DSN  # PowerShell
```

### Variables d'environnement requises

Créer `.env.production` :

```bash
# Supabase
VITE_SUPABASE_URL=https://smtdtgrymuzwvctattmx.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key

# Sentry
VITE_SENTRY_DSN=https://votre-dsn@sentry.io/project-id
VITE_APP_ENV=production

# Plausible (optionnel si events custom)
VITE_PLAUSIBLE_DOMAIN=casskai.fr
```

---

## 🆘 Troubleshooting

### Sentry n'enregistre pas les erreurs

**Causes possibles** :

1. ❌ DSN non configuré → Vérifier `.env.production`
2. ❌ Mode dev actif → Sentry ne s'active qu'en `import.meta.env.PROD`
3. ❌ Erreurs filtrées → Vérifier `beforeSend` dans `main.tsx`
4. ❌ Adblocker bloque Sentry → Tester en navigation privée

**Solution** : Vérifier dans la console du navigateur :

```
✅ Sentry initialized for error tracking
```

Si absent, le DSN n'est pas chargé.

### Plausible n'enregistre pas les visites

**Causes possibles** :

1. ❌ Script bloqué par adblocker → Utiliser proxy (voir docs Plausible)
2. ❌ Domaine incorrect → Doit être `casskai.fr` (sans https)
3. ❌ Script chargé trop tard → Déjà avec `defer`, vérifier Network tab

**Solution** : Ouvrir DevTools → Network → Chercher `script.js` de Plausible

### Alertes Slack ne fonctionnent pas

**Causes possibles** :

1. ❌ Webhook expiré → Régénérer dans Slack
2. ❌ Règle mal configurée → Vérifier seuil (10 errors en 5min ?)
3. ❌ Notifications désactivées → Vérifier Settings → Notifications

---

## 📚 Ressources

- [Documentation Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Plausible Analytics Docs](https://plausible.io/docs)
- [UptimeRobot API](https://uptimerobot.com/api/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)

---

## 🔐 Sécurité & RGPD

### Sentry

- ✅ **RGPD-compliant** : Données anonymisées par défaut
- ✅ **Masking** : `maskAllText: true` dans session replay
- ✅ **Localisation** : Choisir EU data center (Settings → Data Privacy)

### Plausible

- ✅ **RGPD-compliant par design** : Pas de cookies, IP anonymisées
- ✅ **Open-source** : Code auditable
- ✅ **EU-hosted** : Serveurs en Allemagne

---

**Prochaines étapes** : Task #9 - Support Client (Crisp.chat + FAQ)

**Date de finalisation** : 24 novembre 2025
**Auteur** : GitHub Copilot pour CassKai
