# Gmail OAuth - Implémentation Complète

## 📋 Résumé

Implémentation complète du flux OAuth2 Gmail permettant aux utilisateurs d'envoyer des emails directement depuis leur compte Gmail via l'application CassKai.

**Avantages**:
- ✅ Configuration simplifiée (un clic)
- ✅ Haute délivrabilité (emails envoyés depuis Gmail)
- ✅ Pas de limite artificielle (utilise les limites Gmail)
- ✅ Tokens sécurisés avec refresh automatique
- ✅ Gestion automatique de l'expiration des tokens

---

## 🏗️ Architecture

### Composants Créés

#### 1. Edge Functions Supabase

**gmail-oauth-start** ([supabase/functions/gmail-oauth-start/index.ts](supabase/functions/gmail-oauth-start/index.ts))
- **Rôle**: Initie le flux OAuth2
- **Input**: `{ companyId, redirectUrl }`
- **Output**: `{ authUrl }` - URL d'authentification Google
- **Processus**:
  1. Vérifie l'authentification utilisateur
  2. Génère un `state` sécurisé avec timestamp (expiration 10min)
  3. Construit l'URL OAuth Google avec scopes:
     - `gmail.send` - Envoi d'emails
     - `email` - Adresse email
     - `profile` - Informations de profil

**gmail-oauth-callback** ([supabase/functions/gmail-oauth-callback/index.ts](supabase/functions/gmail-oauth-callback/index.ts))
- **Rôle**: Gère le callback OAuth2 de Google
- **Processus**:
  1. Reçoit le code d'autorisation
  2. Vérifie et décrypte le `state`
  3. Échange le code contre les tokens (access + refresh)
  4. Récupère les infos utilisateur Google
  5. Stocke les tokens dans `email_oauth_tokens` (UPSERT)
  6. Crée/met à jour la config email avec `provider: 'gmail_oauth'`
  7. Redirige vers l'app avec succès ou erreur

**gmail-send** ([supabase/functions/gmail-send/index.ts](supabase/functions/gmail-send/index.ts))
- **Rôle**: Envoie les emails via Gmail API
- **Input**: `{ companyId, to, subject, html, attachments }`
- **Output**: `{ success, messageId, from }`
- **Fonctionnalités**:
  - ✅ Vérifie l'expiration du token avant chaque envoi
  - ✅ Refresh automatique du token si expiré
  - ✅ Mise à jour en base du nouveau token
  - ✅ Désactive le token si le refresh échoue
  - ✅ Construction email RFC 2822 (MIME multipart pour attachments)
  - ✅ Envoi via Gmail API v1
- **Codes d'erreur**:
  - `GMAIL_NOT_CONNECTED` (400) - Pas de token OAuth
  - `GMAIL_SESSION_EXPIRED` (401) - Refresh token invalide, reconnexion requise

#### 2. Frontend Components

**EmailConfigurationSettings.tsx** ([src/components/settings/EmailConfigurationSettings.tsx](src/components/settings/EmailConfigurationSettings.tsx))

**Nouvelles fonctionnalités ajoutées**:

1. **État Gmail OAuth**:
```typescript
const [gmailConnected, setGmailConnected] = useState(false);
const [gmailEmail, setGmailEmail] = useState('');
const [gmailConnecting, setGmailConnecting] = useState(false);
```

2. **Fonctions de gestion**:
   - `checkGmailConnection()` - Vérifie si Gmail est connecté au chargement
   - `handleConnectGmail()` - Initie le flux OAuth (appelle `gmail-oauth-start`)
   - `handleDisconnectGmail()` - Désactive le token Gmail

3. **Gestion du callback OAuth**:
```typescript
// Check URL params for OAuth callback
const params = new URLSearchParams(window.location.search);
if (params.get('gmail_success') === 'true') {
  const email = params.get('gmail_email');
  setGmailConnected(true);
  setGmailEmail(email || '');
  toast.success(`✅ Gmail connecté: ${email}`);
  window.history.replaceState({}, '', window.location.pathname);
}
```

