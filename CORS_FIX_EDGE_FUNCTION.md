# Résolution du problème CORS - Edge Function

**Date**: 12 Octobre 2025  
**Problème**: Erreur CORS lors de l'appel à `create-company-onboarding`  
**Status**: ✅ Corrigé (en attente de déploiement)

---

## 🐛 Erreur constatée

```
Access to fetch at 'https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/create-company-onboarding' 
from origin 'https://casskai.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

---

## 🔍 Cause du problème

L'Edge Function `create-company-onboarding` avait des en-têtes CORS mal configurés :

### ❌ Configuration incorrecte (avant)
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Trop permissif pour les credentials
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })  // Pas de status explicite
  }
```

### Problèmes identifiés :
1. **`Access-Control-Allow-Origin: *`** ne fonctionne pas avec les requêtes qui incluent des credentials
2. Pas de **`Access-Control-Allow-Methods`** spécifié
3. Pas de **`Access-Control-Allow-Credentials`**
4. Réponse OPTIONS sans status explicite (devrait être 200)

---

## ✅ Solution appliquée

### ✅ Configuration correcte (après)
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://casskai.app',  // Origine spécifique
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',  // Méthodes autorisées
  'Access-Control-Allow-Credentials': 'true',  // Autorise les credentials
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200  // Status explicite
    })
  }
```

---

## 🚀 Déploiement de la correction

### Prérequis
- ✅ Supabase CLI installé (version 2.48.3)
- ✅ Connecté au projet Supabase

### Commande de déploiement

#### Option 1 : Script PowerShell (recommandé)
```powershell
.\deploy-edge-function.ps1
```

#### Option 2 : Commande directe
```powershell
supabase functions deploy create-company-onboarding --project-ref smtdtgrymuzwvctattmx
```

### Vérification du déploiement
Après le déploiement, testez l'onboarding d'une nouvelle entreprise pour confirmer que l'erreur CORS n'apparaît plus.

---

## 📋 Checklist de vérification

Après déploiement, vérifiez :

- [ ] La fonction Edge est déployée sur Supabase
- [ ] Aucune erreur CORS dans la console du navigateur
- [ ] L'onboarding d'entreprise fonctionne correctement
- [ ] Les logs Supabase montrent des appels réussis
- [ ] Le Service Worker n'affiche plus d'erreur "Failed to fetch"

---

## 🔧 Debug supplémentaire (si le problème persiste)

### 1. Vérifier que la fonction est bien déployée
```powershell
supabase functions list
```

### 2. Voir les logs en temps réel
```powershell
supabase functions logs create-company-onboarding
```

### 3. Tester la fonction directement
```powershell
curl -i -X POST \
  https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/create-company-onboarding \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"companyData": {...}, "userId": "..."}'
```

### 4. Vérifier les en-têtes CORS avec un preflight
```powershell
curl -i -X OPTIONS \
  https://smtdtgrymuzwvctattmx.supabase.co/functions/v1/create-company-onboarding \
  -H "Origin: https://casskai.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization, content-type"
```

Vous devriez voir dans la réponse :
```
HTTP/2 200
access-control-allow-origin: https://casskai.app
access-control-allow-methods: POST, OPTIONS
access-control-allow-credentials: true
```

---

## 🌐 Alternatives si le problème persiste

### Option A : Ajouter plusieurs origines
Si vous avez plusieurs domaines (dev, staging, prod) :

```typescript
const allowedOrigins = [
  'https://casskai.app',
  'https://www.casskai.app',
  'http://localhost:5173'  // Pour le dev local
]

const origin = req.headers.get('origin') || ''
const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

const corsHeaders = {
  'Access-Control-Allow-Origin': allowOrigin,
  // ... reste des headers
}
```

### Option B : Déplacer la logique côté client
Si les Edge Functions posent trop de problèmes CORS, vous pouvez :
1. Utiliser les RLS policies Supabase à la place
2. Faire les inserts directement depuis le client avec le client Supabase
3. Utiliser les triggers PostgreSQL pour l'orchestration

---

## 📚 Références

- [Supabase CORS Configuration](https://supabase.com/docs/guides/functions/cors)
- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ⚠️ Note importante

L'erreur CORS **n'affecte que le navigateur**. Si vous testez la fonction depuis :
- ✅ Postman → Fonctionne
- ✅ cURL → Fonctionne
- ✅ Backend Node.js → Fonctionne
- ❌ Navigateur web → CORS error (avant correction)

C'est une **mesure de sécurité du navigateur** pour protéger les utilisateurs.

---

**Fichier modifié** : `supabase/functions/create-company-onboarding/index.ts`  
**Script de déploiement** : `deploy-edge-function.ps1`  
**Prochaine étape** : Exécuter `.\deploy-edge-function.ps1`
