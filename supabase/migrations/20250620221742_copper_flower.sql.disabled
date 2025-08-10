/*
  # Create tax-related tables

  1. New Tables
    - `company_tax_rates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `name` (text)
      - `rate` (numeric)
      - `type` (text)
      - `description` (text)
      - `is_default` (boolean)
      - `is_active` (boolean)
      - `valid_from` (timestamptz)
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `company_tax_declarations`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `type` (text)
      - `name` (text)
      - `period_start` (timestamptz)
      - `period_end` (timestamptz)
      - `due_date` (timestamptz)
      - `status` (text)
      - `amount` (numeric)
      - `description` (text)
      - `currency` (varchar(3))
      - `submitted_date` (timestamptz)
      - `submitted_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `company_tax_payments`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `declaration_id` (uuid, foreign key to company_tax_declarations)
      - `amount` (numeric)
      - `currency` (varchar(3))
      - `payment_date` (timestamptz)
      - `payment_method` (text)
      - `reference` (text)
      - `status` (text)
      - `receipt_url` (text)
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `company_tax_documents`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `declaration_id` (uuid, foreign key to company_tax_declarations)
      - `name` (text)
      - `type` (text)
      - `file_url` (text)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `uploaded_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for company members to access their data
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
  period_start timestamptz,
  period_end timestamptz,
  due_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  amount numeric(15,2) DEFAULT 0,
  description text DEFAULT '',
  currency varchar(3) DEFAULT 'EUR',
  submitted_date timestamptz,
  submitted_by uuid REFERENCES auth.users(id),
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
  status text NOT NULL DEFAULT 'completed',
  receipt_url text,
  created_by uuid REFERENCES auth.users(id),
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
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for company_tax_rates
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

-- Create policies for company_tax_declarations
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

-- Create policies for company_tax_payments
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

-- Create policies for company_tax_documents
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_tax_rates_company_id ON company_tax_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_company_id ON company_tax_declarations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tax_declarations_due_date ON company_tax_declarations(due_date);
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
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_tax_rates_updated_at') THEN
        CREATE TRIGGER update_company_tax_rates_updated_at
            BEFORE UPDATE ON company_tax_rates
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_tax_declarations_updated_at') THEN
        CREATE TRIGGER update_company_tax_declarations_updated_at
            BEFORE UPDATE ON company_tax_declarations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_tax_payments_updated_at') THEN
        CREATE TRIGGER update_company_tax_payments_updated_at
            BEFORE UPDATE ON company_tax_payments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_tax_documents_updated_at') THEN
        CREATE TRIGGER update_company_tax_documents_updated_at
            BEFORE UPDATE ON company_tax_documents
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;