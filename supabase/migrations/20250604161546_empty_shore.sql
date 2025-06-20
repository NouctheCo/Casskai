/*
  # Complete Schema for Finance Application

  1. New Tables
    - `companies` - Stores company information
    - `accounts` - Chart of accounts
    - `journals` - Accounting journals
    - `journal_entries` - Journal entries header information
    - `journal_entry_items` - Journal entry line items
    - `bank_accounts` - Bank account information
    - `transactions` - Bank transactions
    - `user_companies` - User company associations
    - `roles` - User roles
    - `permissions` - System permissions
    - `role_permissions` - Role permission mappings
    - `company_modules` - Company module settings

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  country character varying(2),
  default_currency character varying(3) DEFAULT 'EUR',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true,
  default_locale text DEFAULT 'fr'::text,
  timezone text DEFAULT 'Europe/Paris'::text,
  stripe_customer_id text,
  stripe_subscription_id text,
  group_id uuid
);

-- Create accounts table (chart of accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  account_number text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  balance numeric(15,2) DEFAULT 0.00,
  currency character varying(3) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  code character varying(15),
  label text,
  parent_code character varying(15),
  class smallint,
  tva_type text,
  UNIQUE(company_id, account_number)
);

-- Create journals table
CREATE TABLE IF NOT EXISTS journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  code character varying(10) NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  last_entry_number integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  entry_date date NOT NULL,
  description text NOT NULL,
  reference_number text,
  journal_id uuid REFERENCES journals(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  entry_number text,
  status text DEFAULT 'draft'::text
);

-- Create journal_entry_items table
CREATE TABLE IF NOT EXISTS journal_entry_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT NOT NULL,
  debit_amount numeric(15,2) DEFAULT 0 NOT NULL,
  credit_amount numeric DEFAULT 0,
  currency character varying(3) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  account_name text NOT NULL,
  bank_name text,
  account_number_masked text,
  currency character varying(3) NOT NULL,
  type text,
  is_active boolean DEFAULT true,
  current_balance numeric(15,2) DEFAULT 0.00,
  last_synced_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency character varying(3) NOT NULL,
  type text,
  category text,
  status text,
  reference_number text,
  is_reconciled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_companies table
CREATE TABLE IF NOT EXISTS user_companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role_id uuid NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, company_id)
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(name, is_system_role),
  UNIQUE(name, company_id)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  module text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(role_id, permission_id)
);

-- Create company_modules table
CREATE TABLE IF NOT EXISTS company_modules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  module_key text NOT NULL,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(company_id, module_key)
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Companies data access policy v3" ON companies;
DROP POLICY IF EXISTS "Company members accounts access policy v2" ON accounts;
DROP POLICY IF EXISTS "Company members journals access policy" ON journals;
DROP POLICY IF EXISTS "Company members journal entries access policy" ON journal_entries;
DROP POLICY IF EXISTS "Company members journal entry items access policy" ON journal_entry_items;
DROP POLICY IF EXISTS "Company members bank accounts access policy" ON bank_accounts;
DROP POLICY IF EXISTS "Company members transactions access policy" ON transactions;
DROP POLICY IF EXISTS "User companies access policy v2" ON user_companies;
DROP POLICY IF EXISTS "Roles read access policy v2" ON roles;
DROP POLICY IF EXISTS "Permissions select access policy" ON permissions;
DROP POLICY IF EXISTS "Role permissions select access policy" ON role_permissions;
DROP POLICY IF EXISTS "Company modules select access policy" ON company_modules;

-- Create policies for companies
CREATE POLICY "Companies data access policy v3"
  ON companies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for accounts
CREATE POLICY "Company members accounts access policy v2"
  ON accounts
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = accounts.company_id
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = accounts.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

-- Create policies for journals
CREATE POLICY "Company members journals access policy"
  ON journals
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = journals.company_id
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = journals.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

-- Create policies for journal entries
CREATE POLICY "Company members journal entries access policy"
  ON journal_entries
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = journal_entries.company_id
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = journal_entries.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

-- Create policies for journal entry items
CREATE POLICY "Company members journal entry items access policy"
  ON journal_entry_items
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = journal_entry_items.company_id
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = journal_entry_items.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

-- Create policies for bank accounts
CREATE POLICY "Company members bank accounts access policy"
  ON bank_accounts
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = bank_accounts.company_id
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = bank_accounts.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

-- Create policies for transactions
CREATE POLICY "Company members transactions access policy"
  ON transactions
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = transactions.company_id
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = transactions.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

-- Create policies for user_companies
CREATE POLICY "User companies access policy v2"
  ON user_companies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for roles
CREATE POLICY "Roles read access policy v2"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for permissions
CREATE POLICY "Permissions select access policy"
  ON permissions
  FOR SELECT
  TO public
  USING (auth.role() = 'authenticated'::text);

-- Create policies for role_permissions
CREATE POLICY "Role permissions select access policy"
  ON role_permissions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
      AND ((r.is_system_role = true) OR 
           (r.company_id IS NOT NULL AND 
            EXISTS (
              SELECT 1 FROM user_companies uc
              WHERE uc.company_id = r.company_id
              AND uc.user_id = auth.uid()
            ))
          )
    )
  );

-- Create policies for company_modules
CREATE POLICY "Company modules select access policy"
  ON company_modules
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = company_modules.company_id
      AND uc.user_id = auth.uid()
    )
  );

-- Create trigger function for updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns, checking if they exist first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
        CREATE TRIGGER update_companies_updated_at
        BEFORE UPDATE ON companies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_accounts_updated_at') THEN
        CREATE TRIGGER update_accounts_updated_at
        BEFORE UPDATE ON accounts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_journals_updated_at') THEN
        CREATE TRIGGER update_journals_updated_at
        BEFORE UPDATE ON journals
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_journal_entries_updated_at') THEN
        CREATE TRIGGER update_journal_entries_updated_at
        BEFORE UPDATE ON journal_entries
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_journal_entry_items_updated_at') THEN
        CREATE TRIGGER update_journal_entry_items_updated_at
        BEFORE UPDATE ON journal_entry_items
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bank_accounts_updated_at') THEN
        CREATE TRIGGER update_bank_accounts_updated_at
        BEFORE UPDATE ON bank_accounts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transactions_updated_at') THEN
        CREATE TRIGGER update_transactions_updated_at
        BEFORE UPDATE ON transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_companies_updated_at') THEN
        CREATE TRIGGER update_user_companies_updated_at
        BEFORE UPDATE ON user_companies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_roles_updated_at') THEN
        CREATE TRIGGER update_roles_updated_at
        BEFORE UPDATE ON roles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_permissions_updated_at') THEN
        CREATE TRIGGER update_permissions_updated_at
        BEFORE UPDATE ON permissions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_role_permissions_updated_at') THEN
        CREATE TRIGGER update_role_permissions_updated_at
        BEFORE UPDATE ON role_permissions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_modules_updated_at') THEN
        CREATE TRIGGER update_company_modules_updated_at
        BEFORE UPDATE ON company_modules
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Create function to generate entry numbers for journal entries
CREATE OR REPLACE FUNCTION generate_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  journal_code TEXT;
  last_number INTEGER;
  new_number TEXT;
BEGIN
  -- Get the journal code
  SELECT code INTO journal_code FROM journals WHERE id = NEW.journal_id;
  
  -- If journal_id is NULL, use 'OD' as default
  IF journal_code IS NULL THEN
    journal_code := 'OD';
  END IF;
  
  -- Get the last entry number for this journal
  SELECT last_entry_number INTO last_number FROM journals WHERE id = NEW.journal_id;
  
  -- If last_number is NULL, start from 0
  IF last_number IS NULL THEN
    last_number := 0;
  END IF;
  
  -- Increment the last number
  last_number := last_number + 1;
  
  -- Format the new entry number
  new_number := journal_code || '-' || TO_CHAR(last_number, 'FM0000');
  
  -- Update the journal's last entry number
  UPDATE journals SET last_entry_number = last_number WHERE id = NEW.journal_id;
  
  -- Set the entry number
  NEW.entry_number := new_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for journal entry numbering if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'journal_entry_numbering') THEN
        CREATE TRIGGER journal_entry_numbering
        BEFORE INSERT ON journal_entries
        FOR EACH ROW
        EXECUTE FUNCTION generate_entry_number();
    END IF;
END
$$;