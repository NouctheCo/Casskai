/*
  # Add Enterprise Columns to Companies Table

  1. Changes
    - Add legal_name column to companies table
    - Add registration_number column to companies table
    - Add vat_number column to companies table
    - Add country_code column to companies table
    - Add address JSONB column to companies table
    - Add tax_regime JSONB column to companies table
    - Add fiscal_year_start and fiscal_year_end columns to companies table
    - Add currency column to companies table
    - Add settings JSONB column to companies table
    - Add is_active column to companies table
*/

-- Use DO block to safely add columns only if they don't exist
DO $$
BEGIN
  -- Add legal_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'legal_name'
  ) THEN
    ALTER TABLE companies ADD COLUMN legal_name VARCHAR(255);
  END IF;

  -- Add registration_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'registration_number'
  ) THEN
    ALTER TABLE companies ADD COLUMN registration_number VARCHAR(100);
  END IF;

  -- Add vat_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'vat_number'
  ) THEN
    ALTER TABLE companies ADD COLUMN vat_number VARCHAR(50);
  END IF;

  -- Add country_code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE companies ADD COLUMN country_code VARCHAR(2) DEFAULT 'FR';
  END IF;

  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address'
  ) THEN
    ALTER TABLE companies ADD COLUMN address JSONB;
  END IF;

  -- Add tax_regime column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'tax_regime'
  ) THEN
    ALTER TABLE companies ADD COLUMN tax_regime JSONB;
  END IF;

  -- Add fiscal_year_start column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'fiscal_year_start'
  ) THEN
    ALTER TABLE companies ADD COLUMN fiscal_year_start INTEGER DEFAULT 1;
  END IF;

  -- Add fiscal_year_end column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'fiscal_year_end'
  ) THEN
    ALTER TABLE companies ADD COLUMN fiscal_year_end INTEGER DEFAULT 12;
  END IF;

  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'currency'
  ) THEN
    ALTER TABLE companies ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR';
  END IF;

  -- Add settings column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'settings'
  ) THEN
    ALTER TABLE companies ADD COLUMN settings JSONB;
  END IF;

  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE companies ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END
$$;