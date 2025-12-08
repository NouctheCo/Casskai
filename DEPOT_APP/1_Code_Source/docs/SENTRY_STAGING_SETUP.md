# 🔍 Configuration Sentry Staging - Beta Testing

## 📋 Vue d'ensemble

Ce guide explique comment configurer un projet Sentry dédié pour l'environnement staging (beta testing).

---

## 🎯 Pourquoi un projet Sentry séparé ?

**Avantages** :
- ✅ Isolation des erreurs beta (pas de pollution du monitoring production)
- ✅ Sampling 100% pour capturer tous les bugs
- ✅ Session replays intensifs pour comprendre le comportement des beta testers
- ✅ Filtrage facile avec tag `beta_testing=true`
- ✅ Alertes dédiées à l'équipe beta

---

## 🚀 Étape 1 : Créer un projet Sentry Staging

### Via l'interface Sentry

1. Aller sur https://sentry.io
2. Cliquer sur **Projects** dans le menu
3. Cliquer sur **Create Project**
4. Configurer :
   - **Platform** : React
   - **Project name** : `casskai-staging` ou `casskai-beta`
   - **Team** : [Votre équipe]
   - **Alert Frequency** : On every new issue
5. Cliquer **Create Project**

### Récupérer le DSN

Après création, récupérer le **DSN** (Data Source Name) :
```
https://xxxxxxxxxxxxx@o1234567.ingest.sentry.io/9876543
```

Ce DSN est à mettre dans `.env.staging` :
```bash
VITE_SENTRY_DSN=https://xxxxxxxxxxxxx@o1234567.ingest.sentry.io/9876543
VITE_SENTRY_ENVIRONMENT=staging
```

---

## ⚙️ Étape 2 : Configuration dans .env.staging

Le fichier `.env.staging` est déjà préconfiguré avec les bonnes variables :

```bash
# Sentry Staging (monitoring beta testers)
VITE_SENTRY_DSN=https://your-staging-sentry-dsn@sentry.io  # ← Remplacer par votre DSN
VITE_SENTRY_ENVIRONMENT=staging
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0                          # 100% des traces
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=1.0                 # 100% des sessions enregistrées
```

**À modifier** :
- `VITE_SENTRY_DSN` : Remplacer par le DSN récupéré à l'étape 1

---

## 🎛️ Étape 3 : Configurer les options du projet Sentry

### Performance Monitoring

**Dans Sentry > Settings > Performance** :
- ✅ Activer Performance Monitoring
- Sampling rate : **100%** (pour beta)
- Transaction timeout : 60s

### Session Replay

**Dans Sentry > Settings > Session Replay** :
- ✅ Activer Session Replay
- Sampling rate : **100%** (pour beta)
- Privacy :
  - ☑️ Mask all text : **No** (on veut voir les bugs)
  - ☑️ Block all media : **No**
  - ⚠️ Attention : Expliquer aux beta testers que les sessions sont enregistrées

### Alertes

**Créer des alertes dédiées beta** :

1. **Alert Rule 1 : New Issue**
   - Trigger : When a new issue is created
   - Conditions : Environment = staging
   - Actions : Send email to beta@casskai.app

2. **Alert Rule 2 : High Error Rate**
   - Trigger : When error rate > 5% over 1 hour
   - Conditions : Environment = staging
   - Actions : Send Slack notification + Email

3. **Alert Rule 3 : Critical Bug**
   - Trigger : When issue has tag `priority=critical`
   - Conditions : Environment = staging
   - Actions : Send SMS + Email urgent

### Notifications

**Dans Sentry > Settings > Notifications** :
- ✅ Email notifications pour :
  - Nouvelle issue
  - Issue résolu
  - Release deployed
- ✅ Slack integration (optionnel) :
  - Webhook : [Votre webhook Slack]
  - Canal : `#casskai-beta`

---

## 🏷️ Étape 4 : Tags et contexte automatiques

Le code CassKai est déjà configuré pour ajouter automatiquement des tags :

**Dans `src/lib/sentry.ts`** :
```typescript
// Tag beta testers pour filtering
if (isBeta) {
  Sentry.setTag('beta_testing', true);
  Sentry.setTag('environment_type', 'staging');
}
```

**Tags ajoutés automatiquement** :
- `beta_testing=true` : Identifie les erreurs beta
- `environment_type=staging` : Distingue staging de production
- `user_id` : ID utilisateur (via `setSentryUser()`)

**Exemple de filtrage dans Sentry** :
```
beta_testing:true environment:staging
```

---

## 📊 Étape 5 : Dashboard Beta Testing

Créer un dashboard Sentry dédié au beta testing :

### Via l'interface Sentry

1. Aller sur **Dashboards**
2. Cliquer **Create Dashboard**
3. Nommer : "Beta Testing - Phase 3"
4. Ajouter les widgets suivants :

#### Widget 1 : Total Errors (Beta)
- Type : Number
- Query : `event.type:error environment:staging`
- Time range : Last 7 days

#### Widget 2 : Error Rate (Beta)
- Type : Line Chart
- Query : `event.type:error environment:staging`
- Group by : Hour

