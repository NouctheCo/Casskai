/*
  # Tax Management System Tables

  1. New Tables
    - `company_tax_rates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text, tax rate name)
      - `rate` (numeric, tax rate percentage)
      - `type` (text, type of tax: TVA, IS, etc.)
      - `description` (text, optional description)
      - `is_default` (boolean, whether this is the default rate)
      - `is_active` (boolean, whether the rate is active)
      - `valid_from` (timestamptz, when the rate becomes valid)
      - `valid_to` (timestamptz, when the rate expires)
      - `created_by` (uuid, user who created the rate)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `company_tax_declarations`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `type` (text, declaration type: TVA, IS, etc.)
      - `name` (text, declaration name)
      - `period_start` (timestamptz, period start date)
      - `period_end` (timestamptz, period end date)
      - `due_date` (timestamptz, declaration due date)
      - `status` (text, declaration status)
      - `amount` (numeric, declaration amount)
      - `currency` (varchar(3), currency code)
      - `description` (text, optional description)
      - `submitted_date` (timestamptz, when submitted)
      - `submitted_by` (uuid, who submitted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `company_tax_payments`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `declaration_id` (uuid, foreign key to company_tax_declarations)
      - `amount` (numeric, payment amount)
      - `currency` (varchar(3), currency code)
      - `payment_date` (timestamptz, when payment was made)
      - `payment_method` (text, payment method)
      - `reference` (text, payment reference)
      - `status` (text, payment status)
      - `receipt_url` (text, receipt URL)
      - `created_by` (uuid, user who created the payment)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `company_tax_documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `declaration_id` (uuid, foreign key to company_tax_declarations)
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
    - Add policies for company members to access their company's tax data
    - Add policies for tax management permissions

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
  valid_to timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_tax_declarations table
CREATE TABLE IF NOT EXISTS company_tax_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  period_start timestamptz,
  period_end timestamptz,
  due_date timestamptz NOT NULL,
  status text DEFAULT 'pending',
  amount numeric(15,2) DEFAULT 0,
  currency varchar(3) DEFAULT 'EUR',
  description text DEFAULT '',
  submitted_date timestamptz,
  submitted_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_tax_payments table
CREATE TABLE IF NOT EXISTS company_tax_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  declaration_id uuid REFERENCES company_tax_declarations(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL,
  currency varchar(3) DEFAULT 'EUR',
  payment_date timestamptz NOT NULL,
  payment_method text NOT NULL,
  reference text,
  status text DEFAULT 'completed',
  receipt_url text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_tax_documents table
CREATE TABLE IF NOT EXISTS company_tax_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  declaration_id uuid REFERENCES company_tax_declarations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_tax_rates_company_id ON company_tax_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_rates_type ON company_tax_rates(type);
CREATE INDEX IF NOT EXISTS idx_company_tax_rates_active ON company_tax_rates(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_company_id ON company_tax_declarations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_type ON company_tax_declarations(type);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_status ON company_tax_declarations(status);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_due_date ON company_tax_declarations(due_date);

CREATE INDEX IF NOT EXISTS idx_company_tax_payments_company_id ON company_tax_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_payments_declaration_id ON company_tax_payments(declaration_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_payments_date ON company_tax_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_company_tax_documents_company_id ON company_tax_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_documents_declaration_id ON company_tax_documents(declaration_id);

-- Enable Row Level Security
ALTER TABLE company_tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_tax_rates
CREATE POLICY "Company members can manage tax rates"
  ON company_tax_rates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies 
      WHERE user_companies.company_id = company_tax_rates.company_id 
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies 
      WHERE user_companies.company_id = company_tax_rates.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Create RLS policies for company_tax_declarations
CREATE POLICY "Company members can manage tax declarations"
  ON company_tax_declarations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies 
      WHERE user_companies.company_id = company_tax_declarations.company_id 
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies 
      WHERE user_companies.company_id = company_tax_declarations.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Create RLS policies for company_tax_payments
CREATE POLICY "Company members can manage tax payments"
  ON company_tax_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies 
      WHERE user_companies.company_id = company_tax_payments.company_id 
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies 
      WHERE user_companies.company_id = company_tax_payments.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Create RLS policies for company_tax_documents
CREATE POLICY "Company members can manage tax documents"
  ON company_tax_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_companies 
      WHERE user_companies.company_id = company_tax_documents.company_id 
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies 
      WHERE user_companies.company_id = company_tax_documents.company_id 
      AND user_companies.user_id = auth.uid()
    )
  );

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_tax_rates_updated_at') THEN
    CREATE TRIGGER update_company_tax_rates_updated_at
      BEFORE UPDATE ON company_tax_rates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_tax_declarations_updated_at') THEN
    CREATE TRIGGER update_company_tax_declarations_updated_at
      BEFORE UPDATE ON company_tax_declarations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_tax_payments_updated_at') THEN
    CREATE TRIGGER update_company_tax_payments_updated_at
      BEFORE UPDATE ON company_tax_payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_tax_documents_updated_at') THEN
    CREATE TRIGGER update_company_tax_documents_updated_at
      BEFORE UPDATE ON company_tax_documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add constraints for data validation
ALTER TABLE company_tax_rates 
ADD CONSTRAINT check_tax_rate_positive 
CHECK (rate >= 0 AND rate <= 100);

ALTER TABLE company_tax_declarations 
ADD CONSTRAINT check_declaration_status 
CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'overdue', 'completed'));

ALTER TABLE company_tax_declarations 
ADD CONSTRAINT check_declaration_amount_positive 
CHECK (amount >= 0);

ALTER TABLE company_tax_payments 
ADD CONSTRAINT check_payment_amount_positive 
CHECK (amount > 0);

ALTER TABLE company_tax_payments 
ADD CONSTRAINT check_payment_status 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded'));

-- Add some useful views for reporting
CREATE OR REPLACE VIEW company_tax_summary AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(DISTINCT ctd.id) as total_declarations,
  COUNT(DISTINCT CASE WHEN ctd.status = 'pending' THEN ctd.id END) as pending_declarations,
  COUNT(DISTINCT CASE WHEN ctd.status = 'overdue' THEN ctd.id END) as overdue_declarations,
  COALESCE(SUM(CASE WHEN ctd.status IN ('pending', 'overdue') THEN ctd.amount END), 0) as total_amount_due,
  COALESCE(SUM(ctp.amount), 0) as total_payments_made
FROM companies c
LEFT JOIN company_tax_declarations ctd ON c.id = ctd.company_id
LEFT JOIN company_tax_payments ctp ON c.id = ctp.company_id
GROUP BY c.id, c.name;