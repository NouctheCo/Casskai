# Configuration Supabase - Obligations Fiscales

## ✅ Schéma de base de données

La table `tax_obligations` **existe déjà** dans Supabase via la migration `20251107100000_create_tax_module_tables.sql`.

### Structure de la table

```sql
CREATE TABLE tax_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Type de taxe
  tax_type_id TEXT NOT NULL,
  tax_type_name TEXT NOT NULL,
  
  -- Fréquence
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annual', 'one_time')),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  advance_notice_days INTEGER NOT NULL DEFAULT 7,
  
  -- Prochaine échéance
  next_due_date DATE NOT NULL,
  next_declaration_id UUID REFERENCES tax_declarations(id) ON DELETE SET NULL,
  
  -- Paramètres
  is_active BOOLEAN DEFAULT true,
  auto_generate BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  notification_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔒 Sécurité (RLS)

Les politiques de sécurité sont **déjà configurées** :

- ✅ SELECT: Utilisateurs peuvent voir les obligations de leurs entreprises
- ✅ INSERT: Utilisateurs peuvent créer des obligations pour leurs entreprises  
- ✅ UPDATE: Utilisateurs peuvent modifier les obligations de leurs entreprises
- ✅ DELETE: Utilisateurs peuvent supprimer les obligations de leurs entreprises

## 📊 Index et performances

Les index suivants sont **déjà créés** :

- `idx_tax_obligations_company` sur `company_id`
- `idx_tax_obligations_tax_type` sur `tax_type_id`
- `idx_tax_obligations_next_due` sur `next_due_date`
- `idx_tax_obligations_active` sur `is_active`

## 🔄 Triggers

Un trigger **existe déjà** pour mettre à jour automatiquement `updated_at` :

```sql
CREATE TRIGGER trigger_tax_obligations_updated_at
  BEFORE UPDATE ON tax_obligations
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_obligations_updated_at();
```

## ✅ Vérification

Pour vérifier que tout est en place dans Supabase :

### Via SQL Editor

```sql
-- Vérifier que la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'tax_obligations'
);

-- Vérifier les colonnes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tax_obligations'
ORDER BY ordinal_position;

-- Vérifier les RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'tax_obligations';

-- Vérifier les index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tax_obligations';

-- Vérifier les triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tax_obligations';
```

## 🚀 Migration déjà appliquée

Si la migration n'a pas été appliquée sur votre environnement Supabase, exécutez :

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor dans le dashboard Supabase
# Copiez-collez le contenu de :
# supabase/migrations/20251107100000_create_tax_module_tables.sql
```

## 📝 Types d'obligations supportés

Le modal permet de créer des obligations pour :

### Types standard
- TVA (Taxe sur la Valeur Ajoutée)
- IS (Impôt sur les Sociétés)
- IR (Impôt sur le Revenu)
- CFE (Cotisation Foncière des Entreprises)
- CVAE (Cotisation sur la Valeur Ajoutée)
- Liasse fiscale

### Types personnalisés
- Redressement fiscal
- Échéancier de paiement
- Pénalités
- Taxe d'apprentissage
- Formation professionnelle

## 🔧 Modifications apportées au code

### Corrections dans taxService.ts

1. **company_id vs enterprise_id** : Le code utilise maintenant correctement `company_id` pour la base de données et `enterprise_id` pour l'interface TypeScript

2. **Calcul automatique de next_due_date** : La date de prochaine échéance est calculée automatiquement en fonction de la fréquence

3. **Transformation des données** : Les réponses Supabase sont transformées pour correspondre à l'interface TypeScript `TaxObligation`

## ⚠️ Points d'attention

- La table utilise `company_id` (schéma DB) mais l'interface TypeScript utilise `enterprise_id`
- La transformation se fait automatiquement dans les fonctions CRUD
- `tax_type_name` est généré automatiquement en majuscules depuis `tax_type_id`
- Les `notification_emails` sont stockés comme array PostgreSQL (TEXT[])

## 🎯 Prochaines améliorations possibles

1. Créer une table `tax_types` pour normaliser les types d'obligations
2. Ajouter une fonction PostgreSQL pour calculer automatiquement `next_due_date`
3. Créer un trigger pour générer automatiquement les déclarations si `auto_generate = true`
4. Ajouter une fonction pour envoyer les notifications email aux échéances