#### Widget 3 : Top Issues (Beta)
- Type : Table
- Query : `event.type:error environment:staging`
- Columns : Issue, Count, Last seen
- Sort by : Count descending
- Limit : 10

#### Widget 4 : Errors by Browser
- Type : Pie Chart
- Query : `event.type:error environment:staging`
- Group by : browser.name

#### Widget 5 : Errors by Beta Tester
- Type : Table
- Query : `event.type:error environment:staging`
- Group by : user.id
- Columns : User, Count

#### Widget 6 : Session Replays (Most Watched)
- Type : Table
- Query : `event.type:replay environment:staging`
- Sort by : Replay count

---

## 🔍 Étape 6 : Utilisation pendant le Beta

### Monitoring quotidien

**Checklist quotidienne** :
- [ ] Vérifier le dashboard Beta Testing
- [ ] Trier les nouvelles issues (P0/P1/P2/P3)
- [ ] Regarder les replays des sessions avec erreurs
- [ ] Répondre aux beta testers ayant rencontré des bugs
- [ ] Fixer les bugs critiques sous 24h

### Analyse d'une erreur

1. **Ouvrir l'issue dans Sentry**
2. **Regarder le stack trace** : Identifier la ligne de code
3. **Consulter le Replay** : Comprendre ce que faisait l'utilisateur
4. **Lire les breadcrumbs** : Actions avant l'erreur
5. **Vérifier le contexte** :
   - Browser version
   - Device
   - Network conditions
6. **Contacter le beta tester** : Demander plus de détails si besoin

### Communiquer avec les beta testers

**Template email de suivi** :
```
Bonjour [Prénom],

Nous avons identifié un bug que vous avez rencontré sur [Page] :
[Description du bug]

Nous sommes en train de le corriger. Il sera résolu sous 24-48h.

Merci pour votre patience et votre participation ! 🙏

L'équipe CassKai
```

---

## 📈 Étape 7 : Métriques Beta Testing

### KPIs à suivre dans Sentry

| Métrique | Objectif | Seuil d'alerte |
|----------|----------|----------------|
| **Error Rate** | < 1% | > 5% |
| **Issues critiques** | 0 | > 3 |
| **Temps de résolution** | < 24h | > 48h |
| **Session Replays avec erreur** | < 10% | > 20% |
| **Browser compatibility** | 95%+ | < 90% |

### Export des données (fin de beta)

Pour créer le rapport Phase 3 :

1. **Export Issues** :
   - Aller sur **Issues**
   - Filtrer : `environment:staging created:>=2025-10-13`
   - Exporter en CSV

2. **Export Stats** :
   - Dashboard > Export to PDF
   - Ou screenshots pour le rapport

---

## 🔒 Étape 8 : Privacy & RGPD

### Données collectées

**Ce qui EST collecté** :
- Stack traces (code source)
- User actions (clicks, navigation)
- Browser/Device info
- Session replays (vidéos de l'écran)

**Ce qui N'EST PAS collecté** :
- Mots de passe
- Tokens d'authentification
- Données bancaires
- Informations sensibles (maskées)

### Informer les beta testers

**Dans le Guide Beta Tester** (déjà inclus) :
```
⚠️ Sessions enregistrées

Pour mieux comprendre les bugs, nous enregistrons vos sessions
(vidéos de votre écran). Évitez de saisir des données ultra-sensibles
pendant le beta testing.

Vos données sont sécurisées et supprimées après le beta.
```

**Consentement** :
- Accepté lors de l'inscription au beta (formulaire Google)
- Mentionné dans l'email de bienvenue

---

## 🧹 Étape 9 : Nettoyage post-beta

Une fois le beta terminé (après 2 semaines) :

1. **Archiver les issues résolues**
2. **Exporter les stats finales**
3. **Supprimer les session replays** (RGPD)
4. **Désactiver le projet Sentry Staging** (ou le réutiliser pour la prochaine phase)
5. **Créer le rapport final** avec les métriques

### Commande pour nettoyer

**Via API Sentry** (optionnel) :
```bash
# Supprimer les replays de plus de 30 jours
curl -X DELETE https://sentry.io/api/0/projects/casskai/casskai-staging/replays/ \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## 📚 Ressources

### Documentation Sentry
- Getting Started : https://docs.sentry.io/platforms/javascript/guides/react/
- Session Replay : https://docs.sentry.io/product/session-replay/
- Performance Monitoring : https://docs.sentry.io/product/performance/

### Support
- Sentry Support : support@sentry.io
- CassKai Beta : beta@casskai.app

---

## ✅ Checklist de configuration

- [ ] Créer projet Sentry Staging
- [ ] Récupérer DSN et mettre dans `.env.staging`
- [ ] Activer Performance Monitoring (100%)
- [ ] Activer Session Replay (100%)
- [ ] Configurer alertes (New Issue, High Error Rate)
- [ ] Créer dashboard Beta Testing
- [ ] Intégrer Slack (optionnel)
- [ ] Tester en local avec `VITE_APP_ENV=staging npm run dev`
- [ ] Déployer sur staging et vérifier que Sentry reçoit les événements
- [ ] Documenter le process pour l'équipe

---

**Créé le** : 5 Octobre 2025
**Phase** : 3 - Beta Testing
**Responsable** : [Votre nom]
