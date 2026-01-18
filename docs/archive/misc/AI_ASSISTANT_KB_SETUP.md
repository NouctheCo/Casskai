# Mise en place (débutant) — Base de connaissance IA (Supabase)

Objectif : rendre l’assistant CassKai capable de répondre à la fois :
- sur **l’application** (aide, workflows, explications),
- sur **les données de la société de l’utilisateur** (contexte entreprise, indicateurs, factures, etc.),
- tout en refusant **toute demande** qui chercherait à obtenir des secrets / détails internes (clés, infra, code, RLS, etc.).

Cette mise en place utilise :
- Supabase (Postgres) + extension `vector` (pgvector) pour stocker une base de connaissance.
- Une Edge Function Supabase `ai-assistant` qui fait du **RAG** (recherche sémantique + réponse).
- Un script d’ingestion qui transforme tes fichiers `.md` en "chunks" + embeddings.

---

## 0) Pré-requis

- Supabase CLI installé (c’est déjà le cas)
- Être connecté à la CLI Supabase
- Avoir :
  - le **mot de passe de la base** (Database password)
  - la clé **OpenAI API**
  - la clé **Supabase service_role** (pour l’ingestion)

⚠️ Ne colle jamais ces secrets dans un chat.

---

## 1) Se connecter à Supabase (une fois)

Dans PowerShell :

```powershell
supabase login
```

Si ça affiche “You are now logged in”, c’est OK.

---

## 2) Lier le repo au projet Supabase (prod)

Si `supabase link` échoue avec une erreur de mot de passe Postgres, c’est normal : la CLI a besoin du **Database password**.

1) Dans le Dashboard Supabase:
- Project Settings → Database → Reset database password (si besoin)

2) Dans PowerShell (évite de mettre le mot de passe dans l’historique) :

```powershell
$DbPass = Read-Host "Supabase Database password"
supabase link --project-ref smtdtgrymuzwvctattmx -p $DbPass
```

Résultat attendu : une confirmation que le projet est lié.

---

## 3) Pousser la migration (crée KB + RLS + RPC)

```powershell
supabase db push
```

Cela applique la migration:
- `supabase/migrations/20260115090000_ai_knowledge_base_rag.sql`

---

## 4) Configurer les secrets Edge Functions

Toujours dans PowerShell (sans afficher les secrets dans la commande) :

```powershell
$env:OPENAI_API_KEY = Read-Host "OpenAI API Key"

# Optionnel : tu peux garder ces valeurs par défaut
$env:OPENAI_MODEL = "gpt-4o-mini"
$env:OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"

supabase secrets set \
  OPENAI_API_KEY=$env:OPENAI_API_KEY \
  OPENAI_MODEL=$env:OPENAI_MODEL \
  OPENAI_EMBEDDING_MODEL=$env:OPENAI_EMBEDDING_MODEL
```

⚠️ Si ton projet Supabase utilise déjà des Edge Functions, tu as probablement déjà `SUPABASE_SERVICE_ROLE_KEY` configurée côté Supabase. Si ce n’est pas le cas, ajoute-la aussi via `supabase secrets set`.

---

## 5) Déployer la function `ai-assistant`

```powershell
supabase functions deploy ai-assistant
```

---

## 6) Ingestion des docs “application” (Markdown → KB)

Le script lit tes fichiers `.md` et les injecte dans :
- `kb_documents`
- `kb_chunks`

Dans PowerShell :

```powershell
$env:SUPABASE_URL = "https://smtdtgrymuzwvctattmx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = Read-Host "Supabase service_role key"
$env:OPENAI_API_KEY = Read-Host "OpenAI API Key"

npm run kb:ingest:app
```

---

## 7) Test rapide dans l’app

- Lance l’app (`npm run dev`)
- Ouvre l’assistant IA
- Pose une question de type :
  - “Comment créer une facture et où trouver les champs TVA ?”
  - “Explique le tableau de bord (KPIs) de ma société et donne 3 actions.”

---

## Notes sécurité (important)

- La function refuse automatiquement les demandes cherchant :
  - des clés, tokens, secrets
  - du code source / architecture interne / infra
  - des instructions de contournement (RLS, hack, exploit)

- La KB a du RLS :
  - les docs "public" sont accessibles
  - les docs "company" ne sont accessibles qu’aux membres de la société

---

## Si tu es bloqué

Copie-colle juste la sortie terminal (sans secrets), et je te dis exactement quoi corriger.
