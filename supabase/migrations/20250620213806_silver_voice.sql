/*
  # Create tax-related tables

  1. New Tables
    - `company_tax_rates` - Stores tax rates for each company
    - `company_tax_declarations` - Stores tax declarations
    - `company_tax_payments` - Stores tax payments
    - `company_tax_documents` - Stores tax-related documents
    - `company_tax_reminders` - Stores tax reminders

  2. Views
    - `upcoming_tax_declarations` - Shows upcoming tax declarations

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Table pour les taux de taxes par entreprise
CREATE TABLE IF NOT EXISTS company_tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('VAT', 'IS', 'IR', 'OTHER')),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_default_rate_per_type UNIQUE (company_id, type, is_default) WHERE is_default = true
);

-- Table pour les déclarations fiscales
CREATE TABLE IF NOT EXISTS company_tax_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'submitted', 'completed', 'overdue')),
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT,
  submitted_date TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for company_tax_declarations
CREATE INDEX IF NOT EXISTS idx_company_declarations ON company_tax_declarations(company_id);
CREATE INDEX IF NOT EXISTS idx_due_date ON company_tax_declarations(due_date);
CREATE INDEX IF NOT EXISTS idx_status ON company_tax_declarations(status);

-- Table pour les paiements de taxes
CREATE TABLE IF NOT EXISTS company_tax_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  declaration_id UUID REFERENCES company_tax_declarations(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  reference VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for company_tax_payments
CREATE INDEX IF NOT EXISTS idx_company_payments ON company_tax_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_declaration_payments ON company_tax_payments(declaration_id);

-- Table pour les documents fiscaux
CREATE TABLE IF NOT EXISTS company_tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  declaration_id UUID REFERENCES company_tax_declarations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Create indexes for company_tax_documents
CREATE INDEX IF NOT EXISTS idx_company_documents ON company_tax_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_declaration_documents ON company_tax_documents(declaration_id);

-- Table pour les rappels fiscaux
CREATE TABLE IF NOT EXISTS company_tax_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  declaration_id UUID REFERENCES company_tax_declarations(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for company_tax_reminders
CREATE INDEX IF NOT EXISTS idx_company_reminders ON company_tax_reminders(company_id);
CREATE INDEX IF NOT EXISTS idx_reminder_date ON company_tax_reminders(reminder_date);

-- Vues pour faciliter les requêtes
CREATE OR REPLACE VIEW upcoming_tax_declarations AS
SELECT 
  d.*,
  c.name as company_name,
  c.country_code,
  CASE 
    WHEN d.due_date < CURRENT_DATE AND d.status = 'pending' THEN 'overdue'
    ELSE d.status
  END as current_status
FROM company_tax_declarations d
JOIN companies c ON d.company_id = c.id
WHERE d.status IN ('pending', 'draft')
ORDER BY d.due_date;

-- Triggers pour updated_at
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
END
$$;

-- Enable Row Level Security
ALTER TABLE company_tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tax_reminders ENABLE ROW LEVEL SECURITY;

-- Policies for company_tax_rates
CREATE POLICY "Users can view their company tax rates"
  ON company_tax_rates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = company_tax_rates.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company tax rates"
  ON company_tax_rates
  FOR ALL
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

-- Policies for company_tax_declarations
CREATE POLICY "Users can view their company tax declarations"
  ON company_tax_declarations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = company_tax_declarations.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company tax declarations"
  ON company_tax_declarations
  FOR ALL
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

-- Policies for company_tax_payments
CREATE POLICY "Users can view their company tax payments"
  ON company_tax_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = company_tax_payments.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company tax payments"
  ON company_tax_payments
  FOR ALL
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

-- Policies for company_tax_documents
CREATE POLICY "Users can view their company tax documents"
  ON company_tax_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = company_tax_documents.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company tax documents"
  ON company_tax_documents
  FOR ALL
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

-- Policies for company_tax_reminders
CREATE POLICY "Users can view their company tax reminders"
  ON company_tax_reminders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = company_tax_reminders.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company tax reminders"
  ON company_tax_reminders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = company_tax_reminders.company_id
      AND user_companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies
      WHERE user_companies.company_id = company_tax_reminders.company_id
      AND user_companies.user_id = auth.uid()
    )
  );

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_rates_company_active ON company_tax_rates(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_declarations_company_status ON company_tax_declarations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_company_date ON company_tax_payments(company_id, payment_date);