# IMPORTANT: Structure de company_settings

## ⚠️ Problème identifié

La migration SQL `add_company_settings_fields.sql` vise la table **`companies`** alors que la vraie table est **`company_settings`**.

## Structure actuelle de company_settings

```sql
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  default_currency TEXT DEFAULT 'EUR',
  fiscal_year_start INTEGER DEFAULT 1,
  business_type TEXT DEFAULT 'services',
  timezone TEXT DEFAULT 'Europe/Paris',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  number_format JSONB DEFAULT '{"decimal": ",", "precision": 2, "thousands": " "}',
  address JSONB DEFAULT '{}',           -- ⚠️ Champ JSONB, pas colonnes individuelles
  contact_info JSONB DEFAULT '{}',      -- ⚠️ Champ JSONB
  business_hours JSONB,
  company_logo_url TEXT,
  website_url TEXT,
  tax_settings JSONB DEFAULT '{}',      -- ⚠️ Champ JSONB
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);
```

## 🔴 Erreurs TypeScript (96 erreurs)

Le fichier `src/types/company-settings.types.ts` essaie d'accéder à des propriétés comme:
- `commercial_name`
- `ape_code`
- `address_street`, `address_postal_code`, `address_city`, `address_country`
- `correspondence_address_*`
- `fiscal_year_end_month`
- `tax_regime`, `vat_regime`, `vat_rate`
- `accountant_firm_name`, `accountant_contact`
- Et ~80 autres propriétés...

**Ces propriétés N'EXISTENT PAS** comme colonnes individuelles. Elles doivent être stockées dans les champs JSONB.

## ✅ Solution recommandée

### Option 1: Utiliser les champs JSONB existants (Recommandé)

Corriger `company-settings.types.ts` pour utiliser la structure JSONB:

```typescript
// Au lieu de:
update.commercial_name = settings.generalInfo.commercialName;

// Utiliser:
if (!update.address) update.address = {};
update.address.street = settings.contact.address.street;

// Ou passer tout le JSONB:
update.address = JSON.stringify(settings.contact.address);
```

### Option 2: Ajouter des colonnes SQL (Non recommandé)

Créer une **NOUVELLE** migration pour ajouter ~50 colonnes à `company_settings`.

⚠️ **Problème**: Cela dénormalise la base et duplique les données JSONB.

## 🎯 Action immédiate

Je recommande **Option 1**: Corriger le code TypeScript pour qu'il utilise correctement les champs JSONB au lieu d'essayer d'accéder à des colonnes qui n'existent pas.

Cela résoudra les 96 erreurs sans toucher à la base de données.