4. **UI Gmail OAuth Card**:
   - Affichage proéminent avec badges de fonctionnalités
   - État connecté: Email affiché + bouton "Déconnecter"
   - État non connecté: Bouton "Se connecter avec Gmail"
   - Loading state pendant la connexion

#### 3. Email Service

**emailService.ts** ([src/services/emailService.ts](src/services/emailService.ts))

**Modification du router**:
```typescript
private async sendEmailDirect(config: EmailConfiguration, params): Promise<boolean> {
  switch (config.provider) {
    case 'gmail_oauth':
      return this.sendViaGmailOAuth(config, params);
    case 'smtp':
      return this.sendViaSMTP(config, params);
    // ... autres providers
  }
}
```

**Nouvelle méthode `sendViaGmailOAuth()`**:
- Récupère la session utilisateur
- Récupère le company_id
- Appelle `gmail-send` Edge Function via `fetch` direct
- Gère les erreurs spécifiques Gmail (NOT_CONNECTED, SESSION_EXPIRED)
- Retourne le succès de l'envoi

---

## 🔐 Tables Supabase

### `email_oauth_tokens`

```sql
CREATE TABLE email_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  provider TEXT NOT NULL,  -- 'gmail'
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, provider)
);

CREATE INDEX idx_email_oauth_tokens_company ON email_oauth_tokens(company_id);
CREATE INDEX idx_email_oauth_tokens_provider ON email_oauth_tokens(provider);
```

### `email_configurations`

```sql
-- Ajout du provider 'gmail_oauth'
ALTER TABLE email_configurations
  ADD CONSTRAINT email_configurations_provider_check
  CHECK (provider IN ('smtp', 'sendgrid', 'mailgun', 'aws_ses', 'gmail_oauth'));
```

---

## 🔄 Flux Complet

```
┌─────────────────────────────────────────────────────────┐
│ 1. CONNEXION INITIALE                                    │
│    User clicks "Se connecter avec Gmail"                │
│    Frontend → gmail-oauth-start                          │
│    Returns: Google OAuth URL                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. AUTHENTIFICATION GOOGLE                               │
│    User redirected to Google consent screen             │
│    User grants permissions (gmail.send, email, profile) │
│    Google → gmail-oauth-callback with auth code         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. STOCKAGE DES TOKENS                                   │
│    gmail-oauth-callback:                                │
│    - Exchanges code for tokens                          │
│    - Stores in email_oauth_tokens (UPSERT)              │
│    - Creates email_configurations entry                 │
│    - Redirects to /settings with success param          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. ENVOI D'EMAIL                                         │
│    User triggers email send (invoice, automation, etc.) │
│    emailService.sendEmail()                             │
│    - Detects gmail_oauth provider                       │
│    - Calls sendViaGmailOAuth()                          │
│    Frontend → gmail-send                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. GESTION AUTOMATIQUE DES TOKENS                        │
│    gmail-send Edge Function:                            │
│    - Checks token expiry                                │
│    - If expired: refreshes token automatically          │
│    - Updates email_oauth_tokens with new token          │
│    - If refresh fails: marks token as inactive          │
│    - Sends email via Gmail API                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Tests à Effectuer

### 1. Test Connexion Gmail
```bash
1. Aller dans Paramètres > Configuration Email
2. Cliquer sur "Se connecter avec Gmail"
3. Autoriser l'accès sur la page Google
4. Vérifier la redirection vers /settings avec succès
5. Vérifier que l'email Gmail est affiché
```

**Résultat attendu**: ✅ "Gmail connecté: user@gmail.com"

### 2. Test Envoi Email
```bash
1. Créer une facture
2. Envoyer par email au client
3. Vérifier que l'email part depuis Gmail
4. Vérifier la réception chez le client
```

**Résultat attendu**: ✅ Email envoyé depuis le compte Gmail connecté

### 3. Test Refresh Token
```bash
1. Attendre 1h (expiration du access_token)
2. Envoyer un email
3. Vérifier que l'envoi fonctionne (refresh automatique)
4. Vérifier dans Supabase que token_expiry est mis à jour
```

**Résultat attendu**: ✅ Email envoyé, token refreshé automatiquement

### 4. Test Déconnexion
```bash
1. Cliquer sur "Déconnecter" dans les paramètres
2. Vérifier que is_active = false dans email_oauth_tokens
3. Vérifier que le bouton "Se connecter" réapparaît
```

**Résultat attendu**: ✅ Gmail déconnecté, peut reconnecter

### 5. Test Erreur Session Expirée
```bash
1. Dans Supabase, supprimer le refresh_token
2. Attendre l'expiration du access_token
3. Essayer d'envoyer un email
4. Vérifier l'erreur "Session Gmail expirée"
```

**Résultat attendu**: ❌ Erreur claire demandant de se reconnecter

---

## 🔐 Variables d'Environnement Supabase

À configurer dans Supabase Dashboard → Project Settings → Edge Functions:

```bash
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_URL=https://casskai.app
```

### Obtenir les identifiants Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un projet (ou utiliser existant)
3. Activer Gmail API
4. Créer des identifiants OAuth 2.0:
   - Type: Application Web
   - URI de redirection autorisés:
     - `https://your-project.supabase.co/functions/v1/gmail-oauth-callback`
     - `http://localhost:54321/functions/v1/gmail-oauth-callback` (dev)

