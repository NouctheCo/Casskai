-- Migration initiale CassKai - Schéma de base de données
-- Fichier: /supabase/migrations/001_initial_schema.sql

-- ============================================================================
-- 1. TABLES CORE (Entreprises et Utilisateurs)
-- ============================================================================

-- Table des entreprises
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  country TEXT NOT NULL DEFAULT 'FR',
  currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  default_locale TEXT NOT NULL DEFAULT 'fr',
  
  -- Informations légales
  registration_number TEXT,
  vat_number TEXT,
  tax_regime TEXT,
  
  -- Adresse
  street TEXT,
  postal_code TEXT,
  city TEXT,
  state TEXT,
  
  -- Configuration comptable
  fiscal_year_start DATE DEFAULT '2024-01-01',
  fiscal_year_end DATE DEFAULT '2024-12-31',
  accounting_standard TEXT DEFAULT 'PCG', -- PCG, SYSCOHADA, BELGIAN
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  is_setup_completed BOOLEAN DEFAULT false,
  
  -- Stripe pour facturation (optionnel)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT companies_name_check CHECK (length(name) >= 2),
  CONSTRAINT companies_currency_check CHECK (currency IN ('EUR', 'USD', 'CAD', 'XOF', 'XAF', 'MAD'))
);

-- Table de liaison utilisateurs-entreprises (multi-tenant)
CREATE TABLE IF NOT EXISTS user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id UUID, -- référence vers roles (créé plus bas)
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Une seule entreprise par défaut par utilisateur
  UNIQUE(user_id, company_id)
);

-- ============================================================================
-- 2. SYSTÈME DE PERMISSIONS ET RÔLES
-- ============================================================================

-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  is_system_role BOOLEAN DEFAULT false, -- pour les rôles système (admin, user, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(name, company_id)
);

-- Table des permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT, -- dashboard, accounting, banking, reports, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison rôles-permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- 3. COMPTABILITÉ - PLAN COMPTABLE
-- ============================================================================

-- Table des comptes comptables
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Identification du compte
  account_number TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Classification
  type TEXT NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  class INTEGER, -- 1-7 pour la comptabilité française
  parent_code TEXT, -- pour hiérarchie des comptes
  
  -- Configuration
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  balance DECIMAL(15,2) DEFAULT 0,
  
  -- Import FEC
  imported_from_fec BOOLEAN DEFAULT false,
  tva_type TEXT, -- normal, reduced, exempt, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(company_id, account_number),
  CONSTRAINT accounts_type_check CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  CONSTRAINT accounts_class_check CHECK (class BETWEEN 1 AND 9)
);

-- ============================================================================
-- 4. COMPTABILITÉ - JOURNAUX
-- ============================================================================

-- Table des journaux comptables
CREATE TABLE IF NOT EXISTS journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Identification
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- VENTE, ACHAT, BANQUE, CAISSE, OD
  description TEXT,
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  last_entry_number INTEGER DEFAULT 0,
  
  -- Import FEC
  imported_from_fec BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(company_id, code),
  CONSTRAINT journals_type_check CHECK (type IN ('VENTE', 'ACHAT', 'BANQUE', 'CAISSE', 'OD'))
);

-- ============================================================================
-- 5. COMPTABILITÉ - ÉCRITURES
-- ============================================================================

-- Table des écritures comptables
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  journal_id UUID REFERENCES journals(id),
  
  -- Identification
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, posted, validated
  
  -- Import FEC
  imported_from_fec BOOLEAN DEFAULT false,
  original_fec_data JSONB,
  fec_journal_code TEXT,
  fec_entry_num TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(company_id, entry_number),
  CONSTRAINT journal_entries_status_check CHECK (status IN ('draft', 'posted', 'validated'))
);

-- Table des lignes d'écriture
CREATE TABLE IF NOT EXISTS journal_entry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  
  -- Montants
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Description
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT journal_entry_items_amounts_check CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (credit_amount > 0 AND debit_amount = 0)
  )
);

-- ============================================================================
-- 6. BANKING - COMPTES BANCAIRES
-- ============================================================================

-- Table des comptes bancaires
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Informations bancaires
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT,
  swift_code TEXT,
  
  -- Configuration
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  current_balance DECIMAL(15,2) DEFAULT 0,
  
  -- Synchronisation
  last_sync_date TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(company_id, account_number)
);

-- Table des transactions bancaires
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  
  -- Transaction
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Classification
  type TEXT, -- debit, credit
  category TEXT,
  reference_number TEXT,
  
  -- Statut
  status TEXT DEFAULT 'pending', -- pending, cleared, reconciled
  is_reconciled BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. TIERS (CLIENTS/FOURNISSEURS)
-- ============================================================================

-- Table des tiers
CREATE TABLE IF NOT EXISTS third_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Identification
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- CLIENT, SUPPLIER, BOTH
  reference_number TEXT,
  
  -- Informations légales
  legal_name TEXT,
  vat_number TEXT,
  registration_number TEXT,
  
  -- Contact
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Adresse
  street TEXT,
  postal_code TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  
  -- Configuration
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_terms_days INTEGER DEFAULT 30,
  credit_limit DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT third_parties_type_check CHECK (type IN ('CLIENT', 'SUPPLIER', 'BOTH'))
);

-- ============================================================================
-- 8. DEVISES ET TAUX DE CHANGE
-- ============================================================================

-- Table des devises supportées
CREATE TABLE IF NOT EXISTS currencies (
  code TEXT PRIMARY KEY, -- ISO 4217 (EUR, USD, XOF, etc.)
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des taux de change
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL REFERENCES currencies(code),
  to_currency TEXT NOT NULL REFERENCES currencies(code),
  rate DECIMAL(15,8) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'manual', -- manual, api, bank
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un seul taux par paire de devises par jour
  UNIQUE(from_currency, to_currency, date)
);

-- ============================================================================
-- 9. INDEXES POUR PERFORMANCE
-- ============================================================================

-- Index sur les entreprises
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Index sur user_companies
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_default ON user_companies(user_id, is_default);

-- Index sur les comptes
CREATE INDEX IF NOT EXISTS idx_accounts_company_id ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_class ON accounts(class);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(is_active);

-- Index sur les journaux
CREATE INDEX IF NOT EXISTS idx_journals_company_id ON journals(company_id);
CREATE INDEX IF NOT EXISTS idx_journals_type ON journals(type);

-- Index sur les écritures
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_journal_id ON journal_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);

-- Index sur les lignes d'écriture
CREATE INDEX IF NOT EXISTS idx_journal_entry_items_entry_id ON journal_entry_items(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_items_account_id ON journal_entry_items(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_items_company_id ON journal_entry_items(company_id);

-- Index sur les comptes bancaires
CREATE INDEX IF NOT EXISTS idx_bank_accounts_company_id ON bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_account_id ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);

-- Index sur les tiers
CREATE INDEX IF NOT EXISTS idx_third_parties_company_id ON third_parties(company_id);
CREATE INDEX IF NOT EXISTS idx_third_parties_type ON third_parties(type);

-- ============================================================================
-- 10. TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- ============================================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur toutes les tables avec updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_companies_updated_at BEFORE UPDATE ON user_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON journals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entry_items_updated_at BEFORE UPDATE ON journal_entry_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_third_parties_updated_at BEFORE UPDATE ON third_parties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
