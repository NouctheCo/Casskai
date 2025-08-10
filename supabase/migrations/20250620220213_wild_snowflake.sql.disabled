/*
  # Create tax management tables

  1. New Tables
    - `company_tax_rates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text, tax rate name)
      - `rate` (numeric, tax percentage)
      - `type` (text, tax type like VAT, IS, etc.)
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
      - `type` (text, declaration type)
      - `name` (text, declaration name)
      - `period_start` (timestamptz, period start date)
      - `period_end` (timestamptz, period end date)
      - `due_date` (timestamptz, when declaration is due)
      - `status` (text, declaration status)
      - `amount` (numeric, declaration amount)
      - `currency` (varchar(3), currency code)
      - `description` (text, optional description)
      - `submitted_date` (timestamptz, when submitted)
      - `submitted_by` (uuid, user who submitted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `company_tax_payments`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `declaration_id` (uuid, foreign key to tax declarations)
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
      - `declaration_id` (uuid, foreign key to tax declarations)
      - `name` (text, document name)
      - `type` (text, document type)
      - `file_url` (text, file URL)
      - `file_size` (bigint, file size in bytes)
      - `mime_type` (text, file MIME type)
      - `uploaded_by` (uuid, user who uploaded)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for company members to access their data

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create company_tax_rates table
CREATE TABLE IF NOT EXISTS company_tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  rate numeric(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
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
  status text NOT NULL DEFAULT 'pending',
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
  status text NOT NULL DEFAULT 'pending',
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

-- Enable Row Level Security
ALTER TABLE company_tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for company_tax_rates
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

-- Create policies for company_tax_declarations
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

-- Create policies for company_tax_payments
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

-- Create policies for company_tax_documents
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
CREATE INDEX IF NOT EXISTS idx_company_tax_rates_default ON company_tax_rates(company_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_company_id ON company_tax_declarations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_due_date ON company_tax_declarations(company_id, due_date);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_status ON company_tax_declarations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_type ON company_tax_declarations(company_id, type);

CREATE INDEX IF NOT EXISTS idx_company_tax_payments_company_id ON company_tax_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_payments_declaration_id ON company_tax_payments(declaration_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_payments_date ON company_tax_payments(company_id, payment_date);

CREATE INDEX IF NOT EXISTS idx_company_tax_documents_company_id ON company_tax_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_documents_declaration_id ON company_tax_documents(declaration_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_company_tax_rates_updated_at
  BEFORE UPDATE ON company_tax_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_tax_declarations_updated_at
  BEFORE UPDATE ON company_tax_declarations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_tax_payments_updated_at
  BEFORE UPDATE ON company_tax_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_tax_documents_updated_at
  BEFORE UPDATE ON company_tax_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for status fields
ALTER TABLE company_tax_declarations 
ADD CONSTRAINT check_declaration_status 
CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'overdue'));

ALTER TABLE company_tax_payments 
ADD CONSTRAINT check_payment_status 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

-- Add constraint for tax rate types
ALTER TABLE company_tax_rates 
ADD CONSTRAINT check_tax_rate_type 
CHECK (type IN ('TVA', 'VAT', 'IS', 'IR', 'SOCIAL', 'OTHER'));

-- Add constraint for payment methods
ALTER TABLE company_tax_payments 
ADD CONSTRAINT check_payment_method 
CHECK (payment_method IN ('bank_transfer', 'credit_card', 'check', 'cash', 'online', 'other'));