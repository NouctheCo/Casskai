/*
  # Add Enterprise Columns to Companies Table

  1. Changes
    - Add `enterprise_name` column to companies table for storing the enterprise/business name
    - Add `enterprise_type` column to companies table for storing the type of enterprise
    - Add `registration_number` column to companies table for storing official registration number
    - Add `tax_identification` column to companies table for storing tax ID number
    - Add `legal_form` column to companies table for storing legal form of the enterprise
    - Add `activity_sector` column to companies table for storing business activity sector
    - Add `address` column to companies table for storing enterprise address
    - Add `city` column to companies table for storing enterprise city
    - Add `postal_code` column to companies table for storing enterprise postal code
    - Add `phone` column to companies table for storing enterprise phone number
    - Add `email` column to companies table for storing enterprise email
    - Add `website` column to companies table for storing enterprise website

  2. Security
    - No changes to RLS policies needed as these are additional columns on existing table
*/

-- Add enterprise-related columns to companies table
DO $$
BEGIN
  -- Add enterprise_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'enterprise_name'
  ) THEN
    ALTER TABLE companies ADD COLUMN enterprise_name text;
  END IF;

  -- Add enterprise_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'enterprise_type'
  ) THEN
    ALTER TABLE companies ADD COLUMN enterprise_type text;
  END IF;

  -- Add registration_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'registration_number'
  ) THEN
    ALTER TABLE companies ADD COLUMN registration_number text;
  END IF;

  -- Add tax_identification column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'tax_identification'
  ) THEN
    ALTER TABLE companies ADD COLUMN tax_identification text;
  END IF;

  -- Add legal_form column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'legal_form'
  ) THEN
    ALTER TABLE companies ADD COLUMN legal_form text;
  END IF;

  -- Add activity_sector column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'activity_sector'
  ) THEN
    ALTER TABLE companies ADD COLUMN activity_sector text;
  END IF;

  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address'
  ) THEN
    ALTER TABLE companies ADD COLUMN address text;
  END IF;

  -- Add city column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'city'
  ) THEN
    ALTER TABLE companies ADD COLUMN city text;
  END IF;

  -- Add postal_code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE companies ADD COLUMN postal_code text;
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'phone'
  ) THEN
    ALTER TABLE companies ADD COLUMN phone text;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'email'
  ) THEN
    ALTER TABLE companies ADD COLUMN email text;
  END IF;

  -- Add website column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'website'
  ) THEN
    ALTER TABLE companies ADD COLUMN website text;
  END IF;
END $$;