# Implémentation Outlook OAuth - COMPLÈTE

**Date**: 2026-01-09
**Statut**: ✅ **IMPLÉMENTATION TERMINÉE** (Build réussi)
**Impact**: 🟢 **NOUVELLE FONCTIONNALITÉ** - Support Outlook/Microsoft 365 OAuth pour l'envoi d'emails

---

## 📋 Résumé Exécutif

Implémentation complète de l'authentification OAuth avec Microsoft (Outlook, Hotmail, Microsoft 365) pour l'envoi d'emails depuis CassKai.

**Fonctionnalités ajoutées:**
- ✅ Bouton "Se connecter avec Outlook" dans les paramètres
- ✅ Flow OAuth complet (start → callback → send)
- ✅ Refresh automatique des tokens expirés
- ✅ Stockage sécurisé des tokens en base de données
- ✅ Support des pièces jointes
- ✅ Interface UI cohérente avec Gmail
- ✅ Gestion des erreurs spécifiques

---

## 🏗️ Architecture Implémentée

### 1. Edge Functions Supabase (Deno)

#### a) `outlook-oauth-start`
**Fichier**: `supabase/functions/outlook-oauth-start/index.ts`

**Rôle**: Génère l'URL d'autorisation Microsoft OAuth2

**Fonctionnalités**:
- ✅ Vérification de l'authentification Supabase
- ✅ Création d'un state encodé avec companyId, userId, redirectUrl
- ✅ Génération de l'URL d'autorisation Microsoft
- ✅ Scopes: `Mail.Send`, `User.Read`, `offline_access`
- ✅ Gestion CORS

**Endpoint**: `POST /functions/v1/outlook-oauth-start`

**Body**:
```json
{
  "companyId": "uuid",
  "redirectUrl": "https://casskai.app/settings"
}
```

**Response**:
```json
{
  "authUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?..."
}
```

#### b) `outlook-oauth-callback`
**Fichier**: `supabase/functions/outlook-oauth-callback/index.ts`

**Rôle**: Reçoit le code OAuth, l'échange contre des tokens, stocke en DB

**Fonctionnalités**:
- ✅ Validation du state (timeout 10 minutes)
- ✅ Échange code → access_token + refresh_token
- ✅ Récupération des infos utilisateur via Microsoft Graph API
- ✅ Stockage dans `email_oauth_tokens`
- ✅ Mise à jour de `email_configurations`
- ✅ Redirection vers l'app avec status de succès/erreur

**Endpoint**: `GET /functions/v1/outlook-oauth-callback?code=xxx&state=xxx`

**Redirections**:
- Succès: `https://casskai.app/settings?outlook_success=true&outlook_email=user@outlook.com`
- Erreur: `https://casskai.app/settings?outlook_error=message`

#### c) `outlook-send`
**Fichier**: `supabase/functions/outlook-send/index.ts`

**Rôle**: Envoie un email via Microsoft Graph API

**Fonctionnalités**:
- ✅ Vérification de l'authentification Supabase
- ✅ Récupération des tokens depuis `email_oauth_tokens`
- ✅ Refresh automatique du token si expiré
- ✅ Envoi via Microsoft Graph API `/me/sendMail`
- ✅ Support des pièces jointes (attachments base64)
- ✅ Gestion des erreurs spécifiques

**Endpoint**: `POST /functions/v1/outlook-send`

**Body**:
```json
{
  "companyId": "uuid",
  "to": "recipient@example.com",
  "subject": "Sujet",
  "html": "<p>Contenu HTML</p>",
  "attachments": [
    {
      "filename": "document.pdf",
      "type": "application/pdf",
      "content": "base64..."
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "from": "sender@outlook.com"
}
```

**Codes d'erreur**:
- `OUTLOOK_NOT_CONNECTED` - Outlook non configuré
- `OUTLOOK_SESSION_EXPIRED` - Session expirée, reconnexion requise

---

### 2. Frontend React

#### a) EmailConfigurationSettings.tsx
**Fichier**: `src/components/settings/EmailConfigurationSettings.tsx`

**Modifications apportées**:

**États ajoutés** (lignes 42-45):
```typescript
const [outlookConnected, setOutlookConnected] = useState(false);
const [outlookEmail, setOutlookEmail] = useState('');
const [outlookConnecting, setOutlookConnecting] = useState(false);
```

