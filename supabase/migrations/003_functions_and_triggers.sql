-- Migration des fonctions avancées et triggers CassKai
-- Fichier: /supabase/migrations/003_functions_and_triggers.sql

-- ============================================================================
-- 1. FONCTIONS DE GESTION DES SOLDES COMPTABLES
-- ============================================================================

-- Fonction pour calculer et mettre à jour les soldes des comptes
CREATE OR REPLACE FUNCTION update_account_balances()
RETURNS TRIGGER AS $$
DECLARE
  account_record RECORD;
  new_balance DECIMAL(15,2);
BEGIN
  -- Récupérer les informations du compte
  SELECT * INTO account_record FROM accounts WHERE id = COALESCE(NEW.account_id, OLD.account_id);
  
  IF account_record IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculer le nouveau solde pour ce compte
  SELECT 
    CASE 
      -- Pour les comptes d'actif (classes 1, 2, 3, 5) et charges (classe 6)
      -- Le solde = débit - crédit
      WHEN account_record.class IN (1, 2, 3, 5, 6) THEN 
        COALESCE(SUM(debit_amount), 0) - COALESCE(SUM(credit_amount), 0)
      -- Pour les comptes de passif (classe 4) et produits (classe 7)
      -- Le solde = crédit - débit
      ELSE 
        COALESCE(SUM(credit_amount), 0) - COALESCE(SUM(debit_amount), 0)
    END INTO new_balance
  FROM journal_entry_items jei
  JOIN journal_entries je ON jei.journal_entry_id = je.id
  WHERE jei.account_id = account_record.id;
  
  -- Mettre à jour le solde du compte
  UPDATE accounts 
  SET 
    balance = COALESCE(new_balance, 0),
    updated_at = NOW()
  WHERE id = account_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique des soldes
CREATE TRIGGER trigger_update_account_balance_on_insert
  AFTER INSERT ON journal_entry_items
  FOR EACH ROW EXECUTE FUNCTION update_account_balances();

CREATE TRIGGER trigger_update_account_balance_on_update
  AFTER UPDATE ON journal_entry_items
  FOR EACH ROW EXECUTE FUNCTION update_account_balances();

CREATE TRIGGER trigger_update_account_balance_on_delete
  AFTER DELETE ON journal_entry_items
  FOR EACH ROW EXECUTE FUNCTION update_account_balances();

-- ============================================================================
-- 2. FONCTIONS DE VALIDATION COMPTABLE
-- ============================================================================

-- Fonction pour valider l'équilibre d'une écriture comptable
CREATE OR REPLACE FUNCTION validate_journal_entry_balance(p_journal_entry_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_debit DECIMAL(15,2);
  total_credit DECIMAL(15,2);
BEGIN
  -- Calculer les totaux débit et crédit
  SELECT 
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM journal_entry_items
  WHERE journal_entry_id = p_journal_entry_id;
  
  -- Retourner true si équilibré (avec tolérance de 0.01 pour les arrondis)
  RETURN ABS(total_debit - total_credit) < 0.01;
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour valider l'équilibre avant insertion/modification
CREATE OR REPLACE FUNCTION enforce_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  is_balanced BOOLEAN;
BEGIN
  -- Vérifier l'équilibre de l'écriture
  SELECT validate_journal_entry_balance(COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)) INTO is_balanced;
  
  IF NOT is_balanced THEN
    RAISE EXCEPTION 'L''écriture comptable n''est pas équilibrée (débit ≠ crédit)';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger de validation (optionnel - peut être activé selon les besoins)
-- CREATE TRIGGER trigger_enforce_balance
--   AFTER INSERT OR UPDATE ON journal_entry_items
--   FOR EACH ROW EXECUTE FUNCTION enforce_journal_entry_balance();

-- ============================================================================
-- 3. FONCTIONS DE GÉNÉRATION AUTOMATIQUE
-- ============================================================================

