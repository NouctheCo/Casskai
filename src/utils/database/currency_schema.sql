-- src/utils/database/currency_schema.sql

-- Table des devises supportées
CREATE TABLE IF NOT EXISTS currencies (
  code TEXT PRIMARY KEY, -- ISO 4217 (EUR, USD, XOF, etc.)
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER NOT NULL DEFAULT 2,
  countries TEXT[], -- Array des codes pays
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des taux de change
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL REFERENCES currencies(code),
  to_currency TEXT NOT NULL REFERENCES currencies(code),
  rate DECIMAL(15,8) NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL, -- Provider source (ECB, Fixer.io, etc.)
  is_fixed BOOLEAN DEFAULT false, -- Taux fixe (XOF/EUR par exemple)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT rate_positive CHECK (rate > 0),
  CONSTRAINT different_currencies CHECK (from_currency != to_currency),
  UNIQUE(from_currency, to_currency, date, source)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies 
ON exchange_rates(from_currency, to_currency);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_date 
ON exchange_rates(date DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_source 
ON exchange_rates(source);

-- Ajouter la devise à la table companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR' REFERENCES currencies(code);

-- Ajouter devise aux comptes
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR' REFERENCES currencies(code);

-- Ajouter devise aux transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR' REFERENCES currencies(code);

-- Ajouter devise aux lignes d'écriture
ALTER TABLE journal_lines 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR' REFERENCES currencies(code),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15,8),
ADD COLUMN IF NOT EXISTS base_currency_debit DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_currency_credit DECIMAL(15,2) DEFAULT 0;

-- Table pour les conversions de devise (cache/historique)
CREATE TABLE IF NOT EXISTS currency_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL REFERENCES currencies(code),
  to_currency TEXT NOT NULL REFERENCES currencies(code),
  original_amount DECIMAL(15,2) NOT NULL,
  converted_amount DECIMAL(15,2) NOT NULL,
  exchange_rate DECIMAL(15,8) NOT NULL,
  conversion_date DATE NOT NULL,
  company_id UUID REFERENCES companies(id),
  reference_type TEXT, -- 'transaction', 'journal_entry', etc.
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les conversions
CREATE INDEX IF NOT EXISTS idx_currency_conversions_company 
ON currency_conversions(company_id);

CREATE INDEX IF NOT EXISTS idx_currency_conversions_reference 
ON currency_conversions(reference_type, reference_id);

-- Vue pour les taux de change actuels
CREATE OR REPLACE VIEW current_exchange_rates AS
SELECT DISTINCT ON (from_currency, to_currency)
  from_currency,
  to_currency,
  rate,
  date,
  source,
  is_fixed,
  created_at
FROM exchange_rates
ORDER BY from_currency, to_currency, date DESC, created_at DESC;

-- Fonction pour obtenir le taux de change le plus récent
CREATE OR REPLACE FUNCTION get_latest_exchange_rate(
  p_from_currency TEXT,
  p_to_currency TEXT
) RETURNS DECIMAL(15,8) AS $$
DECLARE
  v_rate DECIMAL(15,8);
BEGIN
  -- Cas simple : même devise
  IF p_from_currency = p_to_currency THEN
    RETURN 1.0;
  END IF;
  
  -- Chercher le taux direct
  SELECT rate INTO v_rate
  FROM current_exchange_rates
  WHERE from_currency = p_from_currency 
    AND to_currency = p_to_currency;
  
  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;
  
  -- Chercher le taux inverse
  SELECT (1.0 / rate) INTO v_rate
  FROM current_exchange_rates
  WHERE from_currency = p_to_currency 
    AND to_currency = p_from_currency;
  
  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;
  
  -- Pas de taux trouvé
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour convertir un montant
CREATE OR REPLACE FUNCTION convert_amount(
  p_amount DECIMAL(15,2),
  p_from_currency TEXT,
  p_to_currency TEXT
) RETURNS DECIMAL(15,2) AS $$
DECLARE
  v_rate DECIMAL(15,8);
  v_converted DECIMAL(15,2);
BEGIN
  -- Obtenir le taux
  v_rate := get_latest_exchange_rate(p_from_currency, p_to_currency);
  
  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'No exchange rate found for % to %', p_from_currency, p_to_currency;
  END IF;
  
  -- Calculer la conversion
  v_converted := p_amount * v_rate;
  
  RETURN v_converted;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Données initiales des devises
INSERT INTO currencies (code, name, symbol, decimal_places, countries) VALUES
  ('EUR', 'Euro', '€', 2, ARRAY['FR', 'BE']),
  ('XOF', 'Franc CFA (BCEAO)', 'CFA', 0, ARRAY['BJ', 'CI']),
  ('USD', 'Dollar US', '$', 2, ARRAY['US']),
  ('MAD', 'Dirham Marocain', 'MAD', 2, ARRAY['MA']),
  ('TND', 'Dinar Tunisien', 'TND', 3, ARRAY['TN'])
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  decimal_places = EXCLUDED.decimal_places,
  countries = EXCLUDED.countries,
  updated_at = NOW();

-- Taux de change fixes (XOF/EUR - Banque Centrale)
INSERT INTO exchange_rates (from_currency, to_currency, rate, date, source, is_fixed) VALUES
  ('XOF', 'EUR', 0.001524, CURRENT_DATE, 'BCEAO_FIXED', true),
  ('EUR', 'XOF', 655.957, CURRENT_DATE, 'BCEAO_FIXED', true)
ON CONFLICT (from_currency, to_currency, date, source) DO UPDATE SET
  rate = EXCLUDED.rate,
  created_at = NOW();

-- RLS (Row Level Security) pour multi-tenant
ALTER TABLE currency_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY currency_conversions_tenant_isolation ON currency_conversions
  FOR ALL USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE id IN (
        SELECT company_id FROM user_profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Permissions pour les tables
GRANT SELECT, INSERT, UPDATE ON currencies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON exchange_rates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON currency_conversions TO authenticated;

-- Permissions pour les vues et fonctions
GRANT SELECT ON current_exchange_rates TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_exchange_rate(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_amount(DECIMAL, TEXT, TEXT) TO authenticated;
