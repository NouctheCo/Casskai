-- =====================================================
-- AJOUTER LES TEMPLATES MANQUANTS POUR TOUS LES PAYS
-- Date: 2025-11-30
-- Description: Complète les templates de plan comptable pour
--              tous les 33 pays annoncés (OHADA, Maghreb, Anglophone)
-- =====================================================

-- ========== PAYS OHADA MANQUANTS ==========
-- Utiliser le template SYSCOHADA de référence (BJ) pour les pays manquants

DO $$
DECLARE
  ohada_countries TEXT[] := ARRAY['NE', 'GW', 'CF', 'TD', 'GQ', 'KM', 'CD', 'GN'];
  v_country_code TEXT;
BEGIN
  FOREACH v_country_code IN ARRAY ohada_countries
  LOOP
    -- Vérifier si le template existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM chart_of_accounts_templates
      WHERE country_code = v_country_code
      LIMIT 1
    ) THEN
      -- Copier depuis BJ (référence SYSCOHADA)
      INSERT INTO chart_of_accounts_templates
        (country_code, account_number, account_name, account_type, class, level, is_detail_account, parent_account_number, description)
      SELECT
        v_country_code,
        account_number,
        account_name,
        account_type,
        class,
        level,
        is_detail_account,
        parent_account_number,
        description
      FROM chart_of_accounts_templates
      WHERE country_code = 'BJ';

      RAISE NOTICE 'Template SYSCOHADA créé pour %', v_country_code;
    ELSE
      RAISE NOTICE 'Template déjà existant pour %', v_country_code;
    END IF;
  END LOOP;
END $$;

-- ========== MAGHREB - SCF / PCG ADAPTÉ ==========
-- Algérie (DZ), Maroc (MA), Tunisie (TN)
-- Utiliser le PCG français comme base avec adaptations

DO $$
DECLARE
  maghreb_countries TEXT[] := ARRAY['DZ', 'MA', 'TN'];
  v_country_code TEXT;
BEGIN
  FOREACH v_country_code IN ARRAY maghreb_countries
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM chart_of_accounts_templates
      WHERE country_code = v_country_code
      LIMIT 1
    ) THEN
      -- Copier depuis FR (PCG) comme base
      INSERT INTO chart_of_accounts_templates
        (country_code, account_number, account_name, account_type, class, level, is_detail_account, parent_account_number, description)
      SELECT
        v_country_code,
        account_number,
        account_name,
        account_type,
        class,
        level,
        is_detail_account,
        parent_account_number,
        description
      FROM chart_of_accounts_templates
      WHERE country_code = 'FR';

      RAISE NOTICE 'Template SCF/PCG Adapté créé pour %', v_country_code;
    ELSE
      RAISE NOTICE 'Template déjà existant pour %', v_country_code;
    END IF;
  END LOOP;
END $$;

-- ========== AFRIQUE ANGLOPHONE - IFRS ==========
-- 10 pays anglophones: ZA, NG, KE, GH, TZ, UG, RW, ZM, ZW, BW
-- Créer un template IFRS de base simplifié

DO $$
DECLARE
  anglophone_countries TEXT[] := ARRAY['ZA', 'NG', 'KE', 'GH', 'TZ', 'UG', 'RW', 'ZM', 'ZW', 'BW'];
  v_country_code TEXT;
