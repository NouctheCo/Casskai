/*
  # Create tax-related tables for enterprise tax management

  1. New Tables
    - `company_tax_rates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text, tax rate name)
      - `rate` (numeric, tax rate percentage)
      - `type` (text, type of tax - VAT, income, etc.)
      - `description` (text, description)
      - `is_default` (boolean, whether this is the default rate)
      - `is_active` (boolean, whether rate is active)
      - `valid_from` (timestamptz, when rate becomes valid)
      - `created_by` (uuid, user who created)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `company_tax_declarations`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `type` (text, declaration type)
      - `name` (text, declaration name)
      - `period_start` (date, period start)
      - `period_end` (date, period end)
      - `due_date` (date, when declaration is due)
      - `status` (text, declaration status)
      - `amount` (numeric, declaration amount)
      - `description` (text, description)
      - `currency` (text, currency code)
      - `submitted_date` (timestamptz, when submitted)
      - `submitted_by` (uuid, who submitted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `company_tax_payments`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `declaration_id` (uuid, optional foreign key to declarations)
      - `amount` (numeric, payment amount)
      - `currency` (text, currency code)
      - `payment_date` (date, when payment was made)
      - `payment_method` (text, how payment was made)
      - `reference` (text, payment reference)
      - `status` (text, payment status)
      - `receipt_url` (text, receipt document URL)
      - `created_by` (uuid, user who created)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `company_tax_documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `declaration_id` (uuid, optional foreign key to declarations)
      - `name` (text, document name)
      - `type` (text, document type)
      - `file_url` (text, document file URL)
      - `file_size` (bigint, file size in bytes)
      - `mime_type` (text, file MIME type)
      - `uploaded_by` (uuid, user who uploaded)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for company members to access their company's data
    - Add policies for managing tax data based on permissions

  3. Indexes
    - Add indexes for performance on frequently queried columns
*/

-- Create company_tax_rates table
CREATE TABLE IF NOT EXISTS company_tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  rate numeric(5,2) NOT NULL,
  type text NOT NULL,
  description text DEFAULT '',
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_tax_declarations table
CREATE TABLE IF NOT EXISTS company_tax_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  period_start date,
  period_end date,
  due_date date NOT NULL,
  status text DEFAULT 'draft',
  amount numeric(15,2),
  description text DEFAULT '',
  currency text DEFAULT 'EUR',
  submitted_date timestamptz,
  submitted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_tax_payments table
CREATE TABLE IF NOT EXISTS company_tax_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  declaration_id uuid REFERENCES company_tax_declarations(id) ON DELETE SET NULL,
  amount numeric(15,2) NOT NULL,
  currency text DEFAULT 'EUR',
  payment_date date NOT NULL,
  payment_method text NOT NULL,
  reference text,
  status text DEFAULT 'pending',
  receipt_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_tax_documents table
CREATE TABLE IF NOT EXISTS company_tax_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  declaration_id uuid REFERENCES company_tax_declarations(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE company_tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_tax_rates
CREATE POLICY "Company members can access tax rates"
  ON company_tax_rates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = company_tax_rates.company_id
      AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = company_tax_rates.company_id
      AND uc.user_id = auth.uid()
    )
  );

-- Create RLS policies for company_tax_declarations
CREATE POLICY "Company members can access tax declarations"
  ON company_tax_declarations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = company_tax_declarations.company_id
      AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = company_tax_declarations.company_id
      AND uc.user_id = auth.uid()
    )
  );

-- Create RLS policies for company_tax_payments
CREATE POLICY "Company members can access tax payments"
  ON company_tax_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = company_tax_payments.company_id
      AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = company_tax_payments.company_id
      AND uc.user_id = auth.uid()
    )
  );

-- Create RLS policies for company_tax_documents
CREATE POLICY "Company members can access tax documents"
  ON company_tax_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = company_tax_documents.company_id
      AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.company_id = company_tax_documents.company_id
      AND uc.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_tax_rates_company_id ON company_tax_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_rates_active ON company_tax_rates(company_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_company_id ON company_tax_declarations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_status ON company_tax_declarations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_due_date ON company_tax_declarations(company_id, due_date);
CREATE INDEX IF NOT EXISTS idx_company_tax_payments_company_id ON company_tax_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_payments_declaration_id ON company_tax_payments(declaration_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_documents_company_id ON company_tax_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_documents_declaration_id ON company_tax_documents(declaration_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_company_tax_rates_updated_at'
  ) THEN
    CREATE TRIGGER update_company_tax_rates_updated_at
      BEFORE UPDATE ON company_tax_rates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_company_tax_declarations_updated_at'
  ) THEN
    CREATE TRIGGER update_company_tax_declarations_updated_at
      BEFORE UPDATE ON company_tax_declarations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_company_tax_payments_updated_at'
  ) THEN
    CREATE TRIGGER update_company_tax_payments_updated_at
      BEFORE UPDATE ON company_tax_payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_company_tax_documents_updated_at'
  ) THEN
    CREATE TRIGGER update_company_tax_documents_updated_at
      BEFORE UPDATE ON company_tax_documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;