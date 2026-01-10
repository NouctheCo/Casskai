# Fix pour l'erreur "function unaccent(text) does not exist"

## Problème
L'onboarding échoue avec l'erreur:
```
Error: function unaccent(text) does not exist
```

Cela vient de la fonction `normalize_company_name_safe()` qui appelle `unaccent()` pour nettoyer les noms d'entreprise (remplacer accents, etc.).

## Cause
L'extension PostgreSQL `unaccent` n'est pas activée dans Supabase.

## Solutions

### Solution 1: Via Supabase Dashboard SQL Editor (PLUS SIMPLE - À FAIRE MAINTENANT)

1. **Ouvre Supabase Dashboard:**
   - URL: https://app.supabase.com/project/smtdtgrymuzwvctattmx/sql/new

2. **Copie et exécute ce SQL:**

```sql
-- 1. Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Create the unaccent extension
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA extensions;

-- 3. Ensure search_path includes extensions schema
ALTER DATABASE postgres SET search_path = public, extensions, auth, storage;

-- 4. Update the normalize_company_name_safe function to use unaccent properly
CREATE OR REPLACE FUNCTION public.normalize_company_name_safe(company_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    has_unaccent boolean;
BEGIN
    IF company_name IS NULL THEN
        RETURN NULL;
    END IF;

    -- Check if unaccent is available
    has_unaccent := EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'unaccent' AND pronargs = 1
    );

    IF has_unaccent THEN
        -- Use unaccent if extension is loaded
        RETURN UPPER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    extensions.unaccent(TRIM(company_name)),
                    '[^A-Z0-9]', '', 'g'
                ),
                '(SARL|SAS|SASU|EURL|SA|SCI|SCOP)$', '', 'g'
            )
        );
    ELSE
        -- Fallback without unaccent
        RETURN UPPER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    TRIM(company_name),
                    '[^A-Za-z0-9]', '', 'g'
                ),
                '(SARL|SAS|SASU|EURL|SA|SCI|SCOP)$', '', 'g'
            )
        );
    END IF;
END;
$function$
;

-- 5. Test the fix
SELECT unaccent('Créée'), extensions.unaccent('Créée');
```

3. **Clique "Run"**

4. **Vérification:**
   - Si tu vois "Créée" → "Creee", c'est bon ✅
   - Sinon, vérifica le SQL Editor pour les erreurs

### Solution 2: Via Supabase CLI

```bash
# 1. Push les migrations
npx supabase db push

# Les migrations seront appliquées automatiquement
```

### Solution 3: Via ce script Node.js

```bash
# Si tu as la service_role_key:
export SUPABASE_SERVICE_ROLE_KEY="ta-clé-ici"
node fix-unaccent.js
```

## Après le fix

1. **Redémarre le dev server:**
   ```bash
   npm run dev
   ```

2. **Nettoie le cache du navigateur** (Ctrl+Shift+Delete)

3. **Teste l'onboarding:**
   - Va sur http://localhost:5173/onboarding
   - Remplis le formulaire
   - Clique "Finaliser"
   - Ça devrait marcher! ✅

## Fichiers créés/modifiés

- `supabase/migrations/20251228000001_activate_unaccent_extension.sql` - Active l'extension
- `supabase/migrations/20251228000002_fix_normalize_company_name_workaround.sql` - Ajoute le fallback

## En cas de problème persistant

Si tu as toujours l'erreur:
1. Vérife dans Supabase Dashboard → SQL Editor → Exécute: `SELECT * FROM pg_extension WHERE extname = 'unaccent';`
2. Si rien ne s'affiche = l'extension n'est pas activée
3. Vérifie le SQL que tu as exécuté pour les erreurs

## Notes
- Cette erreur affecte UNIQUEMENT l'étape de finalisation de l'onboarding
- Une fois fixée, les nouvelles entreprises peuvent être créées normalement
- Les entreprises existantes ne sont pas affectées
