# Guide de Configuration de l'API OpenAI pour CassKai

## Problème Identifié

L'assistant IA CassKai affiche le message "Cette fonctionnalité sera bientôt disponible..." car :
1. La clé API OpenAI n'est pas configurée dans Supabase Secrets
2. Le code utilisait une réponse simulée au lieu d'appeler réellement OpenAI

## Solution Appliquée

### 1. Correction du Code ✅

Le fichier `src/components/ai/AIAssistant.tsx` a été modifié pour :
- Importer `openAIService` depuis `@/services/ai/OpenAIService`
- Remplacer la réponse simulée par un appel réel à OpenAI via Edge Function
- Ajouter une gestion d'erreur explicite

### 2. Configuration de la Clé API (À FAIRE PAR L'UTILISATEUR)

**IMPORTANT:** Les Edge Functions Supabase utilisent des variables d'environnement Deno, pas les variables Vite.

La clé `VITE_OPENAI_API_KEY` dans `.env.local` ou `.env.production` **NE FONCTIONNE PAS** pour les Edge Functions.

## Étapes de Configuration

### Option A : Via le Dashboard Supabase (Recommandé)

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet : `smtdtgrymuzwvctattmx`
3. Aller dans **Project Settings** (icône engrenage en bas à gauche)
4. Cliquer sur **Edge Functions** dans le menu latéral
5. Cliquer sur l'onglet **Secrets**
6. Cliquer sur **Add Secret**
7. Remplir :
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-...` (votre clé API OpenAI)
8. Cliquer sur **Save**

### Option B : Via la CLI Supabase

```bash
# Définir le secret
supabase secrets set OPENAI_API_KEY="sk-proj-votre-cle-ici"

# Vérifier que le secret est bien configuré
supabase secrets list
```

### 3. Redéployer l'Edge Function

Après avoir ajouté le secret, il faut redéployer la fonction pour qu'elle prenne en compte la nouvelle variable :

```bash
# Redéployer la fonction ai-assistant
supabase functions deploy ai-assistant
```

**OU** attendre le prochain déploiement global.

## Vérification

### Test 1 : Vérifier que le secret existe

```bash
supabase secrets list
```

Devrait afficher :
```
OPENAI_API_KEY: ************
```

### Test 2 : Tester l'assistant IA

1. Déployer le nouveau code sur le VPS
2. Aller sur https://casskai.app
3. Cliquer sur l'icône de l'assistant IA (en bas à droite)
4. Envoyer un message test : "Bonjour, peux-tu m'aider ?"
5. L'assistant devrait répondre avec une vraie réponse OpenAI

### Messages d'Erreur Possibles

| Message | Cause | Solution |
|---------|-------|----------|
| "Cette fonctionnalité sera bientôt disponible..." | Ancien code déployé | Redéployer avec `deploy-vps.ps1` |
| "Veuillez vérifier que la clé API OpenAI est configurée..." | Secret OPENAI_API_KEY manquant | Ajouter le secret dans Supabase |
| "401 Unauthorized" | Clé API invalide | Vérifier la clé OpenAI |
| "429 Too Many Requests" | Quota OpenAI dépassé | Vérifier le compte OpenAI |

## Architecture

```
┌─────────────────┐
│   AIAssistant   │ (Frontend React)
└────────┬────────┘
         │ openAIService.chat()
         ▼
┌─────────────────┐
│ OpenAIService   │ (src/services/ai/OpenAIService.ts)
└────────┬────────┘
         │ POST /functions/v1/ai-assistant
         ▼
┌─────────────────┐
│  Edge Function  │ (supabase/functions/ai-assistant/index.ts)
│  (Deno Runtime) │
└────────┬────────┘
         │ Deno.env.get('OPENAI_API_KEY')
         ▼
┌─────────────────┐
│ Supabase Secrets│
│  OPENAI_API_KEY │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   OpenAI API    │ (api.openai.com)
│   GPT-4 Turbo   │
└─────────────────┘
```

## Différence entre Variables Vite et Secrets Supabase

### Variables Vite (`.env.local`, `.env.production`)

- **Préfixe obligatoire:** `VITE_*`
- **Utilisation:** Frontend React (code client)
- **Disponibles dans:** `import.meta.env.VITE_*`
- **Build time:** Incluses dans le bundle JavaScript
- **Exemple:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Secrets Supabase

- **Pas de préfixe:** `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, etc.
- **Utilisation:** Edge Functions (code serveur Deno)
- **Disponibles dans:** `Deno.env.get('NOM_SECRET')`
- **Runtime:** Injectées au moment de l'exécution
- **Sécurité:** Jamais exposées au client

## Résumé

1. ✅ **Code corrigé** : `AIAssistant.tsx` utilise maintenant le vrai service OpenAI
2. ⚠️ **Configuration requise** : Ajouter `OPENAI_API_KEY` dans Supabase Secrets
3. ⚠️ **Redéploiement** : Déployer le nouveau code avec `deploy-vps.ps1`
4. ⚠️ **Edge Function** : Redéployer avec `supabase functions deploy ai-assistant` (optionnel)

## Commande Complète

```powershell
# 1. Configurer le secret (via Dashboard ou CLI)
supabase secrets set OPENAI_API_KEY="sk-proj-votre-cle"

# 2. Redéployer l'Edge Function
supabase functions deploy ai-assistant

# 3. Déployer le nouveau frontend
.\deploy-vps.ps1
```

Après ces 3 étapes, l'assistant IA devrait fonctionner ! 🎉
