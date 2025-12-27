# Diagnostic: Catégorisation bancaire - journal_entry_lines non insérées

## Problème identifié

Les lignes d'écriture comptable (`journal_entry_lines`) ne sont pas créées lors de la catégorisation des transactions bancaires.

## Cause racine probable

La table `journal_entry_lines` **n'a PAS de colonne `company_id`**. Les politiques RLS s'appuient sur une jointure avec `journal_entries` pour vérifier les permissions.

### Schéma actuel de journal_entry_lines
```sql
CREATE TABLE journal_entry_lines (
    id uuid,
    journal_entry_id uuid NOT NULL,
    account_id uuid NOT NULL,
    description text NOT NULL,
    debit_amount numeric(15,2),
    credit_amount numeric(15,2),
    line_order integer,
    created_at timestamp,
    account_number text,
    account_name text
    -- ❌ PAS de company_id
);
```

## Hypothèses à tester

### 1. Politiques RLS trop restrictives (PLUS PROBABLE)
Les politiques RLS sur `journal_entry_lines` utilisent des sous-requêtes qui peuvent échouer silencieusement.

**Politique actuelle:**
```sql
CREATE POLICY "Users can INSERT journal entry lines for their company entries"
  ON journal_entry_lines FOR INSERT
  WITH CHECK (
    journal_entry_id IN (
      SELECT id FROM journal_entries
      WHERE company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    )
  );
```

**Problème potentiel:** Si `journal_entries` est créée dans la même transaction, la politique RLS pourrait ne pas voir l'entrée immédiatement.

### 2. Trigger qui bloque l'insertion
Vérifier s'il existe un trigger sur `journal_entry_lines` qui pourrait bloquer l'insertion.

### 3. Contrainte de clé étrangère
La contrainte `journal_entry_id` pourrait échouer si la transaction n'est pas commitée.

## Tests à effectuer

### Test 1: Vérifier les politiques RLS actuelles
```sql
SELECT
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'journal_entry_lines'
ORDER BY cmd;
```

### Test 2: Tester l'insertion manuelle
```sql
-- Se connecter en tant qu'utilisateur authentifié
-- Créer une écriture
INSERT INTO journal_entries (company_id, journal_id, entry_date, description, status)
VALUES (
  (SELECT company_id FROM user_companies WHERE user_id = auth.uid() LIMIT 1),
  (SELECT id FROM journals WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()) LIMIT 1),
  CURRENT_DATE,
  'Test catégorisation',
  'posted'
)
RETURNING id;

-- Puis insérer des lignes avec l'ID retourné
INSERT INTO journal_entry_lines (
  journal_entry_id,
  account_id,
  description,
  debit_amount,
  credit_amount,
  line_order,
  account_number,
  account_name
) VALUES (
  '<journal_entry_id from above>',
  (SELECT id FROM chart_of_accounts WHERE company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()) LIMIT 1),
  'Test ligne 1',
  100.00,
  0,
  1,
  '512000',
  'Banque'
);
```

### Test 3: Vérifier les triggers
```sql
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'journal_entry_lines';
```

## Solutions proposées

### Solution 1: Ajouter company_id à journal_entry_lines (RECOMMANDÉE)

Cette solution résout le problème de manière définitive en évitant les sous-requêtes RLS coûteuses.

```sql
-- Ajouter la colonne
ALTER TABLE journal_entry_lines
ADD COLUMN company_id uuid;

-- Remplir avec les données existantes
UPDATE journal_entry_lines jel
SET company_id = je.company_id
FROM journal_entries je
WHERE jel.journal_entry_id = je.id;

-- Rendre la colonne obligatoire
ALTER TABLE journal_entry_lines
ALTER COLUMN company_id SET NOT NULL;

-- Ajouter une contrainte de clé étrangère
ALTER TABLE journal_entry_lines
ADD CONSTRAINT fk_journal_entry_lines_company
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Créer un index pour les performances
CREATE INDEX idx_journal_entry_lines_company_id
ON journal_entry_lines(company_id);

-- Recréer les politiques RLS (plus simples et plus rapides)
DROP POLICY IF EXISTS "Users can SELECT journal entry lines from their company entries" ON journal_entry_lines;
DROP POLICY IF EXISTS "Users can INSERT journal entry lines for their company entries" ON journal_entry_lines;
DROP POLICY IF EXISTS "Users can UPDATE journal entry lines from their company entries" ON journal_entry_lines;
DROP POLICY IF EXISTS "Users can DELETE journal entry lines from their company entries" ON journal_entry_lines;

CREATE POLICY "Users can SELECT their company journal entry lines"
  ON journal_entry_lines FOR SELECT
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can INSERT their company journal entry lines"
  ON journal_entry_lines FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can UPDATE their company journal entry lines"
  ON journal_entry_lines FOR UPDATE
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can DELETE their company journal entry lines"
  ON journal_entry_lines FOR DELETE
  USING (company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

-- Créer un trigger pour maintenir company_id à jour
CREATE OR REPLACE FUNCTION sync_journal_entry_lines_company_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Lors de l'insertion, récupérer le company_id depuis journal_entries
    IF TG_OP = 'INSERT' THEN
        SELECT company_id INTO NEW.company_id
        FROM journal_entries
        WHERE id = NEW.journal_entry_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_journal_entry_lines_company_id
BEFORE INSERT ON journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION sync_journal_entry_lines_company_id();
```

### Solution 2: Utiliser SECURITY DEFINER (Alternative temporaire)

Si vous ne pouvez pas modifier le schéma immédiatement:

```sql
-- Créer une fonction pour insérer les lignes
CREATE OR REPLACE FUNCTION insert_journal_entry_lines(
    p_lines jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_line jsonb;
    v_result json;
    v_inserted_ids uuid[] := '{}';
    v_company_id uuid;
BEGIN
    -- Vérifier que l'utilisateur a accès à la company
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        SELECT je.company_id INTO v_company_id
        FROM journal_entries je
        WHERE je.id = (v_line->>'journal_entry_id')::uuid;
        
        -- Vérifier que l'utilisateur appartient à cette company
        IF NOT EXISTS (
            SELECT 1 FROM user_companies
            WHERE user_id = auth.uid()
            AND company_id = v_company_id
        ) THEN
            RAISE EXCEPTION 'Accès non autorisé';
        END IF;
        
        -- Insérer la ligne
        INSERT INTO journal_entry_lines (
            journal_entry_id,
            account_id,
            description,
            debit_amount,
            credit_amount,
            line_order,
            account_number,
            account_name
        ) VALUES (
            (v_line->>'journal_entry_id')::uuid,
            (v_line->>'account_id')::uuid,
            v_line->>'description',
            (v_line->>'debit_amount')::numeric,
            (v_line->>'credit_amount')::numeric,
            (v_line->>'line_order')::integer,
            v_line->>'account_number',
            v_line->>'account_name'
        )
        RETURNING id INTO v_inserted_ids[array_length(v_inserted_ids, 1) + 1];
    END LOOP;
    
    RETURN json_build_object('ids', v_inserted_ids);
END;
$$;
```

Puis modifier le code TypeScript:
```typescript
// Au lieu de:
const { data: insertedLines, error: linesError } = await supabase
  .from('journal_entry_lines')
  .insert(lines)
  .select();

// Utiliser:
const { data: result, error: linesError } = await supabase
  .rpc('insert_journal_entry_lines', { p_lines: lines });
```

## Modification du code TypeScript

Si vous implémentez la Solution 1, vous devez aussi modifier le code pour inclure `company_id`:

```typescript
// Dans TransactionCategorization.tsx, lignes 245-274
lines.push({
  journal_entry_id: entry.id,
  company_id: currentCompany.id, // ✅ AJOUTER
  account_id: accountId,
  debit_amount: absAmount,
  credit_amount: 0,
  description: transaction.description,
  line_order: 1,
  account_number: selectedAccount.account_number,
  account_name: selectedAccount.account_name,
});
```

## Recommandation

**Implémentez la Solution 1** (ajouter `company_id` à `journal_entry_lines`). C'est la solution la plus propre et la plus performante. Les sous-requêtes RLS sont coûteuses et peuvent causer des problèmes subtils.

## Fichiers à créer/modifier

1. **Migration SQL:** `supabase/migrations/20251222_add_company_id_to_journal_entry_lines.sql`
2. **Code TypeScript:** `src/components/banking/TransactionCategorization.tsx` (ligne 245-274)