BEGIN
  FOREACH v_country_code IN ARRAY anglophone_countries
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM chart_of_accounts_templates
      WHERE country_code = v_country_code
      LIMIT 1
    ) THEN
      -- Créer template IFRS de base
      INSERT INTO chart_of_accounts_templates
        (country_code, account_number, account_name, account_type, class, level, is_detail_account, description)
      VALUES
        -- Assets (1xxx)
        (v_country_code, '1000', 'Assets', 'ASSET', '1', 1, false, 'Non-current and current assets'),
        (v_country_code, '1100', 'Non-Current Assets', 'ASSET', '1', 2, false, 'Property, plant, equipment, intangibles'),
        (v_country_code, '1200', 'Current Assets', 'ASSET', '1', 2, false, 'Cash, receivables, inventory'),
        (v_country_code, '1210', 'Cash and Cash Equivalents', 'ASSET', '1', 3, true, 'Bank accounts, petty cash'),
        (v_country_code, '1220', 'Trade Receivables', 'ASSET', '1', 3, true, 'Amounts owed by customers'),
        (v_country_code, '1230', 'Inventory', 'ASSET', '1', 3, true, 'Goods for resale'),

        -- Liabilities (2xxx)
        (v_country_code, '2000', 'Liabilities', 'LIABILITY', '2', 1, false, 'Non-current and current liabilities'),
        (v_country_code, '2100', 'Non-Current Liabilities', 'LIABILITY', '2', 2, false, 'Long-term debt, provisions'),
        (v_country_code, '2200', 'Current Liabilities', 'LIABILITY', '2', 2, false, 'Trade payables, short-term debt'),
        (v_country_code, '2210', 'Trade Payables', 'LIABILITY', '2', 3, true, 'Amounts owed to suppliers'),
        (v_country_code, '2220', 'Accrued Expenses', 'LIABILITY', '2', 3, true, 'Expenses incurred but not yet paid'),

        -- Equity (3xxx)
        (v_country_code, '3000', 'Equity', 'EQUITY', '3', 1, false, 'Share capital and reserves'),
        (v_country_code, '3100', 'Share Capital', 'EQUITY', '3', 2, true, 'Issued share capital'),
        (v_country_code, '3200', 'Retained Earnings', 'EQUITY', '3', 2, true, 'Accumulated profits/losses'),

        -- Revenue (4xxx)
        (v_country_code, '4000', 'Revenue', 'INCOME', '4', 1, false, 'Sales and other income'),
        (v_country_code, '4100', 'Sales Revenue', 'INCOME', '4', 2, true, 'Revenue from sales of goods/services'),
        (v_country_code, '4200', 'Other Income', 'INCOME', '4', 2, true, 'Interest, gains on disposal'),

        -- Expenses (5xxx)
        (v_country_code, '5000', 'Expenses', 'EXPENSE', '5', 1, false, 'Operating and other expenses'),
        (v_country_code, '5100', 'Cost of Sales', 'EXPENSE', '5', 2, true, 'Direct costs of goods sold'),
        (v_country_code, '5200', 'Operating Expenses', 'EXPENSE', '5', 2, false, 'Administrative and selling expenses'),
        (v_country_code, '5210', 'Salaries and Wages', 'EXPENSE', '5', 3, true, 'Employee compensation'),
        (v_country_code, '5220', 'Rent and Utilities', 'EXPENSE', '5', 3, true, 'Premises costs'),
        (v_country_code, '5230', 'Professional Fees', 'EXPENSE', '5', 3, true, 'Legal, accounting, consulting'),
        (v_country_code, '5240', 'Depreciation', 'EXPENSE', '5', 3, true, 'Asset depreciation charges');

      RAISE NOTICE 'Template IFRS créé pour %', v_country_code;
    ELSE
      RAISE NOTICE 'Template déjà existant pour %', v_country_code;
    END IF;
  END LOOP;
END $$;

-- ========== EUROPE MANQUANTS ==========
-- Luxembourg (LU) - utiliser PCG français

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chart_of_accounts_templates
    WHERE country_code = 'LU'
    LIMIT 1
  ) THEN
    INSERT INTO chart_of_accounts_templates
      (country_code, account_number, account_name, account_type, class, level, is_detail_account, parent_account_number, description)
    SELECT
      'LU',
      account_number,
      account_name,
      account_type,
      class,
      level,
      is_detail_account,
      parent_account_number,
      description
    FROM chart_of_accounts_templates
    WHERE country_code = 'FR';

    RAISE NOTICE 'Template PCG créé pour Luxembourg';
  END IF;
END $$;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

DO $$
DECLARE
  total_countries INTEGER;
  total_templates INTEGER;
  missing_countries TEXT[];
BEGIN
  -- Compter les templates
  SELECT COUNT(DISTINCT country_code) INTO total_templates
  FROM chart_of_accounts_templates;

  -- Lister les pays manquants (si besoin)
  SELECT ARRAY_AGG(code) INTO missing_countries
  FROM (
    VALUES
      ('FR'), ('BE'), ('LU'),  -- Europe PCG
      ('CI'), ('SN'), ('CM'), ('ML'), ('BJ'), ('BF'), ('TG'), ('GA'), ('CG'), -- OHADA
      ('NE'), ('TD'), ('CF'), ('GW'), ('GQ'), ('KM'), ('CD'), ('GN'),
      ('DZ'), ('MA'), ('TN'),  -- Maghreb
      ('ZA'), ('NG'), ('KE'), ('GH'), ('TZ'), ('UG'), ('RW'), ('ZM'), ('ZW'), ('BW')  -- Anglophone
  ) AS expected(code)
  WHERE code NOT IN (
    SELECT DISTINCT country_code FROM chart_of_accounts_templates
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ TEMPLATES PLAN COMPTABLE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Templates créés pour % pays', total_templates;
  RAISE NOTICE '🎯 Objectif: 33 pays (PCG + SYSCOHADA + SCF + IFRS)';

  IF missing_countries IS NOT NULL AND array_length(missing_countries, 1) > 0 THEN
    RAISE NOTICE '⚠️  Pays manquants: %', missing_countries;
  ELSE
    RAISE NOTICE '✅ Tous les pays couverts!';
  END IF;

  RAISE NOTICE '========================================';
END $$;