-- Fonction pour générer le prochain numéro d'écriture
CREATE OR REPLACE FUNCTION get_next_journal_entry_number(
  p_company_id UUID,
  p_journal_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  journal_code TEXT;
  next_number INTEGER;
  result TEXT;
BEGIN
  -- Si un journal est spécifié, utiliser son code
  IF p_journal_id IS NOT NULL THEN
    SELECT code INTO journal_code FROM journals WHERE id = p_journal_id;
    
    -- Mettre à jour et récupérer le prochain numéro
    UPDATE journals 
    SET last_entry_number = COALESCE(last_entry_number, 0) + 1
    WHERE id = p_journal_id
    RETURNING last_entry_number INTO next_number;
    
    result := journal_code || '-' || LPAD(next_number::TEXT, 4, '0');
  ELSE
    -- Générer un numéro global pour l'entreprise
    SELECT COUNT(*) + 1 INTO next_number
    FROM journal_entries
    WHERE company_id = p_company_id;
    
    result := 'ECR-' || LPAD(next_number::TEXT, 6, '0');
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer automatiquement le numéro d'écriture
CREATE OR REPLACE FUNCTION auto_generate_entry_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Si pas de numéro fourni, en générer un automatiquement
  IF NEW.entry_number IS NULL OR NEW.entry_number = '' THEN
    NEW.entry_number := get_next_journal_entry_number(NEW.company_id, NEW.journal_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour génération automatique du numéro
CREATE TRIGGER trigger_auto_generate_entry_number
  BEFORE INSERT ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION auto_generate_entry_number();

-- ============================================================================
-- 4. FONCTIONS RPC AVANCÉES POUR L'APPLICATION
-- ============================================================================

-- Fonction pour obtenir le bilan comptable
CREATE OR REPLACE FUNCTION get_balance_sheet(
  p_company_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  actif JSON;
  passif JSON;
BEGIN
  -- Calculer l'actif (classes 1, 2, 3, 5 avec solde débiteur)
  WITH actif_data AS (
    SELECT 
      a.class,
      CASE a.class
        WHEN 1 THEN 'Immobilisations incorporelles'
        WHEN 2 THEN 'Immobilisations corporelles'
        WHEN 3 THEN 'Stocks'
        WHEN 5 THEN 'Créances et disponibilités'
      END as category,
      SUM(CASE WHEN a.balance > 0 THEN a.balance ELSE 0 END) as amount
    FROM accounts a
    WHERE a.company_id = p_company_id 
      AND a.class IN (1, 2, 3, 5)
      AND a.is_active = true
    GROUP BY a.class
  )
  SELECT json_agg(
    json_build_object(
      'category', category,
      'amount', COALESCE(amount, 0)
    )
  ) INTO actif FROM actif_data;

  -- Calculer le passif (classe 4 avec solde créditeur + capitaux propres)
  WITH passif_data AS (
    SELECT 
      CASE 
        WHEN a.account_number LIKE '1%' THEN 'Capitaux propres'
        WHEN a.account_number LIKE '4%' THEN 'Dettes'
        ELSE 'Autres'
      END as category,
      SUM(CASE WHEN a.balance > 0 THEN a.balance ELSE 0 END) as amount
    FROM accounts a
    WHERE a.company_id = p_company_id 
      AND (a.account_number LIKE '1%' OR a.account_number LIKE '4%')
      AND a.is_active = true
    GROUP BY 
      CASE 
        WHEN a.account_number LIKE '1%' THEN 'Capitaux propres'
        WHEN a.account_number LIKE '4%' THEN 'Dettes'
        ELSE 'Autres'
      END
  )
  SELECT json_agg(
    json_build_object(
      'category', category,
      'amount', COALESCE(amount, 0)
    )
  ) INTO passif FROM passif_data;

  -- Construire le résultat final
  result := json_build_object(
    'date', p_date,
    'actif', COALESCE(actif, '[]'::json),
    'passif', COALESCE(passif, '[]'::json)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le compte de résultat
CREATE OR REPLACE FUNCTION get_income_statement(
  p_company_id UUID,
  p_start_date DATE DEFAULT DATE_TRUNC('year', CURRENT_DATE),
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  charges JSON;
  produits JSON;
  resultat DECIMAL(15,2);
BEGIN
  -- Calculer les charges (classe 6)
  WITH charges_data AS (
    SELECT 
      SUBSTRING(a.account_number, 1, 2) as category_code,
      CASE SUBSTRING(a.account_number, 1, 2)
        WHEN '60' THEN 'Achats'
        WHEN '61' THEN 'Services extérieurs'
        WHEN '62' THEN 'Autres services extérieurs'
        WHEN '63' THEN 'Impôts et taxes'
        WHEN '64' THEN 'Charges de personnel'
        WHEN '65' THEN 'Autres charges'
        WHEN '66' THEN 'Charges financières'
        WHEN '67' THEN 'Charges exceptionnelles'
        WHEN '68' THEN 'Dotations'
        WHEN '69' THEN 'Impôts sur les bénéfices'
        ELSE 'Autres charges'
      END as category,
      SUM(jei.debit_amount - jei.credit_amount) as amount
    FROM journal_entry_items jei
    JOIN accounts a ON jei.account_id = a.id
    JOIN journal_entries je ON jei.journal_entry_id = je.id
    WHERE jei.company_id = p_company_id 
      AND a.class = 6
      AND je.entry_date BETWEEN p_start_date AND p_end_date
    GROUP BY SUBSTRING(a.account_number, 1, 2)
  )
  SELECT json_agg(
    json_build_object(
      'category', category,
      'amount', COALESCE(amount, 0)
    )
  ) INTO charges FROM charges_data;

  -- Calculer les produits (classe 7)
  WITH produits_data AS (
    SELECT 
      SUBSTRING(a.account_number, 1, 2) as category_code,
      CASE SUBSTRING(a.account_number, 1, 2)
        WHEN '70' THEN 'Ventes'
        WHEN '71' THEN 'Production stockée'
        WHEN '72' THEN 'Production immobilisée'
        WHEN '73' THEN 'Subventions'
        WHEN '74' THEN 'Autres produits'
        WHEN '75' THEN 'Produits financiers'
        WHEN '76' THEN 'Produits financiers'
        WHEN '77' THEN 'Produits exceptionnels'
        WHEN '78' THEN 'Reprises'
        ELSE 'Autres produits'
      END as category,
      SUM(jei.credit_amount - jei.debit_amount) as amount
    FROM journal_entry_items jei
    JOIN accounts a ON jei.account_id = a.id
    JOIN journal_entries je ON jei.journal_entry_id = je.id
    WHERE jei.company_id = p_company_id 
      AND a.class = 7
      AND je.entry_date BETWEEN p_start_date AND p_end_date
    GROUP BY SUBSTRING(a.account_number, 1, 2)
  )
  SELECT json_agg(
    json_build_object(
      'category', category,
      'amount', COALESCE(amount, 0)
    )
  ) INTO produits FROM produits_data;

  -- Calculer le résultat
  SELECT 
    COALESCE(SUM(CASE WHEN a.class = 7 THEN jei.credit_amount - jei.debit_amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN a.class = 6 THEN jei.debit_amount - jei.credit_amount ELSE 0 END), 0)
  INTO resultat
  FROM journal_entry_items jei
  JOIN accounts a ON jei.account_id = a.id
  JOIN journal_entries je ON jei.journal_entry_id = je.id
  WHERE jei.company_id = p_company_id 
    AND a.class IN (6, 7)
    AND je.entry_date BETWEEN p_start_date AND p_end_date;

  -- Construire le résultat final
  result := json_build_object(
    'period', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    ),
    'charges', COALESCE(charges, '[]'::json),
    'produits', COALESCE(produits, '[]'::json),
    'resultat', COALESCE(resultat, 0)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les données de cash-flow
CREATE OR REPLACE FUNCTION get_cash_flow_data(
  p_company_id UUID,
  p_months INTEGER DEFAULT 12
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH monthly_cash_flow AS (
    SELECT 
      DATE_TRUNC('month', bt.transaction_date) as month,
      SUM(CASE WHEN bt.amount > 0 THEN bt.amount ELSE 0 END) as inflows,
      SUM(CASE WHEN bt.amount < 0 THEN ABS(bt.amount) ELSE 0 END) as outflows,
      SUM(bt.amount) as net_flow
    FROM bank_transactions bt
    WHERE bt.company_id = p_company_id
      AND bt.transaction_date >= CURRENT_DATE - INTERVAL '1 month' * p_months
    GROUP BY DATE_TRUNC('month', bt.transaction_date)
    ORDER BY month
  )
  SELECT json_agg(
    json_build_object(
      'month', month,
      'inflows', COALESCE(inflows, 0),
      'outflows', COALESCE(outflows, 0),
      'net_flow', COALESCE(net_flow, 0)
    )
  ) INTO result FROM monthly_cash_flow;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FONCTIONS DE GESTION DES UTILISATEURS ET ENTREPRISES
-- ============================================================================

-- Fonction pour créer une nouvelle entreprise avec données par défaut
CREATE OR REPLACE FUNCTION create_company_with_defaults(
  p_user_id UUID,
  p_company_name TEXT,
  p_country TEXT DEFAULT 'FR',
  p_currency TEXT DEFAULT 'EUR',
  p_accounting_standard TEXT DEFAULT 'PCG'
)
RETURNS UUID AS $$
DECLARE
  new_company_id UUID;
  admin_role_id UUID;
BEGIN
  -- Créer l'entreprise
  INSERT INTO companies (
    name, 
    country, 
    default_currency, 
    is_active
  ) VALUES (
    p_company_name,
    p_country,
    p_currency,
    true
  ) RETURNING id INTO new_company_id;

  -- Récupérer le rôle admin
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin' AND is_system_role = true;

  -- Associer l'utilisateur à l'entreprise comme admin
  INSERT INTO user_companies (
    user_id,
    company_id,
    role_id,
    is_default
  ) VALUES (
    p_user_id,
    new_company_id,
    admin_role_id,
    true
  );

  RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour basculer l'entreprise par défaut d'un utilisateur
CREATE OR REPLACE FUNCTION set_default_company(
  p_user_id UUID,
  p_company_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'utilisateur a accès à cette entreprise
  IF NOT EXISTS (
    SELECT 1 FROM user_companies 
    WHERE user_id = p_user_id AND company_id = p_company_id
  ) THEN
    RAISE EXCEPTION 'L''utilisateur n''a pas accès à cette entreprise';
  END IF;

  -- Retirer le statut par défaut de toutes les entreprises de l'utilisateur
  UPDATE user_companies 
  SET is_default = false 
  WHERE user_id = p_user_id;

  -- Définir la nouvelle entreprise par défaut
  UPDATE user_companies 
  SET is_default = true 
  WHERE user_id = p_user_id AND company_id = p_company_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FONCTIONS DE RAPPROCHEMENT BANCAIRE
-- ============================================================================

-- Table des logs d'audit si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  record_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Fonction générique d'audit
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
BEGIN
  -- Extraire company_id selon la table
  IF TG_TABLE_NAME = 'companies' THEN
    company_id_value := COALESCE(NEW.id, OLD.id);
  ELSE
    company_id_value := COALESCE(NEW.company_id, OLD.company_id);
  END IF;

  -- Insérer le log d'audit
  INSERT INTO audit_logs (
    company_id,
    user_id,
    table_name,
    operation,
    record_id,
    old_values,
    new_values
  ) VALUES (
    company_id_value,
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW) 
         WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW) 
         ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. FONCTIONS DE MAINTENANCE ET NETTOYAGE
-- ============================================================================

-- Fonction pour nettoyer les anciens logs d'audit
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(p_days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de nettoyage pour les tests (corrigée)
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void AS $$
BEGIN
  -- Attention : cette fonction supprime toutes les données de test
  -- À utiliser uniquement en développement
  IF current_setting('app.environment', true) = 'development' THEN
    DELETE FROM audit_logs WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    DELETE FROM journal_entry_items WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    DELETE FROM journal_entries WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    DELETE FROM accounts WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    DELETE FROM journals WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    DELETE FROM user_companies WHERE company_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    DELETE FROM companies WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    
    RAISE NOTICE 'Données de test supprimées';
  ELSE
    RAISE EXCEPTION 'Nettoyage autorisé uniquement en développement';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. VUES UTILES POUR L'APPLICATION
-- ============================================================================

-- Vue pour la balance des comptes
CREATE OR REPLACE VIEW account_balances AS
SELECT 
  a.id,
  a.company_id,
  a.account_number,
  a.name,
  a.type,
  a.class,
  a.currency,
  a.balance,
  CASE 
    WHEN a.class IN (1, 2, 3, 5) AND a.balance > 0 THEN a.balance
    WHEN a.class IN (4, 7) AND a.balance < 0 THEN ABS(a.balance)
    ELSE 0
  END as debit_balance,
  CASE 
    WHEN a.class IN (4, 7) AND a.balance > 0 THEN a.balance
    WHEN a.class IN (1, 2, 3, 5) AND a.balance < 0 THEN ABS(a.balance)
    ELSE 0
  END as credit_balance
FROM accounts a
WHERE a.is_active = true;

-- Vue pour le grand livre
CREATE OR REPLACE VIEW general_ledger AS
SELECT 
  je.company_id,
  je.entry_date,
  je.entry_number,
  je.description as entry_description,
  a.account_number,
  a.name as account_name,
  jei.description as line_description,
  jei.debit_amount,
  jei.credit_amount,
  j.code as journal_code,
  j.name as journal_name
FROM journal_entry_items jei
JOIN journal_entries je ON jei.journal_entry_id = je.id
JOIN accounts a ON jei.account_id = a.id
LEFT JOIN journals j ON je.journal_id = j.id
ORDER BY je.entry_date, je.entry_number, jei.id;

-- Message de finalisation
DO $$
BEGIN
  RAISE NOTICE 'Migration des fonctions et triggers terminée avec succès';
  RAISE NOTICE 'Fonctions créées: %', (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION');
END $$;
