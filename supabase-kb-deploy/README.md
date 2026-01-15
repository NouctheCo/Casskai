# KB / RAG deployment (safe)

This folder is an isolated Supabase project containing **only** the KB/RAG migration.
It exists to avoid pushing legacy migrations from the main repo.

## Commands (PowerShell)

```powershell
cd supabase-kb-deploy

# Link this folder to the production project
supabase link --project-ref smtdtgrymuzwvctattmx

# Push only this migration
supabase db push
```

If `supabase db push` asks for the database password, copy it from:
Supabase Dashboard → Project Settings → Database → Database password.