**useEffect modifié** (lignes 46-85):
- ✅ Appel de `checkOutlookConnection()` au chargement
- ✅ Gestion des paramètres URL `outlook_success` et `outlook_error`
- ✅ Toast de confirmation/erreur
- ✅ Nettoyage de l'URL après callback

**Fonctions ajoutées**:

**checkOutlookConnection** (lignes 209-226):
```typescript
const checkOutlookConnection = async () => {
  const { data, error } = await supabase
    .from('email_oauth_tokens')
    .select('email, is_active')
    .eq('company_id', currentCompany!.id)
    .eq('provider', 'outlook')
    .eq('is_active', true)
    .single();

  if (!error && data) {
    setOutlookConnected(true);
    setOutlookEmail(data.email);
  }
};
```

**handleConnectOutlook** (lignes 228-263):
```typescript
const handleConnectOutlook = async () => {
  setOutlookConnecting(true);
  const { data: { session } } = await supabase.auth.getSession();

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${SUPABASE_URL}/functions/v1/outlook-oauth-start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      companyId: currentCompany!.id,
      redirectUrl: window.location.origin + '/settings'
    })
  });

  const { authUrl } = await response.json();
  window.location.href = authUrl; // Redirect to Microsoft OAuth
};
```

**handleDisconnectOutlook** (lignes 265-281):
```typescript
const handleDisconnectOutlook = async () => {
  await supabase
    .from('email_oauth_tokens')
    .update({ is_active: false })
    .eq('company_id', currentCompany!.id)
    .eq('provider', 'outlook');

  setOutlookConnected(false);
  setOutlookEmail('');
  toast.success('✅ Outlook déconnecté');
  loadConfigurations();
};
```

**UI Outlook Card** (lignes 387-457):
```tsx
<Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/10 dark:to-gray-900">
  <CardHeader>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
        <Mail className="h-6 w-6 text-purple-600" />
      </div>
      <div>
        <CardTitle className="text-xl">Connexion Outlook / Microsoft 365</CardTitle>
        <CardDescription>
          Envoyez des emails depuis votre compte Outlook, Hotmail ou Microsoft 365
        </CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex flex-wrap gap-2 mb-4">
      <Badge variant="outline">✅ Configuration simplifiée</Badge>
      <Badge variant="outline">✅ Haute délivrabilité</Badge>
      <Badge variant="outline">✅ Support Microsoft 365</Badge>
      <Badge variant="outline">✅ Tokens sécurisés</Badge>
    </div>

    {outlookConnected ? (
      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">Outlook connecté</p>
            <p className="text-sm text-green-700 dark:text-green-300">{outlookEmail}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleDisconnectOutlook}>
          Déconnecter
        </Button>
      </div>
    ) : (
      <Button
        onClick={handleConnectOutlook}
        disabled={outlookConnecting}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        size="lg"
      >
        {outlookConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Connexion en cours...
          </>
        ) : (
          <>
            <Mail className="w-5 h-5 mr-2" />
            Se connecter avec Outlook
          </>
        )}
      </Button>
    )}
  </CardContent>
</Card>
```

#### b) emailService.ts
**Fichier**: `src/services/emailService.ts`

**Modifications apportées**:

**Switch case modifié** (ligne 334):
```typescript
case 'outlook_oauth':
  return this.sendViaOutlookOAuth(config, params);
```

**Nouvelle méthode sendViaOutlookOAuth** (lignes 425-500):
```typescript
private async sendViaOutlookOAuth(
  config: EmailConfiguration,
  params: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: any[];
  }
): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: companyData } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${SUPABASE_URL}/functions/v1/outlook-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        companyId: companyData.id,
        to: Array.isArray(params.to) ? params.to[0] : params.to,
        subject: params.subject,
        html: params.html || params.text || '',
        attachments: params.attachments
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

      if (errorData.code === 'OUTLOOK_NOT_CONNECTED') {
        throw new Error('Outlook non connecté. Veuillez vous reconnecter dans les paramètres.');
      }
      if (errorData.code === 'OUTLOOK_SESSION_EXPIRED') {
        throw new Error('Session Outlook expirée. Veuillez vous reconnecter.');
      }

      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    logger.info('Email', `Outlook email sent successfully from: ${data.from}`);
    return data?.success || false;
  } catch (error) {
    logger.error('Email', 'Outlook send exception:', error);
    return false;
  }
}
```

---

## 🗄️ Base de Données

### Tables Requises

#### 1. `email_oauth_tokens`
```sql
CREATE TABLE email_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider)
);

CREATE INDEX idx_email_oauth_tokens_company_provider ON email_oauth_tokens(company_id, provider);
CREATE INDEX idx_email_oauth_tokens_active ON email_oauth_tokens(is_active);
```

#### 2. `email_configurations`
```sql
CREATE TABLE email_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('smtp', 'gmail_oauth', 'outlook_oauth', 'sendgrid')),
  from_email text NOT NULL,
  from_name text,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  smtp_password text,
  email_signature text,
  daily_limit integer DEFAULT 500,
  monthly_limit integer DEFAULT 10000,
  emails_sent_today integer DEFAULT 0,
  emails_sent_month integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider)
);

CREATE INDEX idx_email_configurations_company ON email_configurations(company_id);
CREATE INDEX idx_email_configurations_active ON email_configurations(is_active);
```

---

## ⚙️ Configuration Requise

### Variables d'Environnement Supabase

À configurer dans le Dashboard Supabase → Project Settings → Edge Functions → Secrets:

```bash
MICROSOFT_CLIENT_ID=votre_client_id_azure_ad
MICROSOFT_CLIENT_SECRET=votre_client_secret_azure_ad
APP_URL=https://casskai.app
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Configuration Azure AD

1. **Créer une application Azure AD**:
   - Aller sur https://portal.azure.com
   - Azure Active Directory → App registrations → New registration
   - Nom: "CassKai Email Integration"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"

2. **Configurer les Redirect URIs**:
   - Platform: Web
   - Redirect URI: `https://votre-projet.supabase.co/functions/v1/outlook-oauth-callback`

3. **Configurer les API Permissions**:
   - Microsoft Graph → Delegated permissions:
     - `Mail.Send` (Envoyer des emails)
     - `User.Read` (Lire le profil utilisateur)
     - `offline_access` (Refresh token)
   - Grant admin consent

4. **Créer un Client Secret**:
   - Certificates & secrets → New client secret
   - Copier la valeur (visible une seule fois!)

5. **Copier les IDs**:
   - Application (client) ID → `MICROSOFT_CLIENT_ID`
   - Client secret value → `MICROSOFT_CLIENT_SECRET`

---

## 🚀 Déploiement

### 1. Déployer les Edge Functions

```bash
# Déployer toutes les fonctions Outlook
supabase functions deploy outlook-oauth-start
supabase functions deploy outlook-oauth-callback
supabase functions deploy outlook-send

# Vérifier le déploiement
supabase functions list
```

### 2. Créer les Tables

```sql
-- Exécuter dans Supabase SQL Editor
-- (voir section Base de Données ci-dessus)
```

### 3. Configurer les Secrets

```bash
# Via CLI
supabase secrets set MICROSOFT_CLIENT_ID=xxx
supabase secrets set MICROSOFT_CLIENT_SECRET=xxx
supabase secrets set APP_URL=https://casskai.app

# Ou via Dashboard
# Project Settings → Edge Functions → Secrets
```

### 4. Build et Deploy Frontend

```bash
npm run build
.\deploy-vps.ps1 -SkipBuild
```

---

## 🧪 Tests

### Test 1: Connexion Outlook

1. Aller sur https://casskai.app/settings
2. Cliquer sur "Se connecter avec Outlook"
3. **Vérifier**: Redirection vers Microsoft OAuth
4. Autoriser l'accès
5. **Vérifier**: Retour vers l'app avec toast "Outlook connecté"
6. **Vérifier**: Carte affiche "Outlook connecté : email@outlook.com"

### Test 2: Envoi d'Email via Outlook

```typescript
// Dans InvoicingPage.tsx par exemple
const handleSendInvoice = async () => {
  await emailService.sendEmail(companyId, {
    to: 'client@example.com',
    subject: 'Facture F-2026-001',
    html: '<p>Votre facture en pièce jointe</p>',
    attachments: [
      {
        filename: 'facture.pdf',
        type: 'application/pdf',
        content: pdfBase64
      }
    ]
  });
};
```

