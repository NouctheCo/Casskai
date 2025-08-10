
/*
  # Add enterprise columns to companies table

  1. Changes
    - Add legal_name, registration_number, vat_number columns to companies table
    - Add country_code, address, tax_regime, fiscal_year_start, fiscal_year_end columns
    - Add settings JSONB column for enterprise settings
*/

-- Add new columns to companies table if they don't exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'FR';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_regime JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER DEFAULT 1;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fiscal_year_end INTEGER DEFAULT 12;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS settings JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;