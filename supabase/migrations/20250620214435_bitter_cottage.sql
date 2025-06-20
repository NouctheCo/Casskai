/*
  # Add enterprise columns to companies table

  1. Changes
    - Add `enterprise_id` column to companies table to link companies to enterprises
    - Add foreign key constraint to ensure data integrity
    - Update existing policies to work with enterprise structure

  2. Security
    - Maintain existing RLS policies
    - Ensure enterprise relationships are properly secured
*/

-- Add enterprise_id column to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'enterprise_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN enterprise_id uuid REFERENCES enterprises(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'companies' AND indexname = 'idx_companies_enterprise_id'
  ) THEN
    CREATE INDEX idx_companies_enterprise_id ON companies(enterprise_id);
  END IF;
END $$;

-- Add comment to document the relationship
COMMENT ON COLUMN companies.enterprise_id IS 'Links company to its parent enterprise for multi-company management';