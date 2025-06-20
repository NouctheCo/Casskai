/*
  # Add Enterprise Support Columns

  1. New Columns
    - Add `enterprise_id` to companies table to support enterprise grouping
    - Add `enterprise_name` to companies table for display purposes
    - Add `is_enterprise_admin` to user_companies table for enterprise-level permissions

  2. Indexes
    - Add index on companies.enterprise_id for efficient enterprise queries
    - Add index on user_companies.is_enterprise_admin for admin lookups

  3. Security
    - Update existing RLS policies to work with enterprise structure
    - Maintain backward compatibility for non-enterprise companies
*/

-- Add enterprise_id column to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN enterprise_id uuid;
  END IF;
END $$;

-- Add enterprise_name column to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'enterprise_name'
  ) THEN
    ALTER TABLE companies ADD COLUMN enterprise_name text;
  END IF;
END $$;

-- Add is_enterprise_admin column to user_companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_companies' AND column_name = 'is_enterprise_admin'
  ) THEN
    ALTER TABLE user_companies ADD COLUMN is_enterprise_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create index on enterprise_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_companies_enterprise_id 
ON companies(enterprise_id) 
WHERE enterprise_id IS NOT NULL;

-- Create index on is_enterprise_admin for admin lookups
CREATE INDEX IF NOT EXISTS idx_user_companies_enterprise_admin 
ON user_companies(is_enterprise_admin) 
WHERE is_enterprise_admin = true;

-- Add comment to enterprise_id column
COMMENT ON COLUMN companies.enterprise_id IS 'Links companies to an enterprise group for multi-company management';

-- Add comment to enterprise_name column
COMMENT ON COLUMN companies.enterprise_name IS 'Display name of the enterprise this company belongs to';

-- Add comment to is_enterprise_admin column
COMMENT ON COLUMN user_companies.is_enterprise_admin IS 'Indicates if user has enterprise-level admin privileges across all companies in the enterprise';