---

## 🚀 Déploiement

### 1. Déployer les Edge Functions

```bash
# Déployer les 3 Edge Functions
supabase functions deploy gmail-oauth-start
supabase functions deploy gmail-oauth-callback
supabase functions deploy gmail-send

# Vérifier le déploiement
supabase functions list
```

### 2. Configurer les Variables d'Environnement

Dans Supabase Dashboard → Project Settings → Edge Functions:
- Ajouter toutes les variables listées ci-dessus

### 3. Créer les Tables

```sql
-- Table pour stocker les tokens OAuth
CREATE TABLE IF NOT EXISTS email_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  provider TEXT NOT NULL,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, provider)
);

CREATE INDEX idx_email_oauth_tokens_company ON email_oauth_tokens(company_id);
CREATE INDEX idx_email_oauth_tokens_provider ON email_oauth_tokens(provider);
```

### 4. Déployer le Frontend

```bash
# Build
npm run build

# Deploy
./deploy-vps.ps1
```

---

## 📊 Monitoring

### Logs des Edge Functions

```bash
# Logs en temps réel
supabase functions logs gmail-oauth-start --follow
supabase functions logs gmail-oauth-callback --follow
supabase functions logs gmail-send --follow
```

### Vérification des Tokens

```sql
-- Vérifier les tokens actifs
SELECT
  company_id,
  email,
  token_expiry,
  is_active,
  created_at
FROM email_oauth_tokens
WHERE is_active = true;

-- Tokens expirés
SELECT *
FROM email_oauth_tokens
WHERE token_expiry < NOW()
  AND is_active = true;
```

---

## 🐛 Troubleshooting

### Erreur: "Failed to start Gmail OAuth"

**Cause**: Edge Function non déployée ou variables manquantes

**Solution**:
1. Vérifier que `gmail-oauth-start` est déployée
2. Vérifier les variables d'environnement Supabase
3. Vérifier les logs: `supabase functions logs gmail-oauth-start`

### Erreur: "Gmail not connected"

**Cause**: Pas de token OAuth en base

**Solution**:
1. Se reconnecter via "Se connecter avec Gmail"
2. Vérifier dans `email_oauth_tokens` que le token existe

### Erreur: "Gmail session expired"

**Cause**: Refresh token invalide ou révoqué

**Solution**:
1. Se reconnecter via "Se connecter avec Gmail"
2. Vérifier que l'utilisateur n'a pas révoqué l'accès dans Google Account

### Erreur CORS

**Cause**: Headers automatiques du SDK Supabase

**Solution**: Déjà implémentée - utilisation de `fetch` direct au lieu de `supabase.functions.invoke()`

---

## 📚 Références

- [Gmail API - Send Messages](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/send)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [RFC 2822 - Email Format](https://tools.ietf.org/html/rfc2822)

---

**Date**: 2026-01-09
**Statut**: ✅ **IMPLÉMENTÉ**
**Impact**: 🟢 **FEATURE** (Amélioration majeure de l'expérience utilisateur)