**Vérifier**:
- ✅ Email envoyé depuis l'adresse Outlook connectée
- ✅ Email reçu avec pièce jointe
- ✅ Email dans "Éléments envoyés" Outlook

### Test 3: Refresh Token Automatique

1. Attendre expiration du token (1 heure par défaut)
2. Envoyer un email
3. **Vérifier**: Pas d'erreur, email envoyé
4. **Vérifier logs**: "Token expired, refreshing..."

### Test 4: Déconnexion

1. Cliquer sur "Déconnecter"
2. **Vérifier**: Toast "Outlook déconnecté"
3. **Vérifier**: Bouton "Se connecter avec Outlook" affiché
4. Essayer d'envoyer un email
5. **Vérifier erreur**: "Outlook non connecté"

---

## 📊 Fichiers Modifiés/Créés

### Créés:
- ✅ `supabase/functions/outlook-oauth-start/index.ts` (70 lignes)
- ✅ `supabase/functions/outlook-oauth-callback/index.ts` (120 lignes)
- ✅ `supabase/functions/outlook-send/index.ts` (180 lignes)

### Modifiés:
- ✅ `src/components/settings/EmailConfigurationSettings.tsx` (+120 lignes)
  - Lignes 42-45: États Outlook
  - Lignes 46-85: useEffect avec callbacks Outlook
  - Lignes 209-281: Fonctions Outlook
  - Lignes 387-457: Carte UI Outlook
- ✅ `src/services/emailService.ts` (+77 lignes)
  - Ligne 334: Case `outlook_oauth`
  - Lignes 425-500: Méthode `sendViaOutlookOAuth`

---

## ✅ Checklist Complète

### Backend (Edge Functions)
- [x] Créer `outlook-oauth-start`
- [x] Créer `outlook-oauth-callback`
- [x] Créer `outlook-send`
- [x] Gestion refresh token automatique
- [x] Gestion erreurs spécifiques
- [ ] Déployer sur Supabase (à faire par l'utilisateur)

### Frontend
- [x] Ajouter états Outlook (connected, email, connecting)
- [x] Fonction `checkOutlookConnection()`
- [x] Fonction `handleConnectOutlook()`
- [x] Fonction `handleDisconnectOutlook()`
- [x] Carte UI Outlook (design purple)
- [x] Gestion callbacks URL (success/error)
- [x] Toast notifications
- [x] Support dans `emailService.sendViaOutlookOAuth()`

### Base de Données
- [ ] Créer table `email_oauth_tokens` (SQL fourni)
- [ ] Créer table `email_configurations` (SQL fourni)
- [ ] Créer indexes (SQL fourni)

### Configuration
- [ ] Configurer Azure AD Application
- [ ] Ajouter Redirect URI
- [ ] Configurer API Permissions
- [ ] Créer Client Secret
- [ ] Ajouter secrets Supabase

### Tests
- [ ] Test connexion Outlook
- [ ] Test envoi email
- [ ] Test refresh token
- [ ] Test déconnexion
- [ ] Test gestion erreurs

### Build & Deploy
- [x] Build frontend réussi
- [ ] Déployer frontend (à faire)
- [ ] Déployer Edge Functions (à faire)
- [ ] Tester en production (à faire)

---

## 🎯 Résultat Final

**Fonctionnalité complète d'intégration Outlook OAuth** prête à être déployée:

✅ **3 Edge Functions** créées et prêtes à déployer
✅ **UI complète** avec bouton de connexion et statut
✅ **Service email** étendu avec support Outlook
✅ **Gestion automatique** des tokens et refresh
✅ **Gestion d'erreurs** robuste avec codes spécifiques
✅ **Build production** réussi sans erreurs

**L'implémentation est identique au flow Gmail** pour garantir la cohérence UX.

**Prochaine étape**: Déployer les Edge Functions et configurer Azure AD pour activer la fonctionnalité en production! 🚀

---

**Date de complétion**: 2026-01-09
**Version**: Build production avec Outlook OAuth
**Status**: IMPLÉMENTATION TERMINÉE - PRÊT POUR DÉPLOIEMENT